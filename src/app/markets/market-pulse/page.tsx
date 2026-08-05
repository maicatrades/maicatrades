"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowDownRight,
  ArrowLeft,
  ArrowUpRight,
  BarChart3,
  Clock3,
  Gauge,
  LoaderCircle,
  Minus,
  RefreshCw,
} from "lucide-react";

type Status = "Bullish" | "Neutral" | "Watch" | "Low";

type MarketPulseItem = {
  symbol: string;
  name: string;
  status: Status;
  price: number;
  previousClose: number;
  change: number;
  changePercent: number;
  positive: boolean;
  description: string;
  ema20: number | null;
  ema50: number | null;
  rsi14: number | null;
};

type MarketPulseResponse = {
  success: boolean;

  benchmarks: MarketPulseItem[];

  summary: {
    bullish: number;
    neutral: number;
    watch: number;
    lowRisk: number;
    riskSignals: number;
    positiveBenchmarks: number;
    totalMarketBenchmarks: number;
    marketTone: string;
  };

  coverage: {
    requested: number;
    returned: number;
    failed: number;
    failedSymbols: string[];
    partialData: boolean;
  };

  updatedAt: string;
  error?: string;
};

function formatNumber(
  value: number,
  decimals = 2,
) {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function formatPercent(value: number) {
  const prefix = value > 0 ? "+" : "";

  return `${prefix}${formatNumber(value, 2)}%`;
}

function formatTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Recently updated";
  }

  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function getStatusClasses(status: Status) {
  if (status === "Bullish") {
    return "border-emerald-500/20 bg-emerald-500/10 text-emerald-400";
  }

  if (status === "Low") {
    return "border-blue-500/20 bg-blue-500/10 text-blue-400";
  }

  if (status === "Watch") {
    return "border-red-500/20 bg-red-500/10 text-red-400";
  }

  return "border-amber-500/20 bg-amber-500/10 text-amber-400";
}

function getDisplayedStatus(status: Status) {
  if (status === "Low") {
    return "Low Risk";
  }

  return status;
}

function getTrendIcon(changePercent: number) {
  if (changePercent > 0) {
    return ArrowUpRight;
  }

  if (changePercent < 0) {
    return ArrowDownRight;
  }

  return Minus;
}

function getTrendColor(
  symbol: string,
  changePercent: number,
) {
  /*
   * A lower VIX is generally constructive for equities,
   * but the displayed percentage still represents the
   * actual direction of the volatility index.
   */
  if (changePercent > 0) {
    return symbol === "VIX"
      ? "text-red-400"
      : "text-emerald-400";
  }

  if (changePercent < 0) {
    return symbol === "VIX"
      ? "text-emerald-400"
      : "text-red-400";
  }

  return "text-amber-400";
}

function LoadingState() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#050b11] px-5 text-white">
      <div className="text-center">
        <LoaderCircle
          size={38}
          className="mx-auto animate-spin text-blue-400"
        />

        <p className="mt-4 font-semibold text-slate-200">
          Calculating Market Pulse
        </p>

        <p className="mt-2 text-sm text-slate-500">
          Reviewing trend, momentum, and volatility across major benchmarks.
        </p>
      </div>
    </main>
  );
}

function ErrorState({
  message,
}: {
  message: string;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#050b11] px-5 text-white">
      <div className="max-w-md rounded-2xl border border-red-500/20 bg-[#09131d] p-8 text-center">
        <AlertCircle
          size={34}
          className="mx-auto text-red-400"
        />

        <h1 className="mt-4 text-xl font-bold">
          Market Pulse is unavailable
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-400">
          {message}
        </p>

        <Link
          href="/dashboard"
          className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-blue-400 hover:text-blue-300"
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </Link>
      </div>
    </main>
  );
}

export default function MarketPulsePage() {
  const [data, setData] =
    useState<MarketPulseResponse | null>(null);

  const [error, setError] =
    useState<string | null>(null);

  const [isLoading, setIsLoading] =
    useState(true);

  const [isRefreshing, setIsRefreshing] =
    useState(false);

  async function loadMarketPulse(
    showRefreshState = false,
  ) {
    try {
      if (showRefreshState) {
        setIsRefreshing(true);
      }

      setError(null);

      const response = await fetch(
        "/api/market-pulse",
        {
          cache: "no-store",
        },
      );

      const result =
        (await response.json()) as MarketPulseResponse;

      if (!response.ok || !result.success) {
        throw new Error(
          result.error ??
            "Unable to load Market Pulse.",
        );
      }

      setData(result);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load Market Pulse.",
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }

  useEffect(() => {
    loadMarketPulse();

    const refreshInterval =
      window.setInterval(
        () => loadMarketPulse(),
        15 * 60 * 1000,
      );

    return () => {
      window.clearInterval(refreshInterval);
    };
  }, []);

  if (isLoading) {
    return <LoadingState />;
  }

  if (error && !data) {
    return <ErrorState message={error} />;
  }

  if (!data) {
    return (
      <ErrorState message="No valid Market Pulse data was returned." />
    );
  }

  return (
    <main className="min-h-screen bg-[#050b11] text-white">
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 transition hover:text-blue-400"
          >
            <ArrowLeft size={17} />
            Back to Dashboard
          </Link>

          <p className="text-xs text-slate-600">
            Updated {formatTime(data.updatedAt)}
          </p>
        </div>

        <section className="mb-8 overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-[#0b1722] to-[#071019] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.25)] sm:p-8">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-400">
                <Gauge size={14} />
                Market Conditions
              </div>

              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Market Pulse
              </h1>

              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400 sm:text-base">
                Market Pulse provides a quick snapshot of major U.S.
                benchmarks, helping traders evaluate trend, momentum,
                volatility, and the overall trading environment.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2 text-xs text-slate-400">
                <Clock3
                  size={15}
                  className="text-blue-400"
                />
                Delayed market data
              </div>

              <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2 text-xs text-slate-400">
                <BarChart3
                  size={15}
                  className="text-blue-400"
                />
                {data.coverage.returned} benchmarks
              </div>

              <button
                type="button"
                onClick={() =>
                  loadMarketPulse(true)
                }
                disabled={isRefreshing}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-950/40 px-3 py-2 text-xs font-medium text-slate-300 transition hover:border-blue-500/40 hover:text-blue-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw
                  size={15}
                  className={
                    isRefreshing
                      ? "animate-spin"
                      : ""
                  }
                />
                Refresh
              </button>
            </div>
          </div>
        </section>

        {data.coverage.partialData && (
          <div className="mb-6 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm text-amber-300">
            Some benchmark data is temporarily unavailable. Showing{" "}
            {data.coverage.returned} of{" "}
            {data.coverage.requested} benchmarks.
          </div>
        )}

        <section className="mb-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-400">
              Bullish
            </p>

            <p className="mt-2 text-3xl font-bold text-white">
              {data.summary.bullish}
            </p>

            <p className="mt-1 text-sm text-slate-400">
              Benchmarks showing constructive conditions
            </p>
          </div>

          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-400">
              Neutral
            </p>

            <p className="mt-2 text-3xl font-bold text-white">
              {data.summary.neutral}
            </p>

            <p className="mt-1 text-sm text-slate-400">
              Benchmarks showing mixed conditions
            </p>
          </div>

          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-red-400">
              Risk Signals
            </p>

            <p className="mt-2 text-3xl font-bold text-white">
              {data.summary.riskSignals}
            </p>

            <p className="mt-1 text-sm text-slate-400">
              Benchmarks requiring closer attention
            </p>
          </div>
        </section>

        <section className="mb-6 rounded-xl border border-blue-500/20 bg-blue-500/5 p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-400">
                Current Market Tone
              </p>

              <p className="mt-2 text-xl font-bold text-white">
                {data.summary.marketTone}
              </p>
            </div>

            <p className="max-w-2xl text-sm leading-6 text-slate-400">
              {data.summary.positiveBenchmarks} of{" "}
              {data.summary.totalMarketBenchmarks} equity benchmarks are
              advancing. Status readings combine daily direction, moving
              averages, momentum, and volatility conditions.
            </p>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-800 bg-[#09131d]">
          <div className="border-b border-slate-800 px-5 py-4">
            <div className="flex items-center gap-2">
              <Gauge
                size={18}
                className="text-blue-400"
              />

              <h2 className="text-lg font-semibold text-white">
                Benchmark Overview
              </h2>
            </div>

            <p className="mt-1 text-sm text-slate-400">
              Live trend and momentum readings across major market
              benchmarks.
            </p>
          </div>

          <div className="divide-y divide-slate-800">
            {data.benchmarks.map((item) => {
              const TrendIcon =
                getTrendIcon(
                  item.changePercent,
                );

              const trendColor =
                getTrendColor(
                  item.symbol,
                  item.changePercent,
                );

              return (
                <div
                  key={item.symbol}
                  className="grid gap-4 px-5 py-5 transition hover:bg-slate-800/20 sm:grid-cols-[100px_1fr_auto_auto] sm:items-center"
                >
                  <div>
                    <p className="text-base font-bold text-white">
                      {item.symbol}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {item.name}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-slate-300">
                      {item.description}
                    </p>

                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
                      <span>
                        Price: $
                        {formatNumber(
                          item.price,
                          2,
                        )}
                      </span>

                      {item.ema20 !== null && (
                        <span>
                          20 EMA: $
                          {formatNumber(
                            item.ema20,
                            2,
                          )}
                        </span>
                      )}

                      {item.ema50 !== null && (
                        <span>
                          50 EMA: $
                          {formatNumber(
                            item.ema50,
                            2,
                          )}
                        </span>
                      )}

                      {item.rsi14 !== null && (
                        <span>
                          RSI:{" "}
                          {formatNumber(
                            item.rsi14,
                            1,
                          )}
                        </span>
                      )}
                    </div>
                  </div>

                  <span
                    className={`w-fit rounded-full border px-3 py-1 text-xs font-semibold ${getStatusClasses(
                      item.status,
                    )}`}
                  >
                    {getDisplayedStatus(
                      item.status,
                    )}
                  </span>

                  <div className="flex min-w-[100px] items-center justify-end gap-2">
                    <TrendIcon
                      size={16}
                      className={trendColor}
                    />

                    <span
                      className={`text-sm font-semibold ${trendColor}`}
                    >
                      {formatPercent(
                        item.changePercent,
                      )}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <p className="mt-8 text-center text-xs text-slate-600">
          Market information is delayed and provided for educational
          purposes only. It is not financial advice.
        </p>
      </div>
    </main>
  );
}