import { CaseWorkspace, type CaseView } from "@/components/case-workspace";
import { findOrder, referenceExtraction, testCases } from "@/lib/data";
import { rulesFromExtraction } from "@/lib/evaluate";

export default function Home() {
  const cases: CaseView[] = testCases.map((tc) => {
    const extraction = referenceExtraction(tc);
    return {
      testCase: tc,
      order: findOrder(extraction.order_id),
      extraction,
      rules: rulesFromExtraction(tc, extraction),
    };
  });

  return <CaseWorkspace cases={cases} />;
}
