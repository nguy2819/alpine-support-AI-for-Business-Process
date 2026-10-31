"use client";

import { useMemo, useState } from "react";
import { ComparisonTable, metricRows, WrongCases } from "@/components/run-report";
import { testCases } from "@/lib/data";
import { scoreRun, type RunResult } from "@/lib/manualEval";

export interface RunFile {
  name: string;
  description: string;
  content: string;
  mime: string;
}

interface Entry {
  id: number;
  label: string;
  text: string;
}

function download(name: string, content: string, mime: string) {
  const url = URL.createObjectURL(new Blob([content], { type: `${mime};charset=utf-8` }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

// The leading quote stops spreadsheets from running pasted text as a formula.
function csvCell(value: string | number | boolean | null): string {
  const text = value === null ? "" : String(value);
  const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

const toCsv = (rows: (string | number | boolean | null)[][]) =>
  `﻿${rows.map((r) => r.map(csvCell).join(",")).join("\r\n")}\r\n`;

function summaryCsv(runs: RunResult[]): string {
  const { metrics, fields } = metricRows(runs);
  return toCsv([["metric", ...runs.map((r) => r.label)], ...[...metrics, ...fields].map((m) => [m.name, ...m.values])]);
}

function casesCsv(runs: RunResult[]): string {
  const expected = new Map(testCases.map((tc) => [tc.case_id, tc.expected]));
  return toCsv([
    [
      "label",
      "case_id",
      "decision",
      "expected_decision",
      "decision_correct",
      "escalate",
      "expected_escalate",
      "escalate_correct",
      "wrong_fields",
      "hallucinations",
      "error",
    ],
    ...runs.flatMap((r) =>
      r.cases.map((c) => [
        r.label,
        c.caseId,
        c.decision,
        expected.get(c.caseId)?.decision ?? null,
        c.decisionCorrect,
        c.escalate,
        expected.get(c.caseId)?.escalate ?? null,
        c.escalateCorrect,
        c.wrongFields.join("; "),
        c.hallucinations.join("; "),
        c.error,
      ]),
    ),
  ]);
}

function CopyButton({ text }: { text: string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setState("copied");
    } catch {
      setState("failed");
    }
    setTimeout(() => setState("idle"), 2000);
  };
  return (
    <button onClick={copy} className={BUTTON}>
      {state === "copied" ? "Copied" : state === "failed" ? "Copy failed, use Download" : "Copy"}
    </button>
  );
}

const BUTTON =
  "rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50";

const STEPS = [
  "Pick a prompt: v1 is the simple one, v2 is the improved one. Pick one AI tool and model, and keep it the same for every run you want to compare.",
  "Open a new chat on claude.ai (or another AI tool). Use a new chat for every run, because an earlier chat can change the answer.",
  "Download policy.md and orders.json below, then upload both files to the chat. Do not upload anything else.",
  "Copy the prompt and paste it into the chat.",
  "Copy cases_for_ai.txt and paste it below the prompt in the same message, then send.",
  "Copy the whole reply. It should be a JSON list. Do not edit it, even if it looks wrong, because broken JSON is part of the score.",
  "Paste the reply into step 2 below and give it a label such as v1-claude-run1 or v2-chatgpt-run1.",
  "To measure consistency, repeat with a new chat and use the same label ending in run2, run3, and so on. Add each one with Add another run.",
];

const validLabel = (label: string) => /^[\w.-]+$/.test(label);

export function RunWorkspace({ files }: { files: RunFile[] }) {
  const [entries, setEntries] = useState<Entry[]>([{ id: 1, label: "v1-claude-run1", text: "" }]);

  const update = (id: number, patch: Partial<Entry>) =>
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  const addRun = () =>
    setEntries((prev) => {
      const last = prev[prev.length - 1];
      const label = last?.label.replace(/run(\d+)$/i, (_, n) => `run${Number(n) + 1}`) ?? "";
      return [...prev, { id: (last?.id ?? 0) + 1, label: label === last?.label ? "" : label, text: "" }];
    });

  const labelProblem = (e: Entry): string | null => {
    if (!e.text.trim()) return null;
    if (!validLabel(e.label)) return "Label is required. Use letters, numbers, dots, dashes, and underscores only.";
    if (entries.filter((x) => x.label === e.label).length > 1) return "Another run already uses this label.";
    return null;
  };

  const runs = useMemo(
    () =>
      entries
        .filter((e) => e.text.trim() && validLabel(e.label) && entries.filter((x) => x.label === e.label).length === 1)
        .map((e) => scoreRun(e.label, "pasted in browser", e.text)),
    [entries],
  );

  return (
    <main className="mx-auto w-full max-w-5xl space-y-8 p-4 sm:p-6">
      <div>
        <h1 className="text-xl font-semibold">Run an AI evaluation</h1>
        <p className="mt-1 text-sm text-slate-600">
          Test how well an AI reads customer messages, with no coding. You run the AI yourself in its chat window, then
          paste the reply here. Scoring happens in this browser tab. Nothing is uploaded or saved, so download the CSV
          before you close the page.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="font-semibold">Step 1: Run the AI</h2>
        <ol className="list-decimal space-y-1.5 pl-5 text-sm text-slate-800">
          {STEPS.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
        <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">
          {files.map((f) => (
            <li key={f.name} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5">
              <div>
                <p className="font-mono text-sm font-medium">{f.name}</p>
                <p className="text-xs text-slate-500">{f.description}</p>
              </div>
              <div className="flex gap-2">
                <CopyButton text={f.content} />
                <button onClick={() => download(f.name, f.content, f.mime)} className={BUTTON}>
                  Download
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">Step 2: Paste the AI replies</h2>
        {entries.map((e) => {
          const problem = labelProblem(e);
          return (
            <div key={e.id} className="space-y-2 rounded-lg border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap items-end gap-3">
                <label className="flex-1 text-sm text-slate-600">
                  Label
                  <input
                    value={e.label}
                    onChange={(ev) => update(e.id, { label: ev.target.value.trim() })}
                    placeholder="v1-claude-run1"
                    className="mt-1 block w-full rounded-md border border-slate-300 px-2 py-1.5 font-mono text-sm"
                  />
                </label>
                {entries.length > 1 && (
                  <button onClick={() => setEntries((p) => p.filter((x) => x.id !== e.id))} className={BUTTON}>
                    Remove
                  </button>
                )}
              </div>
              {problem && <p className="text-sm text-rose-700">{problem}</p>}
              <label className="block text-sm text-slate-600">
                AI reply
                <textarea
                  value={e.text}
                  onChange={(ev) => update(e.id, { text: ev.target.value })}
                  rows={6}
                  spellCheck={false}
                  placeholder='[{"case_id": "TC01", ...}]'
                  className="mt-1 block w-full rounded-md border border-slate-300 px-2 py-1.5 font-mono text-xs"
                />
              </label>
            </div>
          );
        })}
        <button onClick={addRun} className={BUTTON}>
          Add another run
        </button>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">Step 3: Results</h2>
        {runs.length === 0 ? (
          <p className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
            Results appear here as soon as you paste a reply.
          </p>
        ) : (
          <>
            <p className="text-sm text-slate-600">
              Failed or missing cases count as wrong. Confidence counts as correct within ±0.10. Runs with the same
              label before -run1, -run2 are compared for consistency, which needs at least 2 runs.
            </p>
            <ComparisonTable runs={runs} />
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => download("eval-summary.csv", summaryCsv(runs), "text/csv")}
                className={BUTTON}
              >
                Download summary CSV
              </button>
              <button onClick={() => download("eval-cases.csv", casesCsv(runs), "text/csv")} className={BUTTON}>
                Download case-by-case CSV
              </button>
            </div>
            <h3 className="font-semibold">Cases with errors</h3>
            <div className="space-y-2">
              {runs.map((r) => (
                <WrongCases key={r.label} run={r} open />
              ))}
            </div>
          </>
        )}
      </section>
    </main>
  );
}
