"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  Clock3,
  RefreshCw,
} from "lucide-react";

type CalendarEvent = {
  id: string;
  date: string;
  time: string;
  title: string;
  category: string;
  impact: string;
  previous: string;
  forecast: string;
  actual: string;
  description: string;
};

type EconomicCalendarResponse = {
  success: boolean;
  events?: CalendarEvent[];
  updatedAt?: string;
  error?: string;
};

function formatUpdatedTime(value?: string) {
  if (!value) {
    return "Reviewed weekly";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Reviewed weekly";
  }

  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getImpactStyles(impact: string) {
  if (impact === "High") {
    return {
      badge:
        "border-red-500/20 bg-red-500/10 text-red-400",
      dot: "bg-red-400",
    };
  }

  if (impact === "Medium") {
    return {
      badge:
        "border-yellow-500/20 bg-yellow-500/10 text-yellow-400",
      dot: "bg-yellow-400",
    };
  }

  return {
    badge:
      "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
    dot: "bg-emerald-400",
  };
}

export default function CalendarPage() {
  const [data, setData] =
    useState<EconomicCalendarResponse | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  async function loadCalendar(manualRefresh = false) {
    try {
      if (manualRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response = await fetch(
        "/api/economic-calendar",
        {
          cache: "no-store",
        },
      );

      const result =
        (await response.json()) as EconomicCalendarResponse;

      if (!response.ok || !result.success) {
        throw new Error(
          result.error ||
            "Unable to load this week's market catalysts.",
        );
      }

      setData(result);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to load this week's market catalysts.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void loadCalendar();
  }, []);

  const events = data?.events ?? [];

  const highImpactCount = events.filter(
    (event) => event.impact === "High",
  ).length;

  const mediumImpactCount = events.filter(
    (event) => event.impact === "Medium",
  ).length;

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
                <CalendarDays size={15} />
                Weekly trading calendar
              </div>

              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                This Week&apos;s Market Catalysts
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
                Review the major economic releases and Federal
                Reserve events that may affect volatility,
                interest-rate expectations, and market direction
                during the current trading week.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col lg:items-end">
              <button
                type="button"
                onClick={() => void loadCalendar(true)}
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
                  ? "Reloading..."
                  : "Reload calendar"}
              </button>

              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Clock3 size={14} />
                Calendar reviewed{" "}
                {formatUpdatedTime(data?.updatedAt)}
              </div>
            </div>
          </div>
        </section>

        {error && (
          <div className="mt-6 flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            <AlertTriangle size={18} />
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
              Loading this week&apos;s market catalysts...
            </p>
          </div>
        ) : (
          <>
            <section className="mt-8 grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-slate-800 bg-[#09131d] p-5">
                <span className="text-xs font-semibold uppercase tracking-wide text-blue-400">
                  This Week
                </span>

                <div className="mt-4 text-3xl font-bold">
                  {events.length}
                </div>

                <p className="mt-2 text-sm text-slate-400">
                  Scheduled market catalysts
                </p>
              </div>

              <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-5">
                <span className="text-xs font-semibold uppercase tracking-wide text-red-400">
                  High Impact
                </span>

                <div className="mt-4 text-3xl font-bold">
                  {highImpactCount}
                </div>

                <p className="mt-2 text-sm text-slate-400">
                  Events with elevated volatility risk
                </p>
              </div>

              <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-5">
                <span className="text-xs font-semibold uppercase tracking-wide text-yellow-400">
                  Medium Impact
                </span>

                <div className="mt-4 text-3xl font-bold">
                  {mediumImpactCount}
                </div>

                <p className="mt-2 text-sm text-slate-400">
                  Events worth monitoring
                </p>
              </div>
            </section>

            <section className="mt-8 grid gap-6 xl:grid-cols-[1.6fr_0.9fr]">
              <div>
                <div className="overflow-hidden rounded-2xl border border-slate-800 bg-[#09131d]">
                  <div className="border-b border-slate-800 px-5 py-4 sm:px-6">
                    <h2 className="font-semibold">
                      This Week&apos;s Key Market Catalysts
                    </h2>

                    <p className="mt-1 text-xs text-slate-500">
                      {events.length} scheduled{" "}
                      {events.length === 1
                        ? "event"
                        : "events"}
                    </p>
                  </div>

                  {events.length === 0 ? (
                    <div className="px-6 py-12 text-center text-sm text-slate-500">
                      No major market catalysts have been added for
                      this week.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-800">
                      {events.map((event) => {
                        const styles =
                          getImpactStyles(event.impact);

                        return (
                          <article
                            key={event.id}
                            className="px-5 py-6 sm:px-6"
                          >
                            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                              <div className="flex min-w-0 gap-4">
                                <div className="pt-2">
                                  <div
                                    className={`h-2.5 w-2.5 rounded-full ${styles.dot}`}
                                  />
                                </div>

                                <div className="min-w-0">
                                  <div className="mb-2 flex flex-wrap items-center gap-2 text-xs font-medium text-blue-400">
                                    <CalendarDays size={14} />
                                    <span>{event.date}</span>
                                    <span className="text-slate-600">
                                      •
                                    </span>
                                    <Clock3 size={14} />
                                    <span>{event.time} ET</span>
                                  </div>

                                  <div className="flex flex-wrap items-center gap-3">
                                    <h3 className="text-lg font-semibold text-slate-100">
                                      {event.title}
                                    </h3>

                                    <span
                                      className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${styles.badge}`}
                                    >
                                      {event.impact}
                                    </span>
                                  </div>

                                  <div className="mt-2 text-xs text-slate-500">
                                    {event.category}
                                  </div>

                                  <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
                                    {event.description}
                                  </p>
                                </div>
                              </div>

                              <div className="grid min-w-0 grid-cols-3 gap-3 lg:min-w-[270px]">
                                <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3">
                                  <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                                    Previous
                                  </div>

                                  <div className="mt-2 text-sm font-semibold text-slate-200">
                                    {event.previous}
                                  </div>
                                </div>

                                <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3">
                                  <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                                    Forecast
                                  </div>

                                  <div className="mt-2 text-sm font-semibold text-slate-200">
                                    {event.forecast}
                                  </div>
                                </div>

                                <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3">
                                  <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                                    Actual
                                  </div>

                                  <div className="mt-2 text-sm font-semibold text-slate-200">
                                    {event.actual}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-2xl border border-slate-800 bg-[#09131d] p-6">
                  <h2 className="font-semibold">
                    Market Impact Guide
                  </h2>

                  <div className="mt-5 space-y-4">
                    <div className="flex gap-3">
                      <span className="mt-1 h-2.5 w-2.5 rounded-full bg-red-400" />

                      <div>
                        <div className="text-sm font-medium text-slate-200">
                          High Impact
                        </div>

                        <p className="mt-1 text-sm leading-6 text-slate-400">
                          Can cause sharp moves in indexes,
                          Treasury yields, the U.S. dollar, and
                          growth stocks.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <span className="mt-1 h-2.5 w-2.5 rounded-full bg-yellow-400" />

                      <div>
                        <div className="text-sm font-medium text-slate-200">
                          Medium Impact
                        </div>

                        <p className="mt-1 text-sm leading-6 text-slate-400">
                          May affect sentiment or produce
                          sector-specific volatility.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <span className="mt-1 h-2.5 w-2.5 rounded-full bg-emerald-400" />

                      <div>
                        <div className="text-sm font-medium text-slate-200">
                          Low Impact
                        </div>

                        <p className="mt-1 text-sm leading-6 text-slate-400">
                          Usually has a smaller effect unless the
                          result is significantly different from
                          expectations.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-[#09131d] p-6">
                  <h2 className="font-semibold">
                    How to Use This Week&apos;s Catalysts
                  </h2>

                  <div className="mt-4 space-y-4 text-sm leading-6 text-slate-400">
                    <p>
                      Review high-impact events before entering new
                      positions, especially when releases are
                      scheduled near the market open.
                    </p>

                    <p>
                      Consider reducing position size or waiting for
                      volatility to settle when major inflation,
                      employment, or Federal Reserve events are
                      approaching.
                    </p>

                    <p>
                      This weekly calendar provides context, not a
                      standalone trading signal. Combine it with
                      trend, market breadth, price structure, and
                      risk management.
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