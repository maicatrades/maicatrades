/**
 * Pure US-equity RTH 30-minute -> exchange-aligned 4-hour adapter.
 * 09:30–13:30 ET (8 x 30m) and 13:30–16:00 ET (5 x 30m).
 * Half-days, gaps and partial sessions fail closed. No provider assumptions.
 */
import type { V2Bar } from "./v2-scanner";

const clock = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/New_York", year: "numeric", month: "2-digit",
  day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
});
function etParts(timestamp: number) {
  const parts = Object.fromEntries(clock.formatToParts(new Date(timestamp * 1000))
    .filter(p => p.type !== "literal").map(p => [p.type, p.value]));
  return { day: `${parts.year}-${parts.month}-${parts.day}`,
    minutes: Number(parts.hour) * 60 + Number(parts.minute) };
}
export type AdapterResult = { bars: V2Bar[]; rejectedSessions: string[] };
export function aggregateRthFourHour(thirtyMinuteBars: V2Bar[], asOf: number): AdapterResult {
  const grouped = new Map<string, Map<number, V2Bar>>();
  const rejected = new Set<string>();
  for (const bar of thirtyMinuteBars) {
    if (!Number.isFinite(bar.timestamp)) continue;
    const { day, minutes } = etParts(bar.timestamp);
    if (minutes < 570 || minutes >= 960 || (minutes - 570) % 30 !== 0) continue;
    if (!grouped.has(day)) grouped.set(day, new Map());
    const slots = grouped.get(day)!;
    if (slots.has(minutes)) rejected.add(day);
    slots.set(minutes, bar);
  }
  const bars: V2Bar[] = [];
  for (const [day, slots] of [...grouped].sort(([a], [b]) => a.localeCompare(b))) {
    if (rejected.has(day)) continue;
    // Only complete standard sessions: 13 distinct 30-minute RTH bars.
    if (slots.size !== 13 || [...Array(13)].some((_, i) => !slots.has(570 + i * 30))) {
      rejected.add(day); continue;
    }
    const dayBars: V2Bar[] = [];
    for (const [start, count] of [[570, 8], [810, 5]]) {
      const segment = Array.from({ length: count }, (_, i) => slots.get(start + i * 30)!);
      const endTimestamp = segment[segment.length - 1].timestamp + 1800;
      if (segment.some(b => ![b.open, b.high, b.low, b.close].every(Number.isFinite) ||
          b.low <= 0 || b.low > Math.min(b.open, b.close) ||
          b.high < Math.max(b.open, b.close) ||
          (b.endTimestamp !== undefined && b.endTimestamp !== b.timestamp + 1800)) ||
          endTimestamp > asOf ||
          segment.some((b, i) => i > 0 && b.timestamp !== segment[i - 1].timestamp + 1800)) {
        rejected.add(day); break;
      }
      dayBars.push({
        timestamp: segment[0].timestamp, endTimestamp,
        open: segment[0].open, close: segment[segment.length - 1].close,
        high: Math.max(...segment.map(b => b.high)),
        low: Math.min(...segment.map(b => b.low)),
        volume: segment.every(b => Number.isFinite(b.volume)) ?
          segment.reduce((n, b) => n + (b.volume ?? 0), 0) : undefined,
      });
    }
    if (dayBars.length === 2) bars.push(...dayBars);
  }
  return { bars, rejectedSessions: [...rejected].sort() };
}
