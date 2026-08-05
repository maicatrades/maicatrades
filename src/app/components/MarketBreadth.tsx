"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  Gauge,
  LoaderCircle,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

type AdvanceDeclinePoint = {
  date: string;
  advancing: number;
  declining: number;
  netAdvancers: number;
  value: number;
};

type MarketBreadthResponse = {
  success: boolean;
  breadthScore: number;
  breadthPercent: number;
  decliningPercent: number;
  unchangedPercent: number;

  advancing: number;
  declining: number;
  unchanged: number;
  total: number;

  advanceDeclineRatio: number;
  netAdvancers: number;

  above20Day: {
    count: number;
    total: number;
    percent: number;
  };

  above50Day: {
    count: number;
    total: number;
    percent: number;
  };

  higherHighs: {
    count: number;
    total: number;
    percent: number;
  };

  sectors: {
    positive: number;
    total: number;
    positivePercent: number;
  };

  relativePerformance: {
    spyChangePercent: number;
    rspChangePercent: number;
    relativePerformance: number;
    leader: "RSP" | "SPY" | "Equal";
    signal:
      | "Broad participation"
      | "Large-cap leadership"
      | "Neutral participation";
  } | null;

  advanceDeclineLine: {
    trend: "Rising" | "Falling" | "Flat";
    currentValue: number;
    points: AdvanceDeclinePoint[];
  };

  label: string;

  bias:
    | "Strong Participation"
    | "Healthy Participation"
    | "Mixed Participation"
    | "Weak Participation"
    | "Very Weak Participation";

  trend: {
    label:
      | "Improving"
      | "Stable"
      | "Weakening"
      | "Collecting Data"
      | "Unavailable";
    currentScore: number;
    baselineScore: number | null;
    difference: number | null;
    comparisonDays: number;
    comparisonType:
      | "Previous trading day"
      | "Average of available trading days"
      | "5-day average"
      | "No comparison available";
  };

  coverage: {
    requested: number;
    returned: number;
    percent: number;
  };

  updatedAt: string;
  error?: string;
};

function clamp(value: number, minimum = 0, maximum = 100) {
  return Math.min(maximum, Math.max(minimum, value));
}

function formatNumber(value: number, decimals = 0) {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function formatUpdatedTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Recently updated";
  }

  return `Updated ${date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  })}`;
}

function getBreadthTheme(score: number) {
  if (score >= 65) {
    return {
      text: "text-emerald-400",
      border: "border-emerald-500/30",
      background: "bg-emerald-500/10",
      gauge: "#34d399",
    };
  }

  if (score >= 45) {
    return {
      text: "text-amber-400",
      border: "border-amber-500/30",
      background: "bg-amber-500/10",
      gauge: "#fbbf24",
    };
  }

  return {
    text: "text-rose-400",
    border: "border-rose-500/30",
    background: "bg-rose-500/10",
    gauge: "#fb7185",
  };
}

function getTrendTheme(label: MarketBreadthResponse["trend"]["label"]) {
  if (label === "Improving") {
    return {
      text: "text-emerald-400",
      icon: TrendingUp,
    };
  }

  if (label === "Weakening") {
    return {
      text: "text-rose-400",
      icon: TrendingDown,
    };
  }

  if (label === "Stable") {
    return {
      text: "text-amber-400",
      icon: Activity,
    };
  }

  return {
    text: "text-slate-400",
    icon: Activity,
  };
}

function formatTrendComparison(
  trend: MarketBreadthResponse["trend"],
) {
  if (
    trend.label === "Collecting Data" ||
    trend.comparisonDays === 0 ||
    trend.difference === null
  ) {
    return "Waiting for the next completed session.";
  }

  if (trend.label === "Unavailable") {
    return "Historical comparison is unavailable.";
  }

  const difference = `${trend.difference > 0 ? "+" : ""}${formatNumber(
    trend.difference,
    1,
  )}`;

  const baseline =
    trend.comparisonDays === 1
      ? "previous session"
      : trend.comparisonDays >= 5
        ? "5-day average"
        : `${trend.comparisonDays}-day average`;

  return `${difference} points vs ${baseline}.`;
}

function MiniChart({
  points,
  trend,
}: {
  points: AdvanceDeclinePoint[];
  trend: "Rising" | "Falling" | "Flat";
}) {
  const chart = useMemo(() => {
    if (points.length < 2) {
      return null;
    }

    const width = 250;
    const height = 64;
    const horizontalPadding = 2;
    const verticalPadding = 5;

    const values = points.map((point) => point.value);
    const minimum = Math.min(...values);
    const maximum = Math.max(...values);
    const range = maximum - minimum || 1;

    const coordinates = points.map((point, index) => {
      const x =
        horizontalPadding +
        (index / (points.length - 1)) *
          (width - horizontalPadding * 2);

      const y =
        height -
        verticalPadding -
        ((point.value - minimum) / range) *
          (height - verticalPadding * 2);

      return { x, y };
    });

    const linePath = coordinates
      .map(
        (coordinate, index) =>
          `${index === 0 ? "M" : "L"} ${coordinate.x} ${coordinate.y}`,
      )
      .join(" ");

    const firstPoint = coordinates[0];
    const lastPoint = coordinates[coordinates.length - 1];

    const fillPath = `${linePath} L ${lastPoint.x} ${height} L ${firstPoint.x} ${height} Z`;

    return {
      linePath,
      fillPath,
    };
  }, [points]);

  const strokeColor =
    trend === "Rising"
      ? "#34d399"
      : trend === "Falling"
        ? "#fb7185"
        : "#94a3b8";

  if (!chart) {
    return (
      <div className="flex h-16 items-center justify-center rounded-lg border border-slate-800 bg-slate-950/35 text-xs text-slate-500">
        Trend data unavailable
      </div>
    );
  }

  return (
    <svg
      viewBox="0 0 250 64"
      className="h-16 w-full overflow-visible"
      role="img"
      aria-label={`Advance-decline line is ${trend.toLowerCase()}`}
    >
      <defs>
        <linearGradient
          id="liveBreadthChartFill"
          x1="0"
          y1="0"
          x2="0"
          y2="1"
        >
          <stop
            offset="0%"
            stopColor={strokeColor}
            stopOpacity="0.3"
          />

          <stop
            offset="100%"
            stopColor={strokeColor}
            stopOpacity="0"
          />
        </linearGradient>
      </defs>

      <path
        d={chart.fillPath}
        fill="url(#liveBreadthChartFill)"
      />

      <path
        d={chart.linePath}
        fill="none"
        stroke={strokeColor}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BreadthGauge({
  score,
  label,
}: {
  score: number;
  label: string;
}) {
  const normalizedScore = clamp(score);
  const theme = getBreadthTheme(normalizedScore);

  return (
    <div className="relative mx-auto h-44 w-36">
      <div
        className="absolute left-0 top-0 h-36 w-36 rounded-full"
        style={{
          background: `conic-gradient(
            ${theme.gauge} 0deg,
            ${theme.gauge} ${normalizedScore * 3.6}deg,
            #1e293b ${normalizedScore * 3.6}deg,
            #1e293b 360deg
          )`,
        }}
      />

      <div className="absolute left-[11px] top-[11px] flex h-[122px] w-[122px] flex-col items-center justify-center rounded-full bg-[#09131d] text-center">
        <span className="text-3xl font-bold text-white">
          {formatNumber(normalizedScore)}
        </span>

        <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
          out of 100
        </span>

      </div>

      <span
        className={`absolute bottom-0 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border px-2.5 py-1 text-[10px] font-semibold ${theme.border} ${theme.background} ${theme.text}`}
      >
        {label}
      </span>
    </div>
  );
}

function Metric({
  label,
  value,
  valueClassName = "text-white",
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/35 px-3 py-2.5">
      <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <p className={`mt-1 text-sm font-bold ${valueClassName}`}>
        {value}
      </p>
    </div>
  );
}

function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-xl border border-slate-800 bg-[#09131d] shadow-[0_10px_30px_rgba(0,0,0,0.16)] transition duration-200 group-hover:-translate-y-1 group-hover:border-blue-500/60 group-hover:shadow-[0_16px_40px_rgba(0,0,0,0.28)] ${className}`}
    >
      {children}
    </section>
  );
}

function CardTitle({
  icon: Icon,
  children,
}: {
  icon?: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
      <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-blue-400">
        {Icon && <Icon size={17} />}
        {children}
      </div>

      <span className="text-xs font-medium text-slate-500 transition group-hover:text-blue-400">
        View details →
      </span>
    </div>
  );
}

function LoadingState() {
  return (
    <Card>
      <CardTitle icon={Gauge}>Market Breadth</CardTitle>

      <div className="flex min-h-[430px] flex-col items-center justify-center px-5 py-6 text-center">
        <LoaderCircle
          size={30}
          className="animate-spin text-blue-400"
        />

        <p className="mt-3 text-sm font-medium text-slate-300">
          Calculating market breadth
        </p>

        <p className="mt-1 text-xs text-slate-500">
          Analyzing participation across the tracked market basket.
        </p>
      </div>
    </Card>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <Card>
      <CardTitle icon={Gauge}>Market Breadth</CardTitle>

      <div className="flex min-h-[430px] flex-col items-center justify-center px-6 py-8 text-center">
        <div className="rounded-full border border-rose-500/30 bg-rose-500/10 p-3 text-rose-400">
          <AlertCircle size={24} />
        </div>

        <p className="mt-4 text-sm font-semibold text-slate-200">
          Breadth data is temporarily unavailable
        </p>

        <p className="mt-2 max-w-xs text-xs leading-5 text-slate-500">
          {message}
        </p>
      </div>
    </Card>
  );
}

export default function MarketBreadth() {
  const [data, setData] =
    useState<MarketBreadthResponse | null>(null);

  const [error, setError] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    async function loadMarketBreadth() {
      try {
        setError(null);

        const response = await fetch("/api/market-breadth", {
          cache: "no-store",
          signal: controller.signal,
        });

        const result =
          (await response.json()) as MarketBreadthResponse;

        if (!response.ok || !result.success) {
          throw new Error(
            result.error ?? "Unable to load market breadth.",
          );
        }

        setData(result);
      } catch (requestError) {
        if (
          requestError instanceof DOMException &&
          requestError.name === "AbortError"
        ) {
          return;
        }

        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to load market breadth.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    loadMarketBreadth();

    const refreshInterval = window.setInterval(
      loadMarketBreadth,
      5 * 60 * 1000,
    );

    return () => {
      controller.abort();
      window.clearInterval(refreshInterval);
    };
  }, []);

  if (isLoading) {
    return <LoadingState />;
  }

  if (error || !data) {
    return (
      <ErrorState
        message={
          error ??
          "No valid breadth information was returned."
        }
      />
    );
  }

  const theme = getBreadthTheme(data.breadthScore);
  const breadthTrendTheme = getTrendTheme(data.trend.label);
  const BreadthTrendIcon = breadthTrendTheme.icon;

  const trendIcon =
    data.advanceDeclineLine.trend === "Rising"
      ? TrendingUp
      : data.advanceDeclineLine.trend === "Falling"
        ? TrendingDown
        : Activity;

  const TrendIcon = trendIcon;

  const trendClass =
    data.advanceDeclineLine.trend === "Rising"
      ? "text-emerald-400"
      : data.advanceDeclineLine.trend === "Falling"
        ? "text-rose-400"
        : "text-slate-400";

  return (
    <Link
      href="/markets/breadth"
      className="group block rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      aria-label="View detailed market breadth"
    >
      <Card>
        <CardTitle icon={Gauge}>Market Breadth</CardTitle>

        <div className="px-4 py-5">
          <div className="grid grid-cols-[145px_1fr] items-center gap-4">
            <BreadthGauge
              score={data.breadthScore}
              label={data.label}
            />

            <div className="space-y-2">
              <Metric
                label="Advancing"
                value={`${formatNumber(
                  data.breadthPercent,
                  1,
                )}%`}
                valueClassName="text-emerald-400"
              />

              <Metric
                label="Declining"
                value={`${formatNumber(
                  data.decliningPercent,
                  1,
                )}%`}
                valueClassName="text-rose-400"
              />

              <Metric
                label="A/D Ratio"
                value={formatNumber(
                  data.advanceDeclineRatio,
                  2,
                )}
                valueClassName={
                  data.advanceDeclineRatio >= 1
                    ? "text-emerald-400"
                    : "text-rose-400"
                }
              />
            </div>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-2">
            <Metric
              label="Above 20D"
              value={`${formatNumber(
                data.above20Day.percent,
              )}%`}
            />

            <Metric
              label="Above 50D"
              value={`${formatNumber(
                data.above50Day.percent,
              )}%`}
            />

            <Metric
              label="Sectors"
              value={`${data.sectors.positive}/${data.sectors.total}`}
            />
          </div>

          <div className="mt-4 rounded-lg border border-slate-800 bg-slate-950/30 px-3 py-3">
            <div className="mb-1 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <TrendIcon
                  size={14}
                  className={trendClass}
                />

                <span className="text-xs font-semibold text-slate-300">
                  A/D Line
                </span>
              </div>

              <span
                className={`text-xs font-semibold ${trendClass}`}
              >
                {data.advanceDeclineLine.trend}
              </span>
            </div>

            <MiniChart
              points={data.advanceDeclineLine.points}
              trend={data.advanceDeclineLine.trend}
            />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="flex min-h-[82px] flex-col items-center justify-center rounded-lg border border-slate-800 bg-slate-950/25 px-3 py-3 text-center">
              <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
                Trend
              </p>

              <div
                className={`mt-1 flex items-center justify-center gap-1.5 text-sm font-semibold leading-5 ${breadthTrendTheme.text}`}
              >
                <BreadthTrendIcon size={15} />
                <span>{data.trend.label}</span>
              </div>

              <p className="mt-1 text-[11px] leading-4 text-slate-500">
                {formatTrendComparison(data.trend)}
              </p>
            </div>

            <div className="flex min-h-[82px] flex-col items-center justify-center rounded-lg border border-slate-800 bg-slate-950/25 px-3 py-3 text-center">
              <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
                Equal weight
              </p>

              <p className="mt-1 text-xs font-semibold leading-5 text-slate-300">
                {data.relativePerformance?.signal ??
                  "Signal unavailable"}
              </p>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-slate-800 pt-3 text-[10px] text-slate-600">
            <span>
              Coverage: {data.coverage.returned}/
              {data.coverage.requested} stocks
            </span>

            <span>{formatUpdatedTime(data.updatedAt)}</span>
          </div>
        </div>
      </Card>
    </Link>
  );
}