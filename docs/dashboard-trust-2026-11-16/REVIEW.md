# Review and deployment checkpoint

Read INITIAL-AUDIT.md, HISTORICAL-INTEGRITY.md and TRACKER.md before approval.

## What changed
The dashboard distinguishes score provenance, rejects incomplete rolling windows, protects existing snapshots through application writes, retrieves current finalized research, clarifies per-quote sessions/timestamps, fixes VIX extended-hours substitution, explains separate signal dimensions, and connects Trade Idea planned levels to the existing calculator. A prefill is not a historical fill or a fresh market quote. Account/risk entries remain local React state, are excluded from URLs and are not stored.

## Verification
- Existing research/automation suite: 44 baseline tests passed, with no research files changed.
- `npm run test:trust`: deterministic unit/API tests cover NYSE holiday/DST/early close, invalid/missing values, consecutive history, duplicate/concurrent snapshot safety, final-score weekend cache contract, Pro authentication/latest-250 selection, breadth immutability and long/short calculator prefill. Eleven new tests pass.
- TypeScript check and production build performed with local Linux native dependencies; final passing results recorded in VALIDATION.md.
- Prepared browser checks use intercepted fixture responses, preventing production API writes, but execution is blocked by Chromium launch restrictions. No signed-in Pro session is required for API contract tests.

## Deliberate limitations
This is an initial review candidate, not a claim that the entire multi-phase master project is done. Phase 1 remains partial where capture automation, historical provenance, DB enforcement and full detail-page consistency are unresolved. Trade Idea track record, unconditional outcome baselines, statistical significance and new data features remain pending.

Filters can expose fewer history rows and no five-session average rather than silently treating gaps or intraday values as final. Existing November 13 intraday history stays intraday; it is not promoted. Frozen scoring formulas and research remain untouched. Read-only audit found no basis to approve correcting November 5.

## Owner-controlled release
No deploy, merge, production database write or migration was performed. Review the branch diff and verify in a non-production environment using development credentials. Do not blindly run live public API routes as a smoke test: legacy routes such as Trade Idea have write side effects. Before deployment, owner must accept the partial scope and decide closing-capture monitoring/DB protection. Manual Cloudflare deployment remains the owner's existing process (`npm run deploy`, only after explicit approval). No deployment command was executed.

Rollback: restore prior code commit 542b94a or the preserved archive baseline b611cca, rebuild and deploy only with owner authorization. Code rollback does not repair historical records; this work did not change them.

## Ticker preference update
At the owner’s request, restored the automatically scrolling ticker without a horizontal scrollbar. Two identical presentation copies create the seamless loop; the second is aria-hidden. Quote dates, session labels and stale-data notices remain. Hover pauses scrolling.
