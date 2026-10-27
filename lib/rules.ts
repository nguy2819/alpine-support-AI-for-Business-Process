// Deterministic policy engine. No LLM involved: same input always gives the same output.

import {
  DAMAGE_REPORT_DAYS,
  MIN_CONFIDENCE,
  MISSING_OR_WRONG_REPORT_DAYS,
  RETURN_WINDOW_DAYS,
  SUPERVISOR_THRESHOLD_USD,
} from "./policy";
import type {
  DamageCause,
  Decision,
  EscalationCode,
  IssueType,
  ItemCondition,
  Order,
  OrderItem,
  Sentiment,
} from "./types";

export interface RulesInput {
  order: Order | null;
  issueType: IssueType;
  affectedSku: string | null;
  sentiment: Sentiment;
  confidence: number;
  receivedDate: string; // YYYY-MM-DD
  itemCondition?: ItemCondition;
  damageCause?: DamageCause;
  requestsException?: boolean;
  legalOrChargebackThreat?: boolean;
  safetyIssue?: boolean;
}

export interface Escalation {
  code: EscalationCode;
  reason: string;
  clause: string;
}

export interface RulesResult {
  decision: Decision;
  reasons: string[];
  clauses: string[];
  item: OrderItem | null;
  daysSinceDelivery: number | null;
  itemValue: number | null;
  escalate: boolean;
  escalations: Escalation[];
}

const DAY_MS = 24 * 60 * 60 * 1000;

function parseDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function daysBetween(fromIso: string, toIso: string): number {
  return Math.round((parseDate(toIso).getTime() - parseDate(fromIso).getTime()) / DAY_MS);
}

/** Adds calendar months, clamping to the last day of the month (Jan 31 + 1 month = Feb 28/29). */
export function addMonths(iso: string, months: number): string {
  const d = parseDate(iso);
  const target = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + months, 1));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(d.getUTCDate(), lastDay));
  return target.toISOString().slice(0, 10);
}

interface PolicyDecision {
  decision: Decision;
  reasons: string[];
  clauses: string[];
}

const ineligible = (reason: string, ...clauses: string[]): PolicyDecision => ({
  decision: "ineligible",
  reasons: [reason],
  clauses,
});
const needsInfo = (reason: string, ...clauses: string[]): PolicyDecision => ({
  decision: "needs_info",
  reasons: [reason],
  clauses,
});

function decide(input: RulesInput, item: OrderItem | null, days: number | null): PolicyDecision {
  const { order, issueType } = input;

  if (!order) {
    return needsInfo("No matching order found. Ask the customer to confirm their order number.");
  }
  if (issueType === "other") {
    return needsInfo("The issue type is unclear. Ask the customer what went wrong and what they would like.");
  }
  if (!item) {
    return needsInfo("Cannot tell which item on the order the customer means. Ask them to confirm the item.");
  }

  const delivered = order.status === "delivered" && order.delivery_date !== null && days !== null;
  const notDelivered = `Order is not marked delivered yet (status: ${order.status}${
    order.estimated_delivery_date ? `, estimated delivery ${order.estimated_delivery_date}` : ""
  }).`;

  switch (issueType) {
    case "return": {
      if (!delivered) return ineligible(notDelivered, "2.1");
      if (item.final_sale) return ineligible(`${item.name} is a final sale item.`, "2.3");
      if (item.consumable && (input.itemCondition === "opened" || input.itemCondition === "used")) {
        return ineligible(`${item.name} is a consumable that has been opened.`, "2.3");
      }
      if (input.itemCondition === "used") return ineligible("The item has been used.", "2.2");
      if (days! > RETURN_WINDOW_DAYS) {
        return ineligible(`Request is on day ${days} after delivery; the limit is ${RETURN_WINDOW_DAYS} days.`, "2.1");
      }
      return {
        decision: "eligible",
        reasons: [`Request is on day ${days} of the ${RETURN_WINDOW_DAYS}-day return window and the item is returnable.`],
        clauses: ["2.1", "2.2", "2.4", "2.5"],
      };
    }

    case "warranty": {
      if (item.warranty_months === 0) return ineligible(`${item.name} has no warranty.`, "3.1");
      if (!delivered) return ineligible(notDelivered, "3.1");
      const expires = addMonths(order.delivery_date!, item.warranty_months);
      if (input.receivedDate > expires) {
        return ineligible(`The ${item.warranty_months}-month warranty expired on ${expires}.`, "3.1");
      }
      const cause = input.damageCause;
      if (cause === "accident" || cause === "misuse" || cause === "wear") {
        return ineligible(`The damage was caused by ${cause}, which the warranty does not cover.`, "3.3");
      }
      return {
        decision: "eligible",
        reasons: [`Within the ${item.warranty_months}-month warranty (expires ${expires}) and reported as a defect.`],
        clauses: item.final_sale ? ["3.2", "3.4", "3.5", "3.6"] : ["3.2", "3.4", "3.6"],
      };
    }

    case "damaged_item": {
      if (!delivered) return ineligible(notDelivered, "4.1");
      if (days! > DAMAGE_REPORT_DAYS) {
        return ineligible(
          `Shipping damage reported on day ${days}; the limit is ${DAMAGE_REPORT_DAYS} days. A warranty claim may still apply if it is a defect.`,
          "4.1",
          "3.2",
        );
      }
      return {
        decision: "eligible",
        reasons: [`Shipping damage reported on day ${days}, within ${DAMAGE_REPORT_DAYS} days.`],
        clauses: ["4.1"],
      };
    }

    case "missing_item":
    case "wrong_item": {
      const clause = issueType === "missing_item" ? "4.2" : "4.3";
      const label = issueType === "missing_item" ? "Missing item" : "Wrong item";
      if (!delivered) return ineligible(`${notDelivered} Share tracking status instead.`, clause);
      if (days! > MISSING_OR_WRONG_REPORT_DAYS) {
        return ineligible(
          `${label} reported on day ${days}; the limit is ${MISSING_OR_WRONG_REPORT_DAYS} days.`,
          clause,
        );
      }
      return {
        decision: "eligible",
        reasons: [`${label} reported on day ${days}, within ${MISSING_OR_WRONG_REPORT_DAYS} days.`],
        clauses: [clause],
      };
    }
  }
}

function escalationsFor(
  input: RulesInput,
  decision: Decision,
  item: OrderItem | null,
  itemValue: number | null,
): Escalation[] {
  const out: Escalation[] = [];

  if (decision === "eligible" && itemValue !== null && itemValue > SUPERVISOR_THRESHOLD_USD) {
    out.push({
      code: "refund_over_threshold",
      reason: `Item value $${itemValue.toFixed(2)} is above the $${SUPERVISOR_THRESHOLD_USD} approval limit.`,
      clause: "5.1",
    });
  }
  if (input.confidence < MIN_CONFIDENCE) {
    out.push({
      code: "low_confidence",
      reason: `Extraction confidence ${input.confidence.toFixed(2)} is below ${MIN_CONFIDENCE.toFixed(2)}.`,
      clause: "7",
    });
  }
  if (input.requestsException) {
    out.push({ code: "exception_request", reason: "Customer asks for something outside policy.", clause: "6.1" });
  }
  if (input.sentiment === "angry") {
    out.push({ code: "angry_customer", reason: "Customer is angry or hostile.", clause: "7" });
  }
  if (input.legalOrChargebackThreat) {
    out.push({
      code: "legal_or_chargeback_threat",
      reason: "Customer mentions legal action or a bank dispute.",
      clause: "7",
    });
  }
  const safetyCriticalClaim =
    item?.safety_critical && (input.issueType === "warranty" || input.issueType === "damaged_item");
  if (input.safetyIssue || safetyCriticalClaim) {
    out.push({
      code: "safety_concern",
      reason: safetyCriticalClaim
        ? `${item!.name} is a safety-critical item reported as faulty.`
        : "Customer reports a safety issue.",
      clause: "7",
    });
  }

  return out;
}

export function evaluateRules(input: RulesInput): RulesResult {
  const { order } = input;
  const item = order?.items.find((i) => i.sku === input.affectedSku) ?? null;
  const daysSinceDelivery = order?.delivery_date ? daysBetween(order.delivery_date, input.receivedDate) : null;
  const itemValue = item ? Math.round(item.unit_price * item.quantity * 100) / 100 : null;

  const { decision, reasons, clauses } = decide(input, item, daysSinceDelivery);
  const escalations = escalationsFor(input, decision, item, itemValue);

  return {
    decision,
    reasons,
    clauses,
    item,
    daysSinceDelivery,
    itemValue,
    escalate: escalations.length > 0,
    escalations,
  };
}
