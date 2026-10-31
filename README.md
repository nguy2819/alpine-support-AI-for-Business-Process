# Alpine Outdoor – Support Copilot

Course prototype of AI-assisted customer support for a fictional outdoor retailer.
Pattern: **the system suggests, a human decides.** The AI never sends replies or issues refunds.

## Pipeline

1. **Extraction (LLM, run manually on claude.ai)**: customer message → structured JSON. The app makes no API calls.
2. **Rules (TypeScript, deterministic)**: `lib/rules.ts` decides eligibility and escalation from `data/policy.md`.
3. **Draft reply (LLM, coming next)**: written only from the policy and the rules decision.
4. **Human review**: agent approves, edits, or escalates.

## Project layout

| Path | Purpose |
|------|---------|
| `data/policy.md` | Support policy (source of truth) |
| `data/orders.json` | 15 mock orders |
| `data/test_cases.json` | 25 customer messages with answer keys. Never upload this to the AI. |
| `lib/rules.ts` | Rules engine (no LLM) |
| `lib/evaluate.ts` | Runs rules on every test case and compares with the answer key |
| `lib/extractSchema.ts` | Zod schema for the AI extraction |
| `lib/manualEval.ts` | Scores pasted AI output: validation, hallucination checks, accuracy, consistency |
| `prompts/extract_v1.txt`, `prompts/extract_v2.txt` | Project instructions for claude.ai (simple and improved) |
| `manual/cases_for_ai.txt` | The 25 messages for the AI, without answers |
| `scripts/eval-manual.ts` | Scores one pasted run and saves it |
| `results/raw/<label>.json` | AI output exactly as pasted |
| `results/<label>.json` | Scored run |
| `app/page.tsx` | Agent workspace: AI output vs. answer key |
| `app/eval/page.tsx` | Comparison of AI runs, plus rules evaluation |
| `docs/ai-log.md` | Log of AI experiments and decisions |

## Commands

```bash
npm install
npm run dev          # http://localhost:3000
npm run test:rules   # rules accuracy on the answer-key extraction
npm run eval:manual -- --file results/raw/v1-claude-run1.json --label v1-claude-run1
npm run build
```

## Manual AI runs

Upload only `policy.md` and `orders.json` to a claude.ai Project, paste a prompt from `prompts/` as the
project instructions, and send `manual/cases_for_ai.txt` in a new chat. Save the reply to
`results/raw/<label>.json` and run `npm run eval:manual`.

Labels ending in `-run1`, `-run2`, ... form one group, which is how consistency is measured.

`/` and `/eval` read `results/*.json` when the app is built. Commit and push new results to update the deployed
site. Locally, `npm run dev` shows them on reload.
