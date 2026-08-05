import { NextResponse } from "next/server";

export const revalidate = 300;

const REQUEST_TIMEOUT_MS = 8_000;
const CACHE_SECONDS = 300;

const STOCK_UNIVERSE = [
  { symbol: "AAPL", company: "Apple Inc." },
  { symbol: "AMD", company: "Advanced Micro Devices, Inc." },
  { symbol: "AMZN", company: "Amazon.com, Inc." },
  { symbol: "AVGO", company: "Broadcom Inc." },
  { symbol: "BAC", company: "Bank of America Corporation" },
  { symbol: "COIN", company: "Coinbase Global, Inc." },
  { symbol: "CRM", company: "Salesforce, Inc." },
  { symbol: "GOOGL", company: "Alphabet Inc." },
  { symbol: "HOOD", company: "Robinhood Markets, Inc." },
  { symbol: "INTC", company: "Intel Corporation" },
  { symbol: "JPM", company: "JPMorgan Chase & Co." },
  { symbol: "MARA", company: "MARA Holdings, Inc." },
  { symbol: "META", company: "Meta Platforms, Inc." },
  { symbol: "MSFT", company: "Microsoft Corporation" },
  { symbol: "MU", company: "Micron Technology, Inc." },
  { symbol: "NFLX", company: "Netflix, Inc." },
  { symbol: "NU", company: "Nu Holdings Ltd." },
  { symbol: "NVDA", company: "NVIDIA Corporation" },
  { symbol: "ORCL", company: "Oracle Corporation" },
  { symbol: "PLTR", company: "Palantir Technologies Inc." },
  { symbol: "PYPL", company: "PayPal Holdings, Inc." },
  { symbol: "QCOM", company: "QUALCOMM Incorporated" },
  { symbol: "RBLX", company: "Roblox Corporation" },
  { symbol: "SHOP", company: "Shopify Inc." },
  { symbol: "SMCI", company: "Super Micro Computer, Inc." },
  { symbol: "SOFI", company: "SoFi Technologies, Inc." },
  { symbol: "TSLA", company: "Tesla, Inc." },
  {
    symbol: "TSM",
    company: "Taiwan Semiconductor Manufacturing",
  },
  { symbol: "UBER", company: "Uber Technologies, Inc." },
  { symbol: "XOM", company: "Exxon Mobil Corporation" },
];

type FinnhubQuote = {
  c?: number;
  d?: number;
  dp?: number;
  pc?: number;
  t?: number;
};

type YahooChartMeta = {
  regularMarketPrice?: number;
  chartPreviousClose?: number;
  previousClose?: number;
  regularMarketVolume?: number;
  regularMarketTime?: number;
};

type YahooQuoteIndicators = {
  volume?: Array<number | null>;
};

type YahooChartResult = {
  meta?: YahooChartMeta;
  timestamp?: Array<number | null>;
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

type MarketMover = {
  symbol: string;
  company: string;
  price: number;
  previousClose: number;
  change: number;
  changePercent: number;
  volume: number;
  timestamp: number;
  quoteSource: "Finnhub" | "Yahoo Finance";
};

type VolumeResult = {
  volume: number;
  available: boolean;
};

type YahooSnapshot = {
  price: number;
  previousClose: number;
  change: number;
  changePercent: number;
  volume: number;
  timestamp: number;
};

type MoverFetchResult = {
  mover: MarketMover;
  volumeAvailable: boolean;
  usedYahooQuoteFallback: boolean;
};

type BatchFetchResult = {
  successful: MarketMover[];
  failedSymbols: string[];
  missingVolumeSymbols: string[];
  yahooFallbackSymbols: string[];
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

function sumValidVolumes(values: Array<number | null>): number {
  let total = 0;

  for (const value of values) {
    if (isValidNumber(value) && value > 0) {
      total += value;
    }
  }

  return total;
}

function wait(milliseconds: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, milliseconds);
  });
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

function buildYahooUrl(
  host: "query1" | "query2",
  symbol: string,
) {
  return (
    `https://${host}.finance.yahoo.com/v8/finance/chart/` +
    `${encodeURIComponent(symbol)}` +
    "?interval=5m&range=1d&includePrePost=false"
  );
}

async function requestYahooChart(
  host: "query1" | "query2",
  symbol: string,
): Promise<YahooChartResult> {
  const response = await fetchWithTimeout(
    buildYahooUrl(host, symbol),
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
      `Yahoo ${host} request failed for ${symbol}: HTTP ${response.status}.`,
    );
  }

  let data: YahooChartResponse;

  try {
    data = (await response.json()) as YahooChartResponse;
  } catch {
    throw new Error(
      `Yahoo ${host} returned invalid JSON for ${symbol}.`,
    );
  }

  if (data.chart?.error) {
    throw new Error(
      data.chart.error.description ??
        `Yahoo ${host} returned an error for ${symbol}.`,
    );
  }

  const result = data.chart?.result?.[0];

  if (!result) {
    throw new Error(
      `Yahoo ${host} returned no chart data for ${symbol}.`,
    );
  }

  return result;
}

async function fetchYahooChart(
  symbol: string,
): Promise<YahooChartResult> {
  try {
    return await requestYahooChart("query1", symbol);
  } catch (query1Error) {
    console.warn(
      `Yahoo query1 request failed for ${symbol}. Trying query2.`,
      getErrorMessage(query1Error),
    );

    return requestYahooChart("query2", symbol);
  }
}

function getYahooVolume(result: YahooChartResult): number {
  const metaVolume = result.meta?.regularMarketVolume;

  if (isValidNumber(metaVolume) && metaVolume > 0) {
    return Math.round(metaVolume);
  }

  const rawVolumes =
    result.indicators?.quote?.[0]?.volume ?? [];

  return Math.round(sumValidVolumes(rawVolumes));
}

function getYahooTimestamp(result: YahooChartResult): number {
  const regularMarketTime = result.meta?.regularMarketTime;

  if (isValidNumber(regularMarketTime)) {
    return regularMarketTime;
  }

  const timestamps = result.timestamp ?? [];

  for (let index = timestamps.length - 1; index >= 0; index -= 1) {
    const timestamp = timestamps[index];

    if (isValidNumber(timestamp)) {
      return timestamp;
    }
  }

  return Math.floor(Date.now() / 1000);
}

async function fetchYahooSnapshot(
  symbol: string,
): Promise<YahooSnapshot> {
  const result = await fetchYahooChart(symbol);

  const price = result.meta?.regularMarketPrice;
  const previousClose =
    result.meta?.chartPreviousClose ??
    result.meta?.previousClose;

  if (
    !isValidNumber(price) ||
    !isValidNumber(previousClose) ||
    price <= 0 ||
    previousClose <= 0
  ) {
    throw new Error(
      `Yahoo returned incomplete quote data for ${symbol}.`,
    );
  }

  const change = price - previousClose;
  const changePercent = (change / previousClose) * 100;

  return {
    price,
    previousClose,
    change,
    changePercent,
    volume: getYahooVolume(result),
    timestamp: getYahooTimestamp(result),
  };
}

async function fetchFinnhubQuote(
  symbol: string,
  apiKey: string,
): Promise<FinnhubQuote> {
  const response = await fetchWithTimeout(
    `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(
      symbol,
    )}&token=${encodeURIComponent(apiKey)}`,
    {
      next: {
        revalidate: CACHE_SECONDS,
      },
      headers: {
        Accept: "application/json",
      },
    },
    REQUEST_TIMEOUT_MS,
  );

  if (!response.ok) {
    throw new Error(
      `Finnhub quote failed for ${symbol}: HTTP ${response.status}.`,
    );
  }

  let quote: FinnhubQuote;

  try {
    quote = (await response.json()) as FinnhubQuote;
  } catch {
    throw new Error(
      `Finnhub returned invalid JSON for ${symbol}.`,
    );
  }

  if (
    !isValidNumber(quote.c) ||
    !isValidNumber(quote.pc) ||
    !isValidNumber(quote.dp) ||
    quote.c <= 0 ||
    quote.pc <= 0
  ) {
    throw new Error(
      `Finnhub returned incomplete quote data for ${symbol}.`,
    );
  }

  return quote;
}

async function fetchYahooVolume(
  symbol: string,
): Promise<VolumeResult> {
  try {
    const result = await fetchYahooChart(symbol);
    const volume = getYahooVolume(result);

    return {
      volume,
      available: volume > 0,
    };
  } catch (error) {
    console.warn(
      `Yahoo volume unavailable for ${symbol}.`,
      getErrorMessage(error),
    );

    return {
      volume: 0,
      available: false,
    };
  }
}

async function fetchMover(
  stock: (typeof STOCK_UNIVERSE)[number],
  apiKey: string | undefined,
): Promise<MoverFetchResult> {
  if (apiKey) {
    try {
      const quote = await fetchFinnhubQuote(
        stock.symbol,
        apiKey,
      );

      const price = quote.c;
      const previousClose = quote.pc;
      const quoteChangePercent = quote.dp;

      if (
        !isValidNumber(price) ||
        !isValidNumber(previousClose) ||
        !isValidNumber(quoteChangePercent)
      ) {
        throw new Error(
          `Validated quote data became unavailable for ${stock.symbol}.`,
        );
      }

      const volumeResult = await fetchYahooVolume(
        stock.symbol,
      );

      const change = isValidNumber(quote.d)
        ? quote.d
        : price - previousClose;

      return {
        mover: {
          symbol: stock.symbol,
          company: stock.company,
          price: round(price),
          previousClose: round(previousClose),
          change: round(change),
          changePercent: round(quoteChangePercent),
          volume: volumeResult.volume,
          timestamp: isValidNumber(quote.t)
            ? quote.t
            : Math.floor(Date.now() / 1000),
          quoteSource: "Finnhub",
        },
        volumeAvailable: volumeResult.available,
        usedYahooQuoteFallback: false,
      };
    } catch (finnhubError) {
      console.warn(
        `Finnhub unavailable for ${stock.symbol}. Using Yahoo fallback.`,
        getErrorMessage(finnhubError),
      );
    }
  }

  const yahoo = await fetchYahooSnapshot(stock.symbol);

  return {
    mover: {
      symbol: stock.symbol,
      company: stock.company,
      price: round(yahoo.price),
      previousClose: round(yahoo.previousClose),
      change: round(yahoo.change),
      changePercent: round(yahoo.changePercent),
      volume: yahoo.volume,
      timestamp: yahoo.timestamp,
      quoteSource: "Yahoo Finance",
    },
    volumeAvailable: yahoo.volume > 0,
    usedYahooQuoteFallback: true,
  };
}

async function fetchInBatches(
  apiKey: string | undefined,
  batchSize = 3,
): Promise<BatchFetchResult> {
  const successful: MarketMover[] = [];
  const failedSymbols: string[] = [];
  const missingVolumeSymbols: string[] = [];
  const yahooFallbackSymbols: string[] = [];

  for (
    let startIndex = 0;
    startIndex < STOCK_UNIVERSE.length;
    startIndex += batchSize
  ) {
    const batch = STOCK_UNIVERSE.slice(
      startIndex,
      startIndex + batchSize,
    );

    const results = await Promise.allSettled(
      batch.map((stock) =>
        fetchMover(stock, apiKey),
      ),
    );

    results.forEach((result, index) => {
      const symbol = batch[index].symbol;

      if (result.status === "fulfilled") {
        successful.push(result.value.mover);

        if (!result.value.volumeAvailable) {
          missingVolumeSymbols.push(symbol);
        }

        if (result.value.usedYahooQuoteFallback) {
          yahooFallbackSymbols.push(symbol);
        }

        return;
      }

      failedSymbols.push(symbol);

      console.error(
        `Moving Now request failed for ${symbol}:`,
        getErrorMessage(result.reason),
      );
    });

    if (
      startIndex + batchSize <
      STOCK_UNIVERSE.length
    ) {
      await wait(150);
    }
  }

  return {
    successful,
    failedSymbols,
    missingVolumeSymbols,
    yahooFallbackSymbols,
  };
}

export async function GET() {
  const apiKey = process.env.FINNHUB_API_KEY;

  try {
    const {
      successful,
      failedSymbols,
      missingVolumeSymbols,
      yahooFallbackSymbols,
    } = await fetchInBatches(apiKey);

    if (successful.length === 0) {
      return NextResponse.json(
        {
          success: false,
          topGainers: [],
          topLosers: [],
          mostActive: [],
          error:
            "Market mover data is temporarily unavailable from both quote providers.",
          dataQuality: {
            status: "unavailable",
            requestedSymbols: STOCK_UNIVERSE.length,
            successfulSymbols: 0,
            failedSymbols,
            missingVolumeSymbols,
            yahooFallbackSymbols,
            quoteCoveragePercent: 0,
            volumeCoveragePercent: 0,
          },
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

    const quoteCoveragePercent =
      (successful.length / STOCK_UNIVERSE.length) * 100;

    const volumeAvailableCount =
      successful.length - missingVolumeSymbols.length;

    const volumeCoveragePercent =
      successful.length > 0
        ? (volumeAvailableCount / successful.length) * 100
        : 0;

    const eligibleMovers = successful.filter(
      (stock) =>
        stock.price >= 2 &&
        Number.isFinite(stock.changePercent),
    );

    const topGainers = [...eligibleMovers]
      .filter((stock) => stock.changePercent > 0)
      .sort(
        (first, second) =>
          second.changePercent - first.changePercent,
      )
      .slice(0, 10);

    const topLosers = [...eligibleMovers]
      .filter((stock) => stock.changePercent < 0)
      .sort(
        (first, second) =>
          first.changePercent - second.changePercent,
      )
      .slice(0, 10);

    const mostActive = [...eligibleMovers]
      .filter((stock) => stock.volume >= 100_000)
      .sort(
        (first, second) =>
          second.volume - first.volume,
      )
      .slice(0, 10);

    const partialData =
      failedSymbols.length > 0 ||
      missingVolumeSymbols.length > 0 ||
      yahooFallbackSymbols.length > 0;

    const latestTimestamp =
      successful.reduce<number | null>(
        (latest, stock) => {
          if (
            latest === null ||
            stock.timestamp > latest
          ) {
            return stock.timestamp;
          }

          return latest;
        },
        null,
      );

    return NextResponse.json(
      {
        success: true,
        topGainers,
        topLosers,
        mostActive,
        universeSize: STOCK_UNIVERSE.length,
        successfulSymbols: successful.length,
        failedSymbols,
        missingVolumeSymbols,
        yahooFallbackSymbols,
        dataQuality: {
          status: partialData ? "partial" : "complete",
          requestedSymbols: STOCK_UNIVERSE.length,
          successfulSymbols: successful.length,
          failedSymbols,
          missingVolumeSymbols,
          yahooFallbackSymbols,
          quoteCoveragePercent: round(
            quoteCoveragePercent,
          ),
          volumeCoveragePercent: round(
            volumeCoveragePercent,
          ),
        },
        latestTimestamp,
        updatedAt: new Date().toISOString(),
        sources: {
          quotes:
            yahooFallbackSymbols.length > 0
              ? "Finnhub with Yahoo Finance fallback"
              : "Finnhub",
          volume: "Yahoo Finance",
        },
        delayed: true,
        partialData,
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
      "Moving Now route error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        topGainers: [],
        topLosers: [],
        mostActive: [],
        error:
          error instanceof Error
            ? error.message
            : "Unable to load market movers.",
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