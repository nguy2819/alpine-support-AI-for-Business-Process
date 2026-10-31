import type { Metadata } from "next";
import { pct, runRulesEval, type CaseEval } from "@/lib/evaluate";
import { readRunResults } from "@/lib/manualResults";
import { ComparisonTable, Mark, WrongCases } from "@/components/run-report";

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
