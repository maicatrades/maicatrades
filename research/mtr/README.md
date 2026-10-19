# MaicaTrades Reclaim · Research

MTR Research v1 and v1-P implement hypothesis 9 from the supplied
MaicaTrades-Failed-Breakdown-Test-v1 archive. The historical trades in that
archive are not imported into the forward signal log.

## Frozen rules

- Yesterday closes strictly below the lowest low of its preceding 20 SPY-calendar sessions of **that stock**. The breakdown day's low and recovery bar are excluded. Today must close strictly above that same level. There is no trend filter.
- Breadth on the signal date minus breadth exactly five sessions earlier is at least 5 points, rounded to two decimals. All six sessions require complete data. This is a difference between two scores, not a difference against the five-day average.
- Next-session open entry; reject opening at or below the stop. Stop is the lowest low of five sessions ending on the signal date, multiplied by 0.999.
- v1 exits fully at 2R. v1-P sells half at 2R; the remaining stop moves to entry starting the following session. Original stop remains effective on the target day.
- Maximum 20 holding sessions including entry. Gaps use opening prices; stop has priority when both barriers are touched within an ambiguous daily bar. An observed gap above the target happens before a later intraday stop.
- Charge 0.1% of entry value once per whole trade, including partial trades. No extra slippage or dividends.
- Every qualifying forward signal is recorded, with paired trades even when other signals overlap. The independent account model allows one position per stock, 1% risk of opening account equity, whole shares, no leverage, maximum three simultaneous positions, alphabetical priority. All costs are reserved at entry. Closing proceeds become available the following session. Each version has its own $1,000 account.

## Automated operation

See `MTR-AUTOMATION-SETUP.md` in the project root for the scheduled workflow,
private journal checkpoint, one-time seed, secrets, activation, and Pro health status.
Adding files alone does not activate automation. After cloud handoff, stop local
scan/publication writes; the cloud journal becomes the source of truth.

## Run locally (before cloud handoff)

The collector uses the existing fixed M122 universe and frozen breadth calculation.
It fetches 122 stocks plus SPY and RSP, including splits (248 provider requests).
Keep the EODHD token in an environment variable or `.env.local`; it is never
included in logs or Pro responses. Existing Supabase variables are used only
by the separate publication command.

From the MaicaTrades folder:

```powershell
node --test research/mtr/test.mjs
node research/mtr/run.mjs scan
```

Run after 10 PM America/New_York on trading days, or before the next trading
session opens. The 10 PM cutoff is a conservative operational delay, not a
provider guarantee of finality. Today's bar is excluded earlier in the evening.
The job refuses missing OHLC, duplicate dates, incomplete 50-session coverage,
missing breadth dates, stale data and changed frozen formulas. Duplicate completed-session scans now
succeed without rewriting the journal; missing sessions are processed in order.
No signal is logged once its next entry window has passed; the missed scan is
recorded. The entry-time gate conservatively assumes the next weekday is a
session; around exchange holidays it can miss a valid signal, which is preferable
to logging an already-known outcome as prospective. EOD fills are processed only when that session's completed bar arrives.
It does not place trades.

`journal/ledger.json` is the persistent source of truth. Dated JSON archives
save complete inputs and capture timestamps. Initial signal prices are immutable;
outcomes are recomputed on a split-normalized basis using first-observed raw
prices. Provider price revisions do not overwrite saved bars. Split revisions
require review. Preserve and back up the entire journal folder.

The collector uses an exclusive `journal/run.lock` directory. If interrupted,
check that no collector is running before removing the lock. If an archive and
`ledger.json.tmp` exist but the final ledger was not replaced, verify the staged
ledger's lastSession and archive match, then restore that staged ledger. Do not
rescan archived input dates or overwrite archives.

## Connect the private Pro dashboard

1. Apply `schema.sql` once in the project's Supabase SQL editor.
2. Run `node research/mtr/run.mjs publish` after a successful scan. It publishes
   the saved research view, excluding raw price data, using the server key.
3. Build/deploy the app using its normal process. Pro navigation includes
   **MTR Research**, at `/pro/mtr`. Both the page and data API require login;
   the database denies direct anonymous/authenticated client access.

No database migration, deployment, provider download, publication or schedule
is performed just by adding these files. Follow the automation setup guide and
verify a real scan before relying on the schedule. Late recovered candidates stay
in scan observations and never enter forward signal/account results.

## Validation and limits

Tests exercise strict support/reclaim comparisons, breadth continuity, stop and
target ordering, gap fills, partial protection timing, the holding deadline,
costs and account buying power. The Pro page starts empty, never with mock returns.

Review monthly for data/execution errors. Evaluate completed trades over many
distinct signal dates. Pro reports net R, profit factor, closed-trade drawdown
and losing streaks, plus a separate daily-marked account drawdown. Research R
drawdown orders same-day closes by deterministic signal order; it is descriptive,
not a portfolio result. Partial/full comparisons share all logged signals;
account capacity can produce different accepted trades between versions.

The 122-stock universe is retrospective. Frozen reconstructed breadth still
needs overlap comparison with finalized live snapshots. Daily OHLC cannot
resolve all intraday sequences; the conservative stop-first convention applies.
Paper trades, account assumptions and short samples do not establish live edge.
