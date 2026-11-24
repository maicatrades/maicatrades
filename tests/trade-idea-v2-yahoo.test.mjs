import test from "node:test";
import assert from "node:assert/strict";
import { fetchYahooV2Candles } from "../src/lib/trade-idea/v2-yahoo.ts";

function payload(t, close = [100, 101]) {
  return { chart: { result: [{ meta: { symbol: "SPY", exchangeTimezoneName: "America/New_York" },
    timestamp: t, indicators: { quote: [{ open: close, high: close.map(v => v + 1),
      low: close.map(v => v - 1), close, volume: close.map(() => 1000) }] } }], error: null } };
}
function mock(body, status = 200) {
  return async () => ({ ok: status === 200, status, json: async () => body });
}
const aligned = 1795253400; // 2026-11-20 14:30 UTC
test("Yahoo V2 adapter retains completed bars, discards partial live bar and sends RTH-only request", async () => {
  const seen = [];
  const fetcher = async (url) => {
    seen.push(String(url));
    return mock(payload([aligned, aligned + 1800]))();
  };
  const result = await fetchYahooV2Candles({ symbol: "SPY", resolution: "30m", range: "5d",
    asOf: aligned + 3600, fetcher });
  assert.equal(result.ok, true);
  assert.equal(result.bars.length, 2);
  assert.match(seen[0], /includePrePost=false/);
});
test("Yahoo V2 adapter drops incomplete and irregular live bars", async () => {
  const body = payload([aligned, aligned + 1800, aligned + 3600 + 1036], [100, 101, 102]);
  const result = await fetchYahooV2Candles({ symbol: "SPY", resolution: "30m", range: "5d",
    asOf: aligned + 3600 + 1100, fetcher: mock(body) });
  assert.equal(result.ok, true);
  assert.equal(result.bars.length, 2);
  assert.equal(result.bars[0].endTimestamp, aligned + 1800);
  assert.equal(result.bars[1].endTimestamp, aligned + 3600);
});
test("Yahoo V2 adapter rejects duplicates and access errors", async () => {
  const opts = { symbol: "SPY", resolution: "30m", range: "5d", asOf: aligned + 7200 };
  const duplicate = await fetchYahooV2Candles({ ...opts, fetcher: mock(payload([aligned, aligned])) });
  assert.equal(duplicate.ok, false);
  assert.equal(duplicate.code, "INVALID_RESPONSE");
  const denied = await fetchYahooV2Candles({ ...opts, fetcher: mock({}, 403) });
  assert.equal(denied.code, "ACCESS_DENIED");
});
