# MTR free daily collector

Built November 12, 2026. This patch adds a Twelve Data raw daily OHLC collector and Massive split-event collection. It does not place trades. Live all-symbol collection, GitHub activation, and live Pro publication still require verification with your credentials.

## 1. Install and run the first collection

Extract the patch and copy its .github and research folders into the MaicaTrades project root, merging folders and replacing matching files. Preserve the existing research/mtr/journal and reconstruction cache folders. This patch contains no keys, journals, price datasets, or changed strategy formulas.

Keep these two entries in the existing .env.local (never commit it):

```text
TWELVEDATA_API_KEY=your_private_key
MASSIVE_API_KEY=your_private_key
```

From the project root in PowerShell:

```powershell
node research/mtr/collect.mjs
```

Expect about 20–25 minutes with progress after each symbol. The collector reads the existing journal as its baseline but does not scan, publish, or alter ledger.json. It writes credential-free market-data.json only after all 124 symbols pass coverage and overlap checks. Failed downloads remain in collector-cache.json so the next run can resume. Do not delete or reset the journal.

Success ends with:

```text
Validated 124 symbols through YYYY-MM-DD. Forward journal was not changed.
```

Send that summary or the error for review. A parity failure is a real blocker to inspect, not a reason to change strategy rules or disable checks. Do not run local scan/publication commands when the cloud journal is authoritative.

## 2. Validate the installed patch

```powershell
node --test research/mtr/test.mjs research/mtr/automation.test.mjs research/mtr/stored-data.test.mjs research/mtr/collect.test.mjs research/historical-reconstruction/test.mjs
node research/mtr/stored-data.mjs
```

All 45 automated tests passed during development, including real collector/scanner subprocesses with simulated feeds and fixed clocks. The frozen engine.mjs and historical-reconstruction/frozen.mjs match the supplied original ZIP byte for byte. No live credentials were used during development.

## 3. Activate the existing GitHub schedule after the local collection passes

Add two separate GitHub repository Actions secrets:

- TWELVEDATA_API_KEY
- MASSIVE_API_KEY

Retain NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY. EODHD_API_TOKEN is no longer used by this workflow. The .env.local values on your PC are not automatically available to GitHub.

Commit/push the patch files to the default branch, preserving paths. Run the existing "MTR automatic scan and Pro publication" workflow using Run workflow. No site build/deployment is required for these collector/workflow changes; the existing private Pro page reads its published research log.

The runner restores the EXISTING cloud checkpoint, collects, scans missed sessions in order, saves/verifies its checkpoint, then publishes. It refuses to create a new experiment when no checkpoint exists. Do not reseed over an existing cloud journal. The local collection is a validation step; the cloud runner will independently collect using its restored journal and then retain its own inputs in the private checkpoint.

Verify all of the following before relying on automation:

1. The first manual Actions run completes successfully.
2. Pro's last completed session agrees with the collected session; health says success.
3. The following scheduled run also completes and retains the existing journal/signals.

Existing schedules are preserved: 03:35 UTC (10:35 PM EST / 11:35 PM EDT), retry 10:35 UTC (5:35 AM EST / 6:35 AM EDT). GitHub schedules can be delayed. Both are past the 10 PM ET collection cutoff. There is no guarantee of signal capture if both runs fail before the next entry window.

## What the collector checks

- Fixed 122-stock universe plus SPY and RSP. No universe changes.
- Daily raw OHLC (Twelve Data adjust=none), US exchange timezone, matching returned symbols, numeric OHLC and unique dates.
- Excludes current-day candles until 10 PM ET; older dates only before then. Weekends and scheduled NYSE full-day holidays are handled for expected SPY freshness; early closes still count as sessions. An unexpected exchange closure requires review rather than accepting a stale feed.
- Every symbol must have every supplied SPY-calendar date and the expected latest completed session. A stale/incomplete staged symbol is invalidated so retry fetches it again.
- Corporate actions use Massive's new /stocks/v1/splits endpoint, including stock dividends and reverse splits. All pages are fetched; credentials are sent only to the approved provider hosts. New split ratios use split_to/split_from, never cumulative adjustment factors.
- At least five overlapping saved sessions per symbol. Every overlapping OHLC value must be within 0.1% of the saved value. This is an operational review gate, not a trading rule or guarantee that two providers are interchangeable. Maximum differences and overlap counts are recorded per symbol. The original saved journal bars remain authoritative.
- Missing/revised split events on already frozen dates stop collection. Equivalent numeric ratios preserve the journal's original representation.
- Only fully validated datasets reach the scanner. Missing inputs cannot be labeled zero signals or successful current coverage. Existing late-entry rules keep old recovered candidates out of forward results.

## Limits and recovery

Collection uses 9 seconds between Twelve requests (~19 minutes for 124 symbols), and 15 seconds between Massive requests. The normal daily candle pass costs 124 Twelve credits; the scheduled retry uses another pass only if the completed-date dataset is not already saved. Split collection is a paginated market-wide date query, not 124 individual split calls. Per-run request budgets and bounded 429/server-error retries prevent unbounded loops. Other apps using the same keys share their account quotas.

An interrupted writer leaves a lock. Confirm no collector/scanner is running before removing only its stale collect.lock or run.lock directory. Never remove ledger.json, dated archives, or the cloud checkpoint. Data mismatch failures require inspection; stage files deliberately retain evidence and no bypass is provided.

A cold run downloads a rolling 220-calendar-day window. Historical reconstruction caches and the existing journal retain older inputs. Collection is separate from strategy backtesting. This patch does not silently reconstruct missed observations as prospective trades, does not change the public Score/Breadth history tables, and does not change MTR-1 formulas.

Provider access, all-symbol coverage, overlap agreement, and permitted usage for the intended private research must be verified in the live setup. Public redistribution or product expansion needs a separate licensing check. This patch does not imply that a free account permits public raw-data display.
