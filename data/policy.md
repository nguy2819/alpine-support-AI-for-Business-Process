# Alpine Outdoor — Customer Support Policy

Version: 1.0 (effective 2026-01-01)

This document is the single source of truth for customer support decisions.
Replies to customers must only state what is written here. Anything not covered
by this policy must be escalated to a supervisor.

---

## 1. Definitions

- **Delivery date**: the date the carrier marked the order as delivered. This is "day 0".
- **Days since delivery**: calendar days between the delivery date and the date the
  customer's message was received.
- **Item value**: unit price × quantity of the affected item(s), as shown on the order.
- **Final sale item**: any item marked `final_sale` on the order (clearance, outlet).
- **Consumable item**: fuel, food, and other single-use goods marked `consumable` on the order.
- **Safety-critical item**: climbing harnesses, helmets, carabiners, avalanche gear,
  and any item marked `safety_critical` on the order.

---

## 2. Returns (change of mind)

2.1 **Return window**: items may be returned for a refund if the request is received
**within 30 days of delivery** (day 30 is the last eligible day; day 31 is too late).

2.2 **Condition**: items must be **unused**, in original condition, with tags attached.
Items that have been worn outdoors, used on a trip, washed, or damaged by the customer
are not eligible for return.

2.3 **Not returnable**:
- Final sale items.
- Consumable items once opened. Unopened consumables follow the normal return window.

2.4 **Refund method**: refunds go to the original payment method within 5–10 business
days after the returned item is received at our warehouse.

2.5 **Return shipping**: the customer pays return shipping ($8.95, deducted from the refund)
for change-of-mind returns. Return shipping is free when the item was damaged, defective,
or sent in error.

2.6 **Exchanges**: a different size or color is handled as a return plus a new order.

---

## 3. Warranty (manufacturing defects)

3.1 **Coverage period** (from the delivery date):
- Alpine-brand items: **24 months**.
- Other brands: **12 months**.
- Consumables: no warranty.
- The exact warranty period for each item is listed on the order as `warranty_months`.

3.2 **Covered**: defects in materials or workmanship under normal use
(e.g. zipper failure, seam separation, delamination, broken buckles, faulty electronics).

3.3 **Not covered**:
- Normal wear and tear.
- Accidental damage (drops, crushing, car doors, fire, animals).
- Misuse, improper care, or unauthorized modification or repair.

3.4 **Remedy**: Alpine Outdoor will **repair or replace** the item at its discretion.
A refund is only offered if neither repair nor replacement is possible, and only with
supervisor approval.

3.5 **Final sale items** are still covered by warranty.

3.6 **Process**: the customer must provide the order number and photos of the defect.
A prepaid shipping label is provided for inspection when needed.

---

## 4. Shipping problems

### 4.1 Damaged in transit
- Must be reported **within 7 days of delivery**, with photos of the item and packaging.
- Remedy: free replacement, or a refund if the item is out of stock or the customer prefers.
- Reports made after 7 days are not eligible as shipping damage. If the problem may be a
  manufacturing defect, the customer may file a warranty claim instead (Section 3).

### 4.2 Missing item (part of the order did not arrive)
- Must be reported **within 14 days of delivery**.
- The order must be marked **delivered**. If the order is still in transit, share the
  tracking status instead; a claim can be opened if the package has not arrived
  5 business days after the estimated delivery date.
- Remedy: reship the missing item, or refund it.

### 4.3 Wrong item (different product, size, or color than ordered)
- Must be reported **within 14 days of delivery**.
- Remedy: a free return label for the wrong item plus shipment of the correct item,
  or a refund if the correct item is out of stock or the customer prefers.

---

## 5. Approval limits

5.1 Any refund, replacement, or store credit with an item value **above $200** requires
**supervisor approval** before it is confirmed to the customer.

5.2 Support agents may not grant goodwill credits, discounts, or extra compensation.

---

## 6. Exceptions

6.1 Only supervisors may approve exceptions to this policy (e.g. late returns,
expired warranty, returning used items).

6.2 Agents must never promise or imply that an exception will be granted. If a customer
asks for an exception, the case is escalated and the customer is told that a supervisor
will review it.

---

## 7. Escalation (internal)

A case must be escalated to a supervisor if **any** of the following apply:

| Code                         | Trigger                                                                 |
|------------------------------|-------------------------------------------------------------------------|
| `refund_over_threshold`      | The eligible refund/replacement/credit has an item value above $200.     |
| `low_confidence`             | The AI extraction confidence is below 0.70.                              |
| `exception_request`          | The customer asks for something outside policy, or tries to override it. |
| `angry_customer`             | The customer is angry or hostile (not merely disappointed).              |
| `legal_or_chargeback_threat` | The customer mentions a lawyer, legal action, or a bank dispute/chargeback. |
| `safety_concern`             | Injury, fire, gas leak, or a failure of a safety-critical item.          |

Escalation does not change the policy decision; it only means a supervisor must
review the case before anything is sent.

---

## 8. What support must never do

- Never send a reply, issue a refund, or ship a replacement without a human agent's approval.
- Never promise timelines, amounts, or outcomes not stated in this policy.
- Never promise an exception, compensation, or a supervisor's decision in advance.
- Never ask for full card numbers or passwords.
