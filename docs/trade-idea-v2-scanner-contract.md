# Trade Idea V2 — draft scanner contract

Status: **development only**. V1 and MTR must remain untouched.

## Selection and publication
- The scanner refreshes during the trading week; display **up to three** qualifying opportunities, not exactly three.
- Candidate selection is **manual**. The user can select a ranked candidate, enter an independent ticker, or wait.
- A manually entered ticker must pass the same market-data validation and display its reasons/warnings; a manual override must be clearly identified and must never silently masquerade as a scanner-qualified pick.
- Only one published idea is active at a time. Publication requires explicit user approval.
- Capture immutable versioned setup, levels, direction, source (SCANNER or MANUAL), approval timestamp and provider timestamps.
- No next trade is published automatically, including after a completed stop/target.
- Unselected candidate snapshots may be kept for research but **never** counted as executed or published trades.

## Technical rules — first draft, subject to backtesting
- Daily bars establish broad directional bias; completed 4-hour bars confirm entry.
- Three candidate patterns: break/retest, 9/20 EMA continuation, reversal confirmation.
- Long and short are supported. Minimum 1 million shares average daily volume; minimum 2R; stop beyond local structure.
- Earnings inside five trading sessions or unavailable earnings data must be visibly flagged.
- Ranking scores are heuristic, not probabilities or evidence of profitability.
- Data adapter must guarantee that daily and 4h bars are regular-session, completed, timezone-normalized, split-consistent and fresh. Do not infer completion from provider timestamps without checking provider interval semantics.
- Reject stale, incomplete, malformed or insufficient history. No forced candidates.

## Lifecycle
1. SCANNING -> AWAITING_APPROVAL (not public).
2. Approval -> PUBLISHED_WAITING_FOR_ENTRY (locked).
3. Verified post-publication entry -> ACTIVE.
4. Verified post-entry stop or target -> STOPPED_OUT or TARGET_HIT.
5. Stop/invalidation reached **before entry** -> PRE_ENTRY_INVALIDATION, not a loss.
6. Missing/ambiguous intrabar event ordering -> NEEDS_REVIEW; do not fabricate a win/loss.
7. Terminal event frees the approval slot, but does not approve the next idea.
8. Journal and metrics separate V1 from V2, scanner from manual, and reviewed from verified outcomes.

## Remaining engineering gates before production
- Historical testing and signal-count/coverage analysis across both directions and market regimes.
- Provider adapter for historical and live completed 4-hour US equity bars, with explicit timezone and session boundary rules.
- Verify daily/4h EMA indexing and bar completion using fixture tests; include no-lookahead and duplicate-bar tests.
- Intraday lifecycle monitoring, deterministic ordering and corporate-action handling.
- Authenticated approval UI/API, atomic one-active-idea constraint, immutable snapshots, audit log.
- Durable scanning scheduler, rate-limit management, stale-data warnings and retries.
- Review security and isolate database tables from V1/MTR. Do not merge or deploy until validated.
