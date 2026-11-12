> Superseded implementation status: the daily collector is now implemented in collect.mjs. Follow FREE-DATA-SETUP.md for installation, live validation and GitHub activation. The November 9 audit below remains a snapshot of the original uploaded data.

# MTR stored-data adapter — November 9, 2026

## What is implemented

Read-only audit and optional stored-data scans using existing reconstruction cache files and the frozen MTR ledger. No EODHD calls are made in stored mode. Frozen ledger OHLC takes priority over overlapping historical cache bars. Conflicting split revisions, invalid OHLC, missing sessions and stale coverage fail closed. MTR-1 rules and frozen breadth formulas are unchanged. Existing forward journal and dashboard tables were not modified by this audit.

## Verified coverage in maicatrades11.9.zip

- All 122 fixed-universe stocks, SPY and RSP are present (124 symbols).
- Reconstruction cache: 251 SPY sessions, October 7, 2025–October 6, 2026.
- Existing MTR journal: 151 SPY sessions, March 9–October 12, 2026.
- Combined SPY calendar: 255 sessions, October 7, 2025–October 12, 2026.
- 201 dates have complete 55-session inputs across all symbols for six breadth observations: December 23, 2025–October 12, 2026.
- This is a coverage audit, not a historical strategy performance result. No old candidates were added to the forward signal log.

## Install

Extract this patch into the existing MaicaTrades project root, preserving paths. It contains only the changed MTR files and workflow test command. Preserve research/mtr/journal and research/historical-reconstruction/cache.

From the project root, in PowerShell:

```powershell
node research/mtr/stored-data.mjs
node --test research/mtr/test.mjs research/mtr/automation.test.mjs research/mtr/stored-data.test.mjs research/historical-reconstruction/test.mjs
```

Optional local stored scan (only before cloud journal handoff):

```powershell
$env:MTR_DATA_SOURCE = 'stored'
node research/mtr/run.mjs scan
Remove-Item Env:MTR_DATA_SOURCE
```

MTR_DATA_DIR optionally points to a different reconstruction cache directory. Files must use the original collector's metadata format, with raw OHLC and separate split responses. A summary score, adjusted-close-only series, or quote snapshot is not a replacement.

## Remaining blocker for daily operation

The supplied stock data ends October 12. It cannot produce current signals on November 9. Current stored scans intentionally fail. The site's market_breadth_history and market_score_history writes retain aggregate summaries, not complete individual-stock OHLC and split histories. A daily durable collector covering all 124 symbols and corporate actions still needs to be implemented and connected before stored mode can power hands-off current scans.

The cloud workflow remains on its existing provider mode. No secrets, schedule activation, database migration, seed, publication, or deployment was performed. The reconstruction cache is not automatically transferred in the existing cloud journal checkpoint; a durable data handoff is also required before enabling stored mode in Actions. Do not seed/reset the existing journal or run competing local publication writes after cloud handoff.

## Validation

All 33 tests passed across the MTR, automation, stored-data, and historical reconstruction suites (32 together, followed by the expanded four-test stored suite). The real stored scanner integration test forbids network access and supplies no provider token; it verifies successful scanning, idempotency, and an unchanged ledger after stale-data failure.
