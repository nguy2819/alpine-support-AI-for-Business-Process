export type IssueType = "return" | "warranty" | "damaged_item" | "missing_item" | "wrong_item" | "other";
export type DesiredOutcome = "refund" | "replacement" | "repair" | "exchange" | "store_credit" | "unspecified";
export type Sentiment = "positive" | "neutral" | "negative" | "angry";
export type ItemCondition = "unused" | "opened" | "used" | "unknown";
export type DamageCause = "defect" | "shipping" | "accident" | "misuse" | "wear" | "unknown";
export type Decision = "eligible" | "ineligible" | "needs_info";
export type EscalationCode =
  | "refund_over_threshold"
  | "low_confidence"
  | "exception_request"
  | "angry_customer"
  | "legal_or_chargeback_threat"
  | "safety_concern";

export interface OrderItem {
  sku: string;
  name: string;
  brand: string;
  category: string;
  unit_price: number;
  quantity: number;
  warranty_months: number;
  final_sale: boolean;
  consumable: boolean;
  safety_critical: boolean;
}

export interface Order {
  order_id: string;
  customer_name: string;
  customer_email: string;
  order_date: string;
  status: "delivered" | "in_transit";
  delivery_date: string | null;
  estimated_delivery_date?: string;
  payment_method: string;
  items: OrderItem[];
  total: number;
}

/** Structured facts pulled from a customer message (by the LLM later; from the answer key for now). */
export interface Extraction {
  order_id: string | null;
  affected_sku: string | null;
  issue_type: IssueType;
  desired_outcome: DesiredOutcome;
  sentiment: Sentiment;
  confidence: number;
  item_condition: ItemCondition;
  damage_cause: DamageCause;
  requests_exception: boolean;
  legal_or_chargeback_threat: boolean;
  safety_issue: boolean;
}

export interface ExpectedResult extends Extraction {
  decision: Decision;
  escalate: boolean;
  escalation_reasons: EscalationCode[];
}

export interface TestCase {
  case_id: string;
  received_date: string;
  customer_email: string;
  message: string;
  expected: ExpectedResult;
  rationale: string;
}
