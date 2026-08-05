import { NextResponse } from "next/server";

export const revalidate = 300;

const REQUEST_TIMEOUT_MS = 10_000;
const CACHE_SECONDS = 300;
const MINIMUM_REQUIRED_SECTORS = 8;

const sectors = [
  { name: "Technology", symbol: "XLK" },
  { name: "Communication Services", symbol: "XLC" },
  { name: "Consumer Discretionary", symbol: "XLY" },
  { name: "Financials", symbol: "XLF" },
  { name: "Healthcare", symbol: "XLV" },
  { name: "Consumer Staples", symbol: "XLP" },
  { name: "Industrials", symbol: "XLI" },
  { name: "Energy", symbol: "XLE" },
  { name: "Real Estate", symbol: "XLRE" },
  { name: "Utilities", symbol: "XLU" },
  { name: "Materials", symbol: "XLB" },
];

type YahooHost = "query1" | "query2";

type YahooChartResponse = {
  chart?: {
    result?: Array<{
      meta?: {
        regularMarketPrice?: number;
        previousClose?: number;
        chartPreviousClose?: number;
        regularMarketTime?: number;
        marketState?: string;
      };
    }>;
    error?: {
      code?: string;
      description?: string;
    } | null;
  };
};

type SectorPerformance = {
  symbol: string;
  price: number;
  previousClose: number;
  change: number;
  changePercent: number;
  marketState: string;
  regularMarketTime: number | null;
};

type SectorWithPerformance = (typeof sectors)[number] &
  SectorPerformance;

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

async function requestSectorPerformance(
  host: YahooHost,
  symbol: string,
): Promise<SectorPerformance> {
  const url =
    `https://${host}.finance.yahoo.com/v8/finance/chart/` +
    `${encodeURIComponent(symbol)}` +
    "?interval=1m&range=1d&includePrePost=false";

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
      `Yahoo ${host} returned HTTP ${response.status} for ${symbol}.`,
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

  const meta = data.chart?.result?.[0]?.meta;

  if (!meta) {
    throw new Error(
      `Yahoo ${host} returned no market data for ${symbol}.`,
    );
  }

  const currentPrice = meta.regularMarketPrice;

  /*
   * previousClose is preferred because it represents the prior
   * completed trading session. chartPreviousClose is used only
   * when previousClose is unavailable.
   */
  const previousClose =
    meta.previousClose ?? meta.chartPreviousClose;

  if (
    !isValidNumber(currentPrice) ||
    currentPrice <= 0 ||
    !isValidNumber(previousClose) ||
    previousClose <= 0
  ) {
    throw new Error(
      `Yahoo ${host} returned invalid price data for ${symbol}.`,
    );
  }

  const change = currentPrice - previousClose;
  const changePercent = (change / previousClose) * 100;

  if (
    !Number.isFinite(change) ||
    !Number.isFinite(changePercent)
  ) {
    throw new Error(
      `Unable to calculate the price change for ${symbol}.`,
    );
  }

  return {
    symbol,
    price: round(currentPrice),
    previousClose: round(previousClose),
    change: round(change),
    changePercent: round(changePercent),
    marketState: meta.marketState ?? "UNKNOWN",
    regularMarketTime: isValidNumber(meta.regularMarketTime)
      ? meta.regularMarketTime
      : null,
  };
}

async function getSectorPerformance(
  symbol: string,
): Promise<SectorPerformance> {
  try {
    return await requestSectorPerformance(
      "query1",
      symbol,
    );
  } catch (query1Error) {
    console.warn(
      `Yahoo query1 failed for ${symbol}. Trying query2.`,
      getErrorMessage(query1Error),
    );

    try {
      return await requestSectorPerformance(
        "query2",
        symbol,
      );
    } catch (query2Error) {
      const firstMessage =
        getErrorMessage(query1Error);

      const secondMessage =
        getErrorMessage(query2Error);

      throw new Error(
        `Unable to load ${symbol}. ` +
          `Query1: ${firstMessage} ` +
          `Query2: ${secondMessage}`,
      );
    }
  }
}

export async function GET() {
  try {
    const settledResults = await Promise.allSettled(
      sectors.map(async (sector) => {
        const performance =
          await getSectorPerformance(sector.symbol);

        return {
          ...sector,
          ...performance,
        };
      }),
    );

    const successfulResults: SectorWithPerformance[] =
      [];

    const failedSymbols: string[] = [];

    settledResults.forEach((result, index) => {
      const sector = sectors[index];

      if (result.status === "fulfilled") {
        successfulResults.push(result.value);
        return;
      }

      failedSymbols.push(sector.symbol);

      console.error(
        `Sector request failed for ${sector.symbol}:`,
        result.reason,
      );
    });

    if (
      successfulResults.length <
      MINIMUM_REQUIRED_SECTORS
    ) {
      throw new Error(
        `Insufficient sector data. Received ` +
          `${successfulResults.length} of ${sectors.length} sectors. ` +
          `At least ${MINIMUM_REQUIRED_SECTORS} are required.`,
      );
    }

    const sorted = [...successfulResults].sort(
      (first, second) =>
        second.changePercent - first.changePercent,
    );

    const leadingSector = sorted[0];
    const weakestSector = sorted[sorted.length - 1];

    const marketStates = Array.from(
      new Set(
        successfulResults.map(
          (sector) => sector.marketState,
        ),
      ),
    );

    const latestMarketTime =
      successfulResults.reduce<number | null>(
        (latest, sector) => {
          if (sector.regularMarketTime === null) {
            return latest;
          }

          if (
            latest === null ||
            sector.regularMarketTime > latest
          ) {
            return sector.regularMarketTime;
          }

          return latest;
        },
        null,
      );

    const partialData = failedSymbols.length > 0;

    return NextResponse.json(
      {
        success: true,
        leadingSector,
        weakestSector,
        sectors: sorted,
        dataQuality: {
          status: partialData
            ? "partial"
            : "complete",
          requestedSectors: sectors.length,
          successfulSectors:
            successfulResults.length,
          failedSectors: failedSymbols.length,
          failedSymbols,
          minimumRequiredSectors:
            MINIMUM_REQUIRED_SECTORS,
          coveragePercent: round(
            (successfulResults.length /
              sectors.length) *
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
      "Sector performance route error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        leadingSector: null,
        weakestSector: null,
        sectors: [],
        dataQuality: {
          status: "unavailable",
          requestedSectors: sectors.length,
          successfulSectors: 0,
          failedSectors: sectors.length,
          failedSymbols: sectors.map(
            (sector) => sector.symbol,
          ),
          minimumRequiredSectors:
            MINIMUM_REQUIRED_SECTORS,
          coveragePercent: 0,
        },
        error:
          error instanceof Error
            ? error.message
            : "Unable to load sector performance.",
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