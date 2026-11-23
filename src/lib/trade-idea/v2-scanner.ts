/**
 * Trade Idea V2 — pure candidate qualification engine.
 * Independent of V1, M122 and MTR. No network/database calls or publication.
 * 4h bars must be completed, regular-session bars, ordered oldest to newest.
 * Scores are heuristic rankings, NOT calibrated win probabilities.
 */
export type V2Direction = "LONG" | "SHORT";
export type V2Setup = "BREAK_RETEST" | "EMA_CONTINUATION" | "REVERSAL";
export type V2Bar = { timestamp: number; open: number; high: number; low: number; close: number; volume?: number };
export type V2Input = {
  symbol: string;
  daily: V2Bar[];
  fourHour: V2Bar[];
  averageDailyVolume: number;
  earningsWithinFiveSessions: boolean | null;
  asOf: number; // Unix seconds: reject candles that have not closed
  marketBias?: "BULLISH" | "BEARISH" | "NEUTRAL";
};
export type V2Candidate = {
  symbol: string; direction: V2Direction; setup: V2Setup;
  entry: number; stop: number; target: number; rewardRisk: number;
  score: number; grade: "A" | "A-" | "B";
  signalBarTime: number; reasons: string[]; warnings: string[];
  version: "TRADE_IDEA_V2_DRAFT_1";
};
export type V2Evaluation = { candidates: V2Candidate[]; rejectionReasons: string[] };

const ema = (values: number[], length: number): number[] => {
  if (values.length < length) return [];
  const result: number[] = [];
  const alpha = 2 / (length + 1);
  let value = values.slice(0, length).reduce((a, b) => a + b, 0) / length;
  for (let i = length - 1; i < values.length; i++) {
    if (i > length - 1) value = alpha * values[i] + (1 - alpha) * value;
    result.push(value);
  }
  return result;
};
const valid = (b: V2Bar) => [b.timestamp, b.open, b.high, b.low, b.close].every(Number.isFinite) &&
  b.timestamp > 0 && b.low > 0 && b.low <= Math.min(b.open, b.close) &&
  b.high >= Math.max(b.open, b.close);
const round = (n: number) => Number(n.toFixed(4));

export function evaluateV2Candidate(input: V2Input): V2Evaluation {
  const rejectionReasons: string[] = [];
  if (!/^[A-Z][A-Z0-9.-]{0,14}$/.test(input.symbol)) rejectionReasons.push("INVALID_SYMBOL");
  if (!Number.isFinite(input.asOf) || input.asOf <= 0) rejectionReasons.push("INVALID_AS_OF");
  if (!Number.isFinite(input.averageDailyVolume) || input.averageDailyVolume < 1_000_000)
    rejectionReasons.push("INSUFFICIENT_LIQUIDITY");
  if (input.daily.length < 35 || input.fourHour.length < 35) rejectionReasons.push("INSUFFICIENT_HISTORY");
  if (rejectionReasons.length) return { candidates: [], rejectionReasons };
  const daily = [...input.daily].sort((a, b) => a.timestamp - b.timestamp);
  const h4 = [...input.fourHour].sort((a, b) => a.timestamp - b.timestamp);
  if (![...daily, ...h4].every(valid) ||
      new Set(daily.map(b => b.timestamp)).size !== daily.length ||
      new Set(h4.map(b => b.timestamp)).size !== h4.length)
    return { candidates: [], rejectionReasons: ["INVALID_OR_DUPLICATE_BARS"] };
  // Provider adapters must supply completed bars only; enforce at least 4h since
  // 4h candle START and at least 24h since daily candle START to fail closed.
  if (h4[h4.length - 1].timestamp + 4 * 3600 > input.asOf ||
      daily[daily.length - 1].timestamp > input.asOf)
    return { candidates: [], rejectionReasons: ["UNCONFIRMED_CANDLE"] };
  if (input.asOf - h4[h4.length - 1].timestamp > 7 * 86400)
    return { candidates: [], rejectionReasons: ["STALE_4H_DATA"] };
  const dClose = daily.map(b => b.close), hClose = h4.map(b => b.close);
  const d20 = ema(dClose, 20), d9 = ema(dClose, 9);
  const h9 = ema(hClose, 9), h20 = ema(hClose, 20);
  const last = h4[h4.length - 1], previous = h4[h4.length - 2];
  const dLast = dClose[dClose.length - 1];
  const range = daily.slice(-15).reduce((sum, b) => sum + b.high - b.low, 0) / 15;
  if (!(range > 0)) return { candidates: [], rejectionReasons: ["ZERO_VOLATILITY"] };
  const output: V2Candidate[] = [];
  for (const direction of ["LONG", "SHORT"] as const) {
    const sign = direction === "LONG" ? 1 : -1;
    const trend = sign * (dLast - d20[d20.length - 1]) > 0 &&
      sign * (d9[d9.length - 1] - d20[d20.length - 1]) > 0 &&
      sign * (d20[d20.length - 1] - d20[d20.length - 4]) > 0;
    const hTrend = sign * (h9[h9.length - 1] - h20[h20.length - 1]) > 0 &&
      sign * (h20[h20.length - 1] - h20[h20.length - 4]) > 0;
    const confirmation = direction === "LONG"
      ? last.close > previous.high && last.close > last.open
      : last.close < previous.low && last.close < last.open;
    const retest = direction === "LONG"
      ? previous.low <= h9[h9.length - 2] && previous.close >= h20[h20.length - 2]
      : previous.high >= h9[h9.length - 2] && previous.close <= h20[h20.length - 2];
    const level = direction === "LONG"
      ? Math.max(...h4.slice(-12, -2).map(b => b.high))
      : Math.min(...h4.slice(-12, -2).map(b => b.low));
    const breakout = direction === "LONG"
      ? previous.close > level && last.low <= level && last.close > level
      : previous.close < level && last.high >= level && last.close < level;
    // Reversal needs a daily directional turn and a confirmed 4h structure break.
    const reversal = !trend && confirmation &&
      sign * (d9[d9.length - 1] - d9[d9.length - 4]) > 0 &&
      sign * (dLast - d9[d9.length - 1]) > 0;
    const setups: V2Setup[] = [];
    if (trend && hTrend && confirmation && retest) setups.push("EMA_CONTINUATION");
    if (trend && confirmation && breakout) setups.push("BREAK_RETEST");
    if (reversal && confirmation) setups.push("REVERSAL");
    for (const setup of setups) {
      const entry = direction === "LONG" ? last.high : last.low;
      const stop = direction === "LONG"
        ? Math.min(last.low, previous.low) - range * 0.1
        : Math.max(last.high, previous.high) + range * 0.1;
      const risk = Math.abs(entry - stop);
      if (risk <= 0 || risk / entry > 0.08) continue;
      const target = entry + sign * risk * 2;
      const score = Math.min(100, 25 + (trend ? 25 : 12) + (hTrend ? 15 : 0) +
        (confirmation ? 20 : 0) + (setup === "BREAK_RETEST" ? 5 : 0) + 10);
      if (score < 70) continue;
      const warnings: string[] = [];
      if (input.earningsWithinFiveSessions !== false)
        warnings.push(input.earningsWithinFiveSessions === true ? "EARNINGS_SOON" : "EARNINGS_UNKNOWN");
      if (input.marketBias && input.marketBias !== "NEUTRAL" &&
          input.marketBias !== (direction === "LONG" ? "BULLISH" : "BEARISH"))
        warnings.push("COUNTER_MARKET_BIAS");
      output.push({
        symbol: input.symbol, direction, setup, entry: round(entry), stop: round(stop),
        target: round(target), rewardRisk: 2, score,
        grade: score >= 90 ? "A" : score >= 80 ? "A-" : "B",
        signalBarTime: last.timestamp,
        reasons: ["DAILY_STRUCTURE", "FOUR_HOUR_CONFIRMATION", "STRUCTURE_STOP", "MINIMUM_2R"],
        warnings, version: "TRADE_IDEA_V2_DRAFT_1",
      });
    }
  }
  if (!output.length) rejectionReasons.push("NO_CONFIRMED_SETUP");
  return { candidates: output.sort((a, b) => b.score - a.score), rejectionReasons };
}
export function rankV2Candidates(evaluations: V2Evaluation[]): V2Candidate[] {
  return evaluations.flatMap(e => e.candidates)
    .sort((a, b) => b.score - a.score || a.symbol.localeCompare(b.symbol) ||
      a.setup.localeCompare(b.setup)).slice(0, 3);
}
