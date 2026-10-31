import type { Metadata } from "next";
import { pct, runRulesEval, type CaseEval } from "@/lib/evaluate";
import { consistencyOf, FIELD_KEYS, readRunResults, type Consistency, type RunResult } from "@/lib/manualEval";

export const metadata: Metadata = {
  title: "Eval – Alpine Outdoor Support Copilot",
};

function Stat({ label, n, total }: { label: string; n: number; total: number }) {
  const ok = n === total;
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`mt-1 text-3xl font-semibold tabular-nums ${ok ? "text-emerald-700" : "text-rose-700"}`}>
        {pct(n, total)}
      </p>
      <p className="text-xs text-slate-500 tabular-nums">
        {n} / {total} cases
      </p>
    </div>
  );
}

function Mark({ ok }: { ok: boolean }) {
  return ok ? <span className="text-emerald-700">✓</span> : <span className="font-semibold text-rose-700">✗</span>;
}

function ResultsTable({ rows }: { rows: CaseEval[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table className="w-full min-w-[720px] text-sm">
        <thead className="bg-slate-50 text-left text-xs tracking-wide text-slate-500 uppercase">
          <tr>
            <th className="px-3 py-2">Case</th>
            <th className="px-3 py-2">Issue</th>
            <th className="px-3 py-2">Decision (expected → actual)</th>
            <th className="px-3 py-2">Escalate (expected → actual)</th>
            <th className="px-3 py-2">Escalation reasons</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((r) => (
            <tr key={r.caseId} className={r.passed ? "" : "bg-rose-50"}>
              <td className="px-3 py-2 font-mono text-xs font-semibold">{r.caseId}</td>
              <td className="px-3 py-2">{r.issueType.replace(/_/g, " ")}</td>
              <td className="px-3 py-2">
                <Mark ok={r.decisionCorrect} /> {r.expectedDecision} → {r.actualDecision}
              </td>
              <td className="px-3 py-2">
                <Mark ok={r.escalateCorrect} /> {String(r.expectedEscalate)} → {String(r.actualEscalate)}
              </td>
              <td className="px-3 py-2 font-mono text-xs text-slate-600">
                {r.actualReasons.length ? r.actualReasons.join(", ") : "—"}
                {!r.reasonsMatch && (
                  <span className="block text-amber-700">expected: {r.expectedReasons.join(", ") || "—"}</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const ratio = (n: number | null, total: number) => (n === null ? "n/a" : `${pct(n, total)} (${n}/${total})`);

const METRICS: { name: string; value: (r: RunResult, c: Consistency) => string }[] = [
  { name: "Decision accuracy", value: (r) => ratio(r.decisionCorrect, r.total) },
  { name: "Escalate accuracy", value: (r) => ratio(r.escalateCorrect, r.total) },
  { name: "Decision and escalate both correct", value: (r) => ratio(r.bothCorrect, r.total) },
  { name: "Consistency: decision + escalate", value: (_, c) => ratio(c.decisionConsistent, c.total) },
  { name: "Consistency: all fields", value: (_, c) => ratio(c.extractionConsistent, c.total) },
  { name: "Runs in group", value: (_, c) => String(c.runs) },
  { name: "JSON valid", value: (r) => (r.jsonValid ? "yes" : "NO") + (r.fenced ? " (in a markdown fence)" : "") },
  { name: "Schema errors (cases)", value: (r) => String(r.schemaErrors) },
  { name: "Missing cases", value: (r) => String(r.missingCases) },
  { name: "Unknown case IDs", value: (r) => String(r.unknownCaseIds.length) },
  { name: "Hallucinations (cases)", value: (r) => String(r.hallucinationCases) },
];

function ComparisonTable({ runs }: { runs: RunResult[] }) {
  const consistency = new Map(runs.map((r) => [r.label, consistencyOf(runs.filter((x) => x.group === r.group))]));
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-left text-xs text-slate-500">
          <tr>
            <th className="px-3 py-2 tracking-wide uppercase">Metric</th>
            {runs.map((r) => (
              <th key={r.label} className="px-3 py-2 font-mono whitespace-nowrap">
                {r.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {METRICS.map((m) => (
            <tr key={m.name}>
              <td className="px-3 py-2 whitespace-nowrap text-slate-600">{m.name}</td>
              {runs.map((r) => (
                <td key={r.label} className="px-3 py-2 whitespace-nowrap tabular-nums">
                  {m.value(r, consistency.get(r.label)!)}
                </td>
              ))}
            </tr>
          ))}
          <tr className="bg-slate-50">
            <td colSpan={runs.length + 1} className="px-3 py-2 text-xs tracking-wide text-slate-500 uppercase">
              Field accuracy
            </td>
          </tr>
          {FIELD_KEYS.map((f) => (
            <tr key={f}>
              <td className="px-3 py-2 font-mono text-xs text-slate-600">{f}</td>
              {runs.map((r) => (
                <td key={r.label} className="px-3 py-2 whitespace-nowrap tabular-nums">
                  {ratio(r.fieldCorrect[f], r.total)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function WrongCases({ run }: { run: RunResult }) {
  const wrong = run.cases.filter(
    (c) => !c.decisionCorrect || !c.escalateCorrect || c.wrongFields.length > 0 || c.hallucinations.length > 0,
  );
  return (
    <details className="rounded-lg border border-slate-200 bg-white">
      <summary className="cursor-pointer px-4 py-2.5 text-sm font-semibold">
        <span className="font-mono">{run.label}</span>: {wrong.length} case(s) with errors
      </summary>
      {run.jsonError && <p className="px-4 pb-2 text-sm text-rose-700">JSON error: {run.jsonError}</p>}
      {wrong.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-slate-50 text-left text-xs tracking-wide text-slate-500 uppercase">
              <tr>
                <th className="px-3 py-2">Case</th>
                <th className="px-3 py-2">Decision</th>
                <th className="px-3 py-2">Escalate</th>
                <th className="px-3 py-2">Why</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {wrong.map((c) => (
                <tr key={c.caseId}>
                  <td className="px-3 py-2 font-mono text-xs font-semibold">{c.caseId}</td>
                  <td className="px-3 py-2">
                    <Mark ok={c.decisionCorrect} /> {c.decision ?? "—"}
                  </td>
                  <td className="px-3 py-2">
                    <Mark ok={c.escalateCorrect} /> {c.escalate === null ? "—" : String(c.escalate)}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs text-slate-600">
                    {c.error && <span className="block text-rose-700">{c.error}</span>}
                    {c.wrongFields.length > 0 && <span className="block">wrong: {c.wrongFields.join(", ")}</span>}
                    {c.hallucinations.map((h) => (
                      <span key={h} className="block text-rose-700">
                        hallucination: {h}
                      </span>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </details>
  );
}

export default function EvalPage() {
  const s = runRulesEval();
  const failed = s.results.filter((r) => !r.passed);
  const runs = readRunResults();

  return (
    <main className="mx-auto w-full max-w-5xl space-y-10 p-4 sm:p-6">
      <section className="space-y-3">
        <div>
          <h1 className="text-xl font-semibold">AI extraction comparison</h1>
          <p className="mt-1 text-sm text-slate-600">
            Each label is one manual run on claude.ai, scored through the full pipeline (AI extraction → rules) against
            the answer key. Failed or missing cases count as wrong. Confidence counts as correct within ±0.10. Runs
            named <code className="rounded bg-slate-100 px-1 font-mono text-xs">name-run1</code>,{" "}
            <code className="rounded bg-slate-100 px-1 font-mono text-xs">name-run2</code> form one group for
            consistency, which needs at least 2 runs.
          </p>
        </div>
        {runs.length === 0 ? (
          <p className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
            No AI runs yet. Score one with{" "}
            <code className="rounded bg-slate-100 px-1 font-mono text-xs">npm run eval:manual</code>.
          </p>
        ) : (
          <>
            <ComparisonTable runs={runs} />
            <h2 className="font-semibold">Cases with errors</h2>
            <div className="space-y-2">
              {runs.map((r) => (
                <WrongCases key={r.label} run={r} />
              ))}
            </div>
          </>
        )}
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Rules engine evaluation</h2>
          <p className="mt-1 text-sm text-slate-600">
            The answer-key extraction for each of the {s.total} test cases is fed into the rules engine, and its
            decision and escalation flag are compared with the expected values. This isolates rule bugs from extraction
            errors. Same as <code className="rounded bg-slate-100 px-1 font-mono text-xs">npm run test:rules</code>.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Stat label="Decision correct" n={s.decisionCorrect} total={s.total} />
          <Stat label="Escalate correct" n={s.escalateCorrect} total={s.total} />
          <Stat label="Both correct" n={s.passed} total={s.total} />
        </div>

        <section className="space-y-2">
          <h3 className="font-semibold">Failed cases ({failed.length})</h3>
          {failed.length === 0 ? (
            <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              All cases pass.
            </p>
          ) : (
            <ResultsTable rows={failed} />
          )}
        </section>

        <section className="space-y-2">
          <h3 className="font-semibold">All cases</h3>
          <ResultsTable rows={s.results} />
        </section>
      </section>
    </main>
  );
}
