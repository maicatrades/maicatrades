"use client";

import Link from "next/link";
import {
  Activity,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  ShieldAlert,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

type MarketEnvironment = {
  bias: string;
  riskLevel: string;
  approach: string;
};

type SectorPerformanceItem = {
  name: string;
  symbol: string;
  price: number;
  previousClose: number;
  changePercent: number;
};

type ScoreTrend =
  | "Improving"
  | "Weakening"
  | "Stable"
  | "Unavailable";

type DashboardSummaryProps = {
  environment: MarketEnvironment | null;
  score: number;
  scoreColor: string;
  marketScoreLoading: boolean;

  previousScore?: number | null;
  previousTradingDate?: string | null;
  scoreChange?: number | null;
  scoreTrend?: ScoreTrend | string | null;

  leadingSector?: SectorPerformanceItem;
  weakestSector?: SectorPerformanceItem;
  sectorLoading: boolean;
};

function SummaryCard({
  children,
  href,
  ariaLabel,
}: {
  children: React.ReactNode;
  href?: string;
  ariaLabel?: string;
}) {
  const card = (
    <section
      className={`relative min-h-[185px] overflow-hidden rounded-xl border border-slate-800 bg-[#09131d] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.16)] transition duration-200 ${
        href
          ? "group-hover:-translate-y-1 group-hover:border-blue-500/60 group-hover:shadow-[0_16px_40px_rgba(0,0,0,0.28)]"
          : ""
      }`}
    >
      {children}

      {href && (
        <span className="absolute bottom-4 right-4 text-xs font-medium text-slate-600 transition group-hover:text-blue-400">
          View details →
        </span>
      )}
    </section>
  );

  if (!href) {
    return <div className="block rounded-xl">{card}</div>;
  }

  return (
    <Link
      href={href}
      aria-label={ariaLabel}
      className="group block rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
    >
      {card}
    </Link>
  );
}

function getEnvironmentStyle(bias?: string) {
  if (
    bias === "Aggressive Bullish" ||
    bias === "Strong Bullish" ||
    bias === "Bullish"
  ) {
    return {
      icon: TrendingUp,
      iconClass: "text-emerald-400",
      containerClass:
        "border-emerald-500/20 bg-emerald-500/10",
    };
  }

  if (bias === "Bearish" || bias === "Strong Bearish") {
    return {
      icon: TrendingDown,
      iconClass: "text-red-400",
      containerClass: "border-red-500/20 bg-red-500/10",
    };
  }

  return {
    icon: Activity,
    iconClass: "text-yellow-400",
    containerClass:
      "border-yellow-500/20 bg-yellow-500/10",
  };
}

function getRiskStyle(riskLevel?: string) {
  if (riskLevel === "Low") {
    return {
      textClass: "text-emerald-400",
      barClass: "bg-emerald-400",
      iconClass: "text-emerald-400",
      containerClass:
        "border-emerald-500/20 bg-emerald-500/10",
    };
  }

  if (riskLevel === "Moderate") {
    return {
      textClass: "text-yellow-400",
      barClass: "bg-yellow-400",
      iconClass: "text-yellow-400",
      containerClass:
        "border-yellow-500/20 bg-yellow-500/10",
    };
  }

  if (riskLevel === "Elevated") {
    return {
      textClass: "text-orange-400",
      barClass: "bg-orange-400",
      iconClass: "text-orange-400",
      containerClass:
        "border-orange-500/20 bg-orange-500/10",
    };
  }

  if (riskLevel === "High") {
    return {
      textClass: "text-red-400",
      barClass: "bg-red-400",
      iconClass: "text-red-400",
      containerClass:
        "border-red-500/20 bg-red-500/10",
    };
  }

  return {
    textClass: "text-slate-300",
    barClass: "bg-slate-400",
    iconClass: "text-slate-400",
    containerClass:
      "border-slate-500/20 bg-slate-500/10",
  };
}

function getScoreTrendStyle(scoreTrend?: string | null) {
  if (scoreTrend === "Improving") {
    return {
      icon: ArrowUpRight,
      textClass: "text-emerald-400",
      containerClass:
        "border-emerald-500/20 bg-emerald-500/10",
    };
  }

  if (scoreTrend === "Weakening") {
    return {
      icon: ArrowDownRight,
      textClass: "text-red-400",
      containerClass: "border-red-500/20 bg-red-500/10",
    };
  }

  if (scoreTrend === "Stable") {
    return {
      icon: ArrowRight,
      textClass: "text-yellow-400",
      containerClass:
        "border-yellow-500/20 bg-yellow-500/10",
    };
  }

  return {
    icon: Activity,
    textClass: "text-slate-400",
    containerClass:
      "border-slate-700 bg-slate-800/50",
  };
}

function getSectorTitleSize(name?: string) {
  const length = name?.length ?? 0;

  if (length > 21) {
    return "text-[22px]";
  }

  if (length > 16) {
    return "text-2xl";
  }

  return "text-3xl";
}

function formatComparisonDate(date?: string | null) {
  if (!date) {
    return null;
  }

  const parsedDate = new Date(`${date}T12:00:00`);

  if (Number.isNaN(parsedDate.getTime())) {
    return date;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(parsedDate);
}

export default function DashboardSummary({
  environment,
  score,
  scoreColor,
  marketScoreLoading,
  previousScore = null,
  previousTradingDate = null,
  scoreChange = null,
  scoreTrend = "Unavailable",
  leadingSector,
  weakestSector,
  sectorLoading,
}: DashboardSummaryProps) {
  const riskScore = Math.max(0, Math.min(100, 100 - score));

  const environmentStyle = getEnvironmentStyle(environment?.bias);
  const EnvironmentIcon = environmentStyle.icon;

  const riskStyle = getRiskStyle(environment?.riskLevel);

  const trendStyle = getScoreTrendStyle(scoreTrend);
  const ScoreTrendIcon = trendStyle.icon;

  const formattedPreviousDate = formatComparisonDate(
    previousTradingDate,
  );

  const hasComparison =
    previousScore !== null &&
    scoreChange !== null &&
    scoreTrend !== "Unavailable";

  const formattedScoreChange =
    scoreChange !== null
      ? `${scoreChange > 0 ? "+" : ""}${scoreChange}`
      : null;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <SummaryCard>
        <div
          className={`absolute right-4 top-4 rounded-xl border p-3 ${environmentStyle.containerClass}`}
        >
          <EnvironmentIcon
            size={25}
            className={environmentStyle.iconClass}
          />
        </div>

        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Today&apos;s Environment
        </p>

        <p className={`mt-5 text-3xl font-bold ${scoreColor}`}>
          {environment?.bias ?? "Loading"}
        </p>

        <p className="mt-3 max-w-[230px] pr-5 text-sm leading-6 text-slate-400">
          {environment?.approach ??
            "Calculating current conditions..."}
        </p>

        {!marketScoreLoading && (
          <div className="mt-4 pr-20">
            {hasComparison ? (
              <div
                className={`inline-flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs font-semibold ${trendStyle.containerClass} ${trendStyle.textClass}`}
              >
                <ScoreTrendIcon size={14} />

                <span>{scoreTrend}</span>

                <span className="text-slate-500">•</span>

                <span>{formattedScoreChange} points</span>

                {formattedPreviousDate && (
                  <>
                    <span className="text-slate-500">since</span>
                    <span>{formattedPreviousDate}</span>
                  </>
                )}
              </div>
            ) : (
              <div
                className={`inline-flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs font-medium ${trendStyle.containerClass} ${trendStyle.textClass}`}
              >
                <ScoreTrendIcon size={14} />
                <span>Baseline established</span>
              </div>
            )}
          </div>
        )}
      </SummaryCard>

      <SummaryCard
        href="/markets/sectors"
        ariaLabel="View detailed leading sector performance"
      >
        <div className="absolute right-4 top-4 rounded-xl border border-blue-500/20 bg-blue-500/10 p-3">
          <BarChart3 size={25} className="text-blue-400" />
        </div>

        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Leading Sector
        </p>

        <div className="flex min-h-[112px] flex-col justify-center pb-5 pt-4">
          <p
            className={`max-w-[230px] font-bold leading-tight text-blue-400 ${getSectorTitleSize(
              leadingSector?.name,
            )}`}
          >
            {sectorLoading
              ? "Loading"
              : leadingSector?.name ?? "Unavailable"}
          </p>

          <div className="mt-4 flex items-center gap-3">
            <span className="text-lg font-semibold text-white">
              {leadingSector?.symbol ?? "—"}
            </span>

            <span
              className={`text-sm font-semibold ${
                leadingSector &&
                leadingSector.changePercent >= 0
                  ? "text-emerald-400"
                  : "text-red-400"
              }`}
            >
              {leadingSector
                ? `${
                    leadingSector.changePercent >= 0 ? "+" : ""
                  }${leadingSector.changePercent.toFixed(2)}%`
                : "—"}
            </span>
          </div>
        </div>

        {leadingSector && (
          <p className="absolute bottom-4 left-5 text-xs text-slate-500">
            ${leadingSector.price.toFixed(2)} current price
          </p>
        )}
      </SummaryCard>

      <SummaryCard
        href="/markets/sectors"
        ariaLabel="View detailed weakest sector performance"
      >
        <div className="absolute right-4 top-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3">
          <TrendingDown size={25} className="text-red-400" />
        </div>

        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Weakest Sector
        </p>

        <div className="flex min-h-[112px] flex-col items-center justify-center pb-6 pt-4 text-center">
          <p
            className={`max-w-[230px] font-bold leading-tight text-red-400 ${getSectorTitleSize(
              weakestSector?.name,
            )}`}
          >
            {sectorLoading
              ? "Loading"
              : weakestSector?.name ?? "Unavailable"}
          </p>

          <div className="mt-4 flex items-center justify-center gap-3">
            <span className="text-lg font-semibold text-white">
              {weakestSector?.symbol ?? "—"}
            </span>

            <span
              className={`text-sm font-semibold ${
                weakestSector &&
                weakestSector.changePercent >= 0
                  ? "text-emerald-400"
                  : "text-red-400"
              }`}
            >
              {weakestSector
                ? `${
                    weakestSector.changePercent >= 0 ? "+" : ""
                  }${weakestSector.changePercent.toFixed(2)}%`
                : "—"}
            </span>
          </div>
        </div>

        {weakestSector && (
          <p className="absolute bottom-4 left-5 text-xs text-slate-500">
            ${weakestSector.price.toFixed(2)} current price
          </p>
        )}
      </SummaryCard>

      <SummaryCard>
        <div
          className={`absolute right-4 top-4 rounded-xl border p-3 ${riskStyle.containerClass}`}
        >
          <ShieldAlert
            size={25}
            className={riskStyle.iconClass}
          />
        </div>

        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Today&apos;s Risk
        </p>

        <p
          className={`mt-5 text-3xl font-bold ${riskStyle.textClass}`}
        >
          {environment?.riskLevel ?? "Loading"}
        </p>

        <div className="mt-4">
          <div className="mb-2 flex justify-between text-xs">
            <span className="text-slate-500">Risk Score</span>

            <span className="font-semibold text-slate-200">
              {marketScoreLoading ? "--" : `${riskScore}/100`}
            </span>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-slate-800">
            <div
              className={`h-full rounded-full transition-all duration-500 ${riskStyle.barClass}`}
              style={{
                width: `${marketScoreLoading ? 0 : riskScore}%`,
              }}
            />
          </div>
        </div>
      </SummaryCard>
    </div>
  );
}