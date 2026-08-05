import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

/*
 * Market breadth does not require second-by-second updates.
 * Yahoo historical data is cached for 30 minutes to reduce
 * request pressure and improve reliability.
 */
export const revalidate = 1800;

const MINIMUM_COVERAGE_PERCENT = 80;

const sectorSymbols = {
  Technology: [
    "AAPL",
    "MSFT",
    "NVDA",
    "AVGO",
    "ORCL",
    "CRM",
    "AMD",
    "ADBE",
    "CSCO",
    "ACN",
    "IBM",
    "QCOM",
    "TXN",
    "INTU",
    "NOW",
  ],

  Communication: [
    "META",
    "GOOGL",
    "NFLX",
    "TMUS",
    "DIS",
    "CMCSA",
    "T",
    "VZ",
    "CHTR",
    "EA",
  ],

  "Consumer Discretionary": [
    "AMZN",
    "TSLA",
    "HD",
    "MCD",
    "NKE",
    "LOW",
    "SBUX",
    "BKNG",
    "TJX",
    "MAR",
    "ORLY",
    "GM",
    "F",
  ],

  Financials: [
    "JPM",
    "BAC",
    "WFC",
    "GS",
    "V",
    "MA",
    "MS",
    "C",
    "AXP",
    "BLK",
    "SCHW",
    "PGR",
    "CB",
  ],

  Healthcare: [
    "LLY",
    "UNH",
    "JNJ",
    "ABBV",
    "MRK",
    "TMO",
    "ABT",
    "AMGN",
    "GILD",
    "ISRG",
    "DHR",
    "BSX",
    "SYK",
  ],

  Industrials: [
    "CAT",
    "GE",
    "HON",
    "UPS",
    "BA",
    "RTX",
    "UNP",
    "DE",
    "LMT",
    "ETN",
    "WM",
    "PH",
    "GD",
  ],

  "Consumer Staples": [
    "WMT",
    "COST",
    "PG",
    "KO",
    "PEP",
    "PM",
    "MO",
    "CL",
    "MDLZ",
    "KMB",
  ],

  Energy: [
    "XOM",
    "CVX",
    "COP",
    "EOG",
    "SLB",
    "MPC",
    "PSX",
    "OXY",
    "VLO",
    "WMB",
  ],

  Utilities: [
    "NEE",
    "SO",
    "DUK",
    "CEG",
    "AEP",
    "SRE",
    "D",
    "EXC",
  ],

  "Real Estate": [
    "AMT",
    "PLD",
    "EQIX",
    "WELL",
    "SPG",
    "O",
    "PSA",
    "DLR",
  ],

  Materials: [
    "LIN",
    "FCX",
    "SHW",
    "APD",
    "ECL",
    "NEM",
    "NUE",
    "DOW",
    "VMC",
  ],
} as const;

type SectorName = keyof typeof sectorSymbols;

const breadthSymbols = Object.values(sectorSymbols).flat();

const symbolToSector = Object.entries(sectorSymbols).reduce<
  Record<string, SectorName>
>((accumulator, [sector, symbols]) => {
  for (const symbol of symbols) {
    accumulator[symbol] = sector as SectorName;
  }

  return accumulator;
}, {});

type YahooChartResponse = {
  chart?: {
    result?: Array<{
      meta?: {
        symbol?: string;
        regularMarketPrice?: number;
        chartPreviousClose?: number;
        previousClose?: number;
      };
      timestamp?: number[];
      indicators?: {
        quote?: Array<{
          close?: Array<number | null>;
          high?: Array<number | null>;
        }>;
      };
    }>;
    error?: {
      code?: string;
      description?: string;
    } | null;
  };
};

type HistoricalPoint = {
  timestamp: number;
  close: number;
  high: number | null;
};

type BreadthStock = {
  symbol: string;
  sector: SectorName;
  price: number;
  previousClose: number;
  change: number;
  changePercent: number;
  direction: "advancing" | "declining" | "unchanged";
  above20DayAverage: boolean | null;
  above50DayAverage: boolean | null;
  higherHigh: boolean | null;
  movingAverage20: number | null;
  movingAverage50: number | null;
  history: HistoricalPoint[];
};

type RelativePerformanceResult = {
  spyChangePercent: number;
  rspChangePercent: number;
  relativePerformance: number;
  leader: "RSP" | "SPY" | "Equal";
  signal:
    | "Broad participation"
    | "Large-cap leadership"
    | "Neutral participation";
};

type BreadthFetchResult = {
  stocks: BreadthStock[];
  failedSymbols: string[];
};

type MarketBreadthTrendLabel =
  | "Improving"
  | "Stable"
  | "Weakening"
  | "Collecting Data"
  | "Unavailable";

type MarketBreadthHistoryRow = {
  trading_date: string;
  breadth_score: number | string;
};

type MarketBreadthTrend = {
  label: MarketBreadthTrendLabel;
  currentScore: number;
  baselineScore: number | null;
  difference: number | null;
  comparisonDays: number;
  comparisonType:
    | "Previous trading day"
    | "Average of available trading days"
    | "5-day average"
    | "No comparison available";
};

type FetchOptions = RequestInit & {
  next?: {
    revalidate?: number;
  };
};

function isValidNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function calculateAverage(values: number[]) {
  if (values.length === 0) {
    return null;
  }

  return (
    values.reduce((sum, value) => sum + value, 0) /
    values.length
  );
}

function round(value: number, decimals = 2) {
  return Number(value.toFixed(decimals));
}

function getLatestTradingDate(
  stocks: BreadthStock[],
) {
  const latestTimestamp = stocks.reduce(
    (latest, stock) => {
      const stockTimestamp =
        stock.history[
          stock.history.length - 1
        ]?.timestamp;

      return isValidNumber(stockTimestamp)
        ? Math.max(latest, stockTimestamp)
        : latest;
    },
    0,
  );

  if (latestTimestamp <= 0) {
    return new Date()
      .toISOString()
      .slice(0, 10);
  }

  return new Date(latestTimestamp * 1000)
    .toISOString()
    .slice(0, 10);
}

function buildBreadthTrend(
  currentScore: number,
  previousRows: MarketBreadthHistoryRow[],
): MarketBreadthTrend {
  const previousScores = previousRows
    .map((row) => Number(row.breadth_score))
    .filter((score) => Number.isFinite(score))
    .slice(0, 5);

  if (previousScores.length === 0) {
    return {
      label: "Collecting Data",
      currentScore: round(currentScore),
      baselineScore: null,
      difference: null,
      comparisonDays: 0,
      comparisonType:
        "No comparison available",
    };
  }

  const baseline =
    calculateAverage(previousScores) ??
    currentScore;

  const difference =
    currentScore - baseline;

  let label: MarketBreadthTrendLabel =
    "Stable";

  if (difference >= 3) {
    label = "Improving";
  } else if (difference <= -3) {
    label = "Weakening";
  }

  const comparisonDays =
    previousScores.length;

  return {
    label,
    currentScore: round(currentScore),
    baselineScore: round(baseline),
    difference: round(difference),
    comparisonDays,
    comparisonType:
      comparisonDays === 1
        ? "Previous trading day"
        : comparisonDays >= 5
          ? "5-day average"
          : "Average of available trading days",
  };
}

async function saveBreadthHistoryAndGetTrend({
  tradingDate,
  breadthScore,
  breadthLabel,
  advancing,
  declining,
  unchanged,
  total,
  breadthPercent,
  decliningPercent,
  unchangedPercent,
  advanceDeclineRatio,
  netAdvancers,
  above20DayPercent,
  above50DayPercent,
  higherHighPercent,
  positiveSectors,
  totalSectors,
  positiveSectorPercent,
}: {
  tradingDate: string;
  breadthScore: number;
  breadthLabel: string;
  advancing: number;
  declining: number;
  unchanged: number;
  total: number;
  breadthPercent: number;
  decliningPercent: number;
  unchangedPercent: number;
  advanceDeclineRatio: number;
  netAdvancers: number;
  above20DayPercent: number;
  above50DayPercent: number;
  higherHighPercent: number;
  positiveSectors: number;
  totalSectors: number;
  positiveSectorPercent: number;
}): Promise<MarketBreadthTrend> {
  try {
    const { error: upsertError } =
      await supabaseAdmin
        .from("market_breadth_history")
        .upsert(
          {
            trading_date: tradingDate,
            breadth_score:
              round(breadthScore),
            breadth_label:
              breadthLabel,
            advancing_count: advancing,
            declining_count: declining,
            unchanged_count: unchanged,
            total_stocks: total,
            advancing_percent:
              round(breadthPercent),
            declining_percent:
              round(decliningPercent),
            unchanged_percent:
              round(unchangedPercent),
            advance_decline_ratio:
              round(advanceDeclineRatio),
            net_advancers: netAdvancers,
            above_20_day_percent:
              round(above20DayPercent),
            above_50_day_percent:
              round(above50DayPercent),
            higher_high_percent:
              round(higherHighPercent),
            positive_sectors:
              positiveSectors,
            total_sectors: totalSectors,
            positive_sector_percent:
              round(positiveSectorPercent),
            updated_at:
              new Date().toISOString(),
          },
          {
            onConflict: "trading_date",
          },
        );

    if (upsertError) {
      throw upsertError;
    }

    const {
      data: previousRows,
      error: historyError,
    } = await supabaseAdmin
      .from("market_breadth_history")
      .select(
        "trading_date, breadth_score",
      )
      .lt("trading_date", tradingDate)
      .order("trading_date", {
        ascending: false,
      })
      .limit(5);

    if (historyError) {
      throw historyError;
    }

    return buildBreadthTrend(
      breadthScore,
      (previousRows ??
        []) as MarketBreadthHistoryRow[],
    );
  } catch (error) {
    console.error(
      "Market breadth history error:",
      error instanceof Error
        ? error.message
        : error,
    );

    return {
      label: "Unavailable",
      currentScore: round(breadthScore),
      baselineScore: null,
      difference: null,
      comparisonDays: 0,
      comparisonType:
        "No comparison available",
    };
  }
}

function wait(milliseconds: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, milliseconds);
  });
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
  range: "5d" | "6mo",
): Promise<YahooChartResponse> {
  const url =
    `https://${host}.finance.yahoo.com/v8/finance/chart/` +
    `${encodeURIComponent(symbol)}` +
    `?interval=1d&range=${range}&includePrePost=false`;

  const response = await fetchWithTimeout(
    url,
    {
      next: {
        revalidate: 1800,
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
      `Yahoo returned no chart result for ${symbol}`,
    );
  }

  return data;
}

async function fetchYahooChart(
  symbol: string,
  range: "5d" | "6mo",
): Promise<YahooChartResponse> {
  try {
    return await requestYahooChart(
      "query1",
      symbol,
      range,
    );
  } catch (query1Error) {
    try {
      return await requestYahooChart(
        "query2",
        symbol,
        range,
      );
    } catch (query2Error) {
      const firstMessage =
        query1Error instanceof Error
          ? query1Error.message
          : String(query1Error);

      const secondMessage =
        query2Error instanceof Error
          ? query2Error.message
          : String(query2Error);

      throw new Error(
        `${symbol} failed on both Yahoo hosts. ` +
          `Query1: ${firstMessage}. ` +
          `Query2: ${secondMessage}.`,
      );
    }
  }
}

async function fetchStockBreadth(
  symbol: string,
): Promise<BreadthStock> {
  const data = await fetchYahooChart(symbol, "6mo");

  const result = data.chart?.result?.[0];
  const timestamps = result?.timestamp ?? [];
  const quote = result?.indicators?.quote?.[0];
  const closes = quote?.close ?? [];
  const highs = quote?.high ?? [];

  const history: HistoricalPoint[] = timestamps
    .map((timestamp, index) => {
      const close = closes[index];
      const high = highs[index];

      if (!isValidNumber(close)) {
        return null;
      }

      return {
        timestamp,
        close,
        high: isValidNumber(high) ? high : null,
      };
    })
    .filter(
      (point): point is HistoricalPoint =>
        point !== null,
    );

  /*
   * Use the final two daily closes from the same historical
   * series. This prevents split-adjustment mismatches between
   * Yahoo metadata and chart prices.
   */
  const lastHistoryPoint =
    history[history.length - 1];

  const previousHistoryPoint =
    history[history.length - 2];

  const price = lastHistoryPoint?.close;
  const previousClose = previousHistoryPoint?.close;

  if (
    !isValidNumber(price) ||
    !isValidNumber(previousClose) ||
    price <= 0 ||
    previousClose <= 0
  ) {
    throw new Error(
      `Yahoo returned incomplete price data for ${symbol}`,
    );
  }

  const change = price - previousClose;
  const changePercent =
    (change / previousClose) * 100;

  let direction: BreadthStock["direction"] =
    "unchanged";

  if (change > 0.001) {
    direction = "advancing";
  } else if (change < -0.001) {
    direction = "declining";
  }

  const historicalCloses = history.map(
    (point) => point.close,
  );

  const movingAverage20 =
    historicalCloses.length >= 20
      ? calculateAverage(
          historicalCloses.slice(-20),
        )
      : null;

  const movingAverage50 =
    historicalCloses.length >= 50
      ? calculateAverage(
          historicalCloses.slice(-50),
        )
      : null;

  const recentHighs = history
    .map((point) => point.high)
    .filter(
      (high): high is number => high !== null,
    );

  const latestHigh =
    recentHighs[recentHighs.length - 1];

  const previousHigh =
    recentHighs[recentHighs.length - 2];

  const higherHigh =
    isValidNumber(latestHigh) &&
    isValidNumber(previousHigh)
      ? latestHigh > previousHigh
      : null;

  return {
    symbol,
    sector: symbolToSector[symbol],
    price,
    previousClose,
    change,
    changePercent,
    direction,
    above20DayAverage:
      movingAverage20 !== null
        ? price > movingAverage20
        : null,
    above50DayAverage:
      movingAverage50 !== null
        ? price > movingAverage50
        : null,
    higherHigh,
    movingAverage20,
    movingAverage50,
    history,
  };
}

/*
 * Process symbols in small groups rather than sending more than
 * 120 Yahoo requests simultaneously.
 */
async function fetchBreadthInBatches(
  batchSize = 8,
): Promise<BreadthFetchResult> {
  const stocks: BreadthStock[] = [];
  const failedSymbols: string[] = [];

  for (
    let startIndex = 0;
    startIndex < breadthSymbols.length;
    startIndex += batchSize
  ) {
    const batch = breadthSymbols.slice(
      startIndex,
      startIndex + batchSize,
    );

    const results = await Promise.allSettled(
      batch.map((symbol) =>
        fetchStockBreadth(symbol),
      ),
    );

    results.forEach((result, index) => {
      const symbol = batch[index];

      if (result.status === "fulfilled") {
        stocks.push(result.value);
        return;
      }

      failedSymbols.push(symbol);

      console.error(
        `Market breadth request failed for ${symbol}:`,
        result.reason instanceof Error
          ? result.reason.message
          : result.reason,
      );
    });

    /*
     * A short pause between batches reduces the chance of Yahoo
     * throttling the route.
     */
    if (
      startIndex + batchSize <
      breadthSymbols.length
    ) {
      await wait(100);
    }
  }

  return {
    stocks,
    failedSymbols,
  };
}

async function fetchRelativePerformance(
  symbol: "SPY" | "RSP",
): Promise<number | null> {
  try {
    const data = await fetchYahooChart(symbol, "5d");
    const result = data.chart?.result?.[0];
    const quote = result?.indicators?.quote?.[0];

    const closes =
      quote?.close?.filter(
        (close): close is number =>
          isValidNumber(close),
      ) ?? [];

    /*
     * Use two closes from the same chart series to avoid
     * metadata and split-adjustment mismatches.
     */
    const price = closes[closes.length - 1];

    const previousClose =
      closes[closes.length - 2];

    if (
      !isValidNumber(price) ||
      !isValidNumber(previousClose) ||
      previousClose <= 0
    ) {
      return null;
    }

    return (
      ((price - previousClose) /
        previousClose) *
      100
    );
  } catch (error) {
    console.error(
      `Relative performance error for ${symbol}:`,
      error instanceof Error
        ? error.message
        : error,
    );

    return null;
  }
}

async function getRelativePerformance(): Promise<
  RelativePerformanceResult | null
> {
  const results = await Promise.allSettled([
    fetchRelativePerformance("SPY"),
    fetchRelativePerformance("RSP"),
  ]);

  const spyChangePercent =
    results[0].status === "fulfilled"
      ? results[0].value
      : null;

  const rspChangePercent =
    results[1].status === "fulfilled"
      ? results[1].value
      : null;

  if (
    spyChangePercent === null ||
    rspChangePercent === null
  ) {
    return null;
  }

  const relativePerformance =
    rspChangePercent - spyChangePercent;

  let leader:
    | "RSP"
    | "SPY"
    | "Equal" = "Equal";

  let signal:
    | "Broad participation"
    | "Large-cap leadership"
    | "Neutral participation" =
    "Neutral participation";

  if (relativePerformance > 0.05) {
    leader = "RSP";
    signal = "Broad participation";
  } else if (relativePerformance < -0.05) {
    leader = "SPY";
    signal = "Large-cap leadership";
  }

  return {
    spyChangePercent: round(
      spyChangePercent,
    ),
    rspChangePercent: round(
      rspChangePercent,
    ),
    relativePerformance: round(
      relativePerformance,
    ),
    leader,
    signal,
  };
}

function getBreadthLabel(score: number) {
  if (score >= 80) {
    return "Strong Participation";
  }

  if (score >= 65) {
    return "Healthy Participation";
  }

  if (score >= 50) {
    return "Mixed Participation";
  }

  if (score >= 35) {
    return "Weak Participation";
  }

  return "Very Weak Participation";
}

function getBreadthBias(score: number) {
  return getBreadthLabel(score);
}

function buildAdvanceDeclineLine(
  stocks: BreadthStock[],
) {
  const dailyCounts = new Map<
    number,
    {
      advancing: number;
      declining: number;
    }
  >();

  for (const stock of stocks) {
    const recentHistory =
      stock.history.slice(-21);

    for (
      let index = 1;
      index < recentHistory.length;
      index += 1
    ) {
      const previous =
        recentHistory[index - 1];

      const current = recentHistory[index];

      const existing =
        dailyCounts.get(current.timestamp) ?? {
          advancing: 0,
          declining: 0,
        };

      if (current.close > previous.close) {
        existing.advancing += 1;
      } else if (
        current.close < previous.close
      ) {
        existing.declining += 1;
      }

      dailyCounts.set(
        current.timestamp,
        existing,
      );
    }
  }

  const sortedDays = [
    ...dailyCounts.entries(),
  ]
    .sort(
      ([timestampA], [timestampB]) =>
        timestampA - timestampB,
    )
    .slice(-20);

  let cumulativeValue = 0;

  return sortedDays.map(
    ([timestamp, counts]) => {
      const netAdvancers =
        counts.advancing -
        counts.declining;

      cumulativeValue += netAdvancers;

      return {
        date: new Date(timestamp * 1000)
          .toISOString()
          .slice(0, 10),
        advancing: counts.advancing,
        declining: counts.declining,
        netAdvancers,
        value: cumulativeValue,
      };
    },
  );
}

function calculateBreadthScore({
  advancingPercent,
  above20Percent,
  above50Percent,
  positiveSectorPercent,
  rspRelativePerformance,
}: {
  advancingPercent: number;
  above20Percent: number;
  above50Percent: number;
  positiveSectorPercent: number;
  rspRelativePerformance: number | null;
}) {
  const participationComponent =
    advancingPercent * 0.4;

  const shortTermTrendComponent =
    above20Percent * 0.2;

  const intermediateTrendComponent =
    above50Percent * 0.2;

  const sectorComponent =
    positiveSectorPercent * 0.1;

  const relativePerformanceScore =
    rspRelativePerformance === null
      ? 50
      : Math.min(
          100,
          Math.max(
            0,
            50 +
              rspRelativePerformance * 50,
          ),
        );

  const relativeStrengthComponent =
    relativePerformanceScore * 0.1;

  return Math.min(
    100,
    Math.max(
      0,
      participationComponent +
        shortTermTrendComponent +
        intermediateTrendComponent +
        sectorComponent +
        relativeStrengthComponent,
    ),
  );
}

export async function GET() {
  try {
    const [
      breadthResult,
      relativePerformance,
    ] = await Promise.all([
      fetchBreadthInBatches(),
      getRelativePerformance(),
    ]);

    const validStocks =
      breadthResult.stocks;

    const failedSymbols =
      breadthResult.failedSymbols;

    const coveragePercent =
      (validStocks.length /
        breadthSymbols.length) *
      100;

    if (
      coveragePercent <
      MINIMUM_COVERAGE_PERCENT
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            `Insufficient market breadth coverage. ` +
            `Received ${validStocks.length} of ${breadthSymbols.length} symbols. ` +
            `At least ${MINIMUM_COVERAGE_PERCENT}% coverage is required.`,
          dataQuality: {
            status: "unavailable",
            requestedSymbols:
              breadthSymbols.length,
            returnedSymbols:
              validStocks.length,
            failedSymbols,
            coveragePercent:
              round(coveragePercent),
            minimumCoveragePercent:
              MINIMUM_COVERAGE_PERCENT,
          },
          updatedAt:
            new Date().toISOString(),
        },
        {
          status: 503,
          headers: {
            "Cache-Control":
              "no-store, max-age=0",
          },
        },
      );
    }

    const advancingStocks =
      validStocks.filter(
        (stock) =>
          stock.direction === "advancing",
      );

    const decliningStocks =
      validStocks.filter(
        (stock) =>
          stock.direction === "declining",
      );

    const unchangedStocks =
      validStocks.filter(
        (stock) =>
          stock.direction === "unchanged",
      );

    const stocksAbove20Day =
      validStocks.filter(
        (stock) =>
          stock.above20DayAverage === true,
      );

    const stocksWith20DayData =
      validStocks.filter(
        (stock) =>
          stock.above20DayAverage !== null,
      );

    const stocksAbove50Day =
      validStocks.filter(
        (stock) =>
          stock.above50DayAverage === true,
      );

    const stocksWith50DayData =
      validStocks.filter(
        (stock) =>
          stock.above50DayAverage !== null,
      );

    const stocksMakingHigherHighs =
      validStocks.filter(
        (stock) =>
          stock.higherHigh === true,
      );

    const stocksWithHigherHighData =
      validStocks.filter(
        (stock) =>
          stock.higherHigh !== null,
      );

    const advancing =
      advancingStocks.length;

    const declining =
      decliningStocks.length;

    const unchanged =
      unchangedStocks.length;

    const total = validStocks.length;

    const breadthPercent =
      total > 0
        ? (advancing / total) * 100
        : 0;

    const decliningPercent =
      total > 0
        ? (declining / total) * 100
        : 0;

    const unchangedPercent =
      total > 0
        ? (unchanged / total) * 100
        : 0;

    const above20DayPercent =
      stocksWith20DayData.length > 0
        ? (stocksAbove20Day.length /
            stocksWith20DayData.length) *
          100
        : 0;

    const above50DayPercent =
      stocksWith50DayData.length > 0
        ? (stocksAbove50Day.length /
            stocksWith50DayData.length) *
          100
        : 0;

    const higherHighPercent =
      stocksWithHigherHighData.length >
      0
        ? (stocksMakingHigherHighs.length /
            stocksWithHigherHighData.length) *
          100
        : 0;

    const advanceDeclineRatio =
      declining > 0
        ? advancing / declining
        : advancing;

    const netAdvancers =
      advancing - declining;

    const sectorParticipation =
      Object.keys(sectorSymbols).map(
        (sectorName) => {
          const sector =
            sectorName as SectorName;

          const stocks =
            validStocks.filter(
              (stock) =>
                stock.sector === sector,
            );

          const sectorAdvancing =
            stocks.filter(
              (stock) =>
                stock.direction ===
                "advancing",
            ).length;

          const sectorDeclining =
            stocks.filter(
              (stock) =>
                stock.direction ===
                "declining",
            ).length;

          const sectorUnchanged =
            stocks.filter(
              (stock) =>
                stock.direction ===
                "unchanged",
            ).length;

          const participationPercent =
            stocks.length > 0
              ? (sectorAdvancing /
                  stocks.length) *
                100
              : 0;

          return {
            sector,
            advancing:
              sectorAdvancing,
            declining:
              sectorDeclining,
            unchanged:
              sectorUnchanged,
            total: stocks.length,
            participationPercent:
              round(
                participationPercent,
              ),
            positive:
              participationPercent > 50,
            status:
              participationPercent >= 70
                ? "Strong"
                : participationPercent >
                    50
                  ? "Positive"
                  : participationPercent >=
                      40
                    ? "Mixed"
                    : "Weak",
          };
        },
      );

    const positiveSectors =
      sectorParticipation.filter(
        (sector) => sector.positive,
      ).length;

    const totalSectors =
      sectorParticipation.length;

    const positiveSectorPercent =
      totalSectors > 0
        ? (positiveSectors /
            totalSectors) *
          100
        : 0;

    const breadthScore =
      calculateBreadthScore({
        advancingPercent:
          breadthPercent,
        above20Percent:
          above20DayPercent,
        above50Percent:
          above50DayPercent,
        positiveSectorPercent,
        rspRelativePerformance:
          relativePerformance
            ?.relativePerformance ??
          null,
      });

    const breadthLabel =
      getBreadthLabel(breadthScore);

    const tradingDate =
      getLatestTradingDate(validStocks);

    const breadthTrend =
      await saveBreadthHistoryAndGetTrend({
        tradingDate,
        breadthScore,
        breadthLabel,
        advancing,
        declining,
        unchanged,
        total,
        breadthPercent,
        decliningPercent,
        unchangedPercent,
        advanceDeclineRatio,
        netAdvancers,
        above20DayPercent,
        above50DayPercent,
        higherHighPercent,
        positiveSectors,
        totalSectors,
        positiveSectorPercent,
      });

    const advanceDeclineLine =
      buildAdvanceDeclineLine(
        validStocks,
      );

    const latestAdvanceDeclineValue =
      advanceDeclineLine[
        advanceDeclineLine.length - 1
      ]?.value ?? 0;

    const previousAdvanceDeclineValue =
      advanceDeclineLine[
        advanceDeclineLine.length - 2
      ]?.value ?? 0;

    const advanceDeclineTrend =
      latestAdvanceDeclineValue >
      previousAdvanceDeclineValue
        ? "Rising"
        : latestAdvanceDeclineValue <
            previousAdvanceDeclineValue
          ? "Falling"
          : "Flat";

    const strongestStocks = [
      ...validStocks,
    ]
      .sort(
        (first, second) =>
          second.changePercent -
          first.changePercent,
      )
      .slice(0, 5)
      .map(
        ({
          history,
          ...stock
        }) => stock,
      );

    const weakestStocks = [
      ...validStocks,
    ]
      .sort(
        (first, second) =>
          first.changePercent -
          second.changePercent,
      )
      .slice(0, 5)
      .map(
        ({
          history,
          ...stock
        }) => stock,
      );

    return NextResponse.json(
      {
        success: true,

      breadthScore:
        round(breadthScore),

      breadthPercent:
        round(breadthPercent),

      decliningPercent:
        round(decliningPercent),

      unchangedPercent:
        round(unchangedPercent),

      advancing,
      declining,
      unchanged,
      total,

      advanceDeclineRatio:
        round(advanceDeclineRatio),

      netAdvancers,

      above20Day: {
        count:
          stocksAbove20Day.length,
        total:
          stocksWith20DayData.length,
        percent:
          round(above20DayPercent),
      },

      above50Day: {
        count:
          stocksAbove50Day.length,
        total:
          stocksWith50DayData.length,
        percent:
          round(above50DayPercent),
      },

      higherHighs: {
        count:
          stocksMakingHigherHighs.length,
        total:
          stocksWithHigherHighData.length,
        percent:
          round(higherHighPercent),
      },

      sectors: {
        positive: positiveSectors,
        total: totalSectors,
        positivePercent:
          round(
            positiveSectorPercent,
          ),
        participation:
          sectorParticipation,
      },

      relativePerformance,

      advanceDeclineLine: {
        trend:
          advanceDeclineTrend,
        currentValue:
          latestAdvanceDeclineValue,
        points:
          advanceDeclineLine,
      },

      label:
        breadthLabel,

      bias:
        getBreadthBias(
          breadthScore,
        ),

      trend:
        breadthTrend,

      tradingDate,

      strongestStocks,
      weakestStocks,

      coverage: {
        requested:
          breadthSymbols.length,
        returned:
          validStocks.length,
        failed:
          failedSymbols.length,
        percent:
          round(coveragePercent),
        failedSymbols,
        partialData:
          failedSymbols.length > 0,
      },

      methodology: {
        universe:
          "Expanded 122-stock, multi-sector U.S. large-cap basket",
        updateFrequency:
          "Yahoo Finance data cached for approximately 30 minutes",
        scoreWeights: {
          advancingParticipation: 40,
          above20DayAverage: 20,
          above50DayAverage: 20,
          positiveSectors: 10,
          rspVersusSpy: 10,
        },
      },

        updatedAt:
          new Date().toISOString(),
      },
      {
        headers: {
          "Cache-Control":
            "public, s-maxage=1800, stale-while-revalidate=3600",
        },
      },
    );
  } catch (error) {
    console.error(
      "Market breadth route error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to calculate market breadth.",
      },
      {
        status: 500,
        headers: {
          "Cache-Control":
            "no-store, max-age=0",
        },
      },
    );
  }
}