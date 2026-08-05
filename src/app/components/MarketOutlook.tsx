"use client";

import {
  Activity,
  ShieldAlert,
  TrendingUp,
  Zap,
} from "lucide-react";

type MarketScoreComponent = {
  score: number;
  maxScore: number;
};

type MarketScoreData = {
  label: string;
  environment: {
    bias: string;
    riskLevel: string;
    approach: string;
  };
  components: {
    trend: MarketScoreComponent;
    momentum: MarketScoreComponent;
    sectorStrength: MarketScoreComponent;
    volatility: MarketScoreComponent;
  };
};

type MarketOutlookProps = {
  marketScore: MarketScoreData | null;
  loading: boolean;
};

type MetricType = "trend" | "momentum" | "sectors" | "volatility";

type MetricColors = {
  textClass: string;
  barClass: string;
};

function getScorePercent(component?: MarketScoreComponent) {
  if (!component || component.maxScore === 0) return 0;

  return Math.max(
    0,
    Math.min(
      100,
      Math.round((component.score / component.maxScore) * 100),
    ),
  );
}

function getComponentLabel(percent: number, type: MetricType) {
  if (type === "volatility") {
    if (percent >= 75) return "Calm";
    if (percent >= 50) return "Moderate";
    if (percent >= 30) return "Elevated";
    return "High";
  }

  if (type === "trend") {
    if (percent >= 75) return "Strong";
    if (percent >= 55) return "Constructive";
    if (percent >= 35) return "Mixed";
    return "Weak";
  }

  if (type === "sectors") {
    if (percent >= 75) return "Broad";
    if (percent >= 55) return "Healthy";
    if (percent >= 35) return "Mixed";
    return "Narrow";
  }

  if (percent >= 75) return "Strong";
  if (percent >= 55) return "Positive";
  if (percent >= 35) return "Mixed";
  return "Weak";
}

function getMetricColors(
  percent: number,
  type: MetricType,
): MetricColors {
  if (type === "volatility") {
    if (percent >= 75) {
      return {
        textClass: "text-emerald-400",
        barClass: "bg-emerald-400",
      };
    }

    if (percent >= 50) {
      return {
        textClass: "text-yellow-400",
        barClass: "bg-yellow-400",
      };
    }

    if (percent >= 30) {
      return {
        textClass: "text-orange-400",
        barClass: "bg-orange-400",
      };
    }

    return {
      textClass: "text-red-400",
      barClass: "bg-red-400",
    };
  }

  if (percent >= 75) {
    return {
      textClass: "text-emerald-400",
      barClass: "bg-emerald-400",
    };
  }

  if (percent >= 55) {
    return {
      textClass: "text-emerald-300",
      barClass: "bg-emerald-300",
    };
  }

  if (percent >= 35) {
    return {
      textClass: "text-yellow-400",
      barClass: "bg-yellow-400",
    };
  }

  return {
    textClass: "text-red-400",
    barClass: "bg-red-400",
  };
}

function getMarketHeadline(label?: string) {
  if (label === "Strong Bullish") {
    return "Broad strength supports an aggressive bullish posture.";
  }

  if (label === "Bullish") {
    return "Buyers remain in control, but stay selective.";
  }

  if (label === "Neutral") {
    return "Conditions are mixed. Wait for confirmation.";
  }

  if (label === "Bearish") {
    return "Sellers have the edge. Protect capital.";
  }

  if (label === "Strong Bearish") {
    return "Risk is high. Capital preservation comes first.";
  }

  return "Calculating today’s market environment...";
}

export default function MarketOutlook({
  marketScore,
  loading,
}: MarketOutlookProps) {
  const trendPercent = getScorePercent(
    marketScore?.components.trend,
  );

  const momentumPercent = getScorePercent(
    marketScore?.components.momentum,
  );

  const sectorPercent = getScorePercent(
    marketScore?.components.sectorStrength,
  );

  const volatilityPercent = getScorePercent(
    marketScore?.components.volatility,
  );

  const metrics = [
    {
      label: "Trend",
      type: "trend" as const,
      value: getComponentLabel(trendPercent, "trend"),
      percent: trendPercent,
      icon: TrendingUp,
    },
    {
      label: "Sector Breadth",
      type: "sectors" as const,
      value: getComponentLabel(sectorPercent, "sectors"),
      percent: sectorPercent,
      icon: Activity,
    },
    {
      label: "Momentum",
      type: "momentum" as const,
      value: getComponentLabel(momentumPercent, "momentum"),
      percent: momentumPercent,
      icon: Zap,
    },
    {
      label: "Volatility",
      type: "volatility" as const,
      value: getComponentLabel(volatilityPercent, "volatility"),
      percent: volatilityPercent,
      icon: ShieldAlert,
    },
  ];

  return (
    <div className="flex flex-col justify-center">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          Market Outlook
        </p>

        <h2 className="mt-3 text-2xl font-bold leading-tight text-white sm:text-3xl">
          {getMarketHeadline(marketScore?.label)}
        </h2>

        <p className="mt-3 max-w-xl text-sm leading-6 text-slate-400">
          {marketScore?.environment.approach ??
            "Analyzing trend, momentum, sector participation, and volatility."}
        </p>
      </div>

      <div className="mt-7 grid gap-3 sm:grid-cols-2">
        {metrics.map((metric) => {
          const Icon = metric.icon;

          const colors = getMetricColors(
            metric.percent,
            metric.type,
          );

          return (
            <div
              key={metric.label}
              className="rounded-xl border border-slate-800 bg-[#07111b]/80 p-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">
                  {metric.label}
                </span>

                <Icon
                  size={17}
                  className={colors.textClass}
                />
              </div>

              <p
                className={`mt-2 text-lg font-semibold ${colors.textClass}`}
              >
                {loading ? "Loading" : metric.value}
              </p>

              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-800">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${colors.barClass}`}
                  style={{
                    width: `${loading ? 0 : metric.percent}%`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex flex-col gap-3 border-t border-slate-800 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Today&apos;s approach
          </p>

          <p className="mt-1 text-sm font-medium text-slate-200">
            {marketScore?.environment.approach ??
              "Loading today’s approach..."}
          </p>
        </div>

        <button className="rounded-lg border border-blue-500/70 px-4 py-2 text-sm font-medium text-blue-400 transition hover:bg-blue-500 hover:text-white">
          View Score Breakdown
        </button>
      </div>
    </div>
  );
}