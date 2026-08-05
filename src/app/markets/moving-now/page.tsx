"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowDownRight,
  ArrowLeft,
  ArrowUpRight,
  BarChart3,
  Clock3,
  RefreshCw,
  Search,
  Zap,
} from "lucide-react";

type MarketMover = {
  symbol: string;
  company: string;
  price: number;
  previousClose: number;
  change: number;
  changePercent: number;
  volume: number;
  timestamp?: number;
};

type MovingNowResponse = {
  success: boolean;
  topGainers: MarketMover[];
  topLosers: MarketMover[];
  mostActive: MarketMover[];
  updatedAt?: string;
  universeSize?: number;
  successfulSymbols?: number;
  failedSymbols?: string[];
  sources?: {
    quotes?: string;
    volume?: string;
  };
  delayed?: boolean;
  error?: string;
};

type SectionType = "gainer" | "loser" | "active";

const REFRESH_INTERVAL_SECONDS = 60;

function formatPrice(price: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
}

function formatVolume(volume: number) {
  if (volume >= 1_000_000_000) {
    return `${(volume / 1_000_000_000).toFixed(2)}B`;
  }

  if (volume >= 1_000_000) {
    return `${(volume / 1_000_000).toFixed(1)}M`;
  }

  if (volume >= 1_000) {
    return `${(volume / 1_000).toFixed(1)}K`;
  }

  return volume.toLocaleString("en-US");
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
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
}

function TableSkeleton() {
  return (
    <>
      {/* Mobile loading cards */}
      <div className="space-y-3 p-4 md:hidden">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="animate-pulse rounded-xl border border-slate-800 bg-slate-950/30 p-4"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="h-5 w-16 rounded bg-slate-800" />
                <div className="mt-2 h-4 w-36 rounded bg-slate-800" />
              </div>

              <div className="space-y-2 text-right">
                <div className="ml-auto h-5 w-20 rounded bg-slate-800" />
                <div className="ml-auto h-4 w-16 rounded bg-slate-800" />
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-slate-800 p-3">
                <div className="h-3 w-12 rounded bg-slate-800" />
                <div className="mt-2 h-4 w-16 rounded bg-slate-800" />
              </div>

              <div className="rounded-lg border border-slate-800 p-3">
                <div className="h-3 w-12 rounded bg-slate-800" />
                <div className="mt-2 h-4 w-16 rounded bg-slate-800" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop loading rows */}
      <div className="hidden space-y-3 p-5 md:block">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="grid animate-pulse grid-cols-[70px_1fr_90px_90px_90px] gap-4"
          >
            <div className="h-4 rounded bg-slate-800" />
            <div className="h-4 rounded bg-slate-800" />
            <div className="h-4 rounded bg-slate-800" />
            <div className="h-4 rounded bg-slate-800" />
            <div className="h-4 rounded bg-slate-800" />
          </div>
        ))}
      </div>
    </>
  );
}

function MoversTable({
  title,
  description,
  movers,
  type,
  loading,
}: {
  title: string;
  description: string;
  movers: MarketMover[];
  type: SectionType;
  loading: boolean;
}) {
  const Icon =
    type === "gainer"
      ? ArrowUpRight
      : type === "loser"
        ? ArrowDownRight
        : Activity;

  const iconClass =
    type === "gainer"
      ? "text-emerald-400"
      : type === "loser"
        ? "text-red-400"
        : "text-blue-400";

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-800 bg-[#09131d]">
      <div className="flex items-start justify-between gap-3 border-b border-slate-800 px-4 py-4 sm:px-5">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Icon size={18} className={iconClass} />

            <h2 className="text-lg font-semibold text-white">
              {title}
            </h2>
          </div>

          <p className="mt-1 text-sm leading-5 text-slate-400">
            {description}
          </p>
        </div>

        <span className="shrink-0 rounded-full border border-slate-700 bg-slate-950/40 px-2.5 py-1 text-xs text-slate-400">
          {movers.length} stocks
        </span>
      </div>

      {loading ? (
        <TableSkeleton />
      ) : movers.length === 0 ? (
        <div className="px-5 py-10 text-center text-sm text-slate-500">
          No matching stocks are available.
        </div>
      ) : (
        <>
          {/* Mobile stock cards */}
          <div className="divide-y divide-slate-800 md:hidden">
            {movers.map((mover) => {
              const positive = mover.changePercent >= 0;

              return (
                <article
                  key={`mobile-${title}-${mover.symbol}`}
                  className="p-4 transition hover:bg-slate-800/20"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-white">
                          {mover.symbol}
                        </span>

                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                            positive
                              ? "bg-emerald-500/10 text-emerald-400"
                              : "bg-red-500/10 text-red-400"
                          }`}
                        >
                          {positive ? (
                            <ArrowUpRight size={13} />
                          ) : (
                            <ArrowDownRight size={13} />
                          )}

                          {positive ? "+" : ""}
                          {mover.changePercent.toFixed(2)}%
                        </span>
                      </div>

                      <p className="mt-1 truncate text-sm text-slate-400">
                        {mover.company}
                      </p>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="text-lg font-bold text-white">
                        {formatPrice(mover.price)}
                      </p>

                      <p
                        className={`mt-1 text-sm font-semibold ${
                          positive
                            ? "text-emerald-400"
                            : "text-red-400"
                        }`}
                      >
                        {positive ? "+" : ""}
                        {formatPrice(mover.change)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-lg border border-slate-800 bg-slate-950/30 px-3 py-2.5">
                      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                        Previous close
                      </p>

                      <p className="mt-1 text-sm font-semibold text-slate-200">
                        {formatPrice(mover.previousClose)}
                      </p>
                    </div>

                    <div className="rounded-lg border border-slate-800 bg-slate-950/30 px-3 py-2.5">
                      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                        Volume
                      </p>

                      <p className="mt-1 text-sm font-semibold text-slate-200">
                        {mover.volume > 0
                          ? formatVolume(mover.volume)
                          : "Unavailable"}
                      </p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {/* Desktop table */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[760px] text-left">
              <thead className="border-b border-slate-800 bg-slate-950/30 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-medium">
                    Symbol
                  </th>

                  <th className="px-5 py-3 font-medium">
                    Company
                  </th>

                  <th className="px-5 py-3 font-medium">
                    Price
                  </th>

                  <th className="px-5 py-3 font-medium">
                    Change
                  </th>

                  <th className="px-5 py-3 font-medium">
                    Volume
                  </th>
                </tr>
              </thead>

              <tbody>
                {movers.map((mover) => {
                  const positive = mover.changePercent >= 0;

                  return (
                    <tr
                      key={`desktop-${title}-${mover.symbol}`}
                      className="border-b border-slate-800/80 transition last:border-b-0 hover:bg-slate-800/30"
                    >
                      <td className="px-5 py-4">
                        <span className="font-semibold text-white">
                          {mover.symbol}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-400">
                        {mover.company}
                      </td>

                      <td className="px-5 py-4 text-sm font-medium text-slate-200">
                        {formatPrice(mover.price)}
                      </td>

                      <td className="px-5 py-4">
                        <div
                          className={`flex items-center gap-1 text-sm font-semibold ${
                            positive
                              ? "text-emerald-400"
                              : "text-red-400"
                          }`}
                        >
                          {positive ? (
                            <ArrowUpRight size={15} />
                          ) : (
                            <ArrowDownRight size={15} />
                          )}

                          {positive ? "+" : ""}
                          {mover.changePercent.toFixed(2)}%
                        </div>
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-400">
                        {mover.volume > 0
                          ? formatVolume(mover.volume)
                          : "Unavailable"}
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
  );
}

export default function MovingNowPage() {
  const [data, setData] = useState<MovingNowResponse | null>(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL_SECONDS);

  const loadMovers = useCallback(async (backgroundRefresh = false) => {
    try {
      if (backgroundRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError(null);

      const response = await fetch("/api/moving-now", {
        cache: "no-store",
      });

      const result = (await response.json()) as MovingNowResponse;

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Unable to load market movers.");
      }

      setData(result);
      setCountdown(REFRESH_INTERVAL_SECONDS);
    } catch (requestError) {
      console.error("Moving Now page error:", requestError);

      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load market movers.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadMovers();

    const refreshInterval = window.setInterval(() => {
      void loadMovers(true);
    }, REFRESH_INTERVAL_SECONDS * 1000);

    return () => {
      window.clearInterval(refreshInterval);
    };
  }, [loadMovers]);

  useEffect(() => {
    const countdownInterval = window.setInterval(() => {
      setCountdown((currentCountdown) => {
        if (currentCountdown <= 1) {
          return 0;
        }

        return currentCountdown - 1;
      });
    }, 1000);

    return () => {
      window.clearInterval(countdownInterval);
    };
  }, []);

  const handleManualRefresh = () => {
    setCountdown(REFRESH_INTERVAL_SECONDS);
    void loadMovers(true);
  };

  const filterMovers = useCallback(
    (movers: MarketMover[]) => {
      const normalizedQuery = query.trim().toLowerCase();

      if (!normalizedQuery) {
        return movers;
      }

      return movers.filter((mover) => {
        return (
          mover.symbol.toLowerCase().includes(normalizedQuery) ||
          mover.company.toLowerCase().includes(normalizedQuery)
        );
      });
    },
    [query],
  );

  const topGainers = useMemo(
    () => filterMovers(data?.topGainers ?? []),
    [data, filterMovers],
  );

  const topLosers = useMemo(
    () => filterMovers(data?.topLosers ?? []),
    [data, filterMovers],
  );

  const mostActive = useMemo(
    () => filterMovers(data?.mostActive ?? []),
    [data, filterMovers],
  );

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

        <section className="mb-6 overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-[#0b1722] to-[#071019] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.25)] sm:p-8">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-400">
                <Zap size={14} />
                Live Market Activity
              </div>

              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Moving Now
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
                Track the strongest gainers, largest decliners, and most
                actively traded stocks in the MaicaTrades liquid-stock
                universe.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 text-xs text-slate-400">
              <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2">
                <Clock3 size={15} className="text-blue-400" />
                Updated {formatUpdatedAt(data?.updatedAt)}
              </div>

              <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2">
                <RefreshCw
                  size={15}
                  className={refreshing ? "animate-spin text-blue-400" : "text-blue-400"}
                />

                {refreshing
                  ? "Refreshing data..."
                  : `Next refresh in ${countdown}s`}
              </div>

              <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2">
                <BarChart3 size={15} className="text-blue-400" />
                {data?.successfulSymbols ?? 0} tracked stocks
              </div>
            </div>
          </div>
        </section>

        <section className="mb-6 flex flex-col gap-3 rounded-xl border border-slate-800 bg-[#09131d] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search
              size={17}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
            />

            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search symbol or company"
              className="w-full rounded-lg border border-slate-700 bg-slate-950/40 py-2.5 pl-10 pr-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500"
            />
          </div>

          <button
            type="button"
            onClick={handleManualRefresh}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-blue-500/30 bg-blue-500/10 px-4 py-2.5 text-sm font-medium text-blue-400 transition hover:border-blue-500/60 hover:bg-blue-500/15 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={refreshing ? "animate-spin" : ""}
            />

            {refreshing ? "Refreshing" : "Refresh Data"}
          </button>
        </section>

        {error && (
          <section className="mb-6 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-4">
            <p className="text-sm font-medium text-red-400">
              Market movers could not be loaded.
            </p>

            <p className="mt-1 text-xs text-slate-400">{error}</p>

            <button
              type="button"
              onClick={() => void loadMovers()}
              className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-blue-400"
            >
              <RefreshCw size={14} />
              Try again
            </button>
          </section>
        )}

        <div className="grid gap-6">
          <MoversTable
            title="Top Gainers"
            description="Liquid stocks showing the strongest positive price movement."
            movers={topGainers}
            type="gainer"
            loading={loading}
          />

          <MoversTable
            title="Top Losers"
            description="Liquid stocks experiencing the largest percentage declines."
            movers={topLosers}
            type="loser"
            loading={loading}
          />

          <MoversTable
            title="Most Active"
            description="Tracked stocks currently attracting the highest trading volume."
            movers={mostActive}
            type="active"
            loading={loading}
          />
        </div>

        <div className="mt-6 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-xs leading-5 text-slate-400">
          Quotes and percentage changes are supplied by Finnhub. Volume is
          supplied by Yahoo Finance. Data may be delayed and is intended for
          market context, not order execution.
        </div>
      </div>
    </main>
  );
}