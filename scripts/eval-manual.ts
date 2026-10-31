// Scores a JSON array pasted back from a manual claude.ai run. Makes no API calls.
// Usage: npm run eval:manual -- --file results/raw/v1-claude-run1.json --label v1-claude-run1

import fs from "node:fs";
import path from "node:path";
import { pct } from "../lib/evaluate";
import { consistencyOf, readRunResults, resultPath, scoreRun } from "../lib/manualEval";

function argValue(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const file = argValue("file");
const label = argValue("label");

if (!file || !label) {
  console.error('Usage: npm run eval:manual -- --file results/raw/<name>.json --label "v1-claude-run1"');
  process.exit(1);
}
if (!/^[\w.-]+$/.test(label)) {
  console.error("--label may only use letters, numbers, dots, dashes, and underscores.");
  process.exit(1);
}
if (!fs.existsSync(file)) {
  console.error(`File not found: ${file}`);
  process.exit(1);
}

const run = scoreRun(label, file.replace(/\\/g, "/"), fs.readFileSync(file, "utf-8"));
const out = resultPath(label);
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, `${JSON.stringify(run, null, 2)}\n`);

const n = run.total;
console.log(`${label} (group ${run.group})`);
if (!run.jsonValid) console.log(`JSON INVALID: ${run.jsonError}`);
if (run.fenced) console.log("Note: output was wrapped in a markdown fence.");
console.log(`Valid cases:     ${run.validCases}/${n}`);
console.log(`Schema errors:   ${run.schemaErrors}`);
console.log(`Missing cases:   ${run.missingCases}`);
if (run.unknownCaseIds.length) console.log(`Unknown cases:   ${run.unknownCaseIds.join(", ")}`);
if (run.duplicateCaseIds.length) console.log(`Duplicate cases: ${run.duplicateCaseIds.join(", ")}`);
console.log(`Hallucinations:  ${run.hallucinationCases} case(s)`);
console.log(`Decision:        ${run.decisionCorrect}/${n} (${pct(run.decisionCorrect, n)})`);
console.log(`Escalate:        ${run.escalateCorrect}/${n} (${pct(run.escalateCorrect, n)})`);
console.log(`Both:            ${run.bothCorrect}/${n} (${pct(run.bothCorrect, n)})`);

console.log("\nField accuracy:");
for (const [field, correct] of Object.entries(run.fieldCorrect)) {
  console.log(`  ${field.padEnd(27)} ${correct}/${n} (${pct(correct, n)})`);
}

const c = consistencyOf(readRunResults().filter((r) => r.group === run.group));
console.log(`\nConsistency across ${c.runs} run(s) of ${run.group}:`);
if (c.decisionConsistent === null) {
  console.log("  needs at least 2 runs");
} else {
  console.log(`  decision + escalate: ${c.decisionConsistent}/${c.total} (${pct(c.decisionConsistent, c.total)})`);
  console.log(`  all fields:          ${c.extractionConsistent}/${c.total} (${pct(c.extractionConsistent!, c.total)})`);
}

const wrong = run.cases.filter((x) => !x.decisionCorrect || !x.escalateCorrect || x.wrongFields.length || x.error);
if (wrong.length) {
  console.log("\nCases with any error:");
  for (const x of wrong) {
    const parts = [
      x.error,
      x.wrongFields.length ? `wrong: ${x.wrongFields.join(", ")}` : null,
      !x.decisionCorrect && x.decision ? `decision ${x.decision}` : null,
      !x.escalateCorrect && x.escalate !== null ? `escalate ${x.escalate}` : null,
      ...x.hallucinations,
    ].filter(Boolean);
    console.log(`  ${x.caseId}: ${parts.join(" | ")}`);
  }
}

console.log(`\nSaved ${path.relative(process.cwd(), out)}`);
