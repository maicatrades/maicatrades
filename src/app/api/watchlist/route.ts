import { NextResponse } from "next/server";

export const revalidate = 900;

const WATCHLIST = [
  {
    symbol: "NVDA",
    company: "NVIDIA Corporation",
  },
  {
    symbol: "QQQ",
    company: "Invesco QQQ Trust",
  },
  {
    symbol: "TSLA",
    company: "Tesla, Inc.",
  },
  {
    symbol: "AAPL",
    company: "Apple Inc.",
  },
  {
    symbol: "AMZN",
    company: "Amazon.com Inc.",
  },
  {
    symbol: "PLTR",
    company: "Palantir Technologies",
  },
  {
    symbol: "META",
    company: "Meta Platforms",
  },
] as const;

type Status =
  | "Bullish"
  | "Pullback"
  | "Breakout Watch"
  | "Base Building"
  | "Extended"
  | "Neutral"
  | "Weak";

type YahooChartResponse = {
  chart?: {
    result?: Array<{
      timestamp?: number[];
      indicators?: {
        quote?: Array<{
          close?: Array<number | null>;
          high?: Array<number | null>;
          low?: Array<number | null>;
        }>;
      };
    }>;
    error?: {
      code?: string;
      description?: string;
    } | null;
  };
};

type WatchlistResult = {
  symbol: string;
  company: string;
  price: number;
  change: number;
  status: Status;
  note: string;

  // Existing fields kept for compatibility with the current UI.
  ema20: number | null;
  ema50: number | null;

  // New MaicaTrades trend-alignment fields.
  sma20: number | null;
  sma160: number | null;
  sma20SlopePercent: number;
  sma160SlopePercent: number;
  extensionFromSma20Percent: number | null;

  rsi14: number | null;
};

type FetchOptions = RequestInit & {
  next?: {
    revalidate?: number;
  };
};

function isValidNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function round(value: number, decimals = 2) {
  return Number(value.toFixed(decimals));
}

function calculateEma(values: number[], period: number) {
  if (values.length < period) {
    return null;
  }

  const initialValues = values.slice(0, period);

  let ema =
    initialValues.reduce((sum, value) => sum + value, 0) /
    period;

  const multiplier = 2 / (period + 1);

  for (let index = period; index < values.length; index += 1) {
    ema =
      values[index] * multiplier +
      ema * (1 - multiplier);
  }

  return ema;
}

function calculateSmaSeries(
  values: number[],
  period: number,
): Array<number | null> {
  const series: Array<number | null> = Array(values.length).fill(null);

  if (values.length < period) {
    return series;
  }

  let rollingTotal = values
    .slice(0, period)
    .reduce((sum, value) => sum + value, 0);

  series[period - 1] = rollingTotal / period;

  for (let index = period; index < values.length; index += 1) {
    rollingTotal += values[index];
    rollingTotal -= values[index - period];
    series[index] = rollingTotal / period;
  }

  return series;
}

function calculateSlopePercent(
  series: Array<number | null>,
  lookbackSessions: number,
) {
  const current = series.at(-1);

  const pastIndex = series.length - 1 - lookbackSessions;
  const past =
    pastIndex >= 0
      ? series[pastIndex]
      : null;

  if (
    current === null ||
    past === null ||
    !isValidNumber(current) ||
    !isValidNumber(past) ||
    past === 0
  ) {
    return 0;
  }

  return ((current - past) / past) * 100;
}

function calculateRsi(values: number[], period = 14) {
  if (values.length <= period) {
    return null;
  }

  const changes: number[] = [];

  for (let index = 1; index < values.length; index += 1) {
    changes.push(values[index] - values[index - 1]);
  }

  const recentChanges = changes.slice(-period);

  let gains = 0;
  let losses = 0;

  for (const change of recentChanges) {
    if (change > 0) {
      gains += change;
    } else if (change < 0) {
      losses += Math.abs(change);
    }
  }

  const averageGain = gains / period;
  const averageLoss = losses / period;

  if (averageLoss === 0) {
    return 100;
  }

  const relativeStrength = averageGain / averageLoss;

  return 100 - 100 / (1 + relativeStrength);
}

async function fetchWithTimeout(
  url: string,
  options: FetchOptions,
  timeoutMs = 10_000,
) {
  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function requestYahooChart(
  host: "query1" | "query2",
  symbol: string,
): Promise<YahooChartResponse> {
  const url =
    `https://${host}.finance.yahoo.com/v8/finance/chart/` +
    `${encodeURIComponent(symbol)}` +
    "?interval=1d&range=2y&includePrePost=false";

  const response = await fetchWithTimeout(
    url,
    {
      next: {
        revalidate: 900,
      },
      headers: {
        Accept: "application/json",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
          "AppleWebKit/537.36 (KHTML, like Gecko) " +
          "Chrome/120 Safari/537.36",
      },
    },
    10_000,
  );

  if (!response.ok) {
    throw new Error(
      `Yahoo ${host} returned HTTP ${response.status} for ${symbol}`,
    );
  }

  const data = (await response.json()) as YahooChartResponse;

  if (data.chart?.error) {
    throw new Error(
      data.chart.error.description ??
        `Yahoo returned an error for ${symbol}`,
    );
  }

  if (!data.chart?.result?.[0]) {
    throw new Error(
      `Yahoo returned no chart data for ${symbol}`,
    );
  }

  return data;
}

async function fetchYahooChart(symbol: string) {
  try {
    return await requestYahooChart("query1", symbol);
  } catch (query1Error) {
    try {
      return await requestYahooChart("query2", symbol);
    } catch (query2Error) {
      const query1Message =
        query1Error instanceof Error
          ? query1Error.message
          : String(query1Error);

      const query2Message =
        query2Error instanceof Error
          ? query2Error.message
          : String(query2Error);

      throw new Error(
        `${symbol} failed on both Yahoo hosts. ` +
          `Query1: ${query1Message}. ` +
          `Query2: ${query2Message}.`,
      );
    }
  }
}

function getStatus({
  price,
  changePercent,
  sma20,
  sma160,
  sma20SlopePercent,
  sma160SlopePercent,
  extensionFromSma20Percent,
  rsi14,
}: {
  price: number;
  changePercent: number;
  sma20: number | null;
  sma160: number | null;
  sma20SlopePercent: number;
  sma160SlopePercent: number;
  extensionFromSma20Percent: number | null;
  rsi14: number | null;
}): Status {
  if (sma20 === null || sma160 === null) {
    return "Neutral";
  }

  const distanceFromSma20 =
    ((price - sma20) / sma20) * 100;

  const stronglyExtended =
    changePercent >= 8 ||
    distanceFromSma20 >= 8 ||
    (rsi14 !== null && rsi14 >= 75);

  const brokenTrend =
    price < sma20 &&
    price < sma160 &&
    sma20SlopePercent < 0 &&
    sma160SlopePercent < 0;

  const constructiveTrend =
    price > sma20 &&
    sma20 > sma160 &&
    sma20SlopePercent > 0 &&
    sma160SlopePercent >= 0;

  const strongMomentumNeedsConfirmation =
    changePercent >= 2 &&
    price > sma20 &&
    price > sma160 &&
    sma160SlopePercent >= -0.15 &&
    (rsi14 === null || rsi14 >= 45)

  const nearSma20 =
    Math.abs(distanceFromSma20) <= 3;

  const broaderTrendStillConstructive =
    price >= sma160 &&
    sma160SlopePercent >= -0.15;

  const baseBuilding =
    Math.abs(distanceFromSma20) <= 5 &&
    broaderTrendStillConstructive &&
    sma20SlopePercent >= -0.2 &&
    sma20SlopePercent <= 0.2;

  const meaningfullyWeak =
    brokenTrend ||
    (price < sma160 && sma160SlopePercent < 0) ||
    (price < sma20 &&
      sma20SlopePercent < 0 &&
      sma160SlopePercent < 0) ||
    (price < sma20 &&
      rsi14 !== null &&
      rsi14 < 40);

  if (meaningfullyWeak) {
    return "Weak";
  }

  if (stronglyExtended && price > sma20) {
    return "Extended";
  }

  if (
    constructiveTrend &&
    (rsi14 === null || rsi14 >= 50)
  ) {
    return "Bullish";
  }

  if (strongMomentumNeedsConfirmation) {
    return "Breakout Watch";
  }

  if (
    nearSma20 &&
    broaderTrendStillConstructive
  ) {
    return "Pullback";
  }

  if (baseBuilding) {
    return "Base Building";
  }

  return "Neutral";
}

function getTradingNote({
  price,
  changePercent,
  sma20,
  sma160,
  sma20SlopePercent,
  sma160SlopePercent,
  extensionFromSma20Percent,
  rsi14,
  recentHigh,
  recentLow,
  status,
}: {
  price: number;
  changePercent: number;
  sma20: number | null;
  sma160: number | null;
  sma20SlopePercent: number;
  sma160SlopePercent: number;
  extensionFromSma20Percent: number | null;
  rsi14: number | null;
  recentHigh: number | null;
  recentLow: number | null;
  status: Status;
}) {
  if (sma20 === null || sma160 === null) {
    return "Trend data is temporarily limited.";
  }

  const distanceFromHigh =
    recentHigh !== null && recentHigh > 0
      ? ((recentHigh - price) / recentHigh) * 100
      : null;

  const distanceFromLow =
    recentLow !== null && recentLow > 0
      ? ((price - recentLow) / recentLow) * 100
      : null;

  if (status === "Extended") {
    const extensionText =
      extensionFromSma20Percent === null
        ? ""
        : ` Price is ${round(extensionFromSma20Percent, 1)}% above the 20-day SMA.`;

    return (
      "Strong momentum, but the stock is extended for a fresh swing entry." +
      extensionText +
      " Wait for consolidation or a controlled pullback."
    );
  }

  if (status === "Bullish") {
    return "Short- and longer-term trends are aligned with rising 20-day and 160-day SMAs.";
  }

  if (status === "Breakout Watch") {
    return "Strong upside momentum is developing above both moving averages, but full trend alignment still needs confirmation.";
  }

  if (status === "Pullback") {
    return "Price is near the 20-day SMA while the broader 160-day trend remains constructive.";
  }

  if (status === "Base Building") {
    return "Price is consolidating near the 20-day SMA while the broader trend remains constructive.";
  }

  if (status === "Weak") {
    return "Price is below both the 20-day and 160-day SMAs while both trends are weakening.";
  }

  if (
    distanceFromLow !== null &&
    distanceFromLow <= 2 &&
    price < sma20
  ) {
    return "Testing recent support and needs confirmation before entry.";
  }

  if (
    Math.abs(((price - sma20) / sma20) * 100) <= 3 &&
    price >= sma160 &&
    sma160SlopePercent >= -0.15
  ) {
    return "Pulling back toward the 20-day SMA while the broader 160-day trend remains constructive.";
  }

  if (
    distanceFromHigh !== null &&
    distanceFromHigh <= 1.5 &&
    price > sma20 &&
    sma20SlopePercent > 0
  ) {
    return "Trading near recent resistance with a constructive short-term trend.";
  }

  if (
    sma20SlopePercent > 0 &&
    sma160SlopePercent < 0
  ) {
    return "Short-term momentum is improving, but the 160-day trend is still declining.";
  }

  if (
    sma20SlopePercent < 0 &&
    sma160SlopePercent >= 0
  ) {
    return "Short-term trend is weakening inside a still-constructive broader trend.";
  }

  if (
    rsi14 !== null &&
    rsi14 < 40
  ) {
    return "Momentum remains weak; watch for stabilization before entry.";
  }

  if (
    changePercent > 2 &&
    price > sma20
  ) {
    return "Showing positive momentum above the 20-day SMA, but entry quality still depends on extension.";
  }

  return "Mixed conditions; waiting for clearer trend alignment or a better entry.";
}

async function fetchWatchlistStock(
  stock: (typeof WATCHLIST)[number],
): Promise<WatchlistResult> {
  const data = await fetchYahooChart(stock.symbol);

  const result = data.chart?.result?.[0];
  const quote = result?.indicators?.quote?.[0];

  const closes =
    quote?.close?.filter(
      (value): value is number =>
        isValidNumber(value),
    ) ?? [];

  const highs =
    quote?.high?.filter(
      (value): value is number =>
        isValidNumber(value),
    ) ?? [];

  const lows =
    quote?.low?.filter(
      (value): value is number =>
        isValidNumber(value),
    ) ?? [];

  if (closes.length < 170) {
    throw new Error(
      `Not enough historical data was returned for ${stock.symbol}`,
    );
  }

  const price = closes[closes.length - 1];
  const previousClose = closes[closes.length - 2];

  if (
    !isValidNumber(price) ||
    !isValidNumber(previousClose) ||
    price <= 0 ||
    previousClose <= 0
  ) {
    throw new Error(
      `Invalid price data was returned for ${stock.symbol}`,
    );
  }

  const changePercent =
    ((price - previousClose) / previousClose) * 100;

  // Existing EMA calculations retained so current components do not break.
  const ema20 = calculateEma(closes, 20);
  const ema50 = calculateEma(closes, 50);

  // New MaicaTrades watchlist framework.
  const sma20Series = calculateSmaSeries(closes, 20);
  const sma160Series = calculateSmaSeries(closes, 160);

  const sma20 = sma20Series.at(-1) ?? null;
  const sma160 = sma160Series.at(-1) ?? null;

  const sma20SlopePercent =
    calculateSlopePercent(sma20Series, 5);

  const sma160SlopePercent =
    calculateSlopePercent(sma160Series, 10);

  const extensionFromSma20Percent =
    sma20 !== null && sma20 > 0
      ? ((price - sma20) / sma20) * 100
      : null;

  const rsi14 = calculateRsi(closes, 14);

  const recentHighValues = highs.slice(-20);
  const recentLowValues = lows.slice(-20);

  const recentHigh =
    recentHighValues.length > 0
      ? Math.max(...recentHighValues)
      : null;

  const recentLow =
    recentLowValues.length > 0
      ? Math.min(...recentLowValues)
      : null;

  const status = getStatus({
    price,
    changePercent,
    sma20,
    sma160,
    sma20SlopePercent,
    sma160SlopePercent,
    extensionFromSma20Percent,
    rsi14,
  });

  const note = getTradingNote({
    price,
    changePercent,
    sma20,
    sma160,
    sma20SlopePercent,
    sma160SlopePercent,
    extensionFromSma20Percent,
    rsi14,
    recentHigh,
    recentLow,
    status,
  });

  return {
    symbol: stock.symbol,
    company: stock.company,
    price: round(price),
    change: round(changePercent),
    status,
    note,

    ema20:
      ema20 === null
        ? null
        : round(ema20),

    ema50:
      ema50 === null
        ? null
        : round(ema50),

    sma20:
      sma20 === null
        ? null
        : round(sma20),

    sma160:
      sma160 === null
        ? null
        : round(sma160),

    sma20SlopePercent:
      round(sma20SlopePercent, 3),

    sma160SlopePercent:
      round(sma160SlopePercent, 3),

    extensionFromSma20Percent:
      extensionFromSma20Percent === null
        ? null
        : round(extensionFromSma20Percent),

    rsi14:
      rsi14 === null
        ? null
        : round(rsi14),
  };
}

export async function GET() {
  try {
    const results = await Promise.allSettled(
      WATCHLIST.map(fetchWatchlistStock),
    );

    const watchlist: WatchlistResult[] = [];
    const failedSymbols: string[] = [];

    results.forEach((result, index) => {
      const stock = WATCHLIST[index];

      if (result.status === "fulfilled") {
        watchlist.push(result.value);
        return;
      }

      failedSymbols.push(stock.symbol);

      console.error(
        `Watchlist request failed for ${stock.symbol}:`,
        result.reason instanceof Error
          ? result.reason.message
          : result.reason,
      );
    });

    if (watchlist.length === 0) {
      return NextResponse.json(
        {
          error:
            "No valid watchlist data was returned.",
          watchlist: [],
          failedSymbols,
        },
        {
          status: 503,
        },
      );
    }

    return NextResponse.json({
      updated: new Date().toISOString(),
      watchlist,

      methodology: {
        trend:
          "Status uses the 20-day and 160-day simple moving averages, their slopes, current momentum, and distance from the 20-day SMA.",
        extension:
          "Extended status considers daily change, distance above the 20-day SMA, and RSI.",
        sma20Slope:
          "Measured over the previous 5 trading sessions.",
        sma160Slope:
          "Measured over the previous 10 trading sessions.",
        updateFrequency:
          "Approximately every 15 minutes.",
      },

      coverage: {
        requested: WATCHLIST.length,
        returned: watchlist.length,
        failed: failedSymbols.length,
        failedSymbols,
        partialData:
          failedSymbols.length > 0,
      },
    });
  } catch (error) {
    console.error(
      "Watchlist route error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to load watchlist.",
        watchlist: [],
      },
      {
        status: 500,
      },
    );
  }
}