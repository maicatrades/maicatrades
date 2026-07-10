"use client";

import { useEffect, useRef, useState } from "react";

type Quote = {
  c: number;
  d: number;
  dp: number;
  h: number;
  l: number;
  o: number;
  pc: number;
};

type Profile = {
  name?: string;
  ticker?: string;
  exchange?: string;
  finnhubIndustry?: string;
  marketCapitalization?: number;
  logo?: string;
  weburl?: string;
};

type Metrics = {
  metric?: {
    "52WeekHigh"?: number;
    "52WeekLow"?: number;
    "10DayAverageTradingVolume"?: number;
    peNormalizedAnnual?: number;
    dividendYieldIndicatedAnnual?: number;
    beta?: number;
  };
};

type NewsItem = {
  id: number;
  headline: string;
  source: string;
  url: string;
  datetime: number;
};

export default function MarketDataPage() {
  const [symbol, setSymbol] = useState("AAPL");
  const [searchedSymbol, setSearchedSymbol] = useState("");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState("");
  const [error, setError] = useState("");

  const activeSymbolRef = useRef("");

  async function fetchQuote(ticker: string, showLoading = false) {
    const cleanSymbol = ticker.trim().toUpperCase();
    if (!cleanSymbol) return;

    if (showLoading) {
      setLoading(true);
      setError("");
    }

    try {
      const apiKey = process.env.NEXT_PUBLIC_FINNHUB_API_KEY;

      const quoteRes = await fetch(
        `https://finnhub.io/api/v1/quote?symbol=${cleanSymbol}&token=${apiKey}`,
        { cache: "no-store" }
      );

      const quoteData = await quoteRes.json();

      if (!quoteData || quoteData.c === 0) {
        setError("No quote found. Check the ticker symbol.");
        setQuote(null);
        return;
      }

      setQuote(quoteData);
      setSearchedSymbol(cleanSymbol);
      activeSymbolRef.current = cleanSymbol;
      setLastUpdated(new Date().toLocaleTimeString());

      if (showLoading) {
        await fetchCompanyData(cleanSymbol);
      }
    } catch {
      setError("Could not fetch market data. Try again.");
    } finally {
      if (showLoading) setLoading(false);
    }
  }

  async function fetchCompanyData(ticker: string) {
    const apiKey = process.env.NEXT_PUBLIC_FINNHUB_API_KEY;
    const today = new Date();
    const from = new Date();
    from.setDate(today.getDate() - 7);

    const fromDate = from.toISOString().split("T")[0];
    const toDate = today.toISOString().split("T")[0];

    const [profileRes, metricRes, newsRes] = await Promise.all([
      fetch(
        `https://finnhub.io/api/v1/stock/profile2?symbol=${ticker}&token=${apiKey}`
      ),
      fetch(
        `https://finnhub.io/api/v1/stock/metric?symbol=${ticker}&metric=all&token=${apiKey}`
      ),
      fetch(
        `https://finnhub.io/api/v1/company-news?symbol=${ticker}&from=${fromDate}&to=${toDate}&token=${apiKey}`
      ),
    ]);

    const profileData = await profileRes.json();
    const metricData = await metricRes.json();
    const newsData = await newsRes.json();

    setProfile(profileData);
    setMetrics(metricData);
    setNews(Array.isArray(newsData) ? newsData.slice(0, 5) : []);
  }

  function handleSearch() {
    fetchQuote(symbol, true);
  }

  function toggleWatchlist() {
    if (!searchedSymbol) return;

    const exists = watchlist.includes(searchedSymbol);
    const updated = exists
      ? watchlist.filter((item) => item !== searchedSymbol)
      : [...watchlist, searchedSymbol];

    setWatchlist(updated);
    localStorage.setItem("maicatrades-watchlist", JSON.stringify(updated));
  }

  useEffect(() => {
    const saved = localStorage.getItem("maicatrades-watchlist");
    if (saved) setWatchlist(JSON.parse(saved));
  }, []);

  useEffect(() => {
    if (!searchedSymbol) return;

    const timer = setInterval(() => {
      fetchQuote(activeSymbolRef.current || searchedSymbol, false);
    }, 5000);

    return () => clearInterval(timer);
  }, [searchedSymbol]);

  const isInWatchlist = searchedSymbol && watchlist.includes(searchedSymbol);
  const marketOpen = isMarketOpen();

  return (
    <main className="min-h-screen bg-black px-6 py-10 text-white">
      <div className="mx-auto max-w-7xl">
        <a href="/" className="text-emerald-400 hover:text-emerald-300">
          ← Back to MaicaTrades
        </a>

        <section className="mt-8 rounded-3xl border border-zinc-800 bg-zinc-950/80 p-8">
          <p className="mb-4 inline-flex rounded-full border border-emerald-500/30 px-4 py-2 text-sm text-emerald-400">
            Live Market Data
          </p>

          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            Stock Quote Dashboard
          </h1>

          <p className="mt-5 max-w-2xl text-lg leading-8 text-zinc-400">
            Search a ticker to view live quote data, company details, valuation
            metrics, recent news, and a simple local watchlist.
          </p>
        </section>

        <section className="mt-6 rounded-3xl border border-zinc-800 bg-zinc-950 p-6">
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <input
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearch();
              }}
              className="rounded-xl border border-zinc-700 bg-black px-4 py-4 text-white outline-none focus:border-emerald-400"
              placeholder="Enter ticker, ex: AAPL"
            />

            <button
              onClick={handleSearch}
              disabled={loading}
              className="rounded-xl bg-emerald-500 px-8 py-4 font-bold text-black hover:bg-emerald-400 disabled:opacity-60"
            >
              {loading ? "Loading..." : "Search"}
            </button>
          </div>

          {error && (
            <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">
              {error}
            </div>
          )}
        </section>

        {quote && (
          <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <section className="rounded-3xl border border-emerald-500/30 bg-zinc-950 p-6">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-center gap-4">
                  {profile?.logo && (
                    <img
                      src={profile.logo}
                      alt={profile?.name || searchedSymbol}
                      className="h-14 w-14 rounded-xl bg-white object-contain p-2"
                    />
                  )}

                  <div>
                    <p className="text-sm text-zinc-500">Ticker</p>
                    <h2 className="text-4xl font-bold">{searchedSymbol}</h2>
                    <p className="mt-1 text-zinc-400">
                      {profile?.name || "Company profile loading..."}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-2 sm:items-end">
                  <span
                    className={`rounded-full px-4 py-2 text-sm font-bold ${
                      marketOpen
                        ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                        : "border border-zinc-700 bg-zinc-900 text-zinc-400"
                    }`}
                  >
                    {marketOpen ? "Market Open" : "Market Closed"}
                  </span>

                  <span className="text-sm text-zinc-500">
                    Last updated: {lastUpdated}
                  </span>
                </div>
              </div>

              <div className="mt-8">
                <p className="text-sm text-zinc-500">Current Price</p>

                <p className="mt-2 text-6xl font-bold text-emerald-400">
                  {money(quote.c)}
                </p>

                <p
                  className={`mt-3 text-xl font-bold ${
                    quote.d >= 0 ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {quote.d >= 0 ? "+" : ""}
                  {money(quote.d)} ({quote.dp?.toFixed(2)}%)
                </p>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <MarketCard label="Open" value={money(quote.o)} />
                <MarketCard label="High" value={money(quote.h)} />
                <MarketCard label="Low" value={money(quote.l)} />
                <MarketCard label="Previous Close" value={money(quote.pc)} />
              </div>

              <button
                onClick={toggleWatchlist}
                className="mt-6 w-full rounded-xl border border-zinc-700 py-3 font-bold text-zinc-300 hover:border-emerald-400"
              >
                {isInWatchlist ? "★ Remove from Watchlist" : "☆ Add to Watchlist"}
              </button>
            </section>

            <section className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6">
              <h3 className="text-2xl font-semibold">Company Snapshot</h3>

              <div className="mt-6 grid gap-4">
                <InfoRow label="Exchange" value={profile?.exchange || "—"} />
                <InfoRow
                  label="Industry"
                  value={profile?.finnhubIndustry || "—"}
                />
                <InfoRow
                  label="Market Cap"
                  value={
                    profile?.marketCapitalization
                      ? `$${profile.marketCapitalization.toLocaleString()}M`
                      : "—"
                  }
                />
                <InfoRow
                  label="P/E Ratio"
                  value={formatNumber(metrics?.metric?.peNormalizedAnnual)}
                />
                <InfoRow
                  label="Dividend Yield"
                  value={
                    metrics?.metric?.dividendYieldIndicatedAnnual
                      ? `${metrics.metric.dividendYieldIndicatedAnnual.toFixed(2)}%`
                      : "—"
                  }
                />
                <InfoRow
                  label="Beta"
                  value={formatNumber(metrics?.metric?.beta)}
                />
                <InfoRow
                  label="52 Week High"
                  value={moneyOrDash(metrics?.metric?.["52WeekHigh"])}
                />
                <InfoRow
                  label="52 Week Low"
                  value={moneyOrDash(metrics?.metric?.["52WeekLow"])}
                />
                <InfoRow
                  label="Avg Volume"
                  value={formatNumber(
                    metrics?.metric?.["10DayAverageTradingVolume"]
                  )}
                />
              </div>
            </section>
          </div>
        )}

        {quote && (
          <div className="mt-6 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
            <section className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6">
              <h3 className="text-2xl font-semibold">Watchlist</h3>

              {watchlist.length === 0 ? (
                <p className="mt-4 text-sm text-zinc-500">
                  No symbols added yet. Add a stock to start building your
                  watchlist.
                </p>
              ) : (
                <div className="mt-4 flex flex-wrap gap-2">
                  {watchlist.map((item) => (
                    <button
                      key={item}
                      onClick={() => {
                        setSymbol(item);
                        fetchQuote(item, true);
                      }}
                      className="rounded-full border border-zinc-700 px-4 py-2 text-sm font-bold text-zinc-300 hover:border-emerald-400"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6">
              <h3 className="text-2xl font-semibold">Latest News</h3>

              {news.length === 0 ? (
                <p className="mt-4 text-sm text-zinc-500">
                  No recent news found.
                </p>
              ) : (
                <div className="mt-6 space-y-4">
                  {news.map((item) => (
                    <a
                      key={item.id}
                      href={item.url}
                      target="_blank"
                      className="block rounded-2xl border border-zinc-800 bg-black p-4 hover:border-emerald-400"
                    >
                      <p className="text-sm text-zinc-500">
                        {item.source} • {formatDate(item.datetime)}
                      </p>
                      <p className="mt-2 font-semibold text-white">
                        {item.headline}
                      </p>
                    </a>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </main>
  );
}

function MarketCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-black p-4">
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="mt-1 text-xl font-bold text-white">{value}</p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-t border-zinc-800 py-3">
      <span className="text-sm text-zinc-500">{label}</span>
      <span className="text-right font-bold text-white">{value}</span>
    </div>
  );
}

function money(value: number) {
  return `$${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function moneyOrDash(value?: number) {
  if (!value) return "—";
  return money(value);
}

function formatNumber(value?: number) {
  if (!value) return "—";
  return value.toLocaleString(undefined, {
    maximumFractionDigits: 2,
  });
}

function formatDate(timestamp: number) {
  return new Date(timestamp * 1000).toLocaleDateString();
}

function isMarketOpen() {
  const now = new Date();

  const easternTime = new Date(
    now.toLocaleString("en-US", { timeZone: "America/New_York" })
  );

  const day = easternTime.getDay();
  const hour = easternTime.getHours();
  const minute = easternTime.getMinutes();

  const minutes = hour * 60 + minute;

  const marketOpen = 9 * 60 + 30;
  const marketClose = 16 * 60;

  return day >= 1 && day <= 5 && minutes >= marketOpen && minutes < marketClose;
}