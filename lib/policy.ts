// Short summaries of the clauses in data/policy.md, keyed by section number.
// Shown next to each rules decision so the agent can check the reasoning.
export const POLICY_CLAUSES: Record<string, string> = {
  "2.1": "Returns are accepted within 30 days of delivery (day 30 is the last eligible day).",
  "2.2": "Returned items must be unused, in original condition, with tags attached.",
  "2.3": "Final sale items and opened consumables cannot be returned.",
  "2.4": "Refunds go to the original payment method within 5–10 business days after the return is received.",
  "2.5": "Customer pays $8.95 return shipping for change-of-mind returns; free if damaged, defective, or sent in error.",
  "3.1": "Warranty: 24 months for Alpine-brand items, 12 months for other brands, none for consumables.",
  "3.2": "Warranty covers defects in materials or workmanship under normal use.",
  "3.3": "Warranty excludes normal wear, accidental damage, misuse, and unauthorized modification.",
  "3.4": "Warranty remedy is repair or replacement; refund only if neither is possible, with supervisor approval.",
  "3.5": "Final sale items are still covered by warranty.",
  "3.6": "Warranty claims need the order number and photos of the defect.",
  "4.1": "Shipping damage must be reported within 7 days of delivery, with photos.",
  "4.2": "Missing items must be reported within 14 days of delivery, and the order must be marked delivered.",
  "4.3": "Wrong items must be reported within 14 days of delivery.",
  "5.1": "Refunds, replacements, or credits with an item value above $200 need supervisor approval.",
  "6.1": "Only supervisors may approve exceptions to policy.",
  "7": "Escalate on: value over $200, confidence below 0.70, exception request, angry customer, legal/chargeback threat, safety concern.",
};

export const RETURN_WINDOW_DAYS = 30;
export const DAMAGE_REPORT_DAYS = 7;
export const MISSING_OR_WRONG_REPORT_DAYS = 14;
export const SUPERVISOR_THRESHOLD_USD = 200;
export const MIN_CONFIDENCE = 0.7;
