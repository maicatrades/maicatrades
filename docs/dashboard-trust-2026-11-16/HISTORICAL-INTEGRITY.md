# Historical integrity investigation

Read-only observation on November 16, 2026. No values were corrected, deleted, smoothed, backfilled or promoted.

| Session | Score | Status | Raw score | Breadth adjustment | Breadth recorded with score |
|---|---:|---|---:|---:|---:|
| Nov 13 | 41 | intraday | 41.4 | 0 | unavailable |
| Nov 12 | 31 | final | 36.5 | -6 | 44.51 |
| Nov 11 | missing | — | — | — | — |
| Nov 10 | 25 | final | 24.7 | 0 | 62.32 |
| Nov 9 | 36 | intraday | 34.6 | +1 | 67.53 |
| Nov 6 | 21 | intraday | 21 | 0 | unavailable |
| Nov 5 | 1 | final | 7.1 | -6 | 40 |
| Nov 4 | 45 | final | 43.8 | +1 | 74.84 |
| Nov 3 | 21 | final | 27.2 | -6 | 44.74 |
| Nov 2 | 31 | final | 29.6 | +1 | 71.7 |

November 11 is also absent from breadth history. Veterans Day is an equity trading session, not an exchange holiday. November 13 score was captured 19:41:58 UTC (2:41:58 PM EST), before the close. Its separate breadth row later read 66.53, updated November 16 07:26:28 UTC. That timestamp shows subsequent request/persistence activity, not a validated original close capture.

November 5 stored components: trend 2 + momentum 0 + sectors 5.1 + volatility 0 = raw 7.1. Applying -6 yields 1.1, rounded to 1. The arithmetic is internally consistent. No saved raw SPY/QQQ/VIX/sector payloads in these rows establish whether those inputs were correct. Do not alter this value on appearance alone.

The reported 31.2 average can be reconstructed as (recomputed 43 + stored 31 + 25 + 36 + 21)/5. Using the stored 41 gives 30.8. Neither is a complete consecutive finalized five-session window: November 11 is missing and several rows are intraday. This is an explanation of the reported arithmetic, not proof that the current provider would still return 43.

The reported +40 is 41 minus 1. The code's six stored rows run November 5 through November 13, skipping November 11. Five actual equity sessions before November 13 is November 6, not November 5. Revised presentation refuses to label incomplete windows as a five-session change.

## Safeguards prepared
- Score writes may update only an explicitly intraday row; insert-if-absent ignores conflicts. A final or legacy unknown-status row cannot be replaced by this route, including concurrent finalizers.
- Breadth updates may target only a row whose updated_at predates that session's close; first post-close capture becomes immutable through this code. Legacy after-close timestamps are conservatively protected, not relabeled as proven final inputs.
- No stale-date, weekend, holiday or incomplete-universe breadth writes. Score history needs all sectors and valid same-date breadth; final capture also requires breadth updated after the close.
- Only explicit final score records enter research/averages. Missing sessions suppress averages and 1D/5D transition changes. These safeguards can reduce available samples; they never rewrite history to increase samples.

## Owner decisions still required
1. Approve a separate scheduled closing capture with error/freshness monitoring. The current request-driven system cannot promise a daily final record.
2. Approve database-level immutability, an audit table and explicit correction procedure before any schema migration. Application-only guards cannot constrain other writers.
3. Authorize any replay/backfill or historical correction only after obtaining dated raw provider data, comparing frozen methodology and documenting the proposed changes. No backfill script has been run.

M122 membership, frozen Market Score thresholds/caps, breadth formula, regime formulas, MTR strategy rules and reconstructed outputs were not changed.
