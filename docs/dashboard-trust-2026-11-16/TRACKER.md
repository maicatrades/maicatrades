# Development tracker

Scope checkpoint: tested trust fixes plus calculator prefill; this is not completion of all four project phases. Nothing is deployed or merged.

| Task | Priority | Status / root cause | Changed files | Verification / blocker | Ready |
|---|---|---|---|---|---|
| 1.1 Ticker/Pulse | Critical | Implemented explicit references and quote dates; VIX regular-only. Independent providers may still differ | market-ticker API, MarketTicker, market-pulse API, MarketPulse | Unit/API tests; visual QA blocked; original simultaneous provider payloads unavailable | Review |
| 1.2 Score/average | Critical | Audited real read-only rows; final/provisional distinction and consecutive-window calculation | market-score API, score-history, MarketHero, Pro | Unit/API tests; missing history cannot be repaired without approval | Review |
| 1.3 Snapshots | Critical | Application guards implemented; DB enforcement pending | market-score/breadth APIs, score-history, market-session | Concurrent final/duplicate tests; schema migration requires approval | Partial |
| 1.4 Retrieval | High | Latest 250 final rows, descending query and chronological response | pro/research API | 260-record fixture, auth contract, gap test | Review |
| 1.5 Marquee | High | Automatic seamless scrolling restored at owner request; mirrored copy hidden from assistive technology | MarketTicker | Scrolling CSS restored and lint checked; browser fixture script updated, Chromium launch blocked | Review |
| 1.6 Explanation | High | Same-date breadth/backdrop explanation; no invented sector attribution | market-explanation, market-score API, MarketHero | Deterministic explanation fixtures | Review |
| 1.7 Repetition | Medium | Repeated dashboard footer outlook removed; no duplicate quote is mounted | dashboard page, MarketOutlook | Source/layout review | Review |
| 1.8 Terminology | High | Separate existing dimensions documented; no threshold changes | MarketDefinitions, Watchlist | Source audit; legacy nomenclature across detail pages remains | Partial |
| 1.9 Instrument labels | High | Existing different models explained, not forcibly equated | Watchlist, MarketDefinitions | Instrument-specific Pulse reasoning still uses shared templates | Partial |
| 1.10 Confidence/risk | High | Marked unvalidated, corrected /96, reduced small-sample predictive colors | DashboardSummary, TradeIdea, Pro, MarketDefinitions | Source/formula audit; historical calibration outstanding | Partial |
| 1.11 Sessions | High | Equity calendar, DST/early-close persistence, quote ET, closed-week header and full event dates | market-session, DashboardHeader, ticker, calendar API/component | Deterministic clock tests; detailed page/weekend event prioritization remains | Partial |
| 2.1 Idea lifecycle | High | Existing lifecycle preserved | none of lifecycle engine | New status presentation/RS/earnings/EMA enhancements pending | No |
| 2.2 Calculator | High | Calculate My Position uses validated planned-level URL prefill; existing sizing math untouched | trade-prefill, TradeIdea, position-size page | Long/short/malformed fixtures + browser checks; no balance storage | Review |
| 2.3–2.5 | Medium | Pending documented game-plan rules, key-level and watchlist enhancements | — | Data coverage/source assessments needed | No |
| 3.1–3.5 | High | Study now excludes intraday, gaps suppress transitions, sample labels honest; full validation/baselines/track record not implemented | pro/research, Pro | Raw historical provenance and complete finalized coverage unresolved | No |
| Phase 4 tiers 1–3 | Later | Deferred by master project's trust/statistical gate | — | Phase 1 and 3 acceptance not met; source/cost assessments required | No |

No new external API, paid subscription, recurring service, production secret change or auth permission change was introduced. Calendar maintenance and closing-capture reliability remain operational responsibilities.

## November 17 read-only preview checkpoint

Added a guarded transport to the shared market-record admin client, skipped score/breadth persistence during preview, and served Trade Idea from recorded data without scans or lifecycle writes. Setup persists the mode locally, status is visible in a banner and a no-store endpoint, and an installer preserves original files/configuration. No npm dependency, frozen methodology or database schema change. Verification: 18 trust/preview tests passed; TypeScript, focused lint, production build, disposable-folder installer check and real local HTTP preview-status check passed. Owner installation/status confirmation and real-data verification remain pending. This application safeguard does not modify database permissions and does not cover separate auth/session clients, deployed sites or research jobs.
