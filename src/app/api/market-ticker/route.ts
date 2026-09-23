import { NextResponse } from "next/server";

export const revalidate = 300;

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;
const REQUEST_TIMEOUT_MS = 10_000;
const CACHE_SECONDS = 300;
const MINIMUM_REQUIRED_TICKERS = 4;

const TICKER_SYMBOLS = [
  { symbol: "SPY", finnhubSymbol: "SPY", yahooSymbol: "SPY" },
  { symbol: "QQQ", finnhubSymbol: "QQQ", yahooSymbol: "QQQ" },
  { symbol: "DIA", finnhubSymbol: "DIA", yahooSymbol: "DIA" },
  { symbol: "IWM", finnhubSymbol: "IWM", yahooSymbol: "IWM" },
  { symbol: "VIX", finnhubSymbol: "^VIX", yahooSymbol: "^VIX" },
];

type TickerDefinition = (typeof TICKER_SYMBOLS)[number];
type YahooHost = "query1" | "query2";
type Session = "PRE" | "REGULAR" | "AH";

type FinnhubQuote = {
  c?: number;
  d?: number;
  dp?: number;
  h?: number;
  l?: number;
  o?: number;
  pc?: number;
  t?: number;
};

type TradingPeriod = {
  start?: number;
  end?: number;
};

type YahooChartMeta = {
  regularMarketPrice?: number;
  regularMarketTime?: number;
  currency?: string;
  currentTradingPeriod?: {
    pre?: TradingPeriod;
    regular?: TradingPeriod;
    post?: TradingPeriod;
  };
};

type YahooChartResponse = {
  chart?: {
    result?: Array<{
      meta?: YahooChartMeta;
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
    error?: { description?: string } | null;
  };
};

type YahooExtendedData = {
  session: Session;
  price: number | null;
  regularMarketPrice: number | null;
  quoteTime: number | null;
  currency: string;
  sessionHigh: number | null;
  sessionLow: number | null;
  sessionVolume: number | null;
};

type DailyLevels = {
  previousDayHigh: number | null;
  previousDayLow: number | null;
  previousClose: number | null;
  completedDate: string | null;
  precedingClose: number | null;
};

type MarketTickerItem = {
  symbol: string;
  apiSymbol: string;
  price: number;
  previousClose: number;
  change: number;
  changePercent: number;
  regularPrice: number;
  extendedHoursPrice: number | null;
  session: Session;
  sessionLabel: "PRE" | "AH" | null;
  currency: string;
  marketState: Session;
  quoteTime: number | null;
  regularMarketTime: number | null;
  regularSource: "Finnhub" | "Yahoo Finance";
  extendedHoursSource: "Yahoo Finance" | null;
  premarketHigh: number | null;
  premarketLow: number | null;
  premarketVolume: number | null;
  previousDayHigh: number | null;
  previousDayLow: number | null;
};

function isValidNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function round(value: number, decimals = 2) {
  const multiplier = 10 ** decimals;
  return Math.round(value * multiplier) / multiplier;
}

function marketDate(timestamp: number) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(timestamp * 1000));
  const part = (type: string) => parts.find((value) => value.type === type)?.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

function isWithin(timestamp: number, period?: TradingPeriod) {
  return (
    isValidNumber(period?.start) &&
    isValidNumber(period?.end) &&
    timestamp >= period.start &&
    timestamp <= period.end
  );
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

async function fetchWithTimeout(url: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    return await fetch(url, {
      signal: controller.signal,
      next: { revalidate: CACHE_SECONDS },
      headers: {
        Accept: "application/json",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
          "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
      },
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchFinnhubQuote(ticker: TickerDefinition) {
  if (!FINNHUB_API_KEY) {
    throw new Error("Finnhub API key is missing.");
  }

  const url =
    "https://finnhub.io/api/v1/quote?symbol=" +
    `${encodeURIComponent(ticker.finnhubSymbol)}` +
    `&token=${FINNHUB_API_KEY}`;
  const response = await fetchWithTimeout(url);

  if (!response.ok) {
    throw new Error(
      `Finnhub returned HTTP ${response.status} for ${ticker.symbol}.`,
    );
  }

  const quote = (await response.json()) as FinnhubQuote;

  if (
    !isValidNumber(quote.c) ||
    quote.c <= 0 ||
    !isValidNumber(quote.pc) ||
    quote.pc <= 0
  ) {
    throw new Error(`Finnhub returned an invalid quote for ${ticker.symbol}.`);
  }

  return quote;
}

async function requestYahooExtendedData(
  host: YahooHost,
  ticker: TickerDefinition,
): Promise<YahooExtendedData> {
  const url =
    `https://${host}.finance.yahoo.com/v8/finance/chart/` +
    `${encodeURIComponent(ticker.yahooSymbol)}` +
    "?interval=5m&range=1d&includePrePost=true";
  const response = await fetchWithTimeout(url);

  if (!response.ok) {
    throw new Error(
      `Yahoo ${host} returned HTTP ${response.status} for ${ticker.symbol}.`,
    );
  }

  const data = (await response.json()) as YahooChartResponse;

  if (data.chart?.error) {
    throw new Error(
      data.chart.error.description ??
        `Yahoo ${host} returned an error for ${ticker.symbol}.`,
    );
  }

  const result = data.chart?.result?.[0];
  const meta = result?.meta;

  if (!result || !meta) {
    throw new Error(`Yahoo returned no chart data for ${ticker.symbol}.`);
  }

  const timestamps = result.timestamp ?? [];
  const closes = result.indicators?.quote?.[0]?.close ?? [];
  const highs = result.indicators?.quote?.[0]?.high ?? [];
  const lows = result.indicators?.quote?.[0]?.low ?? [];
  const volumes = result.indicators?.quote?.[0]?.volume ?? [];
  const points = timestamps
    .map((timestamp, index) => ({
      timestamp,
      close: closes[index],
      high: highs[index],
      low: lows[index],
      volume: volumes[index],
    }))
    .filter(
      (point): point is {
        timestamp: number;
        close: number;
        high: number | null;
        low: number | null;
        volume: number | null;
      } =>
        isValidNumber(point.timestamp) &&
        isValidNumber(point.close) &&
        point.close > 0,
    );
  const latestPoint = points[points.length - 1];

  if (!latestPoint) {
    throw new Error(`Yahoo returned no valid chart points for ${ticker.symbol}.`);
  }

  const premarketPoints = points.filter((point) =>
    isWithin(point.timestamp, meta.currentTradingPeriod?.pre),
  );
  const premarketHighs = premarketPoints
    .map((point) => point.high)
    .filter(isValidNumber);
  const premarketLows = premarketPoints
    .map((point) => point.low)
    .filter(isValidNumber);
  const premarketVolumes = premarketPoints
    .map((point) => point.volume)
    .filter(isValidNumber);

  let session: Session = "REGULAR";
  const periods = meta.currentTradingPeriod;

  if (isWithin(latestPoint.timestamp, periods?.pre)) {
    session = "PRE";
  } else if (isWithin(latestPoint.timestamp, periods?.post)) {
    session = "AH";
  }

  return {
    session,
    price: session === "REGULAR" ? null : latestPoint.close,
    regularMarketPrice: isValidNumber(meta.regularMarketPrice)
      ? meta.regularMarketPrice
      : null,
    quoteTime: latestPoint.timestamp,
    currency: meta.currency ?? "USD",
    sessionHigh:
      premarketHighs.length > 0 ? Math.max(...premarketHighs) : null,
    sessionLow:
      premarketLows.length > 0 ? Math.min(...premarketLows) : null,
    sessionVolume:
      premarketVolumes.length > 0
        ? premarketVolumes.reduce((sum, value) => sum + value, 0)
        : null,
  };
}

async function requestYahooDailyLevels(
  host: YahooHost,
  ticker: TickerDefinition,
): Promise<DailyLevels> {
  const url =
    `https://${host}.finance.yahoo.com/v8/finance/chart/` +
    `${encodeURIComponent(ticker.yahooSymbol)}` +
    "?interval=1d&range=10d&includePrePost=false";
  const response = await fetchWithTimeout(url);
  if (!response.ok) throw new Error(`Yahoo daily levels failed for ${ticker.symbol}.`);
  const data = (await response.json()) as YahooChartResponse;
  const result = data.chart?.result?.[0];
  const timestamps = result?.timestamp ?? [];
  const quote = result?.indicators?.quote?.[0];
  const candles = timestamps
    .map((timestamp, index) => ({
      timestamp,
      close: quote?.close?.[index],
      high: quote?.high?.[index],
      low: quote?.low?.[index],
    }))
    .filter(
      (candle): candle is { timestamp: number; close: number; high: number; low: number } =>
        isValidNumber(candle.timestamp) &&
        isValidNumber(candle.close) &&
        isValidNumber(candle.high) &&
        isValidNumber(candle.low),
    );
  // The daily chart may include a partial candle for today's session.
  const today = marketDate(Date.now() / 1000);
  const latest = candles.filter((candle) => marketDate(candle.timestamp) < today).at(-1);
  const preceding = candles.filter((candle) => marketDate(candle.timestamp) < today).at(-2);
  return {
    previousDayHigh: latest?.high ?? null,
    previousDayLow: latest?.low ?? null,
    previousClose: latest?.close ?? null,
    completedDate: latest ? marketDate(latest.timestamp) : null,
    precedingClose: preceding?.close ?? null,
  };
}

async function fetchYahooDailyLevels(ticker: TickerDefinition) {
  try {
    return await requestYahooDailyLevels("query1", ticker);
  } catch {
    return requestYahooDailyLevels("query2", ticker);
  }
}

async function fetchYahooExtendedData(ticker: TickerDefinition) {
  try {
    return await requestYahooExtendedData("query1", ticker);
  } catch (query1Error) {
    console.warn(
      `Yahoo query1 failed for ${ticker.symbol}; trying query2.`,
      getErrorMessage(query1Error),
    );

    return requestYahooExtendedData("query2", ticker);
  }
}

async function requestYahooRegularQuote(
  host: YahooHost,
  ticker: TickerDefinition,
): Promise<FinnhubQuote> {
  const url =
    `https://${host}.finance.yahoo.com/v8/finance/chart/` +
    `${encodeURIComponent(ticker.yahooSymbol)}` +
    "?interval=1d&range=10d&includePrePost=false";
  const response = await fetchWithTimeout(url);

  if (!response.ok) {
    throw new Error(
      `Yahoo ${host} returned HTTP ${response.status} for ${ticker.symbol}.`,
    );
  }

  const data = (await response.json()) as YahooChartResponse;

  if (data.chart?.error) {
    throw new Error(
      data.chart.error.description ??
        `Yahoo ${host} returned an error for ${ticker.symbol}.`,
    );
  }

  const result = data.chart?.result?.[0];
  const meta = result?.meta;
  const validCloses = (
    result?.indicators?.quote?.[0]?.close ?? []
  ).filter(isValidNumber);

  if (!result || !meta || validCloses.length < 2) {
    throw new Error(`Yahoo returned insufficient data for ${ticker.symbol}.`);
  }

  const latestClose = validCloses[validCloses.length - 1];
  const secondLatestClose = validCloses[validCloses.length - 2];
  const currentPrice = isValidNumber(meta.regularMarketPrice)
    ? meta.regularMarketPrice
    : latestClose;
  const previousClose =
    Math.abs(currentPrice - latestClose) < 0.01
      ? secondLatestClose
      : latestClose;
  const change = currentPrice - previousClose;

  return {
    c: currentPrice,
    pc: previousClose,
    d: change,
    dp: (change / previousClose) * 100,
    t: meta.regularMarketTime,
  };
}

async function fetchYahooRegularQuote(ticker: TickerDefinition) {
  try {
    return await requestYahooRegularQuote("query1", ticker);
  } catch (query1Error) {
    console.warn(
      `Yahoo regular query1 failed for ${ticker.symbol}; trying query2.`,
      getErrorMessage(query1Error),
    );

    return requestYahooRegularQuote("query2", ticker);
  }
}

async function getTickerData(
  ticker: TickerDefinition,
): Promise<MarketTickerItem> {
  let regularQuote: FinnhubQuote;
  let regularSource: "Finnhub" | "Yahoo Finance" = "Finnhub";

  try {
    regularQuote = await fetchFinnhubQuote(ticker);
  } catch (error) {
    console.warn(
      `Finnhub quote unavailable for ${ticker.symbol}; using Yahoo regular-session fallback.`,
      getErrorMessage(error),
    );

    regularQuote = await fetchYahooRegularQuote(ticker);
    regularSource = "Yahoo Finance";
  }

  let yahooData: YahooExtendedData | null = null;
  let dailyLevels: DailyLevels = {
    previousDayHigh: null,
    previousDayLow: null,
    previousClose: null,
    completedDate: null,
    precedingClose: null,
  };

  const [extendedResult, levelsResult] = await Promise.allSettled([
    fetchYahooExtendedData(ticker),
    fetchYahooDailyLevels(ticker),
  ]);
  if (extendedResult.status === "fulfilled") {
    yahooData = extendedResult.value;
  } else {
    console.warn(
      `Extended-hours data unavailable for ${ticker.symbol}; using regular-session quote.`,
      getErrorMessage(extendedResult.reason),
    );
  }
  if (levelsResult.status === "fulfilled") {
    dailyLevels = levelsResult.value;
  } else {
    console.warn(`Daily levels unavailable for ${ticker.symbol}.`, getErrorMessage(levelsResult.reason));
  }

  const regularPrice = regularQuote.c as number;
  const session = yahooData?.session ?? "REGULAR";
  const quoteDate = isValidNumber(regularQuote.t) ? marketDate(regularQuote.t) : null;
  const completedQuoteDate = quoteDate !== null && quoteDate === dailyLevels.completedDate;
  const regularPreviousClose = completedQuoteDate
    ? dailyLevels.precedingClose
    : dailyLevels.previousClose;
  if (session === "REGULAR" && !isValidNumber(regularPreviousClose)) {
    throw new Error(`Unable to verify the previous regular close for ${ticker.symbol}.`);
  }
  // Extended-hours moves use the most recent regular close, not Finnhub's
  // prior-session reference (which would include yesterday's regular move).
  const referenceClose =
    session === "REGULAR"
      ? (regularPreviousClose as number)
      : isValidNumber(yahooData?.regularMarketPrice) &&
          yahooData.regularMarketPrice > 0
        ? yahooData.regularMarketPrice
        : regularPrice;
  const extendedPrice =
    session !== "REGULAR" && isValidNumber(yahooData?.price)
      ? yahooData.price
      : null;
  const price = extendedPrice ?? regularPrice;
  if (
    session === "REGULAR" &&
    regularPreviousClose !== null &&
    Math.abs(regularPreviousClose - (regularQuote.pc as number)) > 0.01
  ) {
    console.warn(`Corrected stale ${ticker.symbol} prior close from daily history.`);
  }
  const change = price - referenceClose;
  const changePercent = (change / referenceClose) * 100;

  return {
    symbol: ticker.symbol,
    apiSymbol: ticker.yahooSymbol,
    price: round(price),
    previousClose: round(referenceClose),
    change: round(change),
    changePercent: round(changePercent),
    regularPrice: round(regularPrice),
    extendedHoursPrice: extendedPrice === null ? null : round(extendedPrice),
    session,
    sessionLabel: session === "REGULAR" ? null : session,
    currency: yahooData?.currency ?? "USD",
    marketState: session,
    quoteTime:
      extendedPrice !== null
        ? yahooData?.quoteTime ?? null
        : isValidNumber(regularQuote.t)
          ? regularQuote.t
          : null,
    regularMarketTime: isValidNumber(regularQuote.t) ? regularQuote.t : null,
    regularSource,
    extendedHoursSource: extendedPrice === null ? null : "Yahoo Finance",
    premarketHigh:
      session === "PRE" && isValidNumber(yahooData?.sessionHigh)
        ? round(yahooData.sessionHigh)
        : null,
    premarketLow:
      session === "PRE" && isValidNumber(yahooData?.sessionLow)
        ? round(yahooData.sessionLow)
        : null,
    premarketVolume:
      session === "PRE" && isValidNumber(yahooData?.sessionVolume)
        ? Math.round(yahooData.sessionVolume)
        : null,
    previousDayHigh: isValidNumber(dailyLevels.previousDayHigh)
      ? round(dailyLevels.previousDayHigh)
      : null,
    previousDayLow: isValidNumber(dailyLevels.previousDayLow)
      ? round(dailyLevels.previousDayLow)
      : null,
  };
}

export async function GET() {
  try {
    const settledResults = await Promise.allSettled(
      TICKER_SYMBOLS.map(getTickerData),
    );
    const tickerData: MarketTickerItem[] = [];
    const failedSymbols: string[] = [];

    settledResults.forEach((result, index) => {
      if (result.status === "fulfilled") {
        tickerData.push(result.value);
      } else {
        const symbol = TICKER_SYMBOLS[index].symbol;
        failedSymbols.push(symbol);
        console.error(`Market ticker failed for ${symbol}:`, result.reason);
      }
    });

    if (tickerData.length < MINIMUM_REQUIRED_TICKERS) {
      return NextResponse.json(
        {
          success: false,
          data: [],
          error:
            `Insufficient ticker data. Received ${tickerData.length} of ` +
            `${TICKER_SYMBOLS.length} symbols.`,
          failedSymbols,
          updatedAt: new Date().toISOString(),
        },
        {
          status: 503,
          headers: {
            "Cache-Control": "no-store, max-age=0",
          },
        },
      );
    }

    const orderedData = TICKER_SYMBOLS.map((ticker) =>
      tickerData.find((item) => item.symbol === ticker.symbol),
    ).filter((item): item is MarketTickerItem => Boolean(item));

    return NextResponse.json(
      {
        success: true,
        data: orderedData,
        dataQuality: {
          status: failedSymbols.length > 0 ? "partial" : "complete",
          requestedSymbols: TICKER_SYMBOLS.length,
          successfulSymbols: orderedData.length,
          failedSymbols,
          coveragePercent: round(
            (orderedData.length / TICKER_SYMBOLS.length) * 100,
          ),
        },
        regularSource: "Finnhub with Yahoo Finance fallback",
        extendedHoursSource: "Yahoo Finance",
        updatedAt: new Date().toISOString(),
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      },
    );
  } catch (error) {
    console.error("Market ticker route error:", error);

    return NextResponse.json(
      {
        success: false,
        data: [],
        error:
          error instanceof Error
            ? error.message
            : "Unable to load market ticker.",
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
