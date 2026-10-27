# Alpine Outdoor – Support Copilot

Course prototype of AI-assisted customer support for a fictional outdoor retailer.
Pattern: **the system suggests, a human decides.** The AI never sends replies or issues refunds.

## Pipeline

1. **Extraction (LLM, coming next)**: customer message → structured JSON.
2. **Rules (TypeScript, deterministic)**: `lib/rules.ts` decides eligibility and escalation from `data/policy.md`.
3. **Draft reply (LLM, coming next)**: written only from the policy and the rules decision.
4. **Human review**: agent approves, edits, or escalates.

## Project layout

| Path | Purpose |
|------|---------|
| `data/policy.md` | Support policy (source of truth) |
| `data/orders.json` | 15 mock orders |
| `data/test_cases.json` | 25 customer messages with answer keys |
| `lib/rules.ts` | Rules engine (no LLM) |
| `lib/evaluate.ts` | Runs rules on every test case and compares with the answer key |
| `app/page.tsx` | Agent workspace |
| `app/eval/page.tsx` | Rules evaluation results |

## Commands

```bash
npm install
npm run dev          # http://localhost:3000
npm run test:rules   # rules accuracy on the answer-key extraction
npm run build
```
