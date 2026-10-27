import ordersJson from "../data/orders.json";
import testCasesJson from "../data/test_cases.json";
import type { Extraction, Order, TestCase } from "./types";

export const orders = ordersJson as unknown as Order[];
export const testCases = testCasesJson.cases as unknown as TestCase[];

export function findOrder(orderId: string | null): Order | null {
  if (!orderId) return null;
  return orders.find((o) => o.order_id === orderId) ?? null;
}

/** The answer-key extraction for a case. Stands in for the LLM until extraction is built. */
export function referenceExtraction(tc: TestCase): Extraction {
  const e = tc.expected;
  return {
    order_id: e.order_id,
    affected_sku: e.affected_sku,
    issue_type: e.issue_type,
    desired_outcome: e.desired_outcome,
    sentiment: e.sentiment,
    confidence: e.confidence,
    item_condition: e.item_condition,
    damage_cause: e.damage_cause,
    requests_exception: e.requests_exception,
    legal_or_chargeback_threat: e.legal_or_chargeback_threat,
    safety_issue: e.safety_issue,
  };
}
