import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
export const dynamic = "force-dynamic";

const REQUEST_TIMEOUT_MS = 10_000;
const MINIMUM_REQUIRED_SECTORS = 8;
const DATA_CACHE_SECONDS = 300;
const MAX_CONCURRENT_MARKET_REQUESTS = 3;

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
  timestamp?: number[];
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
  tradingDate: string;
  currency: string;
  marketState: string;
  sourceTradingDate: string;
  sessionPriceUsed: boolean;
};

type SectorResult = {
  symbol: string;
  dailyReturn: number;
  fiveDayReturn: number;
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

type DatedClose = {
  close: number;
  tradingDate: string;
};

type RawMarketData = {
  symbol: string;
  regularMarketPrice: number;
  points: DatedClose[];
  currency: string;
  marketState: string;
};

function getEasternSession(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);

  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );

  const tradingDate =
    `${values.year}-${values.month}-${values.day}`;
  const minutes = Number(values.hour) * 60 + Number(values.minute);
  const weekday = values.weekday;
  const isWeekday = weekday !== "Sat" && weekday !== "Sun";

  return {
    tradingDate,
    minutes,
    isWeekday,
    isRegularSession:
      isWeekday && minutes >= 9 * 60 + 30 && minutes < 16 * 60,
  };
}

function getEasternTradingDate(timestampSeconds: number) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(timestampSeconds * 1000));

  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );

  return `${values.year}-${values.month}-${values.day}`;
}

/**
 * Align one Yahoo series to SPY's official scoring date.
 *
 * Outside the U.S. regular session, every calculation uses the aligned daily
 * close. During the regular session, the live price may replace (never append
 * to) today's active daily candle. This prevents a live quote from becoming a
 * fake extra trading day and prevents VIX/premarket data from advancing ahead
 * of SPY.
 */
function alignMarketData(
  data: RawMarketData,
  scoringDate: string,
  useLiveSessionPrice: boolean,
): MarketData {
  const alignedPoints = data.points.filter(
    (point) => point.tradingDate <= scoringDate,
  );

  const minimumAlignedPoints =
    data.symbol === SYMBOLS.vix ? 6 : 55;

  if (alignedPoints.length < minimumAlignedPoints) {
    throw new Error(
      `Not enough aligned historical data for ${data.symbol} on ${scoringDate}.`,
    );
  }

  const latestPoint = alignedPoints[alignedPoints.length - 1];
  const hasScoringDateCandle =
    latestPoint.tradingDate === scoringDate;

  if (!hasScoringDateCandle && !useLiveSessionPrice) {
    throw new Error(
      `${data.symbol} is not aligned to the Market Score date. ` +
        `Expected ${scoringDate}, received ${latestPoint.tradingDate}.`,
    );
  }

  const closes = alignedPoints.map((point) => point.close);
  const canUseLivePrice =
    useLiveSessionPrice &&
    isValidNumber(data.regularMarketPrice) &&
    data.regularMarketPrice > 0;
  const price = canUseLivePrice
    ? data.regularMarketPrice
    : closes[closes.length - 1];
  const series = [...closes];

  if (canUseLivePrice) {
    if (hasScoringDateCandle) {
      series[series.length - 1] = price;
    } else {
      // Yahoo may not expose today's 1d candle early in the session. In that
      // case, today's verified regular-session price is one legitimate new
      // trading day and must be appended exactly once.
      series.push(price);
    }
  }

  return {
    symbol: data.symbol,
    price,
    closes,
    series,
    tradingDate: scoringDate,
    sourceTradingDate:
      data.points[data.points.length - 1]?.tradingDate ?? scoringDate,
    currency: data.currency,
    marketState: data.marketState,
    sessionPriceUsed: canUseLivePrice,
  };
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
  range = "6mo",
  minimumPoints = 55,
): Promise<RawMarketData> {
  const encodedSymbol = encodeURIComponent(symbol);

  const url =
    `https://${host}.finance.yahoo.com/v8/finance/chart/` +
    `${encodedSymbol}` +
    `?interval=1d&range=${range}&includePrePost=false`;

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

  const rawCloses =
    result.indicators?.quote?.[0]?.close ?? [];

  const timestamps = result.timestamp ?? [];

  const validPoints = rawCloses
    .map((close, index) => {
      const timestamp = timestamps[index];

      if (!isValidNumber(close) || !isValidNumber(timestamp)) {
        return null;
      }

      return {
        close,
        timestamp,
      };
    })
    .filter(
      (point): point is { close: number; timestamp: number } =>
        point !== null,
    );

  if (validPoints.length < minimumPoints) {
    throw new Error(
      `Not enough historical data returned for ${symbol}. ` +
        `Received ${validPoints.length} closes.`,
    );
  }

  const latestPoint = validPoints[validPoints.length - 1];
  const latestClose = latestPoint.close;

  const regularMarketPrice = result.meta?.regularMarketPrice;

  const price = isValidNumber(regularMarketPrice)
    ? regularMarketPrice
    : latestClose;

  if (!isValidNumber(price) || price <= 0) {
    throw new Error(`Yahoo returned an invalid price for ${symbol}.`);
  }

  return {
    symbol,
    regularMarketPrice: price,
    points: validPoints.map((point) => ({
      close: point.close,
      tradingDate: getEasternTradingDate(point.timestamp),
    })),
    currency: result.meta?.currency ?? "USD",
    marketState: result.meta?.marketState ?? "UNKNOWN",
  };
}

async function fetchYahooData(symbol: string): Promise<RawMarketData> {
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
      if (symbol === SYMBOLS.vix) {
        console.warn(
          "Six-month VIX history is unavailable. Trying the 10-day VIX fallback.",
        );

        try {
          return await requestYahooData("query1", symbol, "10d", 6);
        } catch (shortQuery1Error) {
          try {
            return await requestYahooData("query2", symbol, "10d", 6);
          } catch (shortQuery2Error) {
            throw new Error(
              `Unable to load ${symbol}. ` +
                `Six-month query1: ${getErrorMessage(query1Error)} ` +
                `Six-month query2: ${getErrorMessage(query2Error)} ` +
                `Ten-day query1: ${getErrorMessage(shortQuery1Error)} ` +
                `Ten-day query2: ${getErrorMessage(shortQuery2Error)}`,
            );
          }
        }
      }

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
) {
  const successful: RawMarketData[] = [];
  const failedSymbols: string[] = [];
  let nextSymbolIndex = 0;

  async function worker() {
    while (nextSymbolIndex < symbols.length) {
      const symbolIndex = nextSymbolIndex;
      nextSymbolIndex += 1;
      const symbol = symbols[symbolIndex];

      try {
        successful.push(await fetchYahooData(symbol));
      } catch (error) {
        failedSymbols.push(symbol);

        console.error(
          `Market Score request failed for ${symbol}:`,
          error,
        );
      }
    }
  }

  const workerCount = Math.min(
    MAX_CONCURRENT_MARKET_REQUESTS,
    symbols.length,
  );

  await Promise.all(
    Array.from({ length: workerCount }, () => worker()),
  );

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
/* Market breadth confirmation                                                */
/* -------------------------------------------------------------------------- */

type MarketBreadthSnapshot = {
  tradingDate: string;
  score: number;
  label: string | null;
  advancingPercent: number | null;
  positiveSectorPercent: number | null;
  updatedAt: string | null;
};

type BreadthConfirmation = {
  available: boolean;
  adjustment: number;
  scoreCap: number;
  reason: string;
  snapshot: MarketBreadthSnapshot | null;
};

function getBreadthAdjustment(breadthScore: number) {
  if (breadthScore >= 80) {
    return {
      adjustment: 3,
      scoreCap: 100,
      reason: "Strong breadth confirms the bullish market structure.",
    };
  }

  if (breadthScore >= 65) {
    return {
      adjustment: 1,
      scoreCap: 100,
      reason: "Healthy breadth provides positive confirmation.",
    };
  }

  if (breadthScore >= 50) {
    return {
      adjustment: 0,
      scoreCap: 79,
      reason:
        "Mixed breadth prevents an aggressive bullish classification.",
    };
  }

  if (breadthScore >= 35) {
    return {
      adjustment: -6,
      scoreCap: 74,
      reason:
        "Weak participation reduces confidence in index-level strength.",
    };
  }

  return {
    adjustment: -10,
    scoreCap: 64,
    reason:
      "Very weak participation materially limits the bullish market score.",
  };
}

async function getBreadthConfirmationForDate(
  currentTradingDate: string,
  isRegularSession: boolean,
): Promise<BreadthConfirmation> {
  try {
    const { data, error } = await supabaseAdmin
      .from("market_breadth_history")
      .select(
        "trading_date, breadth_score, breadth_label, advancing_percent, positive_sector_percent, updated_at",
      )
      .eq("trading_date", currentTradingDate)
      .maybeSingle();

    if (error) {
      throw error;
    }

    const breadthScore = Number(data?.breadth_score);

    if (!data || !Number.isFinite(breadthScore)) {
      return {
        available: false,
        adjustment: 0,
        scoreCap: 100,
        reason:
          "No valid market breadth snapshot was available, so no adjustment was applied.",
        snapshot: null,
      };
    }

    // During trading hours, an old row for today must not keep capping
    // a freshly calculated score. Breadth refreshes on a 30-minute cycle.
    if (isRegularSession) {
      const updatedAtMs = Date.parse(data.updated_at ?? "");
      const ageMs = Date.now() - updatedAtMs;

      if (
        !Number.isFinite(updatedAtMs) ||
        ageMs < -5 * 60_000 ||
        ageMs > 90 * 60_000
      ) {
        return {
          available: false,
          adjustment: 0,
          scoreCap: 100,
          reason:
            "Today's Market Breadth snapshot is stale or has no valid update time, so no breadth adjustment was applied.",
          snapshot: null,
        };
      }
    }

    const advancingPercent = Number(data.advancing_percent);
    const positiveSectorPercent = Number(
      data.positive_sector_percent,
    );

    const snapshot: MarketBreadthSnapshot = {
      tradingDate: data.trading_date,
      score: round(breadthScore),
      label: data.breadth_label ?? null,
      advancingPercent: Number.isFinite(advancingPercent)
        ? round(advancingPercent)
        : null,
      positiveSectorPercent: Number.isFinite(
        positiveSectorPercent,
      )
        ? round(positiveSectorPercent)
        : null,
      updatedAt: data.updated_at ?? null,
    };

    const modifier = getBreadthAdjustment(breadthScore);

    return {
      available: true,
      adjustment: modifier.adjustment,
      scoreCap: modifier.scoreCap,
      reason: modifier.reason,
      snapshot,
    };
  } catch (error) {
    console.error(
      "Unable to retrieve Market Breadth confirmation:",
      error instanceof Error ? error.message : error,
    );

    return {
      available: false,
      adjustment: 0,
      scoreCap: 100,
      reason:
        "Market breadth confirmation was unavailable, so no adjustment was applied.",
      snapshot: null,
    };
  }
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

async function getStoredMarketScoreFallback() {
  try {
    const { data, error } = await supabaseAdmin
      .from("market_score_history")
      .select(
        "trading_date, market_score, market_label, raw_score, market_bias, risk_level, approach, trend_score, trend_max_score, momentum_score, momentum_max_score, sector_strength_score, sector_strength_max_score, volatility_score, volatility_max_score, captured_at, updated_at",
      )
      .order("trading_date", { ascending: false })
      .limit(5);

    if (error || !data || data.length === 0) {
      if (error) {
        console.error("Unable to retrieve stored Market Score fallback:", error);
      }

      return null;
    }

    const current = data[0];
    const score = Number(current.market_score);

    if (!Number.isFinite(score)) {
      return null;
    }

    const previous = data[1] ?? null;
    const previousScore = previous
      ? Number(previous.market_score)
      : null;
    const validPreviousScore =
      previousScore !== null && Number.isFinite(previousScore)
        ? previousScore
        : null;
    const scoreChange =
      validPreviousScore === null ? null : score - validPreviousScore;
    const storedScores = data
      .map((row) => Number(row.market_score))
      .filter(Number.isFinite);
    const fiveDayAverage =
      storedScores.length === 5
        ? round(average(storedScores), 1)
        : null;

    return {
      score,
      rawScore: Number.isFinite(Number(current.raw_score))
        ? Number(current.raw_score)
        : score,
      label: current.market_label ?? getMarketLabel(score),
      environment: {
        bias: current.market_bias ?? getEnvironment(score).bias,
        riskLevel: current.risk_level ?? getEnvironment(score).riskLevel,
        approach: current.approach ?? getEnvironment(score).approach,
      },
      previousScore: validPreviousScore,
      previousTradingDate: previous?.trading_date ?? null,
      previousLabel: previous?.market_label ?? null,
      scoreChange,
      scoreTrend: getScoreTrend(scoreChange),
      fiveDayAverage,
      fiveDayAverageSampleSize: storedScores.length,
      fiveDayAverageDates: data.map((row) => String(row.trading_date)),
      components: {
        trend: {
          score: Number(current.trend_score),
          maxScore: Number(current.trend_max_score) || 40,
        },
        momentum: {
          score: Number(current.momentum_score),
          maxScore: Number(current.momentum_max_score) || 25,
        },
        sectorStrength: {
          score: Number(current.sector_strength_score),
          maxScore: Number(current.sector_strength_max_score) || 20,
        },
        volatility: {
          score: Number(current.volatility_score),
          maxScore: Number(current.volatility_max_score) || 15,
        },
      },
      dataQuality: {
        status: "stored-fallback",
        officialTradingDate: String(current.trading_date),
      },
      isFallback: true,
      fallbackMessage:
        "Showing the latest verified Market Score snapshot while live providers reconnect.",
      updatedAt:
        current.updated_at ??
        current.captured_at ??
        new Date().toISOString(),
    };
  } catch (fallbackError) {
    console.error("Unexpected stored Market Score fallback error:", fallbackError);
    return null;
  }
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

    const { successful: rawSuccessful, failedSymbols: requestFailedSymbols } =
      await fetchAllMarketData(requestedSymbols);

    const rawDataBySymbol = new Map(
      rawSuccessful.map((item) => [item.symbol, item]),
    );

    const rawSpy = rawDataBySymbol.get(SYMBOLS.spy);
    const rawQqq = rawDataBySymbol.get(SYMBOLS.qqq);
    const rawVix = rawDataBySymbol.get(SYMBOLS.vix);

    const missingRequiredSymbols = [
      !rawSpy ? SYMBOLS.spy : null,
      !rawQqq ? SYMBOLS.qqq : null,
      !rawVix ? SYMBOLS.vix : null,
    ].filter((symbol): symbol is string => Boolean(symbol));

    if (!rawSpy || !rawQqq || !rawVix) {
      throw new Error(
        `Required index data is missing: ${missingRequiredSymbols.join(
          ", ",
        )}.`,
      );
    }

    const easternSession = getEasternSession();
    const acceptCurrentDate =
      easternSession.isRegularSession ||
      (easternSession.isWeekday && easternSession.minutes >= 16 * 60);
    const eligibleSpyPoints = rawSpy.points.filter((point) => {
      if (point.tradingDate < easternSession.tradingDate) {
        return true;
      }

      return (
        point.tradingDate === easternSession.tradingDate &&
        acceptCurrentDate
      );
    });
    const officialSpyPoint =
      eligibleSpyPoints[eligibleSpyPoints.length - 1];

    if (!officialSpyPoint) {
      throw new Error(
        "Unable to establish an official completed SPY trading date.",
      );
    }

    // Yahoo updates the active daily candle with the live price, so comparing
    // regularMarketPrice with that candle cannot prove the market is open.
    const verifiedLiveSession =
      easternSession.isRegularSession &&
      rawSpy.marketState.toUpperCase() === "REGULAR";
    const currentTradingDate = verifiedLiveSession
      ? easternSession.tradingDate
      : officialSpyPoint.tradingDate;
    const useLiveSessionPrice = verifiedLiveSession;
    const successful: MarketData[] = [];
    const alignmentFailedSymbols: string[] = [];

    rawSuccessful.forEach((item) => {
      try {
        successful.push(
          alignMarketData(
            item,
            currentTradingDate,
            useLiveSessionPrice,
          ),
        );
      } catch (alignmentError) {
        alignmentFailedSymbols.push(item.symbol);
        console.error(
          `Market Score date alignment failed for ${item.symbol}:`,
          alignmentError,
        );
      }
    });

    const failedSymbols = Array.from(
      new Set([...requestFailedSymbols, ...alignmentFailedSymbols]),
    );
    const dataBySymbol = new Map(
      successful.map((item) => [item.symbol, item]),
    );
    const spy = dataBySymbol.get(SYMBOLS.spy);
    const qqq = dataBySymbol.get(SYMBOLS.qqq);
    const vix = dataBySymbol.get(SYMBOLS.vix);

    if (!spy || !qqq || !vix) {
      throw new Error(
        "SPY, QQQ, and VIX must share the official Market Score trading date.",
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

    const breadthConfirmation =
      await getBreadthConfirmationForDate(
        currentTradingDate,
        easternSession.isRegularSession,
      );

    const adjustedScore = clamp(
      rawScore + breadthConfirmation.adjustment,
      0,
      breadthConfirmation.scoreCap,
    );

    const score = Math.round(adjustedScore);
    const label = getMarketLabel(score);
    const environment = getEnvironment(score);

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

    let fiveDayAverage: number | null = null;
    let fiveDayAverageSampleSize = 0;
    let fiveDayAverageDates: string[] = [];

    try {
      const { data: priorScoreRows, error: priorScoresError } =
        await supabaseAdmin
          .from("market_score_history")
          .select("trading_date, market_score")
          .lt("trading_date", currentTradingDate)
          .order("trading_date", { ascending: false })
          .limit(4);

      if (priorScoresError) {
        console.error(
          "Unable to retrieve five-day Market Score history:",
          priorScoresError,
        );
      } else {
        const priorScores = (priorScoreRows ?? [])
          .map((row) => ({
            tradingDate: String(row.trading_date),
            score: Number(row.market_score),
          }))
          .filter((row) => Number.isFinite(row.score));
        const rollingScores = [
          { tradingDate: currentTradingDate, score },
          ...priorScores,
        ].slice(0, 5);

        fiveDayAverageSampleSize = rollingScores.length;
        fiveDayAverageDates = rollingScores.map(
          (row) => row.tradingDate,
        );

        if (rollingScores.length === 5) {
          fiveDayAverage = round(
            average(rollingScores.map((row) => row.score)),
            1,
          );
        }
      }
    } catch (priorScoresError) {
      console.error(
        "Unexpected five-day Market Score history error:",
        priorScoresError,
      );
    }

    const shouldPersistHistory =
      currentTradingDate === easternSession.tradingDate &&
      easternSession.isWeekday &&
      (easternSession.isRegularSession ||
        (easternSession.minutes >= 16 * 60 &&
          easternSession.minutes < 18 * 60));

    const isFinalHistorySnapshot =
      shouldPersistHistory &&
      easternSession.minutes >= 16 * 60;

    if (shouldPersistHistory) {
      try {
      const { error: marketScoreHistoryError } =
        await supabaseAdmin
          .from("market_score_history")
          .upsert(
            {
              trading_date: currentTradingDate,

              market_score: score,
              market_label: label,
raw_score: round(rawScore),
breadth_adjusted_score: round(adjustedScore),
breadth_score: breadthConfirmation.snapshot?.score ?? null,
breadth_label: breadthConfirmation.snapshot?.label ?? null,
breadth_adjustment: breadthConfirmation.adjustment,
breadth_trading_date:
  breadthConfirmation.available
    ? breadthConfirmation.snapshot?.tradingDate ?? null
    : null,
breadth_updated_at:
  breadthConfirmation.available
    ? breadthConfirmation.snapshot?.updatedAt ?? null
    : null,
broad_sectors_positive:
  sectorStrength.details.dailyPositiveCount,
broad_sectors_total:
  sectorStrength.details.totalSectors,
              market_bias: environment.bias,
              risk_level: environment.riskLevel,
              approach: environment.approach,
              snapshot_status: isFinalHistorySnapshot
                ? "final"
                : "intraday",
              captured_at: new Date().toISOString(),

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
    }

    const partialData =
      failedSymbols.length > 0 ||
      missingSectorSymbols.length > 0;

    return NextResponse.json(
      {
        success: true,
        score,
        rawScore: round(rawScore),
        breadthAdjustedScore: round(adjustedScore),
        breadthConfirmation,
        label,
        environment,
        previousScore,
        previousTradingDate,
        previousLabel,
        scoreChange,
        scoreTrend,
        fiveDayAverage,
        fiveDayAverageSampleSize,
        fiveDayAverageDates,
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
        methodology: {
          baseScore:
            "Trend, momentum, sector strength, and volatility total 100 possible points.",
          breadthConfirmation:
            "The latest 122-stock Market Breadth score applies a confirmation adjustment and may cap the final classification when participation is mixed or weak.",
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
          officialTradingDate: currentTradingDate,
          easternSessionDate: easternSession.tradingDate,
          regularSessionActive: easternSession.isRegularSession,
          liveSessionPriceUsed: useLiveSessionPrice,
          historyWriteAllowed: shouldPersistHistory,
          inputDates: successful.map((item) => ({
            symbol: item.symbol,
            scoringDate: item.tradingDate,
            sourceTradingDate: item.sourceTradingDate,
            marketState: item.marketState,
            sessionPriceUsed: item.sessionPriceUsed,
          })),
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

    const storedFallback = await getStoredMarketScoreFallback();

    if (storedFallback) {
      return NextResponse.json(
        {
          success: true,
          ...storedFallback,
        },
        {
          headers: {
            "Cache-Control": "no-store, max-age=0",
          },
        },
      );
    }

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
