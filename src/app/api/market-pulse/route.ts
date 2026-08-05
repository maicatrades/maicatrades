import { NextResponse } from "next/server";

export const revalidate = 900;

const BENCHMARKS = [
  {
    symbol: "SPY",
    name: "S&P 500 ETF",
    type: "market",
  },
  {
    symbol: "QQQ",
    name: "Nasdaq 100 ETF",
    type: "market",
  },
  {
    symbol: "IWM",
    name: "Russell 2000 ETF",
    type: "market",
  },
  {
    symbol: "DIA",
    name: "Dow Jones ETF",
    type: "market",
  },
  {
    symbol: "SMH",
    name: "Semiconductor ETF",
    type: "market",
  },
  {
    symbol: "^VIX",
    displaySymbol: "VIX",
    name: "CBOE Volatility Index",
    type: "volatility",
  },
] as const;

type Status = "Bullish" | "Neutral" | "Watch" | "Low";

type YahooChartMeta = {
  regularMarketPrice?: number;
  regularMarketTime?: number;
  regularMarketDayHigh?: number;
  regularMarketDayLow?: number;
  regularMarketVolume?: number;
  previousClose?: number;
  chartPreviousClose?: number;
  marketState?: string;
  exchangeTimezoneName?: string;
};

type YahooChartResult = {
  meta?: YahooChartMeta;
  timestamp?: number[];
  indicators?: {
    quote?: Array<{
      close?: Array<number | null>;
    }>;
  };
};

type YahooChartResponse = {
  chart?: {
    result?: YahooChartResult[];
    error?: {
      code?: string;
      description?: string;
    } | null;
  };
};

type BenchmarkResult = {
  symbol: string;
  name: string;
  status: Status;
  price: number;
  previousClose: number;
  change: number;
  changePercent: number;
  positive: boolean;
  description: string;
  trendDescription: string;
  intradayDescription: string;
  ema20: number | null;
  ema50: number | null;
  rsi14: number | null;
  dayHigh: number | null;
  dayLow: number | null;
  marketState: string | null;
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

  const startingValues = values.slice(0, period);

  let ema =
    startingValues.reduce((sum, value) => sum + value, 0) /
    period;

  const multiplier = 2 / (period + 1);

  for (let index = period; index < values.length; index += 1) {
    ema =
      values[index] * multiplier +
      ema * (1 - multiplier);
  }

  return ema;
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
  interval: string,
  range: string,
): Promise<YahooChartResponse> {
  const url =
    `https://${host}.finance.yahoo.com/v8/finance/chart/` +
    `${encodeURIComponent(symbol)}` +
    `?interval=${interval}` +
    `&range=${range}` +
    "&includePrePost=false" +
    "&events=div%2Csplits";

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

async function fetchYahooChart(
  symbol: string,
  interval: string,
  range: string,
) {
  try {
    return await requestYahooChart(
      "query1",
      symbol,
      interval,
      range,
    );
  } catch (query1Error) {
    try {
      return await requestYahooChart(
        "query2",
        symbol,
        interval,
        range,
      );
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

function getValidCloses(
  result: YahooChartResult | undefined,
) {
  return (
    result?.indicators?.quote?.[0]?.close?.filter(
      (value): value is number =>
        isValidNumber(value) && value > 0,
    ) ?? []
  );
}

function getLivePrice(
  intradayResult: YahooChartResult | undefined,
  intradayCloses: number[],
) {
  const regularMarketPrice =
    intradayResult?.meta?.regularMarketPrice;

  if (
    isValidNumber(regularMarketPrice) &&
    regularMarketPrice > 0
  ) {
    return regularMarketPrice;
  }

  const latestIntradayClose =
    intradayCloses[intradayCloses.length - 1];

  if (
    isValidNumber(latestIntradayClose) &&
    latestIntradayClose > 0
  ) {
    return latestIntradayClose;
  }

  return null;
}

function getPreviousClose(
  intradayResult: YahooChartResult | undefined,
  dailyCloses: number[],
) {
  /*
   * Yahoo's `previousClose` represents the immediately preceding completed
   * regular trading session. This must be preferred for a true daily change.
   *
   * `chartPreviousClose` can reflect the starting reference point of the
   * requested multi-day chart range, which can accidentally produce a
   * multi-session percentage change when using a 5-day intraday request.
   */
  const previousClose =
    intradayResult?.meta?.previousClose;

  if (
    isValidNumber(previousClose) &&
    previousClose > 0
  ) {
    return previousClose;
  }

  if (dailyCloses.length >= 2) {
    const fallbackPreviousClose =
      dailyCloses[dailyCloses.length - 2];

    if (
      isValidNumber(fallbackPreviousClose) &&
      fallbackPreviousClose > 0
    ) {
      return fallbackPreviousClose;
    }
  }

  const chartPreviousClose =
    intradayResult?.meta?.chartPreviousClose;

  if (
    isValidNumber(chartPreviousClose) &&
    chartPreviousClose > 0
  ) {
    return chartPreviousClose;
  }

  return null;
}

function getTrendDescription({
  price,
  ema20,
  ema50,
}: {
  price: number;
  ema20: number | null;
  ema50: number | null;
}) {
  if (ema20 === null || ema50 === null) {
    return "Trend data temporarily limited";
  }

  if (price > ema20 && ema20 > ema50) {
    return "Bullish trend above the 20 and 50 EMA";
  }

  if (price > ema50 && price < ema20) {
    return "Pulling back below the 20 EMA";
  }

  if (price > ema20 && ema20 <= ema50) {
    return "Improving above the 20 EMA";
  }

  if (price < ema20 && price > ema50) {
    return "Weakening but still above the 50 EMA";
  }

  if (price < ema20 && price < ema50) {
    return "Bearish trend below key averages";
  }

  return "Mixed trend conditions";
}

function getIntradayDescription(
  changePercent: number,
) {
  if (changePercent >= 1) {
    return "Strong intraday buying pressure";
  }

  if (changePercent >= 0.35) {
    return "Positive intraday momentum";
  }

  if (changePercent > -0.35) {
    return "Limited intraday movement";
  }

  if (changePercent > -1) {
    return "Intraday selling pressure";
  }

  return "Strong intraday selling pressure";
}

function getMarketStatus({
  price,
  changePercent,
  ema20,
  ema50,
}: {
  price: number;
  changePercent: number;
  ema20: number | null;
  ema50: number | null;
}): Status {
  const aboveEma20 =
    ema20 !== null &&
    price > ema20;

  const bullishTrend =
    ema20 !== null &&
    ema50 !== null &&
    price > ema20 &&
    ema20 > ema50;

  const belowKeyAverages =
    ema20 !== null &&
    ema50 !== null &&
    price < ema20 &&
    price < ema50;

  /*
   * Strong daily price action should be recognized even when a benchmark's
   * moving averages have not fully shifted into bullish alignment yet.
   */
  if (changePercent >= 1) {
    return "Bullish";
  }

  if (
    bullishTrend &&
    changePercent >= 0
  ) {
    return "Bullish";
  }

  if (
    aboveEma20 &&
    changePercent >= 0.35
  ) {
    return "Bullish";
  }

  /*
   * A meaningful negative session should not display as Bullish merely
   * because the longer-term moving-average trend remains positive.
   */
  if (changePercent <= -0.35) {
    return "Watch";
  }

  if (
    belowKeyAverages &&
    changePercent < 0
  ) {
    return "Watch";
  }

  return "Neutral";
}

function getVolatilityStatus({
  price,
  changePercent,
  ema20,
}: {
  price: number;
  changePercent: number;
  ema20: number | null;
}): Status {
  if (
    price >= 25 ||
    changePercent >= 5 ||
    (
      ema20 !== null &&
      price > ema20 &&
      changePercent > 0
    )
  ) {
    return "Watch";
  }

  if (
    price < 20 &&
    changePercent <= 0
  ) {
    return "Low";
  }

  return "Neutral";
}

function getVolatilityDescription({
  price,
  changePercent,
  ema20,
}: {
  price: number;
  changePercent: number;
  ema20: number | null;
}) {
  if (changePercent >= 5) {
    return "Volatility is rising sharply";
  }

  if (changePercent > 1) {
    return "Volatility is increasing";
  }

  if (changePercent < -1) {
    return "Volatility is decreasing";
  }

  if (price >= 25) {
    return "Volatility remains elevated";
  }

  if (
    ema20 !== null &&
    price > ema20
  ) {
    return "Volatility is above its short-term trend";
  }

  if (price < 20) {
    return "Volatility remains relatively calm";
  }

  return "Volatility conditions are moderate";
}

function getCombinedMarketDescription({
  price,
  changePercent,
  ema20,
  ema50,
}: {
  price: number;
  changePercent: number;
  ema20: number | null;
  ema50: number | null;
}) {
  const bullishTrend =
    ema20 !== null &&
    ema50 !== null &&
    price > ema20 &&
    ema20 > ema50;

  if (
    bullishTrend &&
    changePercent <= -1
  ) {
    return "Bullish longer-term trend with strong selling pressure today";
  }

  if (
    bullishTrend &&
    changePercent <= -0.35
  ) {
    return "Bullish longer-term trend, but selling pressure is present today";
  }

  if (
    bullishTrend &&
    changePercent >= 1
  ) {
    return "Bullish trend with strong intraday momentum";
  }

  if (
    bullishTrend &&
    changePercent >= 0.35
  ) {
    return "Bullish trend with positive intraday momentum";
  }

  if (bullishTrend) {
    return "Bullish trend with limited intraday movement";
  }

  if (
    ema20 !== null &&
    price < ema20 &&
    changePercent < 0
  ) {
    return "Below the 20 EMA with continued selling pressure";
  }

  if (changePercent <= -1) {
    return "Strong intraday selling pressure";
  }

  if (changePercent <= -0.35) {
    return "Intraday selling pressure";
  }

  if (changePercent >= 1) {
    return "Strong intraday buying pressure";
  }

  if (changePercent >= 0.35) {
    return "Positive intraday momentum";
  }

  return "Mixed market conditions";
}

async function fetchBenchmark(
  benchmark: (typeof BENCHMARKS)[number],
): Promise<BenchmarkResult> {
  /*
   * Daily data is used for EMA and RSI calculations.
   * Intraday data is used for the current price and today's change.
   */
  const [dailyData, intradayData] =
    await Promise.all([
      fetchYahooChart(
        benchmark.symbol,
        "1d",
        "6mo",
      ),
      fetchYahooChart(
        benchmark.symbol,
        "5m",
        "5d",
      ),
    ]);

  const dailyResult =
    dailyData.chart?.result?.[0];

  const intradayResult =
    intradayData.chart?.result?.[0];

  const dailyCloses =
    getValidCloses(dailyResult);

  const intradayCloses =
    getValidCloses(intradayResult);

  if (dailyCloses.length < 50) {
    throw new Error(
      `Not enough daily historical data was returned for ${benchmark.symbol}`,
    );
  }

  const price =
    getLivePrice(
      intradayResult,
      intradayCloses,
    );

  const previousClose =
    getPreviousClose(
      intradayResult,
      dailyCloses,
    );

  if (
    price === null ||
    previousClose === null ||
    price <= 0 ||
    previousClose <= 0
  ) {
    throw new Error(
      `Invalid live quote data was returned for ${benchmark.symbol}`,
    );
  }

  const change = price - previousClose;

  const changePercent =
    (change / previousClose) * 100;

  /*
   * Append the current live price to the historical series so the
   * moving averages and RSI better reflect current conditions.
   */
  const indicatorCloses = [...dailyCloses];

  if (indicatorCloses.length > 0) {
    indicatorCloses[
      indicatorCloses.length - 1
    ] = price;
  } else {
    indicatorCloses.push(price);
  }

  const ema20 =
    calculateEma(indicatorCloses, 20);

  const ema50 =
    calculateEma(indicatorCloses, 50);

  const rsi14 =
    calculateRsi(indicatorCloses, 14);

  const isVolatility =
    benchmark.type === "volatility";

  const status = isVolatility
    ? getVolatilityStatus({
        price,
        changePercent,
        ema20,
      })
    : getMarketStatus({
        price,
        changePercent,
        ema20,
        ema50,
      });

  const trendDescription =
    getTrendDescription({
      price,
      ema20,
      ema50,
    });

  const intradayDescription =
    getIntradayDescription(
      changePercent,
    );

  const description = isVolatility
    ? getVolatilityDescription({
        price,
        changePercent,
        ema20,
      })
    : getCombinedMarketDescription({
        price,
        changePercent,
        ema20,
        ema50,
      });

  const dayHigh =
    intradayResult?.meta?.regularMarketDayHigh;

  const dayLow =
    intradayResult?.meta?.regularMarketDayLow;

  return {
    symbol:
      "displaySymbol" in benchmark
        ? benchmark.displaySymbol
        : benchmark.symbol,

    name: benchmark.name,
    status,

    price: round(price),
    previousClose: round(previousClose),
    change: round(change),
    changePercent: round(changePercent),

    positive: changePercent >= 0,

    description,
    trendDescription,
    intradayDescription,

    ema20:
      ema20 === null
        ? null
        : round(ema20),

    ema50:
      ema50 === null
        ? null
        : round(ema50),

    rsi14:
      rsi14 === null
        ? null
        : round(rsi14),

    dayHigh:
      isValidNumber(dayHigh)
        ? round(dayHigh)
        : null,

    dayLow:
      isValidNumber(dayLow)
        ? round(dayLow)
        : null,

    marketState:
      intradayResult?.meta?.marketState ??
      null,
  };
}

export async function GET() {
  try {
    const results =
      await Promise.allSettled(
        BENCHMARKS.map(fetchBenchmark),
      );

    const benchmarks: BenchmarkResult[] = [];
    const failedSymbols: string[] = [];

    results.forEach((result, index) => {
      const benchmark = BENCHMARKS[index];

      if (result.status === "fulfilled") {
        benchmarks.push(result.value);
        return;
      }

      failedSymbols.push(benchmark.symbol);

      console.error(
        `Market Pulse request failed for ${benchmark.symbol}:`,
        result.reason instanceof Error
          ? result.reason.message
          : result.reason,
      );
    });

    if (benchmarks.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "No valid Market Pulse data was returned.",
          failedSymbols,
        },
        {
          status: 503,
        },
      );
    }

    const marketBenchmarks =
      benchmarks.filter(
        (item) => item.symbol !== "VIX",
      );

    const bullishCount =
      marketBenchmarks.filter(
        (item) =>
          item.status === "Bullish",
      ).length;

    const neutralCount =
      marketBenchmarks.filter(
        (item) =>
          item.status === "Neutral",
      ).length;

    const watchCount =
      marketBenchmarks.filter(
        (item) =>
          item.status === "Watch",
      ).length;

    const vixResult =
      benchmarks.find(
        (item) => item.symbol === "VIX",
      );

    const lowRiskCount =
      vixResult?.status === "Low"
        ? 1
        : 0;

    const positiveBenchmarks =
      marketBenchmarks.filter(
        (item) =>
          item.changePercent > 0,
      ).length;

    const negativeBenchmarks =
      marketBenchmarks.filter(
        (item) =>
          item.changePercent < 0,
      ).length;

    const averageMarketChange =
      marketBenchmarks.length > 0
        ? marketBenchmarks.reduce(
            (sum, item) =>
              sum + item.changePercent,
            0,
          ) / marketBenchmarks.length
        : 0;

    let marketTone = "Mixed";

    if (
      negativeBenchmarks >= 4 &&
      averageMarketChange <= -0.75
    ) {
      marketTone = "Strong selling pressure";
    } else if (negativeBenchmarks >= 4) {
      marketTone = "Defensive";
    } else if (
      positiveBenchmarks >= 4 &&
      averageMarketChange >= 0.75
    ) {
      marketTone = "Strong buying pressure";
    } else if (positiveBenchmarks >= 4) {
      marketTone = "Constructive";
    } else if (watchCount >= 3) {
      marketTone = "Cautious";
    }

    return NextResponse.json({
      success: true,

      benchmarks,

      summary: {
        bullish: bullishCount,
        neutral: neutralCount,
        watch: watchCount,
        lowRisk: lowRiskCount,
        riskSignals: watchCount,
        positiveBenchmarks,
        negativeBenchmarks,

        totalMarketBenchmarks:
          marketBenchmarks.length,

        averageMarketChange:
          round(averageMarketChange),

        marketTone,
      },

      coverage: {
        requested: BENCHMARKS.length,
        returned: benchmarks.length,
        failed: failedSymbols.length,
        failedSymbols,
        partialData:
          failedSymbols.length > 0,
      },

      methodology: {
        currentSession:
          "Five-minute Yahoo Finance market data used for current price and daily percentage change",

        trend:
          "Price relationship to the 20-day and 50-day exponential moving averages",

        momentum:
          "14-period relative strength index calculated from daily price history",

        volatility:
          "VIX level, current daily movement, and relationship to its 20-day EMA",

        updateFrequency:
          "Approximately every 15 minutes",
      },

      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error(
      "Market Pulse route error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to calculate Market Pulse.",
      },
      {
        status: 500,
      },
    );
  }
}