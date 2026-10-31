import { CaseWorkspace, type CaseView, type RunViews } from "@/components/case-workspace";
import { findOrder, referenceExtraction, testCases } from "@/lib/data";
import { rulesFromExtraction } from "@/lib/evaluate";
import { readRunResults, type RunResult } from "@/lib/manualEval";

function viewsFor(run: RunResult | null): CaseView[] {
  return testCases.map((tc) => {
    const ai = run?.cases.find((c) => c.caseId === tc.case_id) ?? null;
    const reference = referenceExtraction(tc);
    const extraction = ai?.extraction ?? reference;
    return {
      testCase: tc,
      order: findOrder(extraction.order_id),
      extraction,
      reference,
      ai,
      rules: rulesFromExtraction(tc, extraction),
    };
  });
}

export default function Home() {
  const results = readRunResults();
  const runs: RunViews[] = results.length
    ? results.map((r) => ({ label: r.label, views: viewsFor(r) }))
    : [{ label: null, views: viewsFor(null) }];

  return <CaseWorkspace runs={runs} />;
}
