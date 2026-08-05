import { NextResponse } from "next/server";

export const revalidate = 900;

const STOCK_UNIVERSE = [
  { symbol: "AAPL", companyName: "Apple Inc.", sectorSymbol: "XLK" },
  { symbol: "AMD", companyName: "Advanced Micro Devices, Inc.", sectorSymbol: "SMH" },
  { symbol: "AMZN", companyName: "Amazon.com, Inc.", sectorSymbol: "XLY" },
  { symbol: "AVGO", companyName: "Broadcom Inc.", sectorSymbol: "SMH" },
  { symbol: "COIN", companyName: "Coinbase Global, Inc.", sectorSymbol: "XLF" },
  { symbol: "GOOGL", companyName: "Alphabet Inc.", sectorSymbol: "XLC" },
  { symbol: "META", companyName: "Meta Platforms, Inc.", sectorSymbol: "XLC" },
  { symbol: "MSFT", companyName: "Microsoft Corporation", sectorSymbol: "XLK" },
  { symbol: "MU", companyName: "Micron Technology, Inc.", sectorSymbol: "SMH" },
  { symbol: "NFLX", companyName: "Netflix, Inc.", sectorSymbol: "XLC" },
  { symbol: "NVDA", companyName: "NVIDIA Corporation", sectorSymbol: "SMH" },
  { symbol: "PLTR", companyName: "Palantir Technologies Inc.", sectorSymbol: "XLK" },
  { symbol: "SMCI", companyName: "Super Micro Computer, Inc.", sectorSymbol: "SMH" },
  { symbol: "SOFI", companyName: "SoFi Technologies, Inc.", sectorSymbol: "XLF" },
  { symbol: "TSLA", companyName: "Tesla, Inc.", sectorSymbol: "XLY" },
] as const;

const CONTEXT_SYMBOLS = ["SPY", "QQQ", "XLK", "SMH", "XLY", "XLF", "XLC"] as const;
const BATCH_SIZE = 5;
const MINIMUM_ACTIONABLE_SCORE = 62;

type Direction = "LONG" | "SHORT";
type MarketRegime = "Bullish" | "Bearish" | "Neutral";

type YahooChartResponse = {
  chart?: {
    result?: Array<{
      timestamp?: number[];
      indicators?: {
        quote?: Array<{
          close?: Array<number | null>;
          high?: Array<number | null>;
          low?: Array<number | null>;
          volume?: Array<number | null>;
        }>;
      };
    }>;
    error?: { code?: string; description?: string } | null;
  };
};

type PriceRow = {
  timestamp: number;
  close: number;
  high: number;
  low: number;
  volume: number | null;
};

type ChartPoint = {
  date: string;
  close: number;
  sma20: number | null;
};

type MarketSeries = {
  symbol: string;
  rows: PriceRow[];
  closes: number[];
  sma20Series: Array<number | null>;
  sma160Series: Array<number | null>;
  sma20: number | null;
  sma160: number | null;
  sma20SlopePercent: number;
  sma160SlopePercent: number;
  rsi14: number | null;
  atr14: number | null;
  price: number;
  previousClose: number;
  change: number;
  changePercent: number;
  return20: number;
};

type ScoreBreakdown = {
  trend: number;
  marketDirection: number;
  priceAction: number;
  sectorStrength: number;
  distanceToLevel: number;
  riskReward: number;
  relativeStrength: number;
  earningsNews: number;
  momentum: number;
  total: number;
  availableMaximum: number;
};

type TradeLevels = {
  entry: number;
  stopLoss: number;
  target: number;
  riskReward: number;
  stopDistancePercent: number;
  targetDistancePercent: number;
};

type TradeIdea = {
  symbol: string;
  companyName: string;
  sectorSymbol: string;
  direction: Direction;
  price: number;
  previousClose: number;
  change: number;
  changePercent: number;
  setup: string;
  setupType: string;
  holdingPeriod: string;
  entry: number;
  stopLoss: number;
  target: number;
  riskReward: number;
  confidenceScore: number;
  confidenceStars: number;
  grade: string;
  tradeBias: string;
  patternDescription: string;
  biasDescription: string;
  whyItMatters: string[];
  managementPlan: string[];
  sma20: number | null;
  sma160: number | null;
  sma20SlopePercent: number;
  sma160SlopePercent: number;
  trendAlignment: string;
  extensionPercent: number | null;
  extensionInAtr: number | null;
  extended: boolean;
  rsi14: number | null;
  atr14: number | null;
  recentHigh: number;
  recentLow: number;
  triggerDistancePercent: number;
  relativeStrength20: number;
  sectorRelativeStrength20: number;
  marketDirection: MarketRegime;
  scoreBreakdown: ScoreBreakdown;
  chart: ChartPoint[];
};

type FetchOptions = RequestInit & { next?: { revalidate?: number } };

function isValidNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function round(value: number, decimals = 2) {
  return Number(value.toFixed(decimals));
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function calculateSmaSeries(values: number[], period: number) {
  const series: Array<number | null> = Array(values.length).fill(null);

  if (values.length < period) {
    return series;
  }

  let rollingSum = values
    .slice(0, period)
    .reduce((sum, value) => sum + value, 0);

  series[period - 1] = rollingSum / period;

  for (let index = period; index < values.length; index += 1) {
    rollingSum += values[index] - values[index - period];
    series[index] = rollingSum / period;
  }

  return series;
}

function calculateSlopePercent(
  series: Array<number | null>,
  lookbackSessions: number,
) {
  const current = series.at(-1) ?? null;
  const pastIndex = series.length - 1 - lookbackSessions;
  const past = pastIndex >= 0 ? series[pastIndex] : null;

  if (current === null || past === null || past === 0) {
    return 0;
  }

  return ((current - past) / past) * 100;
}

function classifySlope(slopePercent: number) {
  if (slopePercent >= 1) return "Strongly Rising";
  if (slopePercent >= 0.2) return "Rising";
  if (slopePercent > -0.2) return "Flat";
  if (slopePercent > -1) return "Falling";
  return "Strongly Falling";
}

function calculateRsi(values: number[], period = 14) {
  if (values.length <= period) return null;
  const changes = values.slice(1).map((value, index) => value - values[index]);
  const recent = changes.slice(-period);
  const gains = recent.filter((value) => value > 0).reduce((sum, value) => sum + value, 0);
  const losses = recent.filter((value) => value < 0).reduce((sum, value) => sum + Math.abs(value), 0);
  const averageGain = gains / period;
  const averageLoss = losses / period;
  if (averageLoss === 0) return 100;
  return 100 - 100 / (1 + averageGain / averageLoss);
}

function calculateAtr(rows: PriceRow[], period = 14) {
  if (rows.length <= period) return null;
  const ranges: number[] = [];
  for (let index = 1; index < rows.length; index += 1) {
    const current = rows[index];
    const previousClose = rows[index - 1].close;
    ranges.push(
      Math.max(
        current.high - current.low,
        Math.abs(current.high - previousClose),
        Math.abs(current.low - previousClose),
      ),
    );
  }
  const recent = ranges.slice(-period);
  return recent.reduce((sum, value) => sum + value, 0) / recent.length;
}

function calculateReturn(closes: number[], sessions: number) {
  if (closes.length <= sessions) return 0;
  const current = closes.at(-1) ?? 0;
  const starting = closes[closes.length - 1 - sessions];
  return starting === 0 ? 0 : ((current - starting) / starting) * 100;
}

async function fetchWithTimeout(url: string, options: FetchOptions, timeoutMs = 10_000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function requestYahooChart(host: "query1" | "query2", symbol: string) {
  const url =
    `https://${host}.finance.yahoo.com/v8/finance/chart/` +
    `${encodeURIComponent(symbol)}?interval=1d&range=2y&includePrePost=false`;

  const response = await fetchWithTimeout(url, {
    next: { revalidate: 900 },
    headers: {
      Accept: "application/json",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
    },
  });

  if (!response.ok) throw new Error(`Yahoo ${host} returned HTTP ${response.status} for ${symbol}`);
  const data = (await response.json()) as YahooChartResponse;
  if (data.chart?.error) throw new Error(data.chart.error.description ?? `Yahoo error for ${symbol}`);
  if (!data.chart?.result?.[0]) throw new Error(`Yahoo returned no chart data for ${symbol}`);
  return data;
}

async function fetchYahooChart(symbol: string) {
  try {
    return await requestYahooChart("query1", symbol);
  } catch {
    return requestYahooChart("query2", symbol);
  }
}

async function loadMarketSeries(symbol: string): Promise<MarketSeries> {
  const data = await fetchYahooChart(symbol);
  const result = data.chart?.result?.[0];
  const quote = result?.indicators?.quote?.[0];
  const timestamps = result?.timestamp ?? [];
  const closes = quote?.close ?? [];
  const highs = quote?.high ?? [];
  const lows = quote?.low ?? [];
  const volumes = quote?.volume ?? [];

  const rows = timestamps
    .map((timestamp, index) => {
      const close = closes[index];
      if (!isValidNumber(close)) return null;
      return {
        timestamp,
        close,
        high: isValidNumber(highs[index]) ? highs[index] : close,
        low: isValidNumber(lows[index]) ? lows[index] : close,
        volume: isValidNumber(volumes[index]) ? volumes[index] : null,
      };
    })
    .filter((row): row is PriceRow => row !== null);

  if (rows.length < 175) throw new Error(`Not enough historical data for ${symbol}`);

  const cleanCloses = rows.map((row) => row.close);
  const sma20Series = calculateSmaSeries(cleanCloses, 20);
  const sma160Series = calculateSmaSeries(cleanCloses, 160);
  const price = cleanCloses.at(-1) as number;
  const previousClose = cleanCloses.at(-2) as number;
  const sma20 = sma20Series.at(-1) ?? null;
  const sma160 = sma160Series.at(-1) ?? null;
  const sma20SlopePercent = calculateSlopePercent(sma20Series, 5);
  const sma160SlopePercent = calculateSlopePercent(sma160Series, 10);

  return {
    symbol,
    rows,
    closes: cleanCloses,
    sma20Series,
    sma160Series,
    sma20,
    sma160,
    sma20SlopePercent,
    sma160SlopePercent,
    rsi14: calculateRsi(cleanCloses),
    atr14: calculateAtr(rows),
    price,
    previousClose,
    change: price - previousClose,
    changePercent: ((price - previousClose) / previousClose) * 100,
    return20: calculateReturn(cleanCloses, 20),
  };
}

async function loadSeriesMap(symbols: string[]) {
  const map = new Map<string, MarketSeries>();
  const failures: Array<{ symbol: string; error: string }> = [];

  for (let index = 0; index < symbols.length; index += BATCH_SIZE) {
    const batch = symbols.slice(index, index + BATCH_SIZE);
    const results = await Promise.allSettled(batch.map((symbol) => loadMarketSeries(symbol)));
    results.forEach((result, resultIndex) => {
      const symbol = batch[resultIndex];
      if (result.status === "fulfilled") map.set(symbol, result.value);
      else failures.push({ symbol, error: result.reason instanceof Error ? result.reason.message : String(result.reason) });
    });
  }

  return { map, failures };
}

function seriesRegimeScore(series: MarketSeries) {
  let score = 0;

  if (series.sma20 !== null && series.price > series.sma20) score += 1;
  if (series.sma160 !== null && series.price > series.sma160) score += 1;
  if (
    series.sma20 !== null &&
    series.sma160 !== null &&
    series.sma20 > series.sma160
  ) {
    score += 1;
  }

  if (series.sma20SlopePercent > 0.2) score += 0.5;
  if (series.sma160SlopePercent > 0.2) score += 0.5;

  return score;
}

function getMarketRegime(spy: MarketSeries, qqq: MarketSeries): MarketRegime {
  const combined = seriesRegimeScore(spy) + seriesRegimeScore(qqq);
  if (combined >= 5) return "Bullish";
  if (combined <= 2) return "Bearish";
  return "Neutral";
}

function scoreMarketDirection(direction: Direction, regime: MarketRegime) {
  if (regime === "Neutral") return 10;
  if ((direction === "LONG" && regime === "Bullish") || (direction === "SHORT" && regime === "Bearish")) return 18;
  return 0;
}

function scoreTrend(series: MarketSeries, direction: Direction) {
  let score = 0;

  const above20 = series.sma20 !== null && series.price > series.sma20;
  const above160 = series.sma160 !== null && series.price > series.sma160;
  const bullishAlignment =
    series.sma20 !== null &&
    series.sma160 !== null &&
    series.sma20 > series.sma160;

  if (direction === "LONG") {
    if (above20) score += 5;
    if (above160) score += 5;
    if (bullishAlignment) score += 4;

    if (series.sma20SlopePercent >= 0.2) score += 3;
    else if (series.sma20SlopePercent < -0.2) score -= 6;

    if (series.sma160SlopePercent >= 0.2) score += 5;
    else if (series.sma160SlopePercent < -0.2) score -= 12;

    if (
      series.sma20SlopePercent < -0.2 &&
      series.sma160SlopePercent < -0.2
    ) {
      score -= 8;
    }
  } else {
    if (!above20) score += 5;
    if (!above160) score += 5;
    if (!bullishAlignment) score += 4;

    if (series.sma20SlopePercent <= -0.2) score += 3;
    else if (series.sma20SlopePercent > 0.2) score -= 6;

    if (series.sma160SlopePercent <= -0.2) score += 5;
    else if (series.sma160SlopePercent > 0.2) score -= 12;

    if (
      series.sma20SlopePercent > 0.2 &&
      series.sma160SlopePercent > 0.2
    ) {
      score -= 8;
    }
  }

  return score;
}

function getExtensionMetrics(series: MarketSeries, direction: Direction) {
  if (series.sma20 === null) {
    return {
      extensionPercent: null,
      extensionInAtr: null,
      extended: false,
    };
  }

  const directionalDistance =
    direction === "LONG"
      ? series.price - series.sma20
      : series.sma20 - series.price;

  const extensionPercent =
    (directionalDistance / series.sma20) * 100;

  const extensionInAtr =
    series.atr14 && series.atr14 > 0
      ? directionalDistance / series.atr14
      : null;

  const extended =
    extensionPercent > 8 ||
    (extensionInAtr !== null && extensionInAtr > 2);

  return {
    extensionPercent,
    extensionInAtr,
    extended,
  };
}

function getTrendAlignment(series: MarketSeries, direction: Direction) {
  const shortSlope = classifySlope(series.sma20SlopePercent);
  const longSlope = classifySlope(series.sma160SlopePercent);

  if (direction === "LONG") {
    if (
      series.sma20SlopePercent >= 0.2 &&
      series.sma160SlopePercent >= 0.2
    ) {
      return `Aligned bullish: 20 SMA ${shortSlope.toLowerCase()}, 160 SMA ${longSlope.toLowerCase()}.`;
    }

    if (series.sma160SlopePercent < -0.2) {
      return `Long-term warning: 160 SMA ${longSlope.toLowerCase()}.`;
    }

    return `Mixed alignment: 20 SMA ${shortSlope.toLowerCase()}, 160 SMA ${longSlope.toLowerCase()}.`;
  }

  if (
    series.sma20SlopePercent <= -0.2 &&
    series.sma160SlopePercent <= -0.2
  ) {
    return `Aligned bearish: 20 SMA ${shortSlope.toLowerCase()}, 160 SMA ${longSlope.toLowerCase()}.`;
  }

  if (series.sma160SlopePercent > 0.2) {
    return `Long-term warning: 160 SMA ${longSlope.toLowerCase()}.`;
  }

  return `Mixed alignment: 20 SMA ${shortSlope.toLowerCase()}, 160 SMA ${longSlope.toLowerCase()}.`;
}

function recentLevels(series: MarketSeries) {
  const twenty = series.rows.slice(-20);
  const ten = series.rows.slice(-10);
  return {
    recentHigh: Math.max(...twenty.map((row) => row.high)),
    recentLow: Math.min(...twenty.map((row) => row.low)),
    swingHigh: Math.max(...ten.map((row) => row.high)),
    swingLow: Math.min(...ten.map((row) => row.low)),
  };
}

function scorePriceAction(series: MarketSeries, direction: Direction, recentHigh: number, recentLow: number) {
  const last = series.rows.at(-1) as PriceRow;
  const prior = series.rows.at(-2) as PriceRow;
  const range = Math.max(0.01, last.high - last.low);
  const closeLocation = (last.close - last.low) / range;
  let score = 0;

  if (direction === "LONG") {
    if (last.close > prior.close) score += 4;
    if (closeLocation >= 0.65) score += 4;
    if (((recentHigh - series.price) / recentHigh) * 100 <= 3) score += 5;
    if (last.high > prior.high && last.low > prior.low) score += 3;
  } else {
    if (last.close < prior.close) score += 4;
    if (closeLocation <= 0.35) score += 4;
    if (((series.price - recentLow) / series.price) * 100 <= 3) score += 5;
    if (last.high < prior.high && last.low < prior.low) score += 3;
  }
  return score;
}

function scoreSectorStrength(direction: Direction, sector: MarketSeries, spy: MarketSeries) {
  const relative = sector.return20 - spy.return20;
  if (direction === "LONG") {
    if (relative >= 3) return 12;
    if (relative >= 1) return 9;
    if (relative >= 0) return 6;
    if (relative >= -2) return 3;
    return 0;
  }
  if (relative <= -3) return 12;
  if (relative <= -1) return 9;
  if (relative <= 0) return 6;
  if (relative <= 2) return 3;
  return 0;
}

function scoreDistanceToLevel(
  direction: Direction,
  price: number,
  recentHigh: number,
  recentLow: number,
) {
  const distance =
    direction === "LONG"
      ? ((recentHigh - price) / recentHigh) * 100
      : ((price - recentLow) / price) * 100;

  // The setup has already moved too far beyond its trigger.
  // Avoid rewarding trades that may need to be chased.
  if (distance < -3) return 0;
  if (distance < -1.5) return 2;
  if (distance < -0.5) return 5;

  // Best setups are sitting directly beneath/above the trigger
  // or have only just confirmed through it.
  if (distance <= 1) return 10;
  if (distance <= 2.5) return 8;
  if (distance <= 4.5) return 5;
  if (distance <= 7) return 2;

  return 0;
}

function scoreRiskReward(value: number) {
  if (value >= 2) return 9;
  if (value >= 1.8) return 7;
  if (value >= 1.5) return 4;
  return 0;
}

function scoreRelativeStrength(direction: Direction, stockReturn: number, spyReturn: number, qqqReturn: number) {
  const benchmark = (spyReturn + qqqReturn) / 2;
  const difference = stockReturn - benchmark;
  if (direction === "LONG") {
    if (difference >= 5) return 7;
    if (difference >= 2) return 6;
    if (difference >= 0) return 4;
    if (difference >= -3) return 2;
    return 0;
  }
  if (difference <= -5) return 7;
  if (difference <= -2) return 6;
  if (difference <= 0) return 4;
  if (difference <= 3) return 2;
  return 0;
}

function scoreMomentum(direction: Direction, rsi: number | null) {
  if (rsi === null) return 0;
  if (direction === "LONG") {
    if (rsi >= 50 && rsi <= 65) return 2;
    if (rsi >= 45 && rsi <= 72) return 1;
    return 0;
  }
  if (rsi >= 35 && rsi <= 50) return 2;
  if (rsi >= 28 && rsi <= 55) return 1;
  return 0;
}

function calculateLevels(series: MarketSeries, direction: Direction, recentHigh: number, recentLow: number, swingHigh: number, swingLow: number): TradeLevels {
  const atr = series.atr14 ?? series.price * 0.025;
  const bufferPercent = clamp((atr / series.price) * 0.18, 0.002, 0.005);

  if (direction === "LONG") {
    const entry = Math.max(recentHigh * (1 + bufferPercent), series.price * 1.002);
    const rawStop = Math.max(entry - atr * 1.35, swingLow - atr * 0.15);
    const stopLoss = clamp(rawStop, entry * 0.94, entry * 0.985);
    const risk = Math.max(0.01, entry - stopLoss);
    const target = Math.min(entry + risk * 2, entry * 1.12);
    return {
      entry: round(entry), stopLoss: round(stopLoss), target: round(target),
      riskReward: round((target - entry) / risk, 2),
      stopDistancePercent: round(((entry - stopLoss) / entry) * 100),
      targetDistancePercent: round(((target - entry) / entry) * 100),
    };
  }

  const entry = Math.min(recentLow * (1 - bufferPercent), series.price * 0.998);
  const rawStop = Math.min(entry + atr * 1.35, swingHigh + atr * 0.15);
  const stopLoss = clamp(rawStop, entry * 1.015, entry * 1.06);
  const risk = Math.max(0.01, stopLoss - entry);
  const target = Math.max(entry - risk * 2, entry * 0.88);
  return {
    entry: round(entry), stopLoss: round(stopLoss), target: round(target),
    riskReward: round((entry - target) / risk, 2),
    stopDistancePercent: round(((stopLoss - entry) / entry) * 100),
    targetDistancePercent: round(((entry - target) / entry) * 100),
  };
}

function gradeFor(score: number) {
  if (score >= 88) return "A+";
  if (score >= 80) return "A";
  if (score >= 72) return "B+";
  if (score >= 62) return "B";
  if (score >= 52) return "C+";
  return "C";
}

function buildCandidate(
  stock: (typeof STOCK_UNIVERSE)[number],
  series: MarketSeries,
  sector: MarketSeries,
  spy: MarketSeries,
  qqq: MarketSeries,
  regime: MarketRegime,
  direction: Direction,
): TradeIdea {
  const { recentHigh, recentLow, swingHigh, swingLow } = recentLevels(series);
  const levels = calculateLevels(series, direction, recentHigh, recentLow, swingHigh, swingLow);
  const trend = scoreTrend(series, direction);
  const marketDirection = scoreMarketDirection(direction, regime);
  const priceAction = scorePriceAction(series, direction, recentHigh, recentLow);
  const sectorStrength = scoreSectorStrength(direction, sector, spy);
  const distanceToLevel = scoreDistanceToLevel(direction, series.price, recentHigh, recentLow);
  const riskReward = scoreRiskReward(levels.riskReward);
  const relativeStrength = scoreRelativeStrength(direction, series.return20, spy.return20, qqq.return20);
  const momentum = scoreMomentum(direction, series.rsi14);
  const earningsNews = 0;
  const total = trend + marketDirection + priceAction + sectorStrength + distanceToLevel + riskReward + relativeStrength + momentum;
  const benchmarkReturn = (spy.return20 + qqq.return20) / 2;
  const relativeStrength20 = series.return20 - benchmarkReturn;
  const sectorRelativeStrength20 = sector.return20 - spy.return20;
  const triggerDistancePercent = direction === "LONG"
    ? ((recentHigh - series.price) / recentHigh) * 100
    : ((series.price - recentLow) / series.price) * 100;
  const extension = getExtensionMetrics(series, direction);
  const trendAlignment = getTrendAlignment(series, direction);

  let adjustedTotal = total;

  if (extension.extended) {
    adjustedTotal -= 10;
  }

  if (
    direction === "LONG" &&
    series.sma160SlopePercent < -0.2
  ) {
    adjustedTotal -= 8;
  }

  if (
    direction === "SHORT" &&
    series.sma160SlopePercent > 0.2
  ) {
    adjustedTotal -= 8;
  }

  adjustedTotal = Math.max(0, adjustedTotal);

  const setup = direction === "LONG"
    ? triggerDistancePercent <= 2 ? "Bullish Breakout" : series.price > (series.sma20 ?? series.price) ? "Trend Continuation" : "Bullish Reclaim"
    : triggerDistancePercent <= 2 ? "Bearish Breakdown" : series.price < (series.sma20 ?? series.price) ? "Bear Flag Continuation" : "Failed Reclaim";

  const chart: ChartPoint[] = series.rows
    .slice(-90)
    .map((row, index, slicedRows) => {
      const originalIndex =
        series.rows.length - slicedRows.length + index;
      const sma = series.sma20Series[originalIndex];

      return {
        date: new Date(row.timestamp * 1000)
          .toISOString()
          .slice(0, 10),
        close: round(row.close),
        sma20: sma === null ? null : round(sma),
      };
    });

  const directionalWord = direction === "LONG" ? "above resistance" : "below support";
  const invalidationWord = direction === "LONG" ? "below support" : "above resistance";
  const marketAligned = (direction === "LONG" && regime === "Bullish") || (direction === "SHORT" && regime === "Bearish");

  return {
    symbol: stock.symbol,
    companyName: stock.companyName,
    sectorSymbol: stock.sectorSymbol,
    direction,
    price: round(series.price),
    previousClose: round(series.previousClose),
    change: round(series.change),
    changePercent: round(series.changePercent),
    setup,
    setupType: `${direction === "LONG" ? "Long" : "Short"} swing trade`,
    holdingPeriod: "3–10 trading days",
    entry: levels.entry,
    stopLoss: levels.stopLoss,
    target: levels.target,
    riskReward: levels.riskReward,
    confidenceScore: adjustedTotal,
    confidenceStars: Math.max(1, Math.min(5, Math.round((adjustedTotal / 96) * 5))),
    grade: gradeFor(adjustedTotal),
    tradeBias: direction === "LONG" ? "Bullish" : "Bearish",
    patternDescription: `${stock.symbol} has the strongest ${direction.toLowerCase()}-side combination of trend, price action, level proximity, and risk structure found by the current scan. Confirmation ${directionalWord} is still required.`,
    biasDescription: marketAligned
      ? `The ${direction.toLowerCase()} setup is aligned with the current ${regime.toLowerCase()} SPY/QQQ market regime.`
      : `This setup is not fully aligned with the current ${regime.toLowerCase()} market regime, so additional confirmation is required.`,
    whyItMatters: [
      `${stock.symbol} scored ${adjustedTotal} out of 96 available points as a ${direction.toLowerCase()} setup and received a ${gradeFor(adjustedTotal)} grade.`,
      `The trigger is approximately ${round(Math.max(0, triggerDistancePercent), 1)}% away. Its 20-session performance differs from the average of SPY and QQQ by ${round(relativeStrength20, 1)} percentage points.`,
      `${stock.sectorSymbol} differs from SPY by ${round(sectorRelativeStrength20, 1)} percentage points over 20 sessions. The planned stop sits ${levels.stopDistancePercent}% from entry with an initial ${levels.riskReward.toFixed(2)}-to-1 reward-to-risk target.`,
      trendAlignment,
      extension.extended
        ? `Extension warning: price is ${round(extension.extensionPercent ?? 0, 1)}% from the 20 SMA${extension.extensionInAtr !== null ? `, or ${round(extension.extensionInAtr, 1)} ATR` : ""}. Wait for a pullback or tighter consolidation before considering entry.`
        : `Price is not excessively extended from the 20 SMA under the current filter.`,
    ],
    managementPlan: [
      `Wait for a confirmed move ${directionalWord} at ${levels.entry.toFixed(2)} rather than anticipating the trigger.`,
      `Use ${levels.stopLoss.toFixed(2)} as the initial invalidation level ${invalidationWord}, and calculate position size from the defined per-share risk.`,
      `Consider taking partial profits near ${levels.target.toFixed(2)} or reducing risk if price fails to follow through after entry.`,
      extension.extended
        ? "Do not chase the setup while it remains extended. Reassess after price pulls back toward the 20 SMA or forms a new base."
        : "Continue monitoring the 20 SMA and 160 SMA slopes for trend deterioration before entry.",
    ],
    sma20: series.sma20 === null ? null : round(series.sma20),
    sma160: series.sma160 === null ? null : round(series.sma160),
    sma20SlopePercent: round(series.sma20SlopePercent, 3),
    sma160SlopePercent: round(series.sma160SlopePercent, 3),
    trendAlignment,
    extensionPercent:
      extension.extensionPercent === null
        ? null
        : round(extension.extensionPercent, 2),
    extensionInAtr:
      extension.extensionInAtr === null
        ? null
        : round(extension.extensionInAtr, 2),
    extended: extension.extended,
    rsi14: series.rsi14 === null ? null : round(series.rsi14),
    atr14: series.atr14 === null ? null : round(series.atr14),
    recentHigh: round(recentHigh),
    recentLow: round(recentLow),
    triggerDistancePercent: round(triggerDistancePercent),
    relativeStrength20: round(relativeStrength20),
    sectorRelativeStrength20: round(sectorRelativeStrength20),
    marketDirection: regime,
    scoreBreakdown: {
      trend, marketDirection, priceAction, sectorStrength, distanceToLevel, riskReward,
      relativeStrength, earningsNews, momentum, total: adjustedTotal, availableMaximum: 96,
    },
    chart,
  };
}

function isActionable(idea: TradeIdea) {
  const longTrendRejected =
    idea.direction === "LONG" &&
    (
      idea.sma160SlopePercent < -0.2 ||
      (
        idea.sma20SlopePercent < -0.2 &&
        idea.sma160SlopePercent < -0.2
      )
    );

  const shortTrendRejected =
    idea.direction === "SHORT" &&
    (
      idea.sma160SlopePercent > 0.2 ||
      (
        idea.sma20SlopePercent > 0.2 &&
        idea.sma160SlopePercent > 0.2
      )
    );

  const triggerIsReasonablyClose =
    idea.triggerDistancePercent >= -1.5 &&
    idea.triggerDistancePercent <= 6;

  const marketAligned =
    (idea.direction === "LONG" && idea.marketDirection === "Bullish") ||
    (idea.direction === "SHORT" && idea.marketDirection === "Bearish");

  const neutralMarket = idea.marketDirection === "Neutral";

  return (
    idea.confidenceScore >= MINIMUM_ACTIONABLE_SCORE &&
    idea.riskReward >= 1.8 &&
    idea.scoreBreakdown.trend >= 11 &&
    idea.scoreBreakdown.priceAction >= 8 &&
    triggerIsReasonablyClose &&
    (marketAligned || neutralMarket) &&
    !idea.extended &&
    !longTrendRejected &&
    !shortTrendRejected
  );
}

function rankIdeas(ideas: TradeIdea[]) {
  const triggerProximity = (idea: TradeIdea) =>
    Math.abs(idea.triggerDistancePercent);

  const marketAlignmentScore = (idea: TradeIdea) => {
    if (
      idea.direction === "LONG" &&
      idea.marketDirection === "Bullish"
    ) {
      return 2;
    }

    if (
      idea.direction === "SHORT" &&
      idea.marketDirection === "Bearish"
    ) {
      return 2;
    }

    if (idea.marketDirection === "Neutral") {
      return 1;
    }

    return 0;
  };

  return [...ideas].sort((a, b) => {
    return (
      Number(isActionable(b)) - Number(isActionable(a)) ||
      b.confidenceScore - a.confidenceScore ||
      marketAlignmentScore(b) - marketAlignmentScore(a) ||
      b.scoreBreakdown.trend - a.scoreBreakdown.trend ||
      b.scoreBreakdown.priceAction - a.scoreBreakdown.priceAction ||
      b.scoreBreakdown.relativeStrength -
        a.scoreBreakdown.relativeStrength ||
      b.riskReward - a.riskReward ||
      triggerProximity(a) - triggerProximity(b)
    );
  });
}

export async function GET() {
  try {
    const symbols = Array.from(new Set([...STOCK_UNIVERSE.map((stock) => stock.symbol), ...CONTEXT_SYMBOLS]));
    const { map, failures } = await loadSeriesMap(symbols);
    const spy = map.get("SPY");
    const qqq = map.get("QQQ");
    if (!spy || !qqq) throw new Error("SPY or QQQ market context could not be loaded.");

    const marketRegime = getMarketRegime(spy, qqq);
    const candidates: TradeIdea[] = [];

    for (const stock of STOCK_UNIVERSE) {
      const series = map.get(stock.symbol);
      const sector = map.get(stock.sectorSymbol);
      if (!series || !sector) continue;
      candidates.push(buildCandidate(stock, series, sector, spy, qqq, marketRegime, "LONG"));
      candidates.push(buildCandidate(stock, series, sector, spy, qqq, marketRegime, "SHORT"));
    }

    if (candidates.length === 0) throw new Error("No stock data could be analyzed.");

    const ranked = rankIdeas(candidates);
    const actionable = ranked.filter(isActionable);
    const selectedIdea = actionable[0] ?? ranked[0];
    const hasQualifiedSetup = actionable.length > 0;

    const rankings = ranked.map((idea, index) => ({
      rank: index + 1,
      symbol: idea.symbol,
      companyName: idea.companyName,
      direction: idea.direction,
      grade: idea.grade,
      confidenceScore: idea.confidenceScore,
      setup: idea.setup,
      marketDirection: idea.marketDirection,
      price: idea.price,
      changePercent: idea.changePercent,
      triggerDistancePercent: idea.triggerDistancePercent,
      riskReward: idea.riskReward,
      scoreBreakdown: idea.scoreBreakdown,
      actionable: isActionable(idea),
    }));

    return NextResponse.json({
      success: true,
      hasQualifiedSetup,
      idea: selectedIdea,
      rankings,
      marketContext: {
        direction: marketRegime,
        spy: { price: round(spy.price), changePercent: round(spy.changePercent), return20: round(spy.return20) },
        qqq: { price: round(qqq.price), changePercent: round(qqq.changePercent), return20: round(qqq.return20) },
      },
      scan: {
        universeSize: STOCK_UNIVERSE.length,
        candidatesEvaluated: candidates.length,
        actionableCandidates: actionable.length,
        actionableLongs: actionable.filter((idea) => idea.direction === "LONG").length,
        actionableShorts: actionable.filter((idea) => idea.direction === "SHORT").length,
        failedSymbols: failures.length,
        failures,
      },
      methodology: {
        version: "MaicaTrades adaptive long-short model 4.0",
        availableMaximum: 96,
        minimumActionableScore: MINIMUM_ACTIONABLE_SCORE,
        movingAverageFramework:
          "20 SMA slope over 5 sessions and 160 SMA slope over 10 sessions",
        extensionFilter:
          "Rejects actionable setups more than 8% or 2 ATR from the 20 SMA",
        earningsNewsFilter: "Reserved for the next update",
        updateFrequency: "Approximately every 15 minutes",
      },
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Trade idea route error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unable to calculate the featured trade idea." },
      { status: 500 },
    );
  }
}