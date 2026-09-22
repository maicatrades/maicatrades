import { NextRequest, NextResponse } from "next/server";

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;

type SearchResult = {
  description?: string;
  displaySymbol?: string;
  symbol?: string;
  type?: string;
};

type SearchResponse = {
  count?: number;
  result?: SearchResult[];
};

type YahooSearchResponse = {
  quotes?: Array<{
    symbol?: string;
    quoteType?: string;
    exchange?: string;
    shortname?: string;
    longname?: string;
  }>;
};

type YahooChartResponse = {
  chart?: {
    result?: Array<{
      meta?: {
        regularMarketPrice?: number;
        chartPreviousClose?: number;
        previousClose?: number;
        regularMarketDayHigh?: number;
        regularMarketDayLow?: number;
        regularMarketOpen?: number;
      };
      indicators?: {
        quote?: Array<{
          open?: Array<number | null>;
          high?: Array<number | null>;
          low?: Array<number | null>;
          close?: Array<number | null>;
        }>;
      };
    }>;
    error?: { description?: string } | null;
  };
};

type QuoteData = {
  c: number;
  d: number;
  dp: number;
  h: number;
  l: number;
  o: number;
  pc: number;
};

function looksLikeTicker(value: string) {
  return /^[A-Z]{1,6}([.-][A-Z0-9]{1,4})?$/.test(value);
}

function normalizeSearchText(value: string) {
  return value
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, " ")
    .trim();
}

function rankNameMatch(
  query: string,
  symbol: string | undefined,
  names: Array<string | undefined>,
) {
  if (!symbol) return -1;

  const normalizedQuery = normalizeSearchText(query);
  const normalizedSymbol = normalizeSearchText(symbol);
  const normalizedNames = names
    .filter((name): name is string => Boolean(name))
    .map(normalizeSearchText);

  if (normalizedSymbol === normalizedQuery) return 100;
  if (normalizedNames.some((name) => name === normalizedQuery)) return 90;
  if (normalizedNames.some((name) => name.startsWith(normalizedQuery))) return 80;
  if (normalizedNames.some((name) => name.includes(normalizedQuery))) return 70;
  if (normalizedSymbol.startsWith(normalizedQuery)) return 60;

  return 0;
}

async function resolveSymbol(query: string) {
  const cleanQuery = query.trim();
  const upperQuery = cleanQuery.toUpperCase();

  if (FINNHUB_API_KEY) {
    try {
      const searchRes = await fetch(
        `https://finnhub.io/api/v1/search?q=${encodeURIComponent(
          cleanQuery,
        )}&exchange=US&token=${FINNHUB_API_KEY}`,
        { next: { revalidate: 3600 } },
      );

      if (searchRes.ok) {
        const searchData = (await searchRes.json()) as SearchResponse;
        const results = Array.isArray(searchData.result)
          ? searchData.result
          : [];
        const commonStocks = results.filter(
          (item) => item.symbol && item.type?.toLowerCase().includes("stock"),
        );
        const candidates = commonStocks.length > 0 ? commonStocks : results;
        const match = [...candidates].sort(
          (a, b) =>
            rankNameMatch(
              cleanQuery,
              b.symbol ?? b.displaySymbol,
              [b.description],
            ) -
            rankNameMatch(
              cleanQuery,
              a.symbol ?? a.displaySymbol,
              [a.description],
            ),
        )[0];

        if (match?.symbol) return match.symbol;
      }
    } catch (error) {
      console.warn("Finnhub company search unavailable; trying Yahoo.", error);
    }
  }

  const yahooSearchRes = await fetch(
    `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(
      cleanQuery,
    )}&quotesCount=10&newsCount=0`,
    {
      next: { revalidate: 3600 },
      headers: {
        Accept: "application/json",
        "User-Agent": "Mozilla/5.0 Chrome/120 Safari/537.36",
      },
    },
  );

  if (!yahooSearchRes.ok) {
    return looksLikeTicker(upperQuery) ? upperQuery : null;
  }

  const yahooSearch = (await yahooSearchRes.json()) as YahooSearchResponse;
  const yahooMatch = (yahooSearch.quotes ?? [])
    .filter(
      (item) =>
        item.symbol &&
        (item.quoteType === "EQUITY" || item.quoteType === "ETF"),
    )
    .sort(
      (a, b) =>
        rankNameMatch(cleanQuery, b.symbol, [b.longname, b.shortname]) -
        rankNameMatch(cleanQuery, a.symbol, [a.longname, a.shortname]),
    )[0];

  return yahooMatch?.symbol ?? (looksLikeTicker(upperQuery) ? upperQuery : null);
}

function validQuote(value: unknown): value is QuoteData {
  if (!value || typeof value !== "object") return false;
  const quote = value as Partial<QuoteData>;
  return typeof quote.c === "number" && Number.isFinite(quote.c) && quote.c > 0;
}

function lastValid(values: Array<number | null> | undefined) {
  if (!values) return null;
  for (let index = values.length - 1; index >= 0; index -= 1) {
    const value = values[index];
    if (typeof value === "number" && Number.isFinite(value)) return value;
  }
  return null;
}

async function fetchYahooQuote(symbol: string): Promise<QuoteData | null> {
  for (const host of ["query1", "query2"] as const) {
    try {
      const response = await fetch(
        `https://${host}.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
          symbol,
        )}?interval=1m&range=1d&includePrePost=false`,
        {
          next: { revalidate: 60 },
          headers: {
            Accept: "application/json",
            "User-Agent": "Mozilla/5.0 Chrome/120 Safari/537.36",
          },
        },
      );

      if (!response.ok) continue;
      const data = (await response.json()) as YahooChartResponse;
      const result = data.chart?.result?.[0];
      const meta = result?.meta;
      const prices = result?.indicators?.quote?.[0];
      const current = meta?.regularMarketPrice ?? lastValid(prices?.close);
      const previousClose = meta?.chartPreviousClose ?? meta?.previousClose;

      if (
        typeof current !== "number" ||
        !Number.isFinite(current) ||
        current <= 0 ||
        typeof previousClose !== "number" ||
        !Number.isFinite(previousClose) ||
        previousClose <= 0
      ) {
        continue;
      }

      const change = current - previousClose;
      return {
        c: current,
        d: change,
        dp: (change / previousClose) * 100,
        h: meta?.regularMarketDayHigh ?? lastValid(prices?.high) ?? current,
        l: meta?.regularMarketDayLow ?? lastValid(prices?.low) ?? current,
        o: meta?.regularMarketOpen ?? lastValid(prices?.open) ?? current,
        pc: previousClose,
      };
    } catch (error) {
      console.warn(`Yahoo ${host} quote unavailable for ${symbol}.`, error);
    }
  }

  return null;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("symbol")?.trim() ?? "";

  if (!query) {
    return NextResponse.json(
      { error: "Enter a ticker or company name." },
      { status: 400 },
    );
  }

  try {
    const resolvedSymbol = await resolveSymbol(query);

    if (!resolvedSymbol) {
      return NextResponse.json(
        {
          error:
            "No matching U.S. stock was found. Try a ticker or company name.",
        },
        { status: 404 },
      );
    }

    const today = new Date();
    const from = new Date();
    from.setDate(today.getDate() - 7);
    const fromDate = from.toISOString().split("T")[0];
    const toDate = today.toISOString().split("T")[0];

    const finnhubResponses = FINNHUB_API_KEY
      ? await Promise.all([
          fetch(
            `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(
              resolvedSymbol,
            )}&token=${FINNHUB_API_KEY}`,
            { cache: "no-store" },
          ),
          fetch(
            `https://finnhub.io/api/v1/stock/profile2?symbol=${encodeURIComponent(
              resolvedSymbol,
            )}&token=${FINNHUB_API_KEY}`,
            { next: { revalidate: 86400 } },
          ),
          fetch(
            `https://finnhub.io/api/v1/stock/metric?symbol=${encodeURIComponent(
              resolvedSymbol,
            )}&metric=all&token=${FINNHUB_API_KEY}`,
            { next: { revalidate: 3600 } },
          ),
          fetch(
            `https://finnhub.io/api/v1/company-news?symbol=${encodeURIComponent(
              resolvedSymbol,
            )}&from=${fromDate}&to=${toDate}&token=${FINNHUB_API_KEY}`,
            { next: { revalidate: 900 } },
          ),
        ])
      : [null, null, null, null];

    const [quoteRes, profileRes, metricsRes, newsRes] = finnhubResponses;
    const finnhubQuote = quoteRes?.ok ? await quoteRes.json() : null;
    const quote = validQuote(finnhubQuote)
      ? finnhubQuote
      : await fetchYahooQuote(resolvedSymbol);

    if (!quote) {
      return NextResponse.json(
        { error: "Quote data is temporarily unavailable. Please try again shortly." },
        { status: 502 },
      );
    }

    const profile = profileRes?.ok ? await profileRes.json() : {};
    const metrics = metricsRes?.ok ? await metricsRes.json() : {};
    const newsData = newsRes?.ok ? await newsRes.json() : [];
    const news = Array.isArray(newsData) ? newsData.slice(0, 5) : [];

    return NextResponse.json({
      success: true,
      symbol: resolvedSymbol,
      query,
      quote,
      profile,
      metrics,
      news,
      quoteSource: validQuote(finnhubQuote) ? "Finnhub" : "Yahoo fallback",
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Market data route error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Internal server error.",
      },
      { status: 500 },
    );
  }
}
