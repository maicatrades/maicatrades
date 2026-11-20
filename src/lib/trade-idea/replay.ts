/**
 * Read-only, deterministic replay of published Trade Idea levels.
 * No database access or side effects. Daily OHLC cannot prove intraday ordering.
 */
export type ReplayBar = { timestamp: number; open: number; high: number; low: number; close: number };
export type ReplayIdea = {
  direction: "LONG" | "SHORT"; entry: number; stop: number; target: number;
  lockedAt: string;
};
export type ReplayState =
  | "WAITING_FOR_ENTRY" | "ACTIVE" | "TARGET_HIT" | "STOPPED_OUT"
  | "PRE_ENTRY_INVALIDATION" | "NEEDS_REVIEW" | "INSUFFICIENT_DATA";
export type ReplayResult = {
  status: ReplayState;
  entrySession: string | null;
  outcomeSession: string | null;
  reason: string;
  reviewedBars: number;
  requiresIntradayConfirmation: boolean;
};
const session = (bar: ReplayBar) => new Date(bar.timestamp * 1000).toISOString().slice(0, 10);
export function replayTradeIdea(idea: ReplayIdea, bars: ReplayBar[]): ReplayResult {
  const lockedMs = Date.parse(idea.lockedAt);
  const validLevels = [idea.entry, idea.stop, idea.target].every(n => Number.isFinite(n) && n > 0) &&
    (idea.direction === "LONG"
      ? idea.stop < idea.entry && idea.entry < idea.target
      : idea.target < idea.entry && idea.entry < idea.stop);
  const result = (status: ReplayState, reason: string, entrySession: string | null = null,
    outcomeSession: string | null = null, reviewedBars = 0, requiresIntradayConfirmation = false): ReplayResult =>
    ({ status, reason, entrySession, outcomeSession, reviewedBars, requiresIntradayConfirmation });
  if (!Number.isFinite(lockedMs) || !validLevels) return result("INSUFFICIENT_DATA", "Invalid publication time or trade levels.");
  const lockDate = new Date(lockedMs).toISOString().slice(0, 10);
  const clean = [...bars].filter(b => Number.isFinite(b.timestamp) &&
    [b.open, b.high, b.low, b.close].every(Number.isFinite) &&
    b.low <= Math.min(b.open, b.close) && b.high >= Math.max(b.open, b.close) &&
    b.high >= b.low).sort((a, b) => a.timestamp - b.timestamp);
  const relevant = clean.filter(b => session(b) >= lockDate);
  if (!relevant.length) return result("INSUFFICIENT_DATA", "No valid candles on or after the publication date.");
  let entrySession: string | null = null;
  let active = false;
  for (let i = 0; i < relevant.length; i++) {
    const bar = relevant[i], date = session(bar);
    const entry = idea.direction === "LONG" ? bar.high >= idea.entry : bar.low <= idea.entry;
    const stop = idea.direction === "LONG" ? bar.low <= idea.stop : bar.high >= idea.stop;
    const target = idea.direction === "LONG" ? bar.high >= idea.target : bar.low <= idea.target;
    if (date === lockDate) {
      if (entry || stop || target) return result("NEEDS_REVIEW",
        "Publication-day candle overlaps the lock time; intraday prices are required.", null, date, i + 1, true);
      continue;
    }
    if (!active) {
      if (entry && stop) return result("NEEDS_REVIEW",
        "Entry and stop touched in the same daily candle; ordering unknown.", date, date, i + 1, true);
      if (entry && target) return result("NEEDS_REVIEW",
        "Entry and target touched in the same daily candle; ordering unknown.", date, date, i + 1, true);
      if (stop && !entry) return result("PRE_ENTRY_INVALIDATION",
        "Stop/invalidation level touched before any confirmed entry.", null, date, i + 1);
      if (!entry) continue;
      active = true;
      entrySession = date;
      continue;
    }
    if (stop && target) return result("NEEDS_REVIEW",
      "Stop and target touched in the same daily candle; ordering unknown.", entrySession, date, i + 1, true);
    if (stop) return result("STOPPED_OUT", "Stop touched after an earlier confirmed entry session.", entrySession, date, i + 1);
    if (target) return result("TARGET_HIT", "Target touched after an earlier confirmed entry session.", entrySession, date, i + 1);
  }
  return result(active ? "ACTIVE" : "WAITING_FOR_ENTRY",
    active ? "Entry confirmed; no later stop or target in available candles." :
      "No entry confirmed in available candles.", entrySession, null, relevant.length);
}
