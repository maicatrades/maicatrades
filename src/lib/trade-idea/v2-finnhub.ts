/**
 * V2-only Finnhub historical candle adapter. Never writes to V1/MTR.
 * Finnhub stock/candle may require paid entitlement. Do not log credentials.
 */
import type { V2Bar } from "./v2-scanner";
export type FinnhubCandleResult =
  | { ok: true; bars: V2Bar[]; source: "FINNHUB"; resolution: "30" | "D" }
  | { ok: false; code: "NO_DATA" | "ACCESS_DENIED" | "RATE_LIMITED" | "PROVIDER_ERROR" | "INVALID_RESPONSE"; detail: string };
type Payload = { s?: string; t?: number[]; o?: number[]; h?: number[]; l?: number[]; c?: number[]; v?: number[]; error?: string };
export async function fetchFinnhubV2Candles(args: {
  symbol: string; resolution: "30" | "D"; from: number; to: number;
  apiKey: string; fetcher?: typeof fetch;
}): Promise<FinnhubCandleResult> {
  const { symbol, resolution, from, to, apiKey } = args;
  if (!/^[A-Z][A-Z0-9.-]{0,14}$/.test(symbol) || !Number.isInteger(from) ||
      !Number.isInteger(to) || from >= to || !apiKey)
    return { ok: false, code: "INVALID_RESPONSE", detail: "Invalid request parameters or missing server-side API key." };
  // Intraday requests are intentionally capped at 30 days; longer historical
  // backfills must be explicitly paginated and rate-limited by the caller.
  if (resolution === "30" && to - from > 30 * 86400)
    return { ok: false, code: "INVALID_RESPONSE", detail: "Intraday request exceeds 30 days." };
  const url = new URL("https://finnhub.io/api/v1/stock/candle");
  url.searchParams.set("symbol", symbol);
  url.searchParams.set("resolution", resolution);
  url.searchParams.set("from", String(from));
  url.searchParams.set("to", String(to));
  try {
    const response = await (args.fetcher ?? fetch)(url, {
      headers: { Accept: "application/json", "X-Finnhub-Token": apiKey },
      signal: AbortSignal.timeout(12000),
      cache: "no-store",
    });
    if (response.status === 401 || response.status === 403)
      return { ok: false, code: "ACCESS_DENIED", detail: "Finnhub candle access denied; check plan entitlement." };
    if (response.status === 429)
      return { ok: false, code: "RATE_LIMITED", detail: "Finnhub rate limit reached." };
    if (!response.ok)
      return { ok: false, code: "PROVIDER_ERROR", detail: `Finnhub HTTP ${response.status}.` };
    const payload = await response.json() as Payload;
    if (payload.s === "no_data") return { ok: false, code: "NO_DATA", detail: "No historical candles available." };
    if (payload.s !== "ok") return { ok: false, code: "ACCESS_DENIED", detail: "Finnhub did not authorize candle data or returned an error." };
    const fields = [payload.t, payload.o, payload.h, payload.l, payload.c, payload.v];
    if (!fields.every(Array.isArray) || !payload.t?.length ||
        fields.some(field => field!.length !== payload.t!.length))
      return { ok: false, code: "INVALID_RESPONSE", detail: "Malformed Finnhub candle arrays." };
    const bars: V2Bar[] = [];
    for (let i = 0; i < payload.t.length; i++) {
      const timestamp = payload.t[i], open = payload.o![i], high = payload.h![i],
        low = payload.l![i], close = payload.c![i], volume = payload.v![i];
      if (![timestamp, open, high, low, close, volume].every(Number.isFinite) ||
          low <= 0 || low > Math.min(open, close) || high < Math.max(open, close))
        return { ok: false, code: "INVALID_RESPONSE", detail: "Invalid OHLCV candle." };
      // 30m bars are fixed-duration; daily bars need an exchange-calendar close
      // timestamp from a separate session-aware normalizer before scanning.
      bars.push({ timestamp, open, high, low, close, volume,
        ...(resolution === "30" ? { endTimestamp: timestamp + 1800 } : {}) });
    }
    bars.sort((a, b) => a.timestamp - b.timestamp);
    if (new Set(bars.map(b => b.timestamp)).size !== bars.length)
      return { ok: false, code: "INVALID_RESPONSE", detail: "Duplicate candle timestamps." };
    return { ok: true, bars, source: "FINNHUB", resolution };
  } catch {
    return { ok: false, code: "PROVIDER_ERROR", detail: "Finnhub candle request failed." };
  }
}
