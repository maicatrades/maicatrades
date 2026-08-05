import { NextResponse } from "next/server";

export const revalidate = 300;

const REQUEST_TIMEOUT_MS = 10_000;
const CACHE_SECONDS = 300;
const MINIMUM_REQUIRED_TICKERS = 4;

const TICKER_SYMBOLS = [
  { symbol: "SPY", yahooSymbol: "SPY" },
  { symbol: "QQQ", yahooSymbol: "QQQ" },
  { symbol: "DIA", yahooSymbol: "DIA" },
  { symbol: "IWM", yahooSymbol: "IWM" },
  { symbol: "VIX", yahooSymbol: "^VIX" },
];

type YahooHost = "query1" | "query2";

type YahooChartMeta = {
  regularMarketPrice?: number;
  regularMarketTime?: number;
  currency?: string;
  marketState?: string;
};

type YahooQuoteIndicators = {
  close?: Array<number | null>;
};

type YahooChartResult = {
  meta?: YahooChartMeta;
  timestamp?: number[];
  indicators?: {
    quote?: YahooQuoteIndicators[];
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

type MarketTickerItem = {
  symbol: string;
  apiSymbol: string;
  price: number;
  previousClose: number;
  change: number;
  changePercent: number;
  currency: string;
  marketState: string;
  regularMarketTime: number | null;
};

type FetchOptions = Parameters<typeof fetch>[1];

function isValidNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function round(value: number, decimals = 2) {
  const multiplier = 10 ** decimals;

  return Math.round(value * multiplier) / multiplier;
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

async function requestTickerData(
  host: YahooHost,
  ticker: (typeof TICKER_SYMBOLS)[number],
): Promise<MarketTickerItem> {
  const url =
    `https://${host}.finance.yahoo.com/v8/finance/chart/` +
    `${encodeURIComponent(ticker.yahooSymbol)}` +
    "?interval=1d&range=10d&includePrePost=false";

  const response = await fetchWithTimeout(
    url,
    {
      next: {
        revalidate: CACHE_SECONDS,
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
      `Yahoo ${host} returned HTTP ${response.status} for ${ticker.symbol}.`,
    );
  }

  let data: YahooChartResponse;

  try {
    data = (await response.json()) as YahooChartResponse;
  } catch {
    throw new Error(
      `Yahoo ${host} returned invalid JSON for ${ticker.symbol}.`,
    );
  }

  if (data.chart?.error) {
    throw new Error(
      data.chart.error.description ??
        `Yahoo ${host} returned an error for ${ticker.symbol}.`,
    );
  }

  const result = data.chart?.result?.[0];

  if (!result) {
    throw new Error(
      `Yahoo ${host} returned no market data for ${ticker.symbol}.`,
    );
  }

  const meta = result.meta;
  const regularMarketPrice = meta?.regularMarketPrice;

  const rawCloses =
    result.indicators?.quote?.[0]?.close ?? [];

  const validCloses = rawCloses.filter(isValidNumber);

  if (validCloses.length < 2) {
    throw new Error(
      `Yahoo returned insufficient closing-price history for ${ticker.symbol}.`,
    );
  }

  /*
   * Yahoo's newest daily candle may represent the current
   * trading session.
   *
   * When it matches regularMarketPrice, the second-to-last
   * daily close is the true previous session close.
   *
   * Otherwise, the final daily close is used as the previous
   * completed session.
   */
  const latestDailyClose =
    validCloses[validCloses.length - 1];

  const secondLatestDailyClose =
    validCloses[validCloses.length - 2];

  const price = isValidNumber(regularMarketPrice)
    ? regularMarketPrice
    : latestDailyClose;

  if (!isValidNumber(price) || price <= 0) {
    throw new Error(
      `Yahoo returned an invalid current price for ${ticker.symbol}.`,
    );
  }

  let previousClose: number;

  if (Math.abs(price - latestDailyClose) < 0.01) {
    previousClose = secondLatestDailyClose;
  } else {
    previousClose = latestDailyClose;
  }

  if (
    !isValidNumber(previousClose) ||
    previousClose <= 0
  ) {
    throw new Error(
      `Yahoo returned an invalid previous close for ${ticker.symbol}.`,
    );
  }

  const change = price - previousClose;
  const changePercent =
    (change / previousClose) * 100;

  if (
    !Number.isFinite(change) ||
    !Number.isFinite(changePercent)
  ) {
    throw new Error(
      `Unable to calculate price movement for ${ticker.symbol}.`,
    );
  }

  return {
    symbol: ticker.symbol,
    apiSymbol: ticker.yahooSymbol,
    price: round(price),
    previousClose: round(previousClose),
    change: round(change),
    changePercent: round(changePercent),
    currency: meta?.currency ?? "USD",
    marketState: meta?.marketState ?? "UNKNOWN",
    regularMarketTime: isValidNumber(
      meta?.regularMarketTime,
    )
      ? meta.regularMarketTime
      : null,
  };
}

async function getTickerData(
  ticker: (typeof TICKER_SYMBOLS)[number],
): Promise<MarketTickerItem> {
  try {
    return await requestTickerData(
      "query1",
      ticker,
    );
  } catch (query1Error) {
    console.warn(
      `Yahoo query1 failed for ${ticker.symbol}. Trying query2.`,
      getErrorMessage(query1Error),
    );

    try {
      return await requestTickerData(
        "query2",
        ticker,
      );
    } catch (query2Error) {
      const firstMessage =
        getErrorMessage(query1Error);

      const secondMessage =
        getErrorMessage(query2Error);

      throw new Error(
        `${ticker.symbol} failed on both Yahoo hosts. ` +
          `Query1: ${firstMessage} ` +
          `Query2: ${secondMessage}`,
      );
    }
  }
}

export async function GET() {
  try {
    const settledResults = await Promise.allSettled(
      TICKER_SYMBOLS.map((ticker) =>
        getTickerData(ticker),
      ),
    );

    const tickerData: MarketTickerItem[] = [];
    const failedSymbols: string[] = [];

    settledResults.forEach((result, index) => {
      const ticker = TICKER_SYMBOLS[index];

      if (result.status === "fulfilled") {
        tickerData.push(result.value);
        return;
      }

      failedSymbols.push(ticker.symbol);

      console.error(
        `Market ticker request failed for ${ticker.symbol}:`,
        result.reason,
      );
    });

    if (
      tickerData.length <
      MINIMUM_REQUIRED_TICKERS
    ) {
      return NextResponse.json(
        {
          success: false,
          data: [],
          error:
            `Insufficient ticker data. Received ` +
            `${tickerData.length} of ${TICKER_SYMBOLS.length} symbols. ` +
            `At least ${MINIMUM_REQUIRED_TICKERS} are required.`,
          dataQuality: {
            status: "unavailable",
            requestedSymbols:
              TICKER_SYMBOLS.length,
            successfulSymbols:
              tickerData.length,
            failedSymbols,
            minimumRequiredSymbols:
              MINIMUM_REQUIRED_TICKERS,
            coveragePercent: round(
              (tickerData.length /
                TICKER_SYMBOLS.length) *
                100,
            ),
          },
          updatedAt: new Date().toISOString(),
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

    /*
     * Restore the original display order even though individual
     * requests may finish in a different order.
     */
    const orderedTickerData =
      TICKER_SYMBOLS.map((ticker) =>
        tickerData.find(
          (item) =>
            item.symbol === ticker.symbol,
        ),
      ).filter(
        (item): item is MarketTickerItem =>
          Boolean(item),
      );

    const latestMarketTime =
      orderedTickerData.reduce<number | null>(
        (latest, ticker) => {
          if (
            ticker.regularMarketTime === null
          ) {
            return latest;
          }

          if (
            latest === null ||
            ticker.regularMarketTime > latest
          ) {
            return ticker.regularMarketTime;
          }

          return latest;
        },
        null,
      );

    const marketStates = Array.from(
      new Set(
        orderedTickerData.map(
          (ticker) => ticker.marketState,
        ),
      ),
    );

    const partialData =
      failedSymbols.length > 0;

    return NextResponse.json(
      {
        success: true,
        data: orderedTickerData,
        dataQuality: {
          status: partialData
            ? "partial"
            : "complete",
          requestedSymbols:
            TICKER_SYMBOLS.length,
          successfulSymbols:
            orderedTickerData.length,
          failedSymbols,
          minimumRequiredSymbols:
            MINIMUM_REQUIRED_TICKERS,
          coveragePercent: round(
            (orderedTickerData.length /
              TICKER_SYMBOLS.length) *
              100,
          ),
        },
        marketStates,
        latestMarketTime,
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
    console.error(
      "Market ticker route error:",
      error,
    );

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
          "Cache-Control":
            "no-store, max-age=0",
        },
      },
    );
  }
}