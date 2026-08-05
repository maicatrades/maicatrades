"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  BarChart3,
  Gauge,
  LoaderCircle,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

type BreadthBias =
  | "Strongly Bullish"
  | "Moderately Bullish"
  | "Bullish"
  | "Neutral"
  | "Bearish"
  | "Moderately Bearish"
  | "Strongly Bearish";

type StockItem = {
  symbol: string;
  sector: string;
  price: number;
  previousClose: number;
  change: number;
  changePercent: number;
  direction: "advancing" | "declining" | "unchanged";
  above20DayAverage: boolean | null;
  above50DayAverage: boolean | null;
  higherHigh: boolean | null;
  movingAverage20: number | null;
  movingAverage50: number | null;
};

type SectorParticipation = {
  sector: string;
  advancing: number;
  declining: number;
  unchanged: number;
  total: number;
  participationPercent: number;
  positive: boolean;
  status: "Strong" | "Positive" | "Mixed" | "Weak";
};

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
    participation: SectorParticipation[];
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
  bias: BreadthBias;

  strongestStocks: StockItem[];
  weakestStocks: StockItem[];

  coverage: {
    requested: number;
    returned: number;
    percent: number;
  };

  methodology?: {
    universe: string;
    scoreWeights: {
      advancingParticipation: number;
      above20DayAverage: number;
      above50DayAverage: number;
      positiveSectors: number;
      rspVersusSpy: number;
    };
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

function formatPercent(value: number, decimals = 1) {
  const prefix = value > 0 ? "+" : "";

  return `${prefix}${formatNumber(value, decimals)}%`;
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

function getTheme(score: number) {
  if (score >= 80) {
    return {
      text: "text-emerald-400",
      border: "border-emerald-500/30",
      background: "bg-emerald-500/10",
      gauge: "#34d399",
      glow: "rgba(52, 211, 153, 0.12)",
    };
  }

  if (score >= 60) {
    return {
      text: "text-amber-400",
      border: "border-amber-500/30",
      background: "bg-amber-500/10",
      gauge: "#fbbf24",
      glow: "rgba(251, 191, 36, 0.12)",
    };
  }

  if (score >= 45) {
    return {
      text: "text-orange-400",
      border: "border-orange-500/30",
      background: "bg-orange-500/10",
      gauge: "#fb923c",
      glow: "rgba(251, 146, 60, 0.12)",
    };
  }

  return {
    text: "text-rose-400",
    border: "border-rose-500/30",
    background: "bg-rose-500/10",
    gauge: "#fb7185",
    glow: "rgba(251, 113, 133, 0.12)",
  };
}

function getHeadline(data: MarketBreadthResponse) {
  if (data.breadthScore >= 80) {
    return "Strong participation is supporting the market";
  }

  if (data.breadthScore >= 65) {
    return "Healthy participation is supporting the market";
  }

  if (data.breadthScore >= 55) {
    return "Participation is improving across the market";
  }

  if (data.breadthScore >= 45) {
    return "Market participation remains mixed";
  }

  if (data.breadthScore >= 30) {
    return "Participation is weakening beneath the indexes";
  }

  return "Broad market participation is under pressure";
}

function getParticipationLabel(score: number) {
  if (score >= 80) {
    return "Strong Participation";
  }

  if (score >= 65) {
    return "Healthy Participation";
  }

  if (score >= 55) {
    return "Improving Participation";
  }

  if (score >= 45) {
    return "Mixed Participation";
  }

  if (score >= 30) {
    return "Weak Participation";
  }

  return "Broad Selling Pressure";
}

function getInterpretation(data: MarketBreadthResponse) {
  const advancingText =
    data.breadthPercent >= 60
      ? "A clear majority of the tracked stocks are advancing."
      : data.breadthPercent >= 45
        ? "Participation is split across the tracked market basket."
        : "More tracked stocks are declining than advancing.";

  const trendText =
    data.advanceDeclineLine.trend === "Rising"
      ? "The advance-decline line is rising, showing that participation has recently improved."
      : data.advanceDeclineLine.trend === "Falling"
        ? "The advance-decline line is falling, which suggests participation is deteriorating."
        : "The advance-decline line is relatively flat, showing limited improvement in participation.";

  const relativeText = data.relativePerformance
    ? data.relativePerformance.signal === "Broad participation"
      ? "Equal-weight stocks are outperforming SPY, which suggests the move is extending beyond the largest companies."
      : data.relativePerformance.signal === "Large-cap leadership"
        ? "SPY is outperforming its equal-weight counterpart, indicating that large-cap stocks are carrying more of the market move."
        : "Equal-weight and capitalization-weighted performance are currently balanced."
    : "";

  return `${advancingText} ${trendText} ${relativeText}`;
}

function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <article
      className={`rounded-xl border border-slate-800 bg-[#09131d] shadow-[0_14px_40px_rgba(0,0,0,0.18)] ${className}`}
    >
      {children}
    </article>
  );
}

function ScoreGauge({ score }: { score: number }) {
  const normalizedScore = clamp(score);
  const theme = getTheme(normalizedScore);

  return (
    <div className="shrink-0">
      <div className="relative h-44 w-44">
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: `conic-gradient(
              ${theme.gauge} 0deg,
              ${theme.gauge} ${normalizedScore * 3.6}deg,
              #1e293b ${normalizedScore * 3.6}deg,
              #1e293b 360deg
            )`,
            boxShadow: `0 0 38px ${theme.glow}`,
          }}
        />

        <div className="absolute inset-[13px] flex flex-col items-center justify-center rounded-full border border-slate-800 bg-[#09131d]">
          <span className="text-5xl font-bold leading-none text-white">
            {formatNumber(normalizedScore)}
          </span>

          <span className="mt-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Participation Score
          </span>

          <span
            className={`mt-3 max-w-[125px] text-center text-xs font-semibold leading-4 ${theme.text}`}
          >
            {getParticipationLabel(normalizedScore)}
          </span>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  description,
  direction = "neutral",
}: {
  label: string;
  value: string;
  description: string;
  direction?: "positive" | "negative" | "neutral";
}) {
  const valueClass =
    direction === "positive"
      ? "text-emerald-400"
      : direction === "negative"
        ? "text-rose-400"
        : "text-white";

  const Icon =
    direction === "positive"
      ? TrendingUp
      : direction === "negative"
        ? TrendingDown
        : Activity;

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-400">{label}</p>
          <p className={`mt-2 text-3xl font-bold ${valueClass}`}>
            {value}
          </p>
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-2">
          <Icon size={19} className={valueClass} />
        </div>
      </div>

      <p className="mt-3 text-sm leading-5 text-slate-500">
        {description}
      </p>
    </Card>
  );
}

function ParticipationBar({
  label,
  value,
  valueLabel,
}: {
  label: string;
  value: number;
  valueLabel?: string;
}) {
  const normalizedValue = clamp(value);

  const barClass =
    normalizedValue >= 60
      ? "bg-emerald-400"
      : normalizedValue >= 45
        ? "bg-amber-400"
        : "bg-rose-400";

  const textClass =
    normalizedValue >= 60
      ? "text-emerald-400"
      : normalizedValue >= 45
        ? "text-amber-400"
        : "text-rose-400";

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3 text-sm">
        <span className="text-slate-400">{label}</span>

        <span className={`font-semibold ${textClass}`}>
          {valueLabel ?? `${formatNumber(value, 1)}%`}
        </span>
      </div>

      <div className="h-2.5 overflow-hidden rounded-full bg-slate-800">
        <div
          className={`h-full rounded-full transition-all duration-700 ${barClass}`}
          style={{ width: `${normalizedValue}%` }}
        />
      </div>
    </div>
  );
}

function AdvanceDeclineChart({
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

    const width = 760;
    const height = 260;
    const horizontalPadding = 28;
    const verticalPadding = 24;

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

      return {
        x,
        y,
        point,
      };
    });

    const linePath = coordinates
      .map(
        (coordinate, index) =>
          `${index === 0 ? "M" : "L"} ${coordinate.x} ${coordinate.y}`,
      )
      .join(" ");

    const firstPoint = coordinates[0];
    const lastPoint = coordinates[coordinates.length - 1];

    const fillPath = `${linePath} L ${lastPoint.x} ${
      height - verticalPadding
    } L ${firstPoint.x} ${height - verticalPadding} Z`;

    return {
      linePath,
      fillPath,
      coordinates,
      minimum,
      maximum,
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
      <div className="flex h-64 items-center justify-center rounded-xl border border-slate-800 bg-slate-950/30 text-sm text-slate-500">
        Advance-decline history is unavailable.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <svg
        viewBox="0 0 760 260"
        className="w-full min-w-[680px]"
        role="img"
        aria-label={`Advance-decline line is ${trend.toLowerCase()}`}
      >
        <defs>
          <linearGradient
            id="breadthPageChartFill"
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <stop
              offset="0%"
              stopColor={strokeColor}
              stopOpacity="0.28"
            />
            <stop
              offset="100%"
              stopColor={strokeColor}
              stopOpacity="0"
            />
          </linearGradient>
        </defs>

        {[0.2, 0.4, 0.6, 0.8].map((position) => (
          <line
            key={position}
            x1="28"
            y1={260 * position}
            x2="732"
            y2={260 * position}
            stroke="#1e293b"
            strokeWidth="1"
          />
        ))}

        <path
          d={chart.fillPath}
          fill="url(#breadthPageChartFill)"
        />

        <path
          d={chart.linePath}
          fill="none"
          stroke={strokeColor}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {chart.coordinates.map(({ x, y, point }, index) => (
          <circle
            key={`${point.date}-${index}`}
            cx={x}
            cy={y}
            r="3"
            fill={strokeColor}
          />
        ))}

        <text x="28" y="18" fill="#64748b" fontSize="11">
          {formatNumber(chart.maximum)}
        </text>

        <text x="28" y="252" fill="#64748b" fontSize="11">
          {formatNumber(chart.minimum)}
        </text>
      </svg>
    </div>
  );
}

function StockTable({
  title,
  stocks,
  type,
}: {
  title: string;
  stocks: StockItem[];
  type: "strongest" | "weakest";
}) {
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
        <h2 className="font-semibold text-slate-100">{title}</h2>

        {type === "strongest" ? (
          <TrendingUp size={18} className="text-emerald-400" />
        ) : (
          <TrendingDown size={18} className="text-rose-400" />
        )}
      </div>

      <div className="divide-y divide-slate-800">
        {stocks.map((stock) => (
          <div
            key={stock.symbol}
            className="flex items-center justify-between gap-4 px-5 py-4"
          >
            <div>
              <p className="font-semibold text-white">
                {stock.symbol}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                {stock.sector}
              </p>
            </div>

            <div className="text-right">
              <p
                className={`font-semibold ${
                  stock.changePercent >= 0
                    ? "text-emerald-400"
                    : "text-rose-400"
                }`}
              >
                {formatPercent(stock.changePercent, 2)}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                ${formatNumber(stock.price, 2)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function LoadingState() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#050b12] px-4 text-slate-100">
      <div className="text-center">
        <LoaderCircle
          size={38}
          className="mx-auto animate-spin text-blue-400"
        />

        <p className="mt-4 font-semibold text-slate-200">
          Calculating market breadth
        </p>

        <p className="mt-2 text-sm text-slate-500">
          Reviewing participation across the tracked market basket.
        </p>
      </div>
    </main>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#050b12] px-4 text-slate-100">
      <div className="max-w-md rounded-2xl border border-rose-500/20 bg-[#09131d] p-8 text-center">
        <AlertCircle
          size={34}
          className="mx-auto text-rose-400"
        />

        <h1 className="mt-4 text-xl font-bold">
          Breadth data is unavailable
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-400">
          {message}
        </p>

        <Link
          href="/dashboard"
          className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-blue-400 hover:text-blue-300"
        >
          <ArrowLeft size={16} />
          Back to dashboard
        </Link>
      </div>
    </main>
  );
}

export default function MarketBreadthPage() {
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
          error ?? "No valid market breadth data was returned."
        }
      />
    );
  }

  const theme = getTheme(data.breadthScore);

  const trendClass =
    data.advanceDeclineLine.trend === "Rising"
      ? "text-emerald-400"
      : data.advanceDeclineLine.trend === "Falling"
        ? "text-rose-400"
        : "text-slate-400";

  return (
    <main className="min-h-screen bg-[#050b12] text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-blue-400"
          >
            <ArrowLeft size={16} />
            Back to dashboard
          </Link>

          <p className="text-xs text-slate-600">
            Updated {formatTime(data.updatedAt)}
          </p>
        </div>

        <section className="mt-6 rounded-2xl border border-slate-800 bg-[#09131d] p-6 shadow-[0_18px_50px_rgba(0,0,0,0.22)] sm:p-8">
          <div className="flex flex-col gap-10 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl">
              <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-blue-400">
                <Gauge size={18} />
                Market Breadth
              </div>

              <h1 className="mt-3 text-3xl font-bold leading-tight sm:text-4xl">
                {getHeadline(data)}
              </h1>

              <p className="mt-4 text-sm leading-7 text-slate-400 sm:text-base">
                Market breadth measures the health of the market beneath
                the major indexes. It tracks participation, trend strength,
                sector breadth, equal-weight performance, and the
                advance-decline trend to show whether market moves are
                broadly supported or narrowly driven.
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                <span
                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${theme.border} ${theme.background} ${theme.text}`}
                >
                 {getParticipationLabel(data.breadthScore)}
                </span>

                <span className="rounded-full border border-slate-700 bg-slate-900/70 px-3 py-1 text-xs font-semibold text-slate-300">
                  {data.advancing} of {data.total} advancing
                </span>

                <span
                  className={`rounded-full border border-slate-700 bg-slate-900/70 px-3 py-1 text-xs font-semibold ${trendClass}`}
                >
                  A/D line{" "}
                  {data.advanceDeclineLine.trend.toLowerCase()}
                </span>
              </div>
            </div>

            <ScoreGauge score={data.breadthScore} />
          </div>
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Advancing Stocks"
            value={`${formatNumber(data.breadthPercent, 1)}%`}
            description={`${data.advancing} of ${data.total} tracked stocks are trading above their previous close.`}
            direction={
              data.breadthPercent >= 50
                ? "positive"
                : "negative"
            }
          />

          <MetricCard
            label="Declining Stocks"
            value={`${formatNumber(data.decliningPercent, 1)}%`}
            description={`${data.declining} tracked stocks are trading below their previous close.`}
            direction={
              data.decliningPercent > 50
                ? "negative"
                : "neutral"
            }
          />

          <MetricCard
            label="Advance/Decline Ratio"
            value={formatNumber(data.advanceDeclineRatio, 2)}
            description="The number of advancing stocks divided by declining stocks."
            direction={
              data.advanceDeclineRatio >= 1
                ? "positive"
                : "negative"
            }
          />

          <MetricCard
            label="Positive Sectors"
            value={`${data.sectors.positive}/${data.sectors.total}`}
            description={`${formatNumber(
              data.sectors.positivePercent,
              1,
            )}% of tracked sectors have majority participation.`}
            direction={
              data.sectors.positivePercent >= 50
                ? "positive"
                : "negative"
            }
          />
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
          <Card className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">
                  Participation overview
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Current strength across price, trend, and sector
                  participation.
                </p>
              </div>

              <BarChart3 size={21} className="text-blue-400" />
            </div>

            <div className="mt-7 space-y-6">
              <ParticipationBar
                label="Advancing stocks"
                value={data.breadthPercent}
              />

              <ParticipationBar
                label="Above 20-day moving average"
                value={data.above20Day.percent}
                valueLabel={`${data.above20Day.count}/${data.above20Day.total} · ${formatNumber(
                  data.above20Day.percent,
                )}%`}
              />

              <ParticipationBar
                label="Above 50-day moving average"
                value={data.above50Day.percent}
                valueLabel={`${data.above50Day.count}/${data.above50Day.total} · ${formatNumber(
                  data.above50Day.percent,
                )}%`}
              />

              <ParticipationBar
                label="Making short-term higher highs"
                value={data.higherHighs.percent}
                valueLabel={`${data.higherHighs.count}/${data.higherHighs.total} · ${formatNumber(
                  data.higherHighs.percent,
                )}%`}
              />

              <ParticipationBar
                label="Positive sectors"
                value={data.sectors.positivePercent}
                valueLabel={`${data.sectors.positive}/${data.sectors.total} · ${formatNumber(
                  data.sectors.positivePercent,
                )}%`}
              />
            </div>

            <div className="mt-8 rounded-xl border border-slate-800 bg-[#050b12] p-5">
              <p className="text-sm font-semibold text-slate-200">
                What This Means
              </p>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                {getInterpretation(data)}
              </p>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-semibold">
              Equal-weight confirmation
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Comparing RSP with SPY helps show whether performance is
              broad or concentrated.
            </p>

            {data.relativePerformance ? (
              <>
                <div className="mt-6 grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-slate-800 bg-slate-950/35 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-500">
                      SPY
                    </p>

                    <p
                      className={`mt-2 text-2xl font-bold ${
                        data.relativePerformance.spyChangePercent >= 0
                          ? "text-emerald-400"
                          : "text-rose-400"
                      }`}
                    >
                      {formatPercent(
                        data.relativePerformance.spyChangePercent,
                        2,
                      )}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950/35 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-500">
                      RSP
                    </p>

                    <p
                      className={`mt-2 text-2xl font-bold ${
                        data.relativePerformance.rspChangePercent >= 0
                          ? "text-emerald-400"
                          : "text-rose-400"
                      }`}
                    >
                      {formatPercent(
                        data.relativePerformance.rspChangePercent,
                        2,
                      )}
                    </p>
                  </div>
                </div>

                <div className="mt-4 rounded-xl border border-blue-500/20 bg-blue-500/10 p-4">
                  <p className="text-xs uppercase tracking-wide text-blue-300">
                    Current signal
                  </p>

                  <p className="mt-2 font-semibold text-white">
                    {data.relativePerformance.signal}
                  </p>

                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    {data.relativePerformance.leader === "RSP"
                      ? "The equal-weight index is outperforming, which suggests participation extends beyond the largest stocks."
                      : data.relativePerformance.leader === "SPY"
                        ? "The capitalization-weighted index is leading, suggesting market strength is concentrated in larger companies."
                        : "Performance is balanced between equal-weight and capitalization-weighted stocks."}
                  </p>
                </div>
              </>
            ) : (
              <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950/35 p-5 text-sm text-slate-500">
                Relative performance data is temporarily unavailable.
              </div>
            )}
          </Card>
        </section>

        <section className="mt-6">
          <Card className="p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">
                  Advance-decline line
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  A cumulative view of advancing stocks minus declining
                  stocks over the latest sessions.
                </p>
              </div>

              <div className="text-right">
                <p className={`text-sm font-semibold ${trendClass}`}>
                  {data.advanceDeclineLine.trend}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Current value:{" "}
                  {formatNumber(
                    data.advanceDeclineLine.currentValue,
                  )}
                </p>
              </div>
            </div>

            <div className="mt-6">
              <AdvanceDeclineChart
                points={data.advanceDeclineLine.points}
                trend={data.advanceDeclineLine.trend}
              />
            </div>
          </Card>
        </section>

        <section className="mt-6">
          <Card className="overflow-hidden">
            <div className="border-b border-slate-800 px-6 py-5">
              <h2 className="text-lg font-semibold">
                Sector participation
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Percentage of tracked stocks advancing within each
                sector.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left">
                <thead className="border-b border-slate-800 bg-slate-950/25 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-6 py-4 font-medium">
                      Sector
                    </th>

                    <th className="px-6 py-4 font-medium">
                      Advancing
                    </th>

                    <th className="px-6 py-4 font-medium">
                      Declining
                    </th>

                    <th className="px-6 py-4 font-medium">
                      Participation
                    </th>

                    <th className="px-6 py-4 font-medium">
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-800">
                  {[...data.sectors.participation]
                    .sort(
                      (a, b) =>
                        b.participationPercent -
                        a.participationPercent,
                    )
                    .map((sector) => {
                      const statusClass =
                        sector.status === "Strong" ||
                        sector.status === "Positive"
                          ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                          : sector.status === "Mixed"
                            ? "border-amber-500/20 bg-amber-500/10 text-amber-400"
                            : "border-rose-500/20 bg-rose-500/10 text-rose-400";

                      return (
                        <tr
                          key={sector.sector}
                          className="transition hover:bg-slate-900/30"
                        >
                          <td className="px-6 py-4 font-medium text-slate-200">
                            {sector.sector}
                          </td>

                          <td className="px-6 py-4 text-emerald-400">
                            {sector.advancing}
                          </td>

                          <td className="px-6 py-4 text-rose-400">
                            {sector.declining}
                          </td>

                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-2 w-28 overflow-hidden rounded-full bg-slate-800">
                                <div
                                  className={`h-full rounded-full ${
                                    sector.participationPercent >= 60
                                      ? "bg-emerald-400"
                                      : sector.participationPercent >=
                                          45
                                        ? "bg-amber-400"
                                        : "bg-rose-400"
                                  }`}
                                  style={{
                                    width: `${clamp(
                                      sector.participationPercent,
                                    )}%`,
                                  }}
                                />
                              </div>

                              <span className="text-sm text-slate-300">
                                {formatNumber(
                                  sector.participationPercent,
                                )}
                                %
                              </span>
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <span
                              className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClass}`}
                            >
                              {sector.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </Card>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <StockTable
            title="Strongest tracked stocks"
            stocks={data.strongestStocks}
            type="strongest"
          />

          <StockTable
            title="Weakest tracked stocks"
            stocks={data.weakestStocks}
            type="weakest"
          />
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <Card className="p-6">
            <h2 className="text-lg font-semibold">
              How to use market breadth
            </h2>

            <div className="mt-5 space-y-5 text-sm leading-6 text-slate-400">
              <div>
                <p className="font-semibold text-slate-200">
                  Confirm market strength
                </p>

                <p>
                  Rising indexes supported by stronger breadth
                  generally reflect a healthier market move.
                </p>
              </div>

              <div>
                <p className="font-semibold text-slate-200">
                  Watch for divergence
                </p>

                <p>
                  An index moving higher while the advance-decline line
                  falls may show that fewer stocks are supporting the
                  rally.
                </p>
              </div>

              <div>
                <p className="font-semibold text-slate-200">
                  Manage exposure
                </p>

                <p>
                  Improving breadth may support broader exposure. Weak
                  participation may justify smaller positions and
                  tighter risk controls.
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-semibold">
              Calculation methodology
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-400">
              The current score is calculated from a curated,
              multi-sector basket of large-cap U.S. stocks.
            </p>

            <div className="mt-5 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">
                  Advancing participation
                </span>

                <span className="font-semibold text-slate-200">
                  40%
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">
                  Above 20-day average
                </span>

                <span className="font-semibold text-slate-200">
                  20%
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">
                  Above 50-day average
                </span>

                <span className="font-semibold text-slate-200">
                  20%
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">
                  Positive sector participation
                </span>

                <span className="font-semibold text-slate-200">
                  10%
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">
                  RSP versus SPY
                </span>

                <span className="font-semibold text-slate-200">
                  10%
                </span>
              </div>
            </div>

            <div className="mt-5 border-t border-slate-800 pt-4 text-xs text-slate-600">
              Data coverage: {data.coverage.returned}/
              {data.coverage.requested} tracked stocks
            </div>
          </Card>
        </section>

        <p className="mt-8 text-center text-xs text-slate-600">
          Market information is provided for educational purposes only
          and is not financial advice.
        </p>
      </div>
    </main>
  );
}