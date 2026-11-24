/**
 * V2-only historical signal preparation. Pure and read-only.
 * Do not infer daily session completion from midnight-UTC daily timestamps.
 * Use the completed RTH 30m session as the independent close-time witness.
 */
import type { V2Bar, V2Evaluation, V2Input } from "./v2-scanner";
import { evaluateV2Candidate } from "./v2-scanner";
import { aggregateRthFourHour } from "./v2-four-hour-adapter";

const etDayFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit",
});
const utcDay = (seconds: number) => new Date(seconds * 1000).toISOString().slice(0, 10);
const etDay = (seconds: number) => {
  const parts = Object.fromEntries(etDayFormatter.formatToParts(new Date(seconds * 1000))
    .filter(p => p.type !== "literal").map(p => [p.type, p.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
};

export type PreparedV2 = {
  evaluation: V2Evaluation;
  completedDaily: number;
  completedFourHour: number;
  rejectedSessions: string[];
};
export function prepareAndEvaluateV2(args: {
  symbol: string; daily: V2Bar[]; thirtyMinute: V2Bar[];
  asOf: number; earningsWithinFiveSessions: boolean | null;
  marketBias?: V2Input["marketBias"];
}): PreparedV2 {
  const aggregated = aggregateRthFourHour(args.thirtyMinute, args.asOf);
  const completedByDay = new Map<string, number>();
  for (let i = 0; i + 1 < aggregated.bars.length; i += 2) {
    const first = aggregated.bars[i], second = aggregated.bars[i + 1];
    if (etDay(first.timestamp) !== etDay(second.timestamp)) continue;
    completedByDay.set(etDay(first.timestamp), second.endTimestamp!);
  }
  const completedDaily: V2Bar[] = [];
  const seen = new Set<string>();
  for (const bar of [...args.daily].sort((a, b) => a.timestamp - b.timestamp)) {
    // Finnhub D candles are date-labeled, not exchange-session start times.
    const day = utcDay(bar.timestamp);
    const close = completedByDay.get(day);
    if (close === undefined || close > args.asOf || seen.has(day)) continue;
    seen.add(day);
    completedDaily.push({ ...bar, endTimestamp: close });
  }
  const recentVolume = completedDaily.slice(-20);
  const averageDailyVolume = recentVolume.length === 20 &&
    recentVolume.every(b => Number.isFinite(b.volume) && (b.volume ?? 0) >= 0)
    ? recentVolume.reduce((n, b) => n + (b.volume ?? 0), 0) / 20 : NaN;
  const evaluation = evaluateV2Candidate({
    symbol: args.symbol, daily: completedDaily, fourHour: aggregated.bars,
    averageDailyVolume, earningsWithinFiveSessions: args.earningsWithinFiveSessions,
    asOf: args.asOf, marketBias: args.marketBias,
  });
  return {
    evaluation, completedDaily: completedDaily.length,
    completedFourHour: aggregated.bars.length,
    rejectedSessions: aggregated.rejectedSessions,
  };
}
