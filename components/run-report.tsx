import { pct } from "@/lib/evaluate";
import { consistencyOf, FIELD_KEYS, type Consistency, type RunResult } from "@/lib/manualEval";

export function Mark({ ok }: { ok: boolean }) {
  return ok ? <span className="text-emerald-700">✓</span> : <span className="font-semibold text-rose-700">✗</span>;
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

export interface MetricRow {
  name: string;
  values: string[];
}

/** One row per metric, one value per run. Field accuracy rows are kept separate for the table heading. */
export function metricRows(runs: RunResult[]): { metrics: MetricRow[]; fields: MetricRow[] } {
  const consistency = runs.map((r) => consistencyOf(runs.filter((x) => x.group === r.group)));
  return {
    metrics: METRICS.map((m) => ({ name: m.name, values: runs.map((r, i) => m.value(r, consistency[i])) })),
    fields: FIELD_KEYS.map((f) => ({ name: f, values: runs.map((r) => ratio(r.fieldCorrect[f], r.total)) })),
  };
}

function Row({ row, mono }: { row: MetricRow; mono?: boolean }) {
  return (
    <tr>
      <td className={`px-3 py-2 whitespace-nowrap text-slate-600 ${mono ? "font-mono text-xs" : ""}`}>{row.name}</td>
      {row.values.map((v, i) => (
        <td key={i} className="px-3 py-2 whitespace-nowrap tabular-nums">
          {v}
        </td>
      ))}
    </tr>
  );
}

export function ComparisonTable({ runs }: { runs: RunResult[] }) {
  const { metrics, fields } = metricRows(runs);
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
          {metrics.map((row) => (
            <Row key={row.name} row={row} />
          ))}
          <tr className="bg-slate-50">
            <td colSpan={runs.length + 1} className="px-3 py-2 text-xs tracking-wide text-slate-500 uppercase">
              Field accuracy
            </td>
          </tr>
          {fields.map((row) => (
            <Row key={row.name} row={row} mono />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function WrongCases({ run, open }: { run: RunResult; open?: boolean }) {
  const wrong = run.cases.filter(
    (c) => !c.decisionCorrect || !c.escalateCorrect || c.wrongFields.length > 0 || c.hallucinations.length > 0,
  );
  return (
    <details open={open} className="rounded-lg border border-slate-200 bg-white">
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
