import { z } from "zod";

export const ExtractionSchema = z.object({
  order_id: z.string().nullable(),
  affected_sku: z.string().nullable(),
  issue_type: z.enum(["return", "warranty", "damaged_item", "missing_item", "wrong_item", "other"]),
  desired_outcome: z.enum(["refund", "replacement", "repair", "exchange", "store_credit", "unspecified"]),
  sentiment: z.enum(["positive", "neutral", "negative", "angry"]),
  confidence: z.number().min(0).max(1),
  item_condition: z.enum(["unused", "opened", "used", "unknown"]),
  damage_cause: z.enum(["defect", "shipping", "accident", "misuse", "wear", "unknown"]),
  requests_exception: z.boolean(),
  legal_or_chargeback_threat: z.boolean(),
  safety_issue: z.boolean(),
});
