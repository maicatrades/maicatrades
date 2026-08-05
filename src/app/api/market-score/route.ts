import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
export const dynamic = "force-dynamic";

const REQUEST_TIMEOUT_MS = 10_000;
const MINIMUM_REQUIRED_SECTORS = 8;
const DATA_CACHE_SECONDS = 300;

const SYMBOLS = {
  spy: "SPY",
  qqq: "QQQ",
  vix: "^VIX",
  sectors: [
    "XLK", // Technology
    "XLC", // Communication Services
    "XLY", // Consumer Discretionary
    "XLF", // Financials
    "XLI", // Industrials
    "XLE", // Energy
    "XLV", // Healthcare
    "XLP", // Consumer Staples
    "XLU", // Utilities
    "XLRE", // Real Estate
    "XLB", // Materials
  ],
};

const GROWTH_SECTORS = ["XLK", "XLC", "XLY"];
const DEFENSIVE_SECTORS = ["XLP", "XLV", "XLU"];

type YahooHost = "query1" | "query2";

type YahooQuote = {
  close?: Array<number | null>;
};

type YahooMeta = {
  regularMarketPrice?: number;
  currency?: string;
  marketState?: string;
};

type YahooResult = {
  meta?: YahooMeta;
  indicators?: {
    quote?: YahooQuote[];
  };
};

type YahooResponse = {
  chart?: {
    result?: YahooResult[];
    error?: {
      code?: string;
      description?: string;
    } | null;
  };
};

type MarketData = {
  symbol: string;
  price: number;
  closes: number[];
  series: number[];
  currency: string;
  marketState: string;
};

type SectorResult = {
  symbol: string;
  dailyReturn: number;
  fiveDayReturn: number;
};

type FetchResult = {
  successful: MarketData[];
  failedSymbols: string[];
};

type FetchOptions = Parameters<typeof fetch>[1];

function isValidNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function round(value: number, decimals = 2) {
  const multiplier = 10 ** decimals;

  return Math.round(value * multiplier) / multiplier;
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum);
}

function average(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  return (
    values.reduce((total, value) => total + value, 0) /
    values.length
  );
}

function percentChange(current: number, previous: number) {
  if (
    !isValidNumber(current) ||
    !isValidNumber(previous) ||
    previous === 0
  ) {
    return 0;
  }

  return ((current - previous) / previous) * 100;
}

function simpleMovingAverage(series: number[], length: number) {
  if (series.length < length) {
    return null;
  }

  return average(series.slice(-length));
}

function getReturn(series: number[], tradingDays: number) {
  if (series.length <= tradingDays) {
    return 0;
  }

  const current = series[series.length - 1];
  const previous = series[series.length - 1 - tradingDays];

  return percentChange(current, previous);
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    if (error.name === "AbortError") {
      return "The request timed out.";
    }

    return error.message;
  }

  return String(error);
}

/**
 * Yahoo's daily-close array may already include the current market price
 * after the closing bell.
 *
 * During an active session, regularMarketPrice can be newer than the last
 * daily candle. In that case, append the live price so the calculations use
 * the current session.
 */
function buildCurrentSeries(closes: number[], marketPrice: number) {
  if (closes.length === 0) {
    return [marketPrice];
  }

  const latestClose = closes[closes.length - 1];
  const difference = Math.abs(latestClose - marketPrice);

  if (difference < 0.01) {
    return closes;
  }

  return [...closes, marketPrice];
}

async function fetchWithTimeout(
  url: string,
  options: FetchOptions,
  timeoutMs = REQUEST_TIMEOUT_MS,
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

async function requestYahooData(
  host: YahooHost,
  symbol: string,
): Promise<MarketData> {
  const encodedSymbol = encodeURIComponent(symbol);

  const url =
    `https://${host}.finance.yahoo.com/v8/finance/chart/` +
    `${encodedSymbol}` +
    "?interval=1d&range=6mo&includePrePost=false";

  const response = await fetchWithTimeout(
    url,
    {
      next: {
        revalidate: DATA_CACHE_SECONDS,
      },
      headers: {
        Accept: "application/json",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
          "AppleWebKit/537.36 (KHTML, like Gecko) " +
          "Chrome/120 Safari/537.36",
      },
    },
    REQUEST_TIMEOUT_MS,
  );

  if (!response.ok) {
    throw new Error(
      `Yahoo ${host} returned HTTP ${response.status} for ${symbol}.`,
    );
  }

  let json: YahooResponse;

  try {
    json = (await response.json()) as YahooResponse;
  } catch {
    throw new Error(
      `Yahoo ${host} returned invalid JSON for ${symbol}.`,
    );
  }

  if (json.chart?.error) {
    throw new Error(
      json.chart.error.description ??
        `Yahoo ${host} returned an error for ${symbol}.`,
    );
  }

  const result = json.chart?.result?.[0];

  if (!result) {
    throw new Error(
      `Yahoo ${host} returned no market data for ${symbol}.`,
    );
  }

  const closes =
    result.indicators?.quote?.[0]?.close?.filter(isValidNumber) ??
    [];

  if (closes.length < 55) {
    throw new Error(
      `Not enough historical data returned for ${symbol}. ` +
        `Received ${closes.length} closes.`,
    );
  }

  const latestClose = closes[closes.length - 1];
  const regularMarketPrice = result.meta?.regularMarketPrice;

  const price = isValidNumber(regularMarketPrice)
    ? regularMarketPrice
    : latestClose;

  if (!isValidNumber(price) || price <= 0) {
    throw new Error(`Yahoo returned an invalid price for ${symbol}.`);
  }

  const series = buildCurrentSeries(closes, price);

  return {
    symbol,
    price,
    closes,
    series,
    currency: result.meta?.currency ?? "USD",
    marketState: result.meta?.marketState ?? "UNKNOWN",
  };
}

async function fetchYahooData(symbol: string): Promise<MarketData> {
  try {
    return await requestYahooData("query1", symbol);
  } catch (query1Error) {
    console.warn(
      `Yahoo query1 failed for ${symbol}. Trying query2.`,
      getErrorMessage(query1Error),
    );

    try {
      return await requestYahooData("query2", symbol);
    } catch (query2Error) {
      const query1Message = getErrorMessage(query1Error);
      const query2Message = getErrorMessage(query2Error);

      throw new Error(
        `Unable to load ${symbol}. ` +
          `Query1: ${query1Message} ` +
          `Query2: ${query2Message}`,
      );
    }
  }
}

async function fetchAllMarketData(
  symbols: string[],
): Promise<FetchResult> {
  const results = await Promise.allSettled(
    symbols.map((symbol) => fetchYahooData(symbol)),
  );

  const successful: MarketData[] = [];
  const failedSymbols: string[] = [];

  results.forEach((result, index) => {
    const symbol = symbols[index];

    if (result.status === "fulfilled") {
      successful.push(result.value);
      return;
    }

    failedSymbols.push(symbol);

    console.error(
      `Market Score request failed for ${symbol}:`,
      result.reason,
    );
  });

  return {
    successful,
    failedSymbols,
  };
}

/* -------------------------------------------------------------------------- */
/* Trend: 40 points                                                           */
/* -------------------------------------------------------------------------- */

function scoreIndexTrend(data: MarketData) {
  const sma20 = simpleMovingAverage(data.series, 20);
  const sma50 = simpleMovingAverage(data.series, 50);

  if (sma20 === null || sma50 === null) {
    throw new Error(
      `Unable to calculate moving averages for ${data.symbol}.`,
    );
  }

  let score = 0;

  // Price above short-term trend: 8 points
  if (data.price > sma20) {
    score += 8;
  } else if (data.price >= sma20 * 0.99) {
    // Within 1% of the 20-day average: partial credit
    score += 4;
  }

  // Price above intermediate trend: 8 points
  if (data.price > sma50) {
    score += 8;
  } else if (data.price >= sma50 * 0.99) {
    score += 4;
  }

  // Short-term average above intermediate average: 4 points
  if (sma20 > sma50) {
    score += 4;
  } else if (sma20 >= sma50 * 0.995) {
    score += 2;
  }

  return {
    symbol: data.symbol,
    score,
    maxScore: 20,
    price: round(data.price),
    sma20: round(sma20),
    sma50: round(sma50),
    aboveSma20: data.price > sma20,
    aboveSma50: data.price > sma50,
    bullishAverageAlignment: sma20 > sma50,
  };
}

function calculateTrendScore(
  spy: MarketData,
  qqq: MarketData,
) {
  const spyTrend = scoreIndexTrend(spy);
  const qqqTrend = scoreIndexTrend(qqq);

  return {
    score: spyTrend.score + qqqTrend.score,
    maxScore: 40,
    details: {
      spy: spyTrend,
      qqq: qqqTrend,
    },
  };
}

/* -------------------------------------------------------------------------- */
/* Momentum: 25 points                                                        */
/* -------------------------------------------------------------------------- */

function scoreOneDayReturn(value: number) {
  if (value >= 1) return 2;
  if (value > 0) return 1.5;
  if (value >= -0.75) return 1;
  if (value >= -1.5) return 0.5;

  return 0;
}

function scoreFiveDayReturn(value: number) {
  if (value >= 2) return 4;
  if (value >= 0.5) return 3;
  if (value > 0) return 2.5;
  if (value >= -1.5) return 1.5;
  if (value >= -3) return 0.5;

  return 0;
}

function scoreTenDayReturn(value: number) {
  if (value >= 3) return 3;
  if (value >= 1) return 2.5;
  if (value > 0) return 2;
  if (value >= -2) return 1;

  return 0;
}

function scoreTwentyDayReturn(value: number) {
  if (value >= 5) return 3;
  if (value >= 2) return 2.5;
  if (value > 0) return 2;
  if (value >= -3) return 1;

  return 0;
}

function scoreIndexMomentum(data: MarketData) {
  const oneDayReturn = getReturn(data.series, 1);
  const fiveDayReturn = getReturn(data.series, 5);
  const tenDayReturn = getReturn(data.series, 10);
  const twentyDayReturn = getReturn(data.series, 20);

  const oneDayScore = scoreOneDayReturn(oneDayReturn);
  const fiveDayScore = scoreFiveDayReturn(fiveDayReturn);
  const tenDayScore = scoreTenDayReturn(tenDayReturn);
  const twentyDayScore =
    scoreTwentyDayReturn(twentyDayReturn);

  const score =
    oneDayScore +
    fiveDayScore +
    tenDayScore +
    twentyDayScore;

  return {
    symbol: data.symbol,
    score: round(score),
    maxScore: 12,
    returns: {
      oneDay: round(oneDayReturn),
      fiveDay: round(fiveDayReturn),
      tenDay: round(tenDayReturn),
      twentyDay: round(twentyDayReturn),
    },
    scoring: {
      oneDay: oneDayScore,
      fiveDay: fiveDayScore,
      tenDay: tenDayScore,
      twentyDay: twentyDayScore,
    },
  };
}

function calculateMomentumScore(
  spy: MarketData,
  qqq: MarketData,
) {
  const spyMomentum = scoreIndexMomentum(spy);
  const qqqMomentum = scoreIndexMomentum(qqq);

  let confirmationScore = 0;

  const bothFiveDayPositive =
    spyMomentum.returns.fiveDay > 0 &&
    qqqMomentum.returns.fiveDay > 0;

  const bothTenDayPositive =
    spyMomentum.returns.tenDay > 0 &&
    qqqMomentum.returns.tenDay > 0;

  if (bothFiveDayPositive && bothTenDayPositive) {
    confirmationScore = 1;
  } else if (bothFiveDayPositive || bothTenDayPositive) {
    confirmationScore = 0.5;
  }

  const score =
    spyMomentum.score +
    qqqMomentum.score +
    confirmationScore;

  return {
    score: round(clamp(score, 0, 25)),
    maxScore: 25,
    details: {
      spy: spyMomentum,
      qqq: qqqMomentum,
      confirmationScore,
    },
  };
}

/* -------------------------------------------------------------------------- */
/* Sector participation and leadership: 20 points                             */
/* -------------------------------------------------------------------------- */

function calculateSectorScore(sectors: MarketData[]) {
  const sectorResults: SectorResult[] = sectors.map(
    (sector) => ({
      symbol: sector.symbol,
      dailyReturn: round(getReturn(sector.series, 1)),
      fiveDayReturn: round(getReturn(sector.series, 5)),
    }),
  );

  const dailyPositiveCount = sectorResults.filter(
    (sector) => sector.dailyReturn > 0,
  ).length;

  const fiveDayPositiveCount = sectorResults.filter(
    (sector) => sector.fiveDayReturn > 0,
  ).length;

  const totalSectors = sectorResults.length;

  const dailyParticipationRatio =
    totalSectors > 0
      ? dailyPositiveCount / totalSectors
      : 0;

  const fiveDayParticipationRatio =
    totalSectors > 0
      ? fiveDayPositiveCount / totalSectors
      : 0;

  // Daily breadth contributes up to 8 points.
  const dailyParticipationScore = round(
    dailyParticipationRatio * 8,
    1,
  );

  // Five-day breadth contributes up to 8 points.
  const fiveDayParticipationScore = round(
    fiveDayParticipationRatio * 8,
    1,
  );

  const growthReturns = sectorResults
    .filter((sector) =>
      GROWTH_SECTORS.includes(sector.symbol),
    )
    .map((sector) => sector.fiveDayReturn);

  const defensiveReturns = sectorResults
    .filter((sector) =>
      DEFENSIVE_SECTORS.includes(sector.symbol),
    )
    .map((sector) => sector.fiveDayReturn);

  const growthAverage = average(growthReturns);
  const defensiveAverage = average(defensiveReturns);

  const hasLeadershipData =
    growthReturns.length >= 2 &&
    defensiveReturns.length >= 2;

  const leadershipSpread = hasLeadershipData
    ? growthAverage - defensiveAverage
    : 0;

  let leadershipScore = 0;

  if (hasLeadershipData) {
    if (leadershipSpread >= 1.5) {
      leadershipScore = 4;
    } else if (leadershipSpread >= 0.5) {
      leadershipScore = 3;
    } else if (leadershipSpread > 0) {
      leadershipScore = 2;
    } else if (leadershipSpread >= -0.5) {
      leadershipScore = 1;
    }
  }

  const score =
    dailyParticipationScore +
    fiveDayParticipationScore +
    leadershipScore;

  return {
    score: round(clamp(score, 0, 20)),
    maxScore: 20,
    details: {
      dailyPositiveCount,
      fiveDayPositiveCount,
      totalSectors,
      expectedSectorCount: SYMBOLS.sectors.length,
      coveragePercent: round(
        (totalSectors / SYMBOLS.sectors.length) * 100,
      ),
      dailyParticipationPercent: round(
        dailyParticipationRatio * 100,
      ),
      fiveDayParticipationPercent: round(
        fiveDayParticipationRatio * 100,
      ),
      growthFiveDayAverage: round(growthAverage),
      defensiveFiveDayAverage: round(defensiveAverage),
      leadershipSpread: round(leadershipSpread),
      leadershipScore,
      leadershipDataAvailable: hasLeadershipData,
      sectors: sectorResults,
    },
  };
}

/* -------------------------------------------------------------------------- */
/* Volatility: 15 points                                                      */
/* -------------------------------------------------------------------------- */

function calculateVolatilityScore(vix: MarketData) {
  const vixLevel = vix.price;
  const dailyReturn = getReturn(vix.series, 1);
  const fiveDayReturn = getReturn(vix.series, 5);

  let levelScore = 0;

  if (vixLevel < 15) {
    levelScore = 10;
  } else if (vixLevel < 18) {
    levelScore = 8;
  } else if (vixLevel < 22) {
    levelScore = 6;
  } else if (vixLevel < 28) {
    levelScore = 3;
  }

  let dailyDirectionScore = 0;

  if (dailyReturn <= -5) {
    dailyDirectionScore = 3;
  } else if (dailyReturn < 0) {
    dailyDirectionScore = 2;
  } else if (dailyReturn <= 5) {
    dailyDirectionScore = 1;
  }

  let fiveDayDirectionScore = 0;

  if (fiveDayReturn <= -10) {
    fiveDayDirectionScore = 2;
  } else if (fiveDayReturn < 0) {
    fiveDayDirectionScore = 1.5;
  } else if (fiveDayReturn <= 5) {
    fiveDayDirectionScore = 1;
  } else if (fiveDayReturn <= 15) {
    fiveDayDirectionScore = 0.5;
  }

  const score =
    levelScore +
    dailyDirectionScore +
    fiveDayDirectionScore;

  return {
    score: round(clamp(score, 0, 15)),
    maxScore: 15,
    details: {
      vixLevel: round(vixLevel),
      dailyReturn: round(dailyReturn),
      fiveDayReturn: round(fiveDayReturn),
      levelScore,
      dailyDirectionScore,
      fiveDayDirectionScore,
    },
  };
}

/* -------------------------------------------------------------------------- */
/* Labels and summary                                                         */
/* -------------------------------------------------------------------------- */

function getMarketLabel(score: number) {
  if (score >= 80) return "Strong Bullish";
  if (score >= 65) return "Bullish";
  if (score >= 50) return "Neutral";
  if (score >= 35) return "Bearish";

  return "Strong Bearish";
}

function getScoreTrend(scoreChange: number | null) {
  if (scoreChange === null) {
    return "Unavailable";
  }

  if (scoreChange >= 3) {
    return "Improving";
  }

  if (scoreChange <= -3) {
    return "Weakening";
  }

  return "Stable";
}

function getEnvironment(score: number) {
  if (score >= 80) {
    return {
      bias: "Aggressive Bullish",
      riskLevel: "Low",
      approach:
        "Favor strong momentum setups while continuing to manage position risk.",
    };
  }

  if (score >= 65) {
    return {
      bias: "Bullish",
      riskLevel: "Moderate",
      approach:
        "Favor long setups in leading sectors, but avoid chasing extended entries.",
    };
  }

  if (score >= 50) {
    return {
      bias: "Neutral",
      riskLevel: "Moderate",
      approach:
        "Stay selective, reduce position size, and wait for confirmed setups.",
    };
  }

  if (score >= 35) {
    return {
      bias: "Bearish",
      riskLevel: "Elevated",
      approach:
        "Protect capital, limit new exposure, and require stronger confirmation.",
    };
  }

  return {
    bias: "Strong Bearish",
    riskLevel: "High",
    approach:
      "Prioritize capital preservation and avoid aggressive long exposure.",
  };
}

/* -------------------------------------------------------------------------- */
/* Route handler                                                              */
/* -------------------------------------------------------------------------- */

export async function GET() {
  try {
    const requestedSymbols = [
      SYMBOLS.spy,
      SYMBOLS.qqq,
      SYMBOLS.vix,
      ...SYMBOLS.sectors,
    ];

    const { successful, failedSymbols } =
      await fetchAllMarketData(requestedSymbols);

    const dataBySymbol = new Map(
      successful.map((item) => [item.symbol, item]),
    );

    const spy = dataBySymbol.get(SYMBOLS.spy);
    const qqq = dataBySymbol.get(SYMBOLS.qqq);
    const vix = dataBySymbol.get(SYMBOLS.vix);

    const missingRequiredSymbols = [
      !spy ? SYMBOLS.spy : null,
      !qqq ? SYMBOLS.qqq : null,
      !vix ? SYMBOLS.vix : null,
    ].filter((symbol): symbol is string => Boolean(symbol));

    if (!spy || !qqq || !vix) {
      throw new Error(
        `Required index data is missing: ${missingRequiredSymbols.join(
          ", ",
        )}.`,
      );
    }

    const sectors = SYMBOLS.sectors.map((symbol) =>
      dataBySymbol.get(symbol),
    ).filter(
      (sector): sector is MarketData => Boolean(sector),
    );

    const missingSectorSymbols = SYMBOLS.sectors.filter(
      (symbol) => !dataBySymbol.has(symbol),
    );

    if (sectors.length < MINIMUM_REQUIRED_SECTORS) {
      throw new Error(
        `Insufficient sector data. Received ${sectors.length} of ` +
          `${SYMBOLS.sectors.length} sector ETFs. At least ` +
          `${MINIMUM_REQUIRED_SECTORS} are required.`,
      );
    }

    const trend = calculateTrendScore(spy, qqq);
    const momentum = calculateMomentumScore(spy, qqq);
    const sectorStrength = calculateSectorScore(sectors);
    const volatility = calculateVolatilityScore(vix);

    const rawScore =
      trend.score +
      momentum.score +
      sectorStrength.score +
      volatility.score;

    const score = Math.round(clamp(rawScore, 0, 100));
    const label = getMarketLabel(score);
    const environment = getEnvironment(score);

    const currentTradingDate = new Date().toISOString().slice(0, 10);

    let previousScore: number | null = null;
    let previousTradingDate: string | null = null;
    let previousLabel: string | null = null;

    try {
      const {
        data: previousScoreRow,
        error: previousScoreError,
      } = await supabaseAdmin
        .from("market_score_history")
        .select("trading_date, market_score, market_label")
        .lt("trading_date", currentTradingDate)
        .order("trading_date", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (previousScoreError) {
        console.error(
          "Unable to retrieve previous Market Score:",
          previousScoreError,
        );
      } else if (previousScoreRow) {
        const storedPreviousScore = Number(
          previousScoreRow.market_score,
        );

        if (Number.isFinite(storedPreviousScore)) {
          previousScore = storedPreviousScore;
          previousTradingDate =
            previousScoreRow.trading_date ?? null;
          previousLabel = previousScoreRow.market_label ?? null;
        }
      }
    } catch (previousScoreError) {
      console.error(
        "Unexpected previous Market Score error:",
        previousScoreError,
      );
    }

    const scoreChange =
      previousScore === null ? null : score - previousScore;

    const scoreTrend = getScoreTrend(scoreChange);

    try {
      const { error: marketScoreHistoryError } =
        await supabaseAdmin
          .from("market_score_history")
          .upsert(
            {
              trading_date: currentTradingDate,

              market_score: score,
              market_label: label,

              market_bias: environment.bias,
              risk_level: environment.riskLevel,
              approach: environment.approach,

              trend_score: trend.score,
              trend_max_score: trend.maxScore,

              momentum_score: momentum.score,
              momentum_max_score: momentum.maxScore,

              sector_strength_score: sectorStrength.score,
              sector_strength_max_score:
                sectorStrength.maxScore,

              volatility_score: volatility.score,
              volatility_max_score: volatility.maxScore,

              updated_at: new Date().toISOString(),
            },
            {
              onConflict: "trading_date",
            },
          );

      if (marketScoreHistoryError) {
        console.error(
          "Unable to save Market Score history:",
          marketScoreHistoryError,
        );
      }
    } catch (marketScoreHistoryError) {
      console.error(
        "Unexpected Market Score history error:",
        marketScoreHistoryError,
      );
    }

    const partialData =
      failedSymbols.length > 0 ||
      missingSectorSymbols.length > 0;

    return NextResponse.json(
      {
        success: true,
        score,
        rawScore: round(rawScore),
        label,
        environment,
        previousScore,
        previousTradingDate,
        previousLabel,
        scoreChange,
        scoreTrend,
        comparison: {
          currentScore: score,
          currentTradingDate,
          previousScore,
          previousTradingDate,
          previousLabel,
          scoreChange,
          scoreTrend,
        },
        components: {
          trend,
          momentum,
          sectorStrength,
          volatility,
        },
        weights: {
          trend: 40,
          momentum: 25,
          sectorStrength: 20,
          volatility: 15,
        },
        dataQuality: {
          status: partialData ? "partial" : "complete",
          requestedSymbols: requestedSymbols.length,
          successfulSymbols: successful.length,
          failedSymbols,
          sectorsReceived: sectors.length,
          sectorsExpected: SYMBOLS.sectors.length,
          missingSectorSymbols,
          minimumRequiredSectors:
            MINIMUM_REQUIRED_SECTORS,
        },
        source: "Yahoo Finance",
        updatedAt: new Date().toISOString(),
      },
      {
        headers: {
          "Cache-Control":
            "public, s-maxage=300, stale-while-revalidate=600",
        },
      },
    );
  } catch (error) {
    console.error("Market score route error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to calculate the market score.",
        updatedAt: new Date().toISOString(),
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      },
    );
  }
}