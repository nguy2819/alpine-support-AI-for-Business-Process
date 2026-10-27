import { findOrder, referenceExtraction, testCases } from "./data";
import { evaluateRules, type RulesResult } from "./rules";
import type { Decision, EscalationCode, Extraction, TestCase } from "./types";

export function rulesFromExtraction(tc: TestCase, ex: Extraction): RulesResult {
  return evaluateRules({
    order: findOrder(ex.order_id),
    issueType: ex.issue_type,
    affectedSku: ex.affected_sku,
    sentiment: ex.sentiment,
    confidence: ex.confidence,
    receivedDate: tc.received_date,
    itemCondition: ex.item_condition,
    damageCause: ex.damage_cause,
    requestsException: ex.requests_exception,
    legalOrChargebackThreat: ex.legal_or_chargeback_threat,
    safetyIssue: ex.safety_issue,
  });
}

export interface CaseEval {
  caseId: string;
  issueType: string;
  expectedDecision: Decision;
  actualDecision: Decision;
  expectedEscalate: boolean;
  actualEscalate: boolean;
  expectedReasons: EscalationCode[];
  actualReasons: EscalationCode[];
  decisionCorrect: boolean;
  escalateCorrect: boolean;
  reasonsMatch: boolean;
  passed: boolean;
}

export interface EvalSummary {
  total: number;
  decisionCorrect: number;
  escalateCorrect: number;
  passed: number;
  results: CaseEval[];
}

/** Runs the rules on the reference extraction of every test case and compares with the answer key. */
export function runRulesEval(cases: TestCase[] = testCases): EvalSummary {
  const results = cases.map((tc): CaseEval => {
    const r = rulesFromExtraction(tc, referenceExtraction(tc));
    const actualReasons = r.escalations.map((e) => e.code);
    const expectedReasons = tc.expected.escalation_reasons;
    const decisionCorrect = r.decision === tc.expected.decision;
    const escalateCorrect = r.escalate === tc.expected.escalate;
    return {
      caseId: tc.case_id,
      issueType: tc.expected.issue_type,
      expectedDecision: tc.expected.decision,
      actualDecision: r.decision,
      expectedEscalate: tc.expected.escalate,
      actualEscalate: r.escalate,
      expectedReasons,
      actualReasons,
      decisionCorrect,
      escalateCorrect,
      reasonsMatch: [...expectedReasons].sort().join() === [...actualReasons].sort().join(),
      passed: decisionCorrect && escalateCorrect,
    };
  });

  return {
    total: results.length,
    decisionCorrect: results.filter((r) => r.decisionCorrect).length,
    escalateCorrect: results.filter((r) => r.escalateCorrect).length,
    passed: results.filter((r) => r.passed).length,
    results,
  };
}

export const pct = (n: number, total: number) => (total === 0 ? "0.0%" : `${((100 * n) / total).toFixed(1)}%`);
