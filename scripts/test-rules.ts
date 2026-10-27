// Feeds the answer-key extraction into the rules engine and checks decision + escalate.
// Usage: npm run test:rules

import { pct, runRulesEval } from "../lib/evaluate";

const s = runRulesEval();

console.log("Alpine Outdoor - rules engine test (reference extraction)\n");
console.log(`Decision correct:  ${s.decisionCorrect}/${s.total}  (${pct(s.decisionCorrect, s.total)})`);
console.log(`Escalate correct:  ${s.escalateCorrect}/${s.total}  (${pct(s.escalateCorrect, s.total)})`);
console.log(`Both correct:      ${s.passed}/${s.total}  (${pct(s.passed, s.total)})`);

const failed = s.results.filter((r) => !r.passed);
if (failed.length > 0) {
  console.log("\nFailed cases:");
  console.table(
    failed.map((r) => ({
      case: r.caseId,
      issue: r.issueType,
      "expected decision": r.expectedDecision,
      "actual decision": r.actualDecision,
      "expected escalate": r.expectedEscalate,
      "actual escalate": r.actualEscalate,
    })),
  );
}

const reasonMismatches = s.results.filter((r) => r.passed && !r.reasonsMatch);
if (reasonMismatches.length > 0) {
  console.log("\nPassed, but escalation reasons differ (informational):");
  for (const r of reasonMismatches) {
    console.log(`  ${r.caseId}: expected [${r.expectedReasons.join(", ")}], got [${r.actualReasons.join(", ")}]`);
  }
}

process.exit(failed.length > 0 ? 1 : 0);
