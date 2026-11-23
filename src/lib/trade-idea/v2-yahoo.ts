/**
 * Read-only Yahoo chart adapter for V2 research/prototyping only.
 * Unofficial endpoint: not approved for commercial production use.
 * Rejects malformed, duplicate, missing, or unfinished 30m candles.
 * Does not mutate V1, MTR, or historical market data.
 */
import type { V2Bar } from "./v2-scanner";
export type YahooV2Result =
  | { ok: true; source: "YAHOO_RESEARCH"; resolution: "30m" | "1d"; bars: V2Bar[]; timezone: string }
  | { ok: false; code: "INVALID_REQUEST" | "ACCESS_DENIED" | "RATE_LIMITED" | "NO_DATA" | "INVALID_RESPONSE" | "PROVIDER_ERROR"; detail: string };
type ChartPayload = {
  chart?: { error?: unknown; result?: Array<{
    meta?: { symbol?: string; exchangeTimezoneName?: string };
    timestamp?: number[];
    indicators?: { quote?: Array<{ open?: (number | null)[]; high?: (number | null)[]; low?: (number | null)[]; close?: (number | null)[]; volume?: (number | null)[] }> };
  }> | null };
};
export async function fetchYahooV2Candles(args: {
  symbol: string; resolution: "30m" | "1d"; range: "5d" | "1mo" | "3mo";
  asOf: number; fetcher?: typeof fetch;
}): Promise<YahooV2Result> {
  const { symbol, resolution, range, asOf } = args;
  if (!/^[A-Z][A-Z0-9.\-]{0,14}$/.test(symbol) ||
      !["30m", "1d"].includes(resolution) ||
      !["5d", "1mo", "3mo"].includes(range) ||
      !Number.isFinite(asOf))
    return { ok: false, code: "INVALID_REQUEST", detail: "Invalid Yahoo candle request." };
  // Yahoo intraday history is limited; do not request 3 months of 30m bars.
  if (resolution === "30m" && range === "3mo")
    return { ok: false, code: "INVALID_REQUEST", detail: "Intraday range exceeds supported research window." };
  const url = new URL(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}`);
  url.searchParams.set("interval", resolution);
  url.searchParams.set("range", range);
  url.searchParams.set("includePrePost", "false");
  try {
    const response = await (args.fetcher ?? fetch)(url, {
      headers: { Accept: "application/json", "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(12000), cache: "no-store",
    });
    if ([401, 403].includes(response.status))
      return { ok: false, code: "ACCESS_DENIED", detail: "Yahoo chart access denied." };
    if (response.status === 429)
      return { ok: false, code: "RATE_LIMITED", detail: "Yahoo chart rate limited." };
    if (!response.ok)
      return { ok: false, code: "PROVIDER_ERROR", detail: `Yahoo HTTP ${response.status}.` };
    const payload = await response.json() as ChartPayload;
    const result = payload.chart?.result?.[0];
    if (payload.chart?.error || !result)
      return { ok: false, code: "NO_DATA", detail: "Yahoo returned no chart data." };
    const timestamps = result.timestamp, quote = result.indicators?.quote?.[0];
    const fields = [timestamps, quote?.open, quote?.high, quote?.low, quote?.close, quote?.volume];
    if (!timestamps?.length || fields.some(f => !Array.isArray(f) || f.length !== timestamps.length) ||
        result.meta?.symbol !== symbol || result.meta?.exchangeTimezoneName !== "America/New_York")
      return { ok: false, code: "INVALID_RESPONSE", detail: "Malformed or mismatched Yahoo chart data." };
    const bars: V2Bar[] = [];
    const seen = new Set<number>();
    for (let i = 0; i < timestamps.length; i++) {
      const timestamp = timestamps[i];
      const [open, high, low, close, volume] = [quote!.open![i], quote!.high![i], quote!.low![i], quote!.close![i], quote!.volume![i]];
      if (!Number.isInteger(timestamp) || seen.has(timestamp))
        return { ok: false, code: "INVALID_RESPONSE", detail: "Duplicate or invalid candle timestamp." };
      seen.add(timestamp);
      // Yahoo may append a partial live bar with an irregular timestamp.
      // Reject it, not the entire valid history. Other malformed bars fail closed.
      if (resolution === "30m" && timestamp % 1800 !== 0) continue;
      if (![open, high, low, close, volume].every(v => typeof v === "number" && Number.isFinite(v)) ||
          low! <= 0 || low! > Math.min(open!, close!) || high! < Math.max(open!, close!) || volume! < 0)
        return { ok: false, code: "INVALID_RESPONSE", detail: "Invalid OHLCV values." };
      const endTimestamp = timestamp + (resolution === "30m" ? 1800 : 86400);
      if (resolution === "30m" && endTimestamp > asOf) continue;
      if (timestamp > asOf) continue;
      bars.push({ timestamp, endTimestamp: resolution === "30m" ? endTimestamp : undefined,
        open: open!, high: high!, low: low!, close: close!, volume: volume! });
    }
    bars.sort((a, b) => a.timestamp - b.timestamp);
    if (!bars.length)
      return { ok: false, code: "NO_DATA", detail: "No completed candles available." };
    return { ok: true, source: "YAHOO_RESEARCH", resolution, bars, timezone: "America/New_York" };
  } catch {
    return { ok: false, code: "PROVIDER_ERROR", detail: "Yahoo chart request failed." };
  }
}
