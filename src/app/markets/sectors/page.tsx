"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Clock3,
  RefreshCw,
  ShieldAlert,
  Trophy,
} from "lucide-react";

type Sector = {
  name: string;
  symbol: string;
  price: number;
  previousClose: number;
  changePercent: number;
};

type SectorPerformanceResponse = {
  success: boolean;
  leadingSector?: Sector;
  weakestSector?: Sector;
  sectors?: Sector[];
  updatedAt?: string;
  error?: string;
};

function formatPrice(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatUpdatedTime(value?: string) {
  if (!value) {
    return "Waiting for update";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Recently updated";
  }

  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getRotationMessage(sectors: Sector[]) {
  if (sectors.length === 0) {
    return "Sector rotation analysis is currently unavailable.";
  }

  const positiveSectors = sectors.filter(
    (sector) => sector.changePercent >= 0,
  ).length;

  const participation =
    (positiveSectors / sectors.length) * 100;

  if (participation >= 75) {
    return "Broad sector participation is present. Strength is spread across most areas of the market, which can support a healthier risk-on environment.";
  }

  if (participation >= 50) {
    return "Sector participation is mixed but leaning positive. Leadership exists, though traders should still watch for uneven performance beneath the major indexes.";
  }

  if (participation >= 25) {
    return "Sector participation is narrow. A smaller group of sectors is carrying the market, which can increase the risk of failed breakouts and sudden reversals.";
  }

  return "Most sectors are trading lower. This defensive environment favors tighter risk management, smaller position sizes, and greater selectivity.";
}

export default function SectorsPage() {
  const [data, setData] =
    useState<SectorPerformanceResponse | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  async function loadSectorPerformance(
    manualRefresh = false,
  ) {
    try {
      if (manualRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response = await fetch(
        "/api/sector-performance",
        {
          cache: "no-store",
        },
      );

      const result =
        (await response.json()) as SectorPerformanceResponse;

      if (!response.ok || !result.success) {
        throw new Error(
          result.error ||
            "Unable to load sector performance.",
        );
      }

      setData(result);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to load sector performance.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void loadSectorPerformance();

    const interval = window.setInterval(() => {
      void loadSectorPerformance();
    }, 300000);

    return () => window.clearInterval(interval);
  }, []);

  const sectors = data?.sectors ?? [];

  const positiveCount = useMemo(
    () =>
      sectors.filter(
        (sector) => sector.changePercent >= 0,
      ).length,
    [sectors],
  );

  const negativeCount = sectors.length - positiveCount;

  const positiveParticipation =
    sectors.length > 0
      ? Math.round(
          (positiveCount / sectors.length) * 100,
        )
      : 0;

  const maxAbsoluteChange = useMemo(() => {
    if (sectors.length === 0) {
      return 1;
    }

    return Math.max(
      ...sectors.map((sector) =>
        Math.abs(sector.changePercent),
      ),
      1,
    );
  }, [sectors]);

  return (
    <main className="min-h-screen bg-[#050b12] px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <Link
          href="/dashboard"
          className="mb-6 inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-blue-400"
        >
          <ArrowLeft size={16} />
          Back to dashboard
        </Link>

        <section className="relative overflow-hidden rounded-2xl border border-slate-800 bg-[#09131d] p-6 shadow-[0_18px_50px_rgba(0,0,0,0.22)] sm:p-8">
          <div className="pointer-events-none absolute -left-24 -top-32 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />

          <div className="pointer-events-none absolute -bottom-32 right-0 h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl" />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-blue-400">
                <BarChart3 size={15} />
                Live market data
              </div>

              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Sector Performance
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
                Compare the 11 major S&amp;P 500 sector
                ETFs, identify current market leadership,
                and monitor changes in sector participation.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col lg:items-end">
              <button
                type="button"
                onClick={() =>
                  void loadSectorPerformance(true)
                }
                disabled={refreshing}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-900/70 px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-blue-500/50 hover:text-blue-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw
                  size={16}
                  className={
                    refreshing ? "animate-spin" : ""
                  }
                />
                {refreshing
                  ? "Refreshing..."
                  : "Refresh data"}
              </button>

              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Clock3 size={14} />
                Updated{" "}
                {formatUpdatedTime(data?.updatedAt)}
              </div>
            </div>
          </div>
        </section>

        {error && (
          <div className="mt-6 flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            <ShieldAlert size={18} />
            {error}
          </div>
        )}

        {loading ? (
          <div className="mt-8 rounded-2xl border border-slate-800 bg-[#09131d] px-6 py-20 text-center">
            <RefreshCw
              size={26}
              className="mx-auto animate-spin text-blue-400"
            />

            <p className="mt-4 text-sm text-slate-400">
              Loading live sector performance...
            </p>
          </div>
        ) : (
          <>
            <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wide text-emerald-400">
                    Leading Sector
                  </span>

                  <Trophy
                    size={18}
                    className="text-emerald-400"
                  />
                </div>

                <div className="mt-4 text-2xl font-bold">
                  {data?.leadingSector?.name ?? "Unavailable"}
                </div>

                <div className="mt-2 flex items-center justify-between">
                  <span className="text-sm text-slate-400">
                    {data?.leadingSector?.symbol ?? "—"}
                  </span>

                  <span className="flex items-center gap-1 text-sm font-semibold text-emerald-400">
                    <ArrowUpRight size={15} />
                    {data?.leadingSector
                      ? `${data.leadingSector.changePercent >= 0 ? "+" : ""}${data.leadingSector.changePercent.toFixed(2)}%`
                      : "—"}
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wide text-red-400">
                    Weakest Sector
                  </span>

                  <ArrowDownRight
                    size={18}
                    className="text-red-400"
                  />
                </div>

                <div className="mt-4 text-2xl font-bold">
                  {data?.weakestSector?.name ??
                    "Unavailable"}
                </div>

                <div className="mt-2 flex items-center justify-between">
                  <span className="text-sm text-slate-400">
                    {data?.weakestSector?.symbol ?? "—"}
                  </span>

                  <span className="flex items-center gap-1 text-sm font-semibold text-red-400">
                    <ArrowDownRight size={15} />
                    {data?.weakestSector
                      ? `${data.weakestSector.changePercent >= 0 ? "+" : ""}${data.weakestSector.changePercent.toFixed(2)}%`
                      : "—"}
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-[#09131d] p-5">
                <span className="text-xs font-semibold uppercase tracking-wide text-blue-400">
                  Positive Sectors
                </span>

                <div className="mt-4 text-3xl font-bold">
                  {positiveCount}
                  <span className="text-base font-normal text-slate-500">
                    {" "}
                    / {sectors.length}
                  </span>
                </div>

                <p className="mt-2 text-sm text-slate-400">
                  Trading above the previous close
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-[#09131d] p-5">
                <span className="text-xs font-semibold uppercase tracking-wide text-blue-400">
                  Participation
                </span>

                <div className="mt-4 text-3xl font-bold">
                  {positiveParticipation}%
                </div>

                <p className="mt-2 text-sm text-slate-400">
                  Breadth across major sector ETFs
                </p>
              </div>
            </section>

            <section className="mt-8 grid gap-6 xl:grid-cols-[1.6fr_0.9fr]">
              <div className="overflow-hidden rounded-2xl border border-slate-800 bg-[#09131d]">
                <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4 sm:px-6">
                  <div>
                    <h2 className="font-semibold">
                      Sector Rankings
                    </h2>

                    <p className="mt-1 text-xs text-slate-500">
                      Ranked strongest to weakest by daily
                      percentage change
                    </p>
                  </div>

                  <span className="text-xs text-slate-500">
                    Today
                  </span>
                </div>

                <div className="divide-y divide-slate-800">
                  {sectors.map((sector, index) => {
                    const positive =
                      sector.changePercent >= 0;

                    const barWidth = Math.max(
                      5,
                      (Math.abs(sector.changePercent) /
                        maxAbsoluteChange) *
                        100,
                    );

                    return (
                      <div
                        key={sector.symbol}
                        className="grid gap-4 px-5 py-4 transition hover:bg-slate-900/40 sm:grid-cols-[40px_minmax(180px,1.2fr)_minmax(160px,1fr)_100px]"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-xs font-semibold text-slate-400">
                          {index + 1}
                        </div>

                        <div>
                          <div className="font-medium text-slate-200">
                            {sector.name}
                          </div>

                          <div className="mt-1 text-xs text-slate-500">
                            {sector.symbol} ·{" "}
                            {formatPrice(sector.price)}
                          </div>
                        </div>

                        <div className="flex items-center">
                          <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-800">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                positive
                                  ? "bg-emerald-400"
                                  : "bg-red-500"
                              }`}
                              style={{
                                width: `${barWidth}%`,
                              }}
                            />
                          </div>
                        </div>

                        <div
                          className={`flex items-center justify-end gap-1 font-semibold ${
                            positive
                              ? "text-emerald-400"
                              : "text-red-400"
                          }`}
                        >
                          {positive ? (
                            <ArrowUpRight size={16} />
                          ) : (
                            <ArrowDownRight size={16} />
                          )}

                          {positive ? "+" : ""}
                          {sector.changePercent.toFixed(2)}%
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-2xl border border-slate-800 bg-[#09131d] p-6">
                  <h2 className="font-semibold">
                    Market Rotation Analysis
                  </h2>

                  <p className="mt-4 text-sm leading-6 text-slate-400">
                    {getRotationMessage(sectors)}
                  </p>

                  <div className="mt-6 overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-2 rounded-full bg-emerald-400 transition-all duration-500"
                      style={{
                        width: `${positiveParticipation}%`,
                      }}
                    />
                  </div>

                  <div className="mt-3 flex justify-between text-xs text-slate-500">
                    <span>
                      {negativeCount} negative
                    </span>

                    <span>
                      {positiveCount} positive
                    </span>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-[#09131d] p-6">
                  <h2 className="font-semibold">
                    How to Use Sector Performance
                  </h2>

                  <div className="mt-4 space-y-4 text-sm leading-6 text-slate-400">
                    <p>
                      Strong sectors can help traders identify
                      where institutional money may be flowing.
                      Stocks inside leading sectors often have
                      better odds of maintaining momentum.
                    </p>

                    <p>
                      Weak sectors can reveal areas where
                      breakouts may be less reliable or where
                      defensive positioning is increasing.
                    </p>

                    <p>
                      Sector performance should be combined with
                      trend, market breadth, price structure, and
                      risk management rather than used as a
                      standalone trading signal.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}