"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDownRight,
  ArrowLeft,
  ArrowUpRight,
  BarChart3,
  Clock3,
  Eye,
  ListChecks,
  Plus,
  RefreshCw,
  Star,
} from "lucide-react";

type Status = "Bullish" | "Neutral" | "Watch" | "Weak";

type WatchlistStock = {
  symbol: string;
  company: string;
  price: number;
  change: number;
  status: Status;
  note: string;
};

type WatchlistResponse = {
  updated?: string;
  watchlist?: WatchlistStock[];
  error?: string;
};

function getStatusClasses(status: Status) {
  if (status === "Bullish") {
    return "border-emerald-500/20 bg-emerald-500/10 text-emerald-400";
  }

  if (status === "Neutral") {
    return "border-amber-500/20 bg-amber-500/10 text-amber-400";
  }

  if (status === "Watch") {
    return "border-blue-500/20 bg-blue-500/10 text-blue-400";
  }

  return "border-red-500/20 bg-red-500/10 text-red-400";
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
}

function formatUpdatedAt(value?: string) {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function WatchlistSkeleton() {
  return (
    <div className="space-y-3 p-5">
      {Array.from({ length: 7 }).map((_, index) => (
        <div
          key={index}
          className="grid animate-pulse grid-cols-[90px_1fr_100px_100px] gap-4"
        >
          <div className="h-5 rounded bg-slate-800" />
          <div className="h-5 rounded bg-slate-800" />
          <div className="h-5 rounded bg-slate-800" />
          <div className="h-5 rounded bg-slate-800" />
        </div>
      ))}
    </div>
  );
}

export default function WatchlistPage() {
  const [watchlist, setWatchlist] = useState<WatchlistStock[]>([]);
  const [updatedAt, setUpdatedAt] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadWatchlist = useCallback(async (backgroundRefresh = false) => {
    try {
      if (backgroundRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError(null);

      const response = await fetch("/api/watchlist", {
        cache: "no-store",
      });

      const result = (await response.json()) as WatchlistResponse;

      if (!response.ok || !Array.isArray(result.watchlist)) {
        throw new Error(result.error || "Unable to load the watchlist.");
      }

      setWatchlist(result.watchlist);
      setUpdatedAt(result.updated);
    } catch (requestError) {
      console.error("Watchlist page error:", requestError);

      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load the watchlist.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadWatchlist();
  }, [loadWatchlist]);

  const bullishCount = useMemo(
    () => watchlist.filter((stock) => stock.status === "Bullish").length,
    [watchlist],
  );

  const needsAttentionCount = useMemo(
    () =>
      watchlist.filter(
        (stock) =>
          stock.status === "Neutral" ||
          stock.status === "Watch" ||
          stock.status === "Weak",
      ).length,
    [watchlist],
  );

  const averageChange = useMemo(() => {
    if (watchlist.length === 0) {
      return 0;
    }

    const total = watchlist.reduce((sum, stock) => sum + stock.change, 0);

    return total / watchlist.length;
  }, [watchlist]);

  return (
    <main className="min-h-screen bg-[#050b11] text-white">
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-6 lg:px-8">
        <Link
          href="/dashboard"
          className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-slate-400 transition hover:text-blue-400"
        >
          <ArrowLeft size={17} />
          Back to Dashboard
        </Link>

        <section className="mb-8 overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-[#0b1722] to-[#071019] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.25)] sm:p-8">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-400">
                <ListChecks size={14} />
                Stock Tracking
              </div>

              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                My Watchlist
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
                Track the stocks currently on the MaicaTrades radar, review
                their market status, and keep important trading notes in one
                place.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => void loadWatchlist(true)}
                disabled={refreshing}
                className="inline-flex items-center gap-2 rounded-lg border border-blue-500/30 bg-blue-500/10 px-4 py-2.5 text-sm font-semibold text-blue-400 transition hover:border-blue-500/60 hover:bg-blue-500/15 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCw
                  size={17}
                  className={refreshing ? "animate-spin" : ""}
                />

                {refreshing ? "Refreshing" : "Refresh Data"}
              </button>

              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-400"
              >
                <Plus size={17} />
                Add Symbol
              </button>
            </div>
          </div>
        </section>

        <section className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-800 bg-[#09131d] p-5">
            <div className="flex items-center gap-2 text-blue-400">
              <Star size={17} />

              <p className="text-xs font-semibold uppercase tracking-wide">
                Total Symbols
              </p>
            </div>

            <p className="mt-3 text-3xl font-bold">{watchlist.length}</p>

            <p className="mt-1 text-sm text-slate-400">
              Stocks currently being monitored
            </p>
          </div>

          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5">
            <div className="flex items-center gap-2 text-emerald-400">
              <ArrowUpRight size={17} />

              <p className="text-xs font-semibold uppercase tracking-wide">
                Bullish Setups
              </p>
            </div>

            <p className="mt-3 text-3xl font-bold">{bullishCount}</p>

            <p className="mt-1 text-sm text-slate-400">
              Stocks showing constructive conditions
            </p>
          </div>

          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5">
            <div className="flex items-center gap-2 text-amber-400">
              <Eye size={17} />

              <p className="text-xs font-semibold uppercase tracking-wide">
                Needs Attention
              </p>
            </div>

            <p className="mt-3 text-3xl font-bold">{needsAttentionCount}</p>

            <p className="mt-1 text-sm text-slate-400">
              Stocks waiting for confirmation
            </p>
          </div>

          <div
            className={`rounded-xl border p-5 ${
              averageChange >= 0
                ? "border-emerald-500/20 bg-emerald-500/5"
                : "border-red-500/20 bg-red-500/5"
            }`}
          >
            <div
              className={`flex items-center gap-2 ${
                averageChange >= 0 ? "text-emerald-400" : "text-red-400"
              }`}
            >
              {averageChange >= 0 ? (
                <ArrowUpRight size={17} />
              ) : (
                <ArrowDownRight size={17} />
              )}

              <p className="text-xs font-semibold uppercase tracking-wide">
                Average Change
              </p>
            </div>

            <p className="mt-3 text-3xl font-bold">
              {averageChange >= 0 ? "+" : ""}
              {averageChange.toFixed(2)}%
            </p>

            <p className="mt-1 text-sm text-slate-400">
              Average daily watchlist performance
            </p>
          </div>
        </section>

        {error && (
          <section className="mb-6 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-4">
            <p className="text-sm font-semibold text-red-400">
              Watchlist data could not be loaded.
            </p>

            <p className="mt-1 text-xs text-slate-400">{error}</p>

            <button
              type="button"
              onClick={() => void loadWatchlist()}
              className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-blue-400"
            >
              <RefreshCw size={14} />
              Try again
            </button>
          </section>
        )}

        <section className="overflow-hidden rounded-2xl border border-slate-800 bg-[#09131d]">
          <div className="flex flex-col justify-between gap-4 border-b border-slate-800 px-5 py-4 sm:flex-row sm:items-center">
            <div>
              <div className="flex items-center gap-2">
                <BarChart3 size={18} className="text-blue-400" />

                <h2 className="text-lg font-semibold">Watchlist Overview</h2>
              </div>

              <p className="mt-1 text-sm text-slate-400">
                Current price, daily movement, status, and trading notes.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Clock3 size={15} className="text-blue-400" />
              Updated {formatUpdatedAt(updatedAt)}
            </div>
          </div>

          {loading ? (
  <WatchlistSkeleton />
) : watchlist.length === 0 ? (
  <div className="px-5 py-12 text-center text-sm text-slate-500">
    No watchlist symbols are currently available.
  </div>
) : (
  <>
    {/* Mobile watchlist cards */}
    <div className="divide-y divide-slate-800 sm:hidden">
      {watchlist.map((stock) => {
        const positive = stock.change >= 0;
        const ChangeIcon = positive
          ? ArrowUpRight
          : ArrowDownRight;

        return (
          <article
            key={`mobile-${stock.symbol}`}
            className="p-5"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Star
                    size={15}
                    className="shrink-0 text-amber-400"
                  />

                  <h3 className="font-semibold text-white">
                    {stock.symbol}
                  </h3>
                </div>

                <p className="mt-1 truncate text-sm text-slate-400">
                  {stock.company}
                </p>
              </div>

              <div
                className={`flex shrink-0 items-center gap-1 text-sm font-semibold ${
                  positive
                    ? "text-emerald-400"
                    : "text-red-400"
                }`}
              >
                <ChangeIcon size={15} />

                {positive ? "+" : ""}
                {stock.change.toFixed(2)}%
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between gap-4">
              <p className="text-lg font-semibold text-slate-100">
                {formatPrice(stock.price)}
              </p>

              <span
                className={`rounded-full border px-3 py-1 text-xs font-semibold ${getStatusClasses(
                  stock.status,
                )}`}
              >
                {stock.status}
              </span>
            </div>

            <p className="mt-4 border-t border-slate-800 pt-4 text-sm leading-6 text-slate-400">
              {stock.note}
            </p>
          </article>
        );
      })}
    </div>

    {/* Desktop and tablet table */}
    <div className="hidden overflow-x-auto sm:block">
      <table className="w-full min-w-[900px] text-left">
        <thead className="border-b border-slate-800 bg-slate-950/30 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-5 py-3 font-medium">Symbol</th>
            <th className="px-5 py-3 font-medium">Company</th>
            <th className="px-5 py-3 font-medium">Price</th>
            <th className="px-5 py-3 font-medium">Change</th>
            <th className="px-5 py-3 font-medium">Status</th>
            <th className="px-5 py-3 font-medium">Trading Note</th>
          </tr>
        </thead>

        <tbody>
          {watchlist.map((stock) => {
            const positive = stock.change >= 0;
            const ChangeIcon = positive
              ? ArrowUpRight
              : ArrowDownRight;

            return (
              <tr
                key={stock.symbol}
                className="border-b border-slate-800/80 transition last:border-b-0 hover:bg-slate-800/25"
              >
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <Star
                      size={15}
                      className="text-amber-400"
                    />

                    <span className="font-semibold">
                      {stock.symbol}
                    </span>
                  </div>
                </td>

                <td className="px-5 py-4 text-sm text-slate-400">
                  {stock.company}
                </td>

                <td className="px-5 py-4 text-sm font-medium text-slate-200">
                  {formatPrice(stock.price)}
                </td>

                <td className="px-5 py-4">
                  <div
                    className={`flex items-center gap-1 text-sm font-semibold ${
                      positive
                        ? "text-emerald-400"
                        : "text-red-400"
                    }`}
                  >
                    <ChangeIcon size={15} />

                    {positive ? "+" : ""}
                    {stock.change.toFixed(2)}%
                  </div>
                </td>

                <td className="px-5 py-4">
                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${getStatusClasses(
                      stock.status,
                    )}`}
                  >
                    {stock.status}
                  </span>
                </td>

                <td className="max-w-sm px-5 py-4 text-sm text-slate-400">
                  {stock.note}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  </>
)}
        </section>

        <div className="mt-6 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-xs leading-5 text-slate-400">
  Market data is supplied by Yahoo Finance and may be delayed. It is
  intended for market context rather than order execution.
</div>
      </div>
    </main>
  );
}