"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  RefreshCw,
  Star,
} from "lucide-react";

type ChartPoint = {
  date: string;
  close: number;
  ema20: number | null;
};

type TradeIdeaData = {
  symbol: string;
  companyName: string;
  price: number;
  previousClose: number;
  change: number;
  changePercent: number;
  setup: string;
  setupType: string;
  direction: "LONG" | "SHORT";
  holdingPeriod: string;
  entry: number;
  stopLoss: number;
  target: number;
  riskReward: number;
  confidenceScore: number;
  confidenceStars: number;
  tradeBias: string;
  chart: ChartPoint[];
};

type TradeIdeaResponse = {
  success: boolean;
  idea?: TradeIdeaData;
  updatedAt?: string;
  error?: string;
};

type ChartCoordinates = {
  pricePath: string;
  emaPath: string;
  entryY: number;
  stopY: number;
  targetY: number;
};

const REFRESH_INTERVAL = 15 * 60 * 1000;

function Card({
  children,
  className = "",
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <section
      onClick={onClick}
      onKeyDown={(event) => {
        if (!onClick) {
          return;
        }

        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick();
        }
      }}
      role={onClick ? "link" : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={`group w-full min-w-0 max-w-full overflow-hidden rounded-xl border border-slate-800 bg-[#09131d] shadow-[0_10px_30px_rgba(0,0,0,0.16)] ${
        onClick
          ? "cursor-pointer transition duration-200 hover:border-blue-500/60 hover:bg-[#0b1722] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          : ""
      } ${className}`}
    >
      {children}
    </section>
  );
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatPercent(value: number) {
  const prefix = value > 0 ? "+" : "";

  return `${prefix}${value.toFixed(2)}%`;
}

function buildPath(
  values: Array<number | null>,
  minimum: number,
  maximum: number,
  width: number,
  height: number,
  padding: number,
) {
  const validValues = values
    .map((value, index) => ({
      value,
      index,
    }))
    .filter(
      (
        item,
      ): item is {
        value: number;
        index: number;
      } =>
        typeof item.value === "number" &&
        Number.isFinite(item.value),
    );

  if (validValues.length < 2) {
    return "";
  }

  const usableWidth = width - padding * 2;
  const usableHeight = height - padding * 2;
  const range = Math.max(0.01, maximum - minimum);
  const denominator = Math.max(1, values.length - 1);

  return validValues
    .map(({ value, index }, pathIndex) => {
      const x =
        padding +
        (index / denominator) * usableWidth;

      const y =
        padding +
        ((maximum - value) / range) *
          usableHeight;

      return `${pathIndex === 0 ? "M" : "L"}${x.toFixed(
        2,
      )} ${y.toFixed(2)}`;
    })
    .join(" ");
}

function buildChartCoordinates(
  idea: TradeIdeaData,
): ChartCoordinates | null {
  const points = idea.chart.slice(-60);

  if (points.length < 2) {
    return null;
  }

  const chartValues = [
    ...points.map((point) => point.close),
    ...points
      .map((point) => point.ema20)
      .filter(
        (value): value is number =>
          typeof value === "number" &&
          Number.isFinite(value),
      ),
    idea.entry,
    idea.stopLoss,
    idea.target,
  ];

  const rawMinimum = Math.min(...chartValues);
  const rawMaximum = Math.max(...chartValues);
  const chartRange = Math.max(
    1,
    rawMaximum - rawMinimum,
  );

  const chartPadding = chartRange * 0.08;
  const minimum = rawMinimum - chartPadding;
  const maximum = rawMaximum + chartPadding;

  const width = 600;
  const height = 220;
  const padding = 18;
  const usableHeight = height - padding * 2;
  const range = Math.max(0.01, maximum - minimum);

  const getY = (value: number) =>
    padding +
    ((maximum - value) / range) * usableHeight;

  return {
    pricePath: buildPath(
      points.map((point) => point.close),
      minimum,
      maximum,
      width,
      height,
      padding,
    ),
    emaPath: buildPath(
      points.map((point) => point.ema20),
      minimum,
      maximum,
      width,
      height,
      padding,
    ),
    entryY: getY(idea.entry),
    stopY: getY(idea.stopLoss),
    targetY: getY(idea.target),
  };
}

function LoadingState() {
  return (
    <Card>
      <div className="border-b border-slate-800 px-5 py-4">
        <div className="h-5 w-44 animate-pulse rounded bg-slate-800" />
      </div>

      <div className="grid w-full min-w-0 max-w-full grid-cols-1 gap-6 p-4 sm:p-5 md:grid-cols-[minmax(0,1fr)_220px]">
        <div>
          <div className="flex justify-between gap-5">
            <div>
              <div className="h-7 w-20 animate-pulse rounded bg-slate-800" />

              <div className="mt-2 h-4 w-36 animate-pulse rounded bg-slate-800" />
            </div>

            <div>
              <div className="h-7 w-24 animate-pulse rounded bg-slate-800" />

              <div className="mt-2 h-4 w-16 animate-pulse rounded bg-slate-800" />
            </div>
          </div>

          <div className="mt-5 h-56 animate-pulse rounded-lg border border-slate-800 bg-slate-950/40" />
        </div>

        <div className="space-y-5 border-slate-800 md:border-l md:pl-5">
          {Array.from({ length: 5 }).map(
            (_, index) => (
              <div key={index}>
                <div className="h-3 w-16 animate-pulse rounded bg-slate-800" />

                <div className="mt-2 h-5 w-28 animate-pulse rounded bg-slate-800" />
              </div>
            ),
          )}
        </div>
      </div>
    </Card>
  );
}

export default function TradeIdea() {
  const router = useRouter();

  const [data, setData] =
    useState<TradeIdeaResponse | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const loadTradeIdea = useCallback(
    async (backgroundRefresh = false) => {
      try {
        if (backgroundRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError(null);

        const response = await fetch(
          "/api/trade-idea",
          {
            cache: "no-store",
          },
        );

        const result =
          (await response.json()) as TradeIdeaResponse;

        if (
          !response.ok ||
          !result.success ||
          !result.idea
        ) {
          throw new Error(
            result.error ??
              "Unable to load today's trade idea.",
          );
        }

        setData(result);
      } catch (requestError) {
        console.error(
          "Dashboard trade idea error:",
          requestError,
        );

        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to load today's trade idea.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [],
  );

  useEffect(() => {
    void loadTradeIdea();

    const interval = window.setInterval(() => {
      void loadTradeIdea(true);
    }, REFRESH_INTERVAL);

    return () => {
      window.clearInterval(interval);
    };
  }, [loadTradeIdea]);

  const idea = data?.idea;

  const chart = useMemo(() => {
    if (!idea) {
      return null;
    }

    return buildChartCoordinates(idea);
  }, [idea]);

  if (loading && !idea) {
    return <LoadingState />;
  }

  if (!idea) {
    return (
      <Card>
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-blue-400">
            <Star size={17} />
            Today&apos;s Trade Idea
          </div>
        </div>

        <div className="p-6">
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-5">
            <div className="flex items-start gap-3">
              <AlertCircle
                size={20}
                className="mt-0.5 shrink-0 text-red-400"
              />

              <div>
                <p className="font-semibold text-red-400">
                  Trade idea unavailable
                </p>

                <p className="mt-1 text-sm text-slate-400">
                  {error ??
                    "The latest trade idea could not be loaded."}
                </p>

                <button
                  type="button"
                  onClick={() =>
                    void loadTradeIdea()
                  }
                  className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-blue-400 hover:text-blue-300"
                >
                  <RefreshCw size={15} />
                  Try again
                </button>
              </div>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  const positiveChange =
    idea.changePercent >= 0;

  const isShort = idea.direction === "SHORT";

  return (
    <Card
      onClick={() => {
        router.push("/markets/trade-idea");
      }}
    >
      <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
        <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-blue-400">
          <Star size={17} />
          Today&apos;s Trade Idea
        </div>

        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            void loadTradeIdea(true);
          }}
          onKeyDown={(event) => {
            event.stopPropagation();
          }}
          disabled={refreshing}
          className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 transition hover:text-blue-400 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Refresh trade idea"
        >
          <RefreshCw
            size={15}
            className={
              refreshing ? "animate-spin" : ""
            }
          />

          {refreshing
            ? "Refreshing"
            : "Live"}
        </button>
      </div>

      {error && (
        <div className="border-b border-amber-500/20 bg-amber-500/5 px-5 py-2.5 text-xs text-amber-300">
          Refresh failed. Displaying the last
          successful trade idea.
        </div>
      )}

      <div className="grid gap-6 p-5 md:grid-cols-[1fr_220px]">
        <div className="min-w-0">
          <div className="flex min-w-0 flex-wrap items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="text-2xl font-bold text-white">
                {idea.symbol}
              </p>

              <p className="truncate text-xs text-slate-500">
                {idea.companyName}
              </p>
            </div>

            <div className="shrink-0 text-right">
              <p className="text-2xl font-semibold text-white">
                {formatMoney(idea.price)}
              </p>

              <p
                className={
                  positiveChange
                    ? "text-emerald-400"
                    : "text-red-400"
                }
              >
                {formatPercent(
                  idea.changePercent,
                )}
              </p>
            </div>
          </div>

          <div className="relative mt-5 h-48 w-full min-w-0 max-w-full overflow-hidden rounded-lg border border-slate-800 bg-[#06101a] sm:h-56">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.05)_1px,transparent_1px)] bg-[size:40px_40px]" />

            {chart ? (
              <svg
  viewBox="0 0 600 220"
  preserveAspectRatio="none"
  className="relative block h-full w-full min-w-0 max-w-full"
                aria-label={`${idea.symbol} live price chart with 20-day EMA, entry, stop, and target`}
              >
                <line
                  x1="0"
                  y1={chart.targetY}
                  x2="600"
                  y2={chart.targetY}
                  stroke="#22c55e"
                  strokeWidth="2"
                  strokeDasharray="8 8"
                  opacity="0.9"
                />

                <line
                  x1="0"
                  y1={chart.entryY}
                  x2="600"
                  y2={chart.entryY}
                  stroke="#f59e0b"
                  strokeWidth="2"
                  strokeDasharray="8 8"
                  opacity="0.9"
                />

                <line
                  x1="0"
                  y1={chart.stopY}
                  x2="600"
                  y2={chart.stopY}
                  stroke="#ef4444"
                  strokeWidth="2"
                  strokeDasharray="8 8"
                  opacity="0.9"
                />

                {chart.emaPath && (
                  <path
                    d={chart.emaPath}
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {chart.pricePath && (
                  <path
                    d={chart.pricePath}
                    fill="none"
                    stroke="#22c55e"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}
              </svg>
            ) : (
              <div className="relative flex h-full items-center justify-center text-sm text-slate-500">
                Chart data unavailable
              </div>
            )}
          </div>

          <div className="mt-3 grid w-full min-w-0 grid-cols-3 gap-x-2 gap-y-2 text-[10px] text-slate-500 sm:flex sm:flex-wrap sm:items-center sm:gap-x-4 sm:text-[11px]">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-px w-5 bg-emerald-400" />
              Price
            </span>

            <span className="inline-flex items-center gap-1.5">
              <span className="h-px w-5 bg-blue-500" />
              20 EMA
            </span>

            <span className="inline-flex items-center gap-1.5">
              <span className="h-px w-5 border-t border-dashed border-amber-400" />
              Entry
            </span>

            <span className="inline-flex items-center gap-1.5">
              <span className="h-px w-5 border-t border-dashed border-red-400" />
              Stop
            </span>

            <span className="inline-flex items-center gap-1.5">
              <span className="h-px w-5 border-t border-dashed border-emerald-500" />
              Target
            </span>
          </div>
        </div>

        <div className="space-y-4 border-l-0 border-slate-800 md:border-l md:pl-5">
          <div>
            <p className="text-[10px] font-semibold uppercase text-yellow-400">
              Setup
            </p>

            <p className="text-sm font-semibold text-white">
              {idea.setup}
            </p>

            <p className="text-xs text-slate-500">
              {idea.setupType}
            </p>
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase text-blue-400">
              Entry
            </p>

            <p className="font-semibold text-white">
              {isShort ? "Below" : "Above"} {formatMoney(idea.entry)}
            </p>
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase text-red-400">
              Stop Loss
            </p>

            <p className="font-semibold text-white">
              {formatMoney(idea.stopLoss)}
            </p>
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase text-emerald-400">
              Target
            </p>

            <p className="font-semibold text-white">
              {formatMoney(idea.target)}
            </p>
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase text-slate-400">
              Confidence
            </p>

            <p className="mt-1 text-sm font-semibold text-white">
              {idea.confidenceScore}/100
            </p>

            <div className="mt-1 flex text-yellow-400">
              {Array.from({ length: 5 }).map(
                (_, index) => (
                  <Star
                    key={index}
                    size={17}
                    fill={
                      index <
                      idea.confidenceStars
                        ? "currentColor"
                        : "none"
                    }
                    className={
                      index <
                      idea.confidenceStars
                        ? "text-yellow-400"
                        : "text-slate-600"
                    }
                  />
                ),
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-800 px-5 py-4">
        <span className="inline-flex items-center text-sm font-medium text-blue-400 transition group-hover:text-blue-300">
          View Full Trade Breakdown →
        </span>
      </div>
    </Card>
  );
}