"use client";

import { useState } from "react";
import { POLICY_CLAUSES } from "@/lib/policy";
import type { RulesResult } from "@/lib/rules";
import type { Decision, Extraction, Order, TestCase } from "@/lib/types";

export interface CaseView {
  testCase: TestCase;
  order: Order | null;
  extraction: Extraction;
  rules: RulesResult;
}

type ReviewStatus = "pending" | "editing" | "approved" | "escalated";

const STATUS_STYLE: Record<ReviewStatus, string> = {
  pending: "bg-slate-100 text-slate-600",
  editing: "bg-sky-100 text-sky-800",
  approved: "bg-emerald-100 text-emerald-800",
  escalated: "bg-amber-100 text-amber-800",
};

const DECISION_STYLE: Record<Decision, string> = {
  eligible: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  ineligible: "bg-rose-100 text-rose-800 ring-rose-200",
  needs_info: "bg-amber-100 text-amber-800 ring-amber-200",
};

const humanize = (s: string) => s.replace(/_/g, " ");
const usd = (n: number) => `$${n.toFixed(2)}`;

function Badge({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${className}`}>
      {children}
    </span>
  );
}

function Card({
  title,
  aside,
  children,
}: {
  title: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white">
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-2.5">
        <h2 className="text-sm font-semibold text-slate-700">{title}</h2>
        {aside}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-1 text-sm">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right font-medium text-slate-900">{children}</dd>
    </div>
  );
}

export function CaseWorkspace({ cases }: { cases: CaseView[] }) {
  const [selectedId, setSelectedId] = useState(cases[0]?.testCase.case_id);
  const [statuses, setStatuses] = useState<Record<string, ReviewStatus>>({});
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const current = cases.find((c) => c.testCase.case_id === selectedId) ?? cases[0];
  if (!current) return null;

  const id = current.testCase.case_id;
  const status = statuses[id] ?? "pending";
  const setStatus = (s: ReviewStatus) => setStatuses((prev) => ({ ...prev, [id]: s }));
  const reviewed = Object.values(statuses).filter((s) => s === "approved" || s === "escalated").length;

  return (
    <div className="flex flex-1 flex-col lg:flex-row">
      {/* Case list */}
      <aside className="border-b border-slate-200 bg-white lg:sticky lg:top-0 lg:h-[calc(100vh-3.5rem)] lg:w-80 lg:shrink-0 lg:border-r lg:border-b-0">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-sm font-semibold">Inbox</h1>
          <span className="text-xs text-slate-500">
            {reviewed}/{cases.length} reviewed
          </span>
        </div>
        <ul className="max-h-72 overflow-y-auto lg:max-h-[calc(100%-2.75rem)]">
          {cases.map((c) => {
            const cid = c.testCase.case_id;
            const s = statuses[cid] ?? "pending";
            const active = cid === id;
            return (
              <li key={cid}>
                <button
                  onClick={() => setSelectedId(cid)}
                  className={`w-full border-l-2 px-4 py-2.5 text-left transition-colors ${
                    active ? "border-emerald-600 bg-emerald-50" : "border-transparent hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-semibold text-slate-700">{cid}</span>
                    <div className="flex items-center gap-1.5">
                      {c.rules.escalate && (
                        <span className="h-2 w-2 rounded-full bg-amber-500" title="Needs escalation" />
                      )}
                      <Badge className={STATUS_STYLE[s]}>{s}</Badge>
                    </div>
                  </div>
                  <p className="mt-1 truncate text-sm text-slate-600">{c.testCase.message}</p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {humanize(c.extraction.issue_type)} · {c.extraction.order_id ?? "no order ID"}
                  </p>
                </button>
              </li>
            );
          })}
        </ul>
      </aside>

      {/* Case detail */}
      <main className="flex-1 space-y-4 p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">Case {id}</h2>
              <Badge className={STATUS_STYLE[status]}>{status}</Badge>
            </div>
            <p className="text-sm text-slate-500">
              {current.testCase.customer_email} · received {current.testCase.received_date}
            </p>
          </div>
        </div>

        <Card title="Customer message">
          <p className="text-sm leading-relaxed whitespace-pre-wrap text-slate-800">{current.testCase.message}</p>
        </Card>

        <div className="grid gap-4 xl:grid-cols-2">
          <OrderCard view={current} />
          <ExtractionCard extraction={current.extraction} />
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <DecisionCard rules={current.rules} />
          <EscalationCard rules={current.rules} />
        </div>

        <Card
          title="Draft reply"
          aside={<Badge className="bg-violet-100 text-violet-800">AI draft – coming next</Badge>}
        >
          <textarea
            value={drafts[id] ?? ""}
            onChange={(e) => setDrafts((prev) => ({ ...prev, [id]: e.target.value }))}
            readOnly={status !== "editing"}
            placeholder="AI draft – coming next"
            rows={6}
            className={`w-full rounded-md border px-3 py-2 text-sm outline-none ${
              status === "editing"
                ? "border-sky-300 bg-white focus:ring-2 focus:ring-sky-200"
                : "border-slate-200 bg-slate-50 text-slate-600"
            }`}
          />
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              onClick={() => setStatus("approved")}
              className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800"
            >
              Approve
            </button>
            <button
              onClick={() => setStatus("editing")}
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Edit
            </button>
            <button
              onClick={() => setStatus("escalated")}
              className="rounded-md border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-900 hover:bg-amber-100"
            >
              Escalate
            </button>
            {status !== "pending" && (
              <button
                onClick={() => setStatus("pending")}
                className="text-sm text-slate-500 underline-offset-2 hover:underline"
              >
                Reset
              </button>
            )}
          </div>
          <p className="mt-3 text-xs text-slate-500">
            Prototype: these buttons only change the status on this screen. Nothing is sent to the customer and no
            refund is issued.
          </p>
        </Card>
      </main>
    </div>
  );
}

function OrderCard({ view }: { view: CaseView }) {
  const { order, rules, extraction } = view;
  if (!order) {
    return (
      <Card title="Order">
        <p className="text-sm text-slate-600">
          {extraction.order_id ? (
            <>
              No order found for <span className="font-mono">{extraction.order_id}</span>.
            </>
          ) : (
            "The customer did not give an order ID."
          )}
        </p>
      </Card>
    );
  }
  return (
    <Card title={`Order ${order.order_id}`} aside={<Badge className="bg-slate-100 text-slate-700">{humanize(order.status)}</Badge>}>
      <dl>
        <Field label="Customer">{order.customer_name}</Field>
        <Field label="Ordered">{order.order_date}</Field>
        <Field label="Delivered">
          {order.delivery_date ?? `not yet (est. ${order.estimated_delivery_date ?? "unknown"})`}
        </Field>
        {rules.daysSinceDelivery !== null && <Field label="Days since delivery">{rules.daysSinceDelivery}</Field>}
        <Field label="Payment">{humanize(order.payment_method)}</Field>
      </dl>
      <ul className="mt-3 divide-y divide-slate-100 rounded-md border border-slate-200">
        {order.items.map((item) => {
          const affected = item.sku === extraction.affected_sku;
          return (
            <li key={item.sku} className={`px-3 py-2 text-sm ${affected ? "bg-emerald-50" : ""}`}>
              <div className="flex justify-between gap-3">
                <span className="font-medium">
                  {item.name}
                  {item.quantity > 1 && <span className="text-slate-500"> × {item.quantity}</span>}
                </span>
                <span className="tabular-nums">{usd(item.unit_price * item.quantity)}</span>
              </div>
              <div className="mt-1 flex flex-wrap gap-1">
                <span className="font-mono text-xs text-slate-400">{item.sku}</span>
                {affected && <Badge className="bg-emerald-600 text-white">affected</Badge>}
                <Badge className="bg-slate-100 text-slate-600">
                  {item.warranty_months ? `${item.warranty_months}-mo warranty` : "no warranty"}
                </Badge>
                {item.final_sale && <Badge className="bg-rose-100 text-rose-800">final sale</Badge>}
                {item.consumable && <Badge className="bg-slate-100 text-slate-600">consumable</Badge>}
                {item.safety_critical && <Badge className="bg-amber-100 text-amber-800">safety-critical</Badge>}
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

function ExtractionCard({ extraction: ex }: { extraction: Extraction }) {
  const flags = [
    ex.requests_exception && "requests exception",
    ex.legal_or_chargeback_threat && "legal / chargeback threat",
    ex.safety_issue && "safety issue",
  ].filter(Boolean);
  return (
    <Card
      title="Extraction"
      aside={<Badge className="bg-violet-100 text-violet-800">AI extraction – coming next</Badge>}
    >
      <p className="mb-2 text-xs text-slate-500">Showing the answer-key values until the LLM step is connected.</p>
      <dl>
        <Field label="Order ID">
          <span className="font-mono">{ex.order_id ?? "—"}</span>
        </Field>
        <Field label="Affected SKU">
          <span className="font-mono">{ex.affected_sku ?? "—"}</span>
        </Field>
        <Field label="Issue type">{humanize(ex.issue_type)}</Field>
        <Field label="Desired outcome">{humanize(ex.desired_outcome)}</Field>
        <Field label="Sentiment">{ex.sentiment}</Field>
        <Field label="Confidence">
          <span className={ex.confidence < 0.7 ? "text-amber-700" : ""}>{ex.confidence.toFixed(2)}</span>
        </Field>
        <Field label="Item condition">{ex.item_condition}</Field>
        <Field label="Damage cause">{ex.damage_cause}</Field>
        <Field label="Flags">{flags.length ? flags.join(", ") : "none"}</Field>
      </dl>
    </Card>
  );
}

function DecisionCard({ rules }: { rules: RulesResult }) {
  return (
    <Card title="Rules decision" aside={<span className="text-xs text-slate-400">deterministic · no LLM</span>}>
      <span
        className={`inline-flex rounded-md px-3 py-1 text-sm font-semibold uppercase tracking-wide ring-1 ${
          DECISION_STYLE[rules.decision]
        }`}
      >
        {humanize(rules.decision)}
      </span>
      <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-800">
        {rules.reasons.map((r) => (
          <li key={r}>{r}</li>
        ))}
      </ul>
      {rules.clauses.length > 0 && (
        <div className="mt-4">
          <h3 className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Policy clauses</h3>
          <ul className="mt-2 space-y-1.5">
            {rules.clauses.map((c) => (
              <li key={c} className="flex gap-2 text-sm">
                <span className="shrink-0 font-mono text-xs leading-5 text-slate-500">§{c}</span>
                <span className="text-slate-700">{POLICY_CLAUSES[c]}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}

function EscalationCard({ rules }: { rules: RulesResult }) {
  return (
    <Card
      title="Escalation"
      aside={
        rules.escalate ? (
          <Badge className="bg-amber-100 text-amber-800">supervisor review required</Badge>
        ) : (
          <Badge className="bg-slate-100 text-slate-600">not required</Badge>
        )
      }
    >
      {rules.escalations.length === 0 ? (
        <p className="text-sm text-slate-600">No escalation triggers. An agent can review and approve this case.</p>
      ) : (
        <ul className="space-y-2">
          {rules.escalations.map((e) => (
            <li key={e.code} className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs font-semibold text-amber-900">{e.code}</span>
                <span className="font-mono text-xs text-amber-700">§{e.clause}</span>
              </div>
              <p className="mt-0.5 text-sm text-amber-900">{e.reason}</p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
