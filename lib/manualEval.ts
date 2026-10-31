// Scores pasted AI output. Runs in the browser on /run, so it must stay free of Node APIs.
import { findOrder, referenceExtraction, testCases } from "./data";
import { rulesFromExtraction } from "./evaluate";
import { ExtractionSchema } from "./extractSchema";
import type { Decision, EscalationCode, Extraction, TestCase } from "./types";

export const FIELD_KEYS = [
  "order_id",
  "affected_sku",
  "issue_type",
  "desired_outcome",
  "sentiment",
  "confidence",
  "item_condition",
  "damage_cause",
  "requests_exception",
  "legal_or_chargeback_threat",
  "safety_issue",
] as const satisfies readonly (keyof Extraction)[];

const CONFIDENCE_TOLERANCE = 0.1;

export interface ScoredCase {
  caseId: string;
  extraction: Extraction | null;
  error: string | null;
  hallucinations: string[];
  wrongFields: string[];
  decision: Decision | null;
  escalate: boolean | null;
  escalationReasons: EscalationCode[];
  decisionCorrect: boolean;
  escalateCorrect: boolean;
}

export interface RunResult {
  label: string;
  group: string;
  sourceFile: string;
  importedAt: string;
  jsonValid: boolean;
  jsonError: string | null;
  fenced: boolean;
  unknownCaseIds: string[];
  duplicateCaseIds: string[];
  total: number;
  validCases: number;
  schemaErrors: number;
  missingCases: number;
  hallucinationCases: number;
  decisionCorrect: number;
  escalateCorrect: number;
  bothCorrect: number;
  fieldCorrect: Record<string, number>;
  cases: ScoredCase[];
}

/** Runs of one prompt and model share a group: "v1-claude-run2" belongs to "v1-claude". */
export const groupOf = (label: string) => label.replace(/-run\d+$/i, "");

export function fieldsEqual(field: keyof Extraction, a: Extraction, b: Extraction): boolean {
  if (field === "confidence") return Math.abs(a.confidence - b.confidence) <= CONFIDENCE_TOLERANCE + 1e-9;
  return a[field] === b[field];
}

const normalize = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, "");

// AO-99999 is not hallucinated when the customer wrote it, so existence in orders.json is not the test.
export function findHallucinations(ex: Extraction, message: string): string[] {
  const out: string[] = [];
  if (ex.order_id && !normalize(message).includes(normalize(ex.order_id))) {
    out.push(`order_id ${ex.order_id} is not in the customer's message`);
  }
  if (ex.affected_sku && !findOrder(ex.order_id)?.items.some((i) => i.sku === ex.affected_sku)) {
    out.push(`affected_sku ${ex.affected_sku} is not on order ${ex.order_id ?? "(none)"}`);
  }
  return out;
}

function failedCase(caseId: string, error: string): ScoredCase {
  return {
    caseId,
    extraction: null,
    error,
    hallucinations: [],
    wrongFields: [],
    decision: null,
    escalate: null,
    escalationReasons: [],
    decisionCorrect: false,
    escalateCorrect: false,
  };
}

function scoreCase(tc: TestCase, ex: Extraction): ScoredCase {
  const rules = rulesFromExtraction(tc, ex);
  const expected = referenceExtraction(tc);
  return {
    caseId: tc.case_id,
    extraction: ex,
    error: null,
    hallucinations: findHallucinations(ex, tc.message),
    wrongFields: FIELD_KEYS.filter((f) => !fieldsEqual(f, ex, expected)),
    decision: rules.decision,
    escalate: rules.escalate,
    escalationReasons: rules.escalations.map((e) => e.code),
    decisionCorrect: rules.decision === tc.expected.decision,
    escalateCorrect: rules.escalate === tc.expected.escalate,
  };
}

function parseRaw(text: string): { items: unknown[] | null; fenced: boolean; error: string | null } {
  const trimmed = text.trim();
  const fence = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  try {
    const parsed: unknown = JSON.parse(fence ? fence[1] : trimmed);
    if (!Array.isArray(parsed)) return { items: null, fenced: !!fence, error: "Top level is not a JSON array." };
    return { items: parsed, fenced: !!fence, error: null };
  } catch (err) {
    return { items: null, fenced: !!fence, error: err instanceof Error ? err.message : String(err) };
  }
}

export function scoreRun(label: string, sourceFile: string, rawText: string, cases: TestCase[] = testCases): RunResult {
  const { items, fenced, error } = parseRaw(rawText);
  const known = new Set(cases.map((c) => c.case_id));
  const seen = new Set<string>();
  const unknownCaseIds: string[] = [];
  const duplicateCaseIds: string[] = [];
  const byCase = new Map<string, Extraction | string>();

  for (const item of items ?? []) {
    const id = (item as { case_id?: unknown } | null)?.case_id;
    if (typeof id !== "string") {
      unknownCaseIds.push(`(no case_id: ${JSON.stringify(item)?.slice(0, 40)})`);
      continue;
    }
    if (!known.has(id)) {
      unknownCaseIds.push(id);
      continue;
    }
    if (seen.has(id)) {
      duplicateCaseIds.push(id);
      continue;
    }
    seen.add(id);
    const parsed = ExtractionSchema.safeParse(item);
    if (parsed.success) {
      byCase.set(id, parsed.data);
    } else {
      byCase.set(id, parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "));
    }
  }

  let schemaErrors = 0;
  let missingCases = 0;
  const scored = cases.map((tc) => {
    const entry = byCase.get(tc.case_id);
    if (entry === undefined) {
      missingCases++;
      return failedCase(tc.case_id, error ? "No usable JSON in this run." : "Case missing from the AI output.");
    }
    if (typeof entry === "string") {
      schemaErrors++;
      return failedCase(tc.case_id, `Schema error: ${entry}`);
    }
    return scoreCase(tc, entry);
  });

  const fieldCorrect: Record<string, number> = {};
  for (const f of FIELD_KEYS) {
    fieldCorrect[f] = scored.filter((c) => c.extraction && !c.wrongFields.includes(f)).length;
  }

  return {
    label,
    group: groupOf(label),
    sourceFile,
    importedAt: new Date().toISOString(),
    jsonValid: items !== null,
    jsonError: error,
    fenced,
    unknownCaseIds,
    duplicateCaseIds,
    total: cases.length,
    validCases: scored.filter((c) => c.extraction).length,
    schemaErrors,
    missingCases,
    hallucinationCases: scored.filter((c) => c.hallucinations.length > 0).length,
    decisionCorrect: scored.filter((c) => c.decisionCorrect).length,
    escalateCorrect: scored.filter((c) => c.escalateCorrect).length,
    bothCorrect: scored.filter((c) => c.decisionCorrect && c.escalateCorrect).length,
    fieldCorrect,
    cases: scored,
  };
}

export interface Consistency {
  runs: number;
  total: number;
  decisionConsistent: number | null;
  extractionConsistent: number | null;
}

/** A case counts as consistent only if every run produced a valid extraction and they all agree. */
export function consistencyOf(runs: RunResult[]): Consistency {
  const total = runs[0]?.total ?? 0;
  if (runs.length < 2) return { runs: runs.length, total, decisionConsistent: null, extractionConsistent: null };

  let decisionConsistent = 0;
  let extractionConsistent = 0;
  for (let i = 0; i < total; i++) {
    const row = runs.map((r) => r.cases[i]);
    const first = row[0];
    if (row.some((c) => !c.extraction)) continue;
    if (row.every((c) => c.decision === first.decision && c.escalate === first.escalate)) decisionConsistent++;
    if (row.every((c) => FIELD_KEYS.every((f) => fieldsEqual(f, c.extraction!, first.extraction!)))) {
      extractionConsistent++;
    }
  }
  return { runs: runs.length, total, decisionConsistent, extractionConsistent };
}
