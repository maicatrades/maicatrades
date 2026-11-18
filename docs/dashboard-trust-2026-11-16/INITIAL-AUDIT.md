# MaicaTrades audit — November 16, 2026

## Source and baseline
GitHub main was fetched and inspected: 542b94a, “Add free MTR data collection and durable automation.” No newer main commit was returned. The supplied November 16 archive has five substantive differences after ignoring CRLF: market-score route, DashboardSummary, MarketHero, Pro page and tsconfig. These were preserved in baseline commit b611cca on dedicated local branch fix/dashboard-trust-2026-11-16. Other archive-only files and the archive's original working tree were left untouched. No November 9 archive was needed to establish these causes.

Verified stack: Next 16.2.10, React 19.2.4, TypeScript 5, Tailwind 4, Supabase JS ^2.111.0, OpenNext Cloudflare ^1.20.1. Uploaded node_modules contains Windows native dependencies. Initial `npm run build` failed with executable permissions; invoking Next with Node exposed missing Linux Lightning CSS binaries. Matching Linux-only build dependencies were installed outside the repository; no dependency or lockfile upgrades were introduced.

Existing deterministic research/automation baseline: 44 passing tests. No production endpoints that could write records were invoked. Database investigation used GET-only Supabase REST requests selecting score/breadth history. No secrets are included in this report or release files.

## Confirmed causes
1. `/api/pro/research` ordered ascending before LIMIT 250, selecting the oldest records. It included intraday records in studies and called six stored rows a five-session change even across missing sessions.
2. `/api/market-score` recomputed completed dates from current provider responses while Pro research read stored records. A current calculation could diverge from an older intraday record. Five-day average used current recomputation plus four stored rows regardless of date gaps or final status.
3. Score persistence used unrestricted upsert on trading_date even for finalized rows. Persistence occurred only when users requested the route during regular hours or the two-hour post-close window. There is no independent score/breadth finalization job in the checked-in workflows; MTR automation is separate. Missing visits, provider failures or absent breadth can leave sessions missing or intraday.
4. Breadth persistence upserted a date on every request, including old dates on weekends. The table has no snapshot_status in this implementation. updated_at is not proof that input data was captured at that time.
5. Ticker intentionally uses latest regular close for PRE/AH movement; Pulse uses prior regular close for daily movement. ETF ticker primary provider is Finnhub while Pulse uses Yahoo. Both cache independently. The ticker duplicated its full instrument list for a marquee and displayed refresh clock without a timezone; it did not expose per-quote dates.
6. VIX was eligible for the ticker's ETF extended-hours substitution. Using its regular price as the extended-hours reference could manufacture a zero. VIX is now kept on its regular-session quote/reference.
7. Watchlist uses SMA20/SMA160 slopes, extension and RSI; Pulse uses daily change and EMA20/EMA50. These labels have different meanings, not interchangeable calculations. Existing thresholds remain unchanged.
8. Risk is 100 minus score plus a session adjustment (bounded -15 to +30), then clipped 0–100. It is not calibrated probability; volatility is a separate subcomponent. Trade Idea confidence is a scanner heuristic out of 96; UI incorrectly said /100. Pro evidence previously called 30 episodes “High” without statistical validation.
9. Calendar display date returned weekday only; dashboard omitted date and ET. Dashboard footer repeated Market Outlook. The separate QuoteOfTheDay component is unused on the dashboard; there were not two mounted Quote components in this source.

## Remaining uncertainties
Exact historical input payloads/provider timestamps were not retained with the queried score records. We cannot prove whether November 5 inputs were valid, nor reproduce the precise originally reported ticker/Pulse numbers without their provider responses and timestamps. We cannot prove request-driven capture alone caused November 11's absence without platform request/error logs. Database-wide immutability is not guaranteed by application guards: external/admin writers would require an approved database constraint/trigger and audited correction pathway.

## Calendar
Explicit equity-session coverage is 2025–2028, including 2025 January 9 exceptional closure and scheduled early closes. Unknown years fail closed for writes. Source: https://www.nyse.com/trade/hours-calendars and the NYSE 2025–2027 announcement. Unexpected future closures require calendar maintenance; this is not a live exchange-calendar subscription. Existing research calendars/formulas are unchanged.
