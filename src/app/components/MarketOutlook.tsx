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

type MarketPulseSummary = {
  bullish: number;
  neutral: number;
  watch: number;
  lowRisk: number;
  riskSignals: number;
  positiveBenchmarks: number;
  negativeBenchmarks: number;
  totalMarketBenchmarks: number;
  averageMarketChange: number;
  marketTone: string;
};

type MarketOutlookProps = {
  marketScore: MarketScoreData | null;
  loading: boolean;
  marketPulseSummary: MarketPulseSummary | null;
  marketPulseLoading: boolean;
  isPremarket: boolean;
  premarketTone: "Risk-On" | "Risk-Off" | "Mixed" | null;
  premarketWindowOpen: boolean;
};

type MetricType =
  | "trend"
  | "momentum"
  | "sectors"
  | "volatility";

type MetricColors = {
  textClass: string;
  barClass: string;
};

function getScorePercent(
  component?: MarketScoreComponent,
) {
  if (!component || component.maxScore === 0) {
    return 0;
  }

  return Math.max(
    0,
    Math.min(
      100,
      Math.round(
        (component.score / component.maxScore) *
          100,
      ),
    ),
  );
}

function getComponentLabel(
  percent: number,
  type: MetricType,
) {
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

function getStructuralHeadline(label?: string) {
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

function getPriorSessionHeadline(label?: string) {
  if (label === "Strong Bullish") return "The previous regular session closed with broad bullish strength.";
  if (label === "Bullish") return "Previous session: buyers remained in control.";
  if (label === "Neutral") return "The previous regular session closed with mixed conditions.";
  if (label === "Bearish") return "The previous regular session closed with sellers holding the edge.";
  if (label === "Strong Bearish") return "The previous regular session closed in a high-risk environment.";
  return "Reviewing the previous regular-session environment...";
}

function getPremarketHeadline(
  label: string | undefined,
  tone: "Risk-On" | "Risk-Off" | "Mixed" | null,
) {
  const bullishBase = label === "Bullish" || label === "Strong Bullish";

  if (tone === "Risk-Off") {
    return bullishBase
      ? "Bullish prior-session base, but premarket risk has elevated."
      : "Premarket weakness is adding risk to the prior-session backdrop.";
  }

  if (tone === "Risk-On") {
    return bullishBase
      ? "Prior-session bullish strength is supported by premarket action."
      : "Premarket strength is improving the prior-session backdrop.";
  }

  return bullishBase
    ? "Prior-session bullish base; premarket signals are mixed."
    : "Premarket signals are mixed. Wait for the opening session to confirm direction.";
}

function getPremarketApproach(
  tone: "Risk-On" | "Risk-Off" | "Mixed" | null,
) {
  if (tone === "Risk-Off") {
    return "Buyers controlled the previous regular session. Premarket index weakness suggests patience, smaller initial risk, and confirmation after the open.";
  }

  if (tone === "Risk-On") {
    return "Premarket index strength supports the prior-session backdrop, but wait for regular-session confirmation before increasing risk.";
  }

  return "The previous-session score remains the structural baseline. Premarket signals are divided, so wait for clearer confirmation after the open.";
}

function getMarketHeadline(
  label: string | undefined,
  marketTone: string | undefined,
) {
  if (marketTone === "Strong selling pressure") {
    if (
      label === "Strong Bullish" ||
      label === "Bullish"
    ) {
      return "Underlying trend remains constructive, but sellers control today’s session.";
    }

    if (label === "Neutral") {
      return "Sellers control today’s session as market conditions weaken.";
    }

    return "Selling pressure is reinforcing an already weak market environment.";
  }

  if (marketTone === "Defensive") {
    if (
      label === "Strong Bullish" ||
      label === "Bullish"
    ) {
      return "The broader trend remains constructive, but sellers have the edge today.";
    }

    if (label === "Neutral") {
      return "The market is defensive. Patience is warranted.";
    }

    return "Defensive conditions favor capital preservation.";
  }

  if (marketTone === "Cautious") {
    if (
      label === "Strong Bullish" ||
      label === "Bullish"
    ) {
      return "The bullish backdrop remains intact, but near-term pressure is building.";
    }

    if (label === "Neutral") {
      return "Conditions are mixed with a cautious near-term tone.";
    }

    return "Weak conditions remain in place with elevated near-term caution.";
  }

  if (marketTone === "Strong buying pressure") {
    if (
      label === "Bearish" ||
      label === "Strong Bearish"
    ) {
      return "Buyers control today’s session, but the broader backdrop remains weak.";
    }

    if (label === "Neutral") {
      return "Strong buying pressure is improving today’s market tone.";
    }

    return "Broad strength confirms the constructive market backdrop.";
  }

  if (marketTone === "Constructive") {
    if (
      label === "Bearish" ||
      label === "Strong Bearish"
    ) {
      return "Today’s tape is improving, but the broader environment remains weak.";
    }
  }

  return getStructuralHeadline(label);
}

function getMarketApproach(
  marketScore: MarketScoreData | null,
  marketPulseSummary: MarketPulseSummary | null,
) {
  const marketTone =
    marketPulseSummary?.marketTone;

  if (marketTone === "Strong selling pressure") {
    return "Broad selling pressure is overriding the constructive backdrop today. Stay selective and wait for stabilization before adding long exposure.";
  }

  if (marketTone === "Defensive") {
    return "Near-term conditions are defensive. Reduce aggression, respect downside pressure, and wait for stronger confirmation before adding risk.";
  }

  if (marketTone === "Cautious") {
    return "Near-term pressure is building. Favor higher-quality setups and require stronger confirmation before committing capital.";
  }

  if (marketTone === "Strong buying pressure") {
    return "Broad buying pressure is supporting the session. Favor strong setups while maintaining disciplined entries and risk management.";
  }

  if (marketTone === "Constructive") {
    return "Current-session conditions are constructive. Favor quality setups that align with the broader market environment.";
  }

  return (
    marketScore?.environment.approach ??
    "Analyzing trend, momentum, sector participation, volatility, and current-session conditions."
  );
}

export default function MarketOutlook({
  marketScore,
  loading,
  marketPulseSummary,
  marketPulseLoading,
  isPremarket,
  premarketTone,
  premarketWindowOpen,
}: MarketOutlookProps) {
  const unavailable = !loading && marketScore === null;
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

  const marketTone =
    marketPulseSummary?.marketTone;

  const headline =
    unavailable
      ? "Market Score is temporarily unavailable."
      : loading || marketPulseLoading
      ? "Analyzing today’s market environment..."
      : isPremarket && premarketWindowOpen
        ? getPremarketHeadline(
            marketScore?.label,
            premarketTone,
          )
        : isPremarket
          ? getPriorSessionHeadline(
              marketScore?.label,
            )
      : getMarketHeadline(
          marketScore?.label,
          marketTone,
        );

  const approach =
    unavailable
      ? "Waiting for SPY, QQQ, and VIX to provide verified data from the same trading session. The dashboard will retry automatically."
      : loading || marketPulseLoading
      ? "Analyzing trend, momentum, sector participation, volatility, and current-session conditions."
      : isPremarket && premarketWindowOpen
        ? getPremarketApproach(premarketTone)
        : isPremarket
          ? "This score reflects the previous regular-session close. Premarket context is still developing and will be evaluated after 8:30 AM ET."
      : getMarketApproach(
          marketScore,
          marketPulseSummary,
        );

  const metrics = [
    {
      label: "Trend",
      type: "trend" as const,
      value: getComponentLabel(
        trendPercent,
        "trend",
      ),
      percent: trendPercent,
      icon: TrendingUp,
    },
    {
      label: "Sector Breadth",
      type: "sectors" as const,
      value: getComponentLabel(
        sectorPercent,
        "sectors",
      ),
      percent: sectorPercent,
      icon: Activity,
    },
    {
      label: "Momentum",
      type: "momentum" as const,
      value: getComponentLabel(
        momentumPercent,
        "momentum",
      ),
      percent: momentumPercent,
      icon: Zap,
    },
    {
      label: "Volatility",
      type: "volatility" as const,
      value: getComponentLabel(
        volatilityPercent,
        "volatility",
      ),
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
          {headline}
        </h2>

        <p className="mt-3 max-w-xl text-sm leading-6 text-slate-400">
          {approach}
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
                {loading
                  ? "Loading"
                  : unavailable
                    ? "Unavailable"
                    : metric.value}
              </p>

              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-800">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${colors.barClass}`}
                  style={{
                    width: `${
                      loading || unavailable
                        ? 0
                        : metric.percent
                    }%`,
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
            {approach}
          </p>
        </div>

        <button className="rounded-lg border border-blue-500/70 px-4 py-2 text-sm font-medium text-blue-400 transition hover:bg-blue-500 hover:text-white">
          View Score Breakdown
        </button>
      </div>
    </div>
  );
}
