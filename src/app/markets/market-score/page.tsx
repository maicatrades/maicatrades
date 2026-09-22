"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowLeft,
  BarChart3,
  Gauge,
  ShieldAlert,
  TrendingUp,
  Waves,
} from "lucide-react";

type MarketScoreComponent = {
  score: number;
  maxScore: number;
};

type MarketScoreResponse = {
  success: boolean;
  score: number;
  rawScore: number;
  breadthAdjustedScore?: number;
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
  updatedAt: string;
  isFallback?: boolean;
  fallbackMessage?: string;
  error?: string;
};

function getScoreTheme(label?: string) {
  if (label === "Strong Bullish") {
    return {
      text: "text-emerald-300",
      border: "border-emerald-500/30",
      background: "bg-emerald-500/10",
      bar: "bg-emerald-400",
    };
  }

  if (label === "Bullish") {
    return {
      text: "text-emerald-400",
      border: "border-emerald-500/30",
      background: "bg-emerald-500/10",
      bar: "bg-emerald-400",
    };
  }

  if (label === "Neutral") {
    return {
      text: "text-yellow-400",
      border: "border-yellow-500/30",
      background: "bg-yellow-500/10",
      bar: "bg-yellow-400",
    };
  }

  if (label === "Bearish") {
    return {
      text: "text-orange-400",
      border: "border-orange-500/30",
      background: "bg-orange-500/10",
      bar: "bg-orange-400",
    };
  }

  if (label === "Strong Bearish") {
    return {
      text: "text-red-400",
      border: "border-red-500/30",
      background: "bg-red-500/10",
      bar: "bg-red-400",
    };
  }

  return {
    text: "text-slate-300",
    border: "border-slate-700",
    background: "bg-slate-800/40",
    bar: "bg-slate-400",
  };
}

function ScoreBar({
  label,
  score,
  maxScore,
  icon: Icon,
  valueLabel,
  unavailable = false,
}: {
  label: string;
  score: number;
  maxScore: number;
  icon: React.ElementType;
  valueLabel?: string;
  unavailable?: boolean;
}) {
  const percentage =
    maxScore > 0
      ? Math.min(Math.max((score / maxScore) * 100, 0), 100)
      : 0;

  return (
    <article className="rounded-xl border border-slate-800 bg-[#09131d] p-5">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-2 text-blue-400">
            <Icon size={18} />
          </div>

          <div>
            <p className="font-semibold text-slate-100">{label}</p>

            <p className="text-xs text-slate-500">
              {unavailable
                ? "Waiting for verified data"
                : `${score} of ${maxScore} points`}
            </p>
          </div>
        </div>

        <p className="text-2xl font-bold text-slate-100">
  {unavailable ? "—" : valueLabel ?? `${Math.round(percentage)}%`}
</p>
      </div>

      <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-slate-800">
        <div
          className="h-full rounded-full bg-blue-400 transition-all duration-700"
          style={{ width: `${unavailable ? 0 : percentage}%` }}
        />
      </div>
    </article>
  );
}

export default function MarketScorePage() {
  const [marketScore, setMarketScore] =
    useState<MarketScoreResponse | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchMarketScore() {
      try {
        const response = await fetch("/api/market-score", {
          cache: "no-store",
        });

        const result = (await response.json()) as MarketScoreResponse;

        if (!response.ok || !result.success) {
          throw new Error(
            result.error || "Unable to load market score",
          );
        }

        if (mounted) {
          setMarketScore(result);
          setError(null);
        }
      } catch (fetchError) {
        console.error("Market score page error:", fetchError);

        if (mounted) {
          setError(
            fetchError instanceof Error
              ? fetchError.message
              : "Unable to load Market Score.",
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchMarketScore();

    const interval = window.setInterval(
      fetchMarketScore,
      5 * 60_000,
    );

    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, []);

  const score = marketScore?.score ?? null;

  const marketLabel = marketScore?.label;

  const theme = getScoreTheme(marketLabel);

  const updatedAt = marketScore?.updatedAt
    ? new Date(marketScore.updatedAt).toLocaleString()
    : "Waiting for live data";

  return (
    <main className="min-h-screen bg-[#050b12] text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-blue-400"
        >
          <ArrowLeft size={16} />
          Back to dashboard
        </Link>

        {error && (
          <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-300">
            Market Score data is temporarily unavailable. {error}
          </div>
        )}

        {!error && marketScore?.isFallback && (
          <div className="mt-6 rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-5 py-4 text-sm text-yellow-200">
            {marketScore.fallbackMessage}
          </div>
        )}

        <section className="mt-6 rounded-2xl border border-slate-800 bg-[#09131d] p-6 shadow-[0_18px_50px_rgba(0,0,0,0.22)] sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-blue-400">
                <Gauge size={18} />
                MaicaTrades Market Score
              </div>

              <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
                Today&apos;s Market Score summarizes the current
                market environment.
              </h1>

              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400 sm:text-base">
                Today&apos;s Market Score combines trend, momentum,
                sector strength, and volatility into one
                easy-to-read score designed to help swing traders
                quickly understand today&apos;s market conditions.
                Market Breadth is then used as a confirmation layer
                so the final score reflects whether index strength
                is broadly supported.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-slate-800 bg-[#050b12] p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    Market bias
                  </p>

                  <p className="mt-2 font-semibold text-slate-100">
                    {loading
                      ? "Loading"
                      : marketScore?.environment.bias ??
                        "Unavailable"}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-800 bg-[#050b12] p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    Risk level
                  </p>

                  <p className="mt-2 font-semibold text-slate-100">
                    {loading
                      ? "Loading"
                      : marketScore?.environment.riskLevel ??
                        "Unavailable"}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-800 bg-[#050b12] p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    Suggested approach
                  </p>

                  <p className="mt-2 font-semibold leading-6 text-slate-100">
                    {loading
                      ? "Loading"
                      : marketScore?.environment.approach ??
                        "Unavailable"}
                  </p>
                </div>
              </div>
            </div>

            <div
              className={`rounded-2xl border p-8 text-center ${theme.border} ${theme.background}`}
            >
              <p className="text-sm uppercase tracking-[0.2em] text-slate-400">
                Today&apos;s Score
              </p>

              <div className="mt-5 flex items-end justify-center gap-2">
                <p
                  className={`text-7xl font-bold ${theme.text}`}
                >
                  {loading ? "--" : score ?? "—"}
                </p>

                <p className="mb-2 text-xl text-slate-500">
                  {score === null && !loading ? "" : "/100"}
                </p>
              </div>

              <p
                className={`mt-3 text-xl font-semibold ${theme.text}`}
              >
                {loading
                  ? "Loading"
                  : marketScore?.label ?? "Unavailable"}
              </p>

              <div className="mt-6 h-3 overflow-hidden rounded-full bg-slate-800">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${theme.bar}`}
                  style={{
                    width: `${loading || score === null ? 0 : score}%`,
                  }}
                />
              </div>

              <p className="mt-4 text-xs text-slate-500">
                Today&apos;s reading updated: {updatedAt}
              </p>
            </div>
          </div>
        </section>

        <section className="mt-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-400">
              Score breakdown
            </p>

            <h2 className="mt-2 text-2xl font-bold">
              What&apos;s driving today&apos;s Market Score
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              The four core components contribute 100 possible
              points. Market Breadth then acts as a confirmation
              layer before the final Market Score is classified.
            </p>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <ScoreBar
              label="Trend"
              score={marketScore?.components.trend.score ?? 0}
              maxScore={
                marketScore?.components.trend.maxScore ?? 40
              }
              icon={TrendingUp}
              unavailable={!loading && marketScore === null}
            />

            <ScoreBar
              label="Momentum"
              score={marketScore?.components.momentum.score ?? 0}
              maxScore={
                marketScore?.components.momentum.maxScore ?? 25
              }
              icon={Activity}
              unavailable={!loading && marketScore === null}
            />

            <ScoreBar
              label="Sector Strength"
              score={
                marketScore?.components.sectorStrength.score ?? 0
              }
              maxScore={
                marketScore?.components.sectorStrength.maxScore ??
                20
              }
              icon={BarChart3}
              unavailable={!loading && marketScore === null}
            />

            <ScoreBar
  label="Volatility"
  score={
    marketScore?.components.volatility.score ?? 0
  }
  maxScore={
    marketScore?.components.volatility.maxScore ?? 15
  }
  icon={Waves}
  unavailable={!loading && marketScore === null}
  valueLabel={(() => {
    const component = marketScore?.components.volatility;

    if (!component || component.maxScore === 0) {
      return "Unavailable";
    }

    const percent = Math.round(
      (component.score / component.maxScore) * 100
    );

    if (percent >= 75) return "Calm";
    if (percent >= 50) return "Moderate";
    if (percent >= 30) return "Elevated";

    return "High";
  })()}
/>
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
          <article className="rounded-xl border border-slate-800 bg-[#09131d] p-6">
            <div className="flex items-center gap-2">
              <Activity
                size={19}
                className="text-blue-400"
              />

              <h2 className="text-lg font-semibold">
                Today&apos;s Market Outlook
              </h2>
            </div>

            <p className="mt-4 text-sm leading-7 text-slate-400">
              {loading
                ? "Calculating today's market outlook..."
                : marketScore?.environment.approach ??
                  "Current market outlook is unavailable."}
            </p>
          </article>

          <article className="rounded-xl border border-slate-800 bg-[#09131d] p-6">
            <div className="flex items-center gap-2">
              <ShieldAlert
                size={19}
                className="text-orange-400"
              />

              <h2 className="text-lg font-semibold">
                Score ranges
              </h2>
            </div>

            <div className="mt-5 space-y-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">80–100</span>

                <span className="font-semibold text-emerald-300">
                  Strong Bullish
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">65–79</span>

                <span className="font-semibold text-emerald-400">
                  Bullish
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">50–64</span>

                <span className="font-semibold text-yellow-400">
                  Neutral
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">35–49</span>

                <span className="font-semibold text-orange-400">
                  Bearish
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">0–34</span>

                <span className="font-semibold text-red-400">
                  Strong Bearish
                </span>
              </div>
            </div>
          </article>
        </section>

        <section className="mt-6 rounded-xl border border-slate-800 bg-[#09131d] p-6">
          <h2 className="text-lg font-semibold">
            How the Market Score is used
          </h2>

          <div className="mt-5 grid gap-5 md:grid-cols-3">
            <div>
              <p className="font-semibold text-slate-200">
                Understand the environment
              </p>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                Use the score as a quick summary of whether
                conditions are strongly bullish, bullish, neutral,
                bearish, or strongly bearish.
              </p>
            </div>

            <div>
              <p className="font-semibold text-slate-200">
                Adjust risk exposure
              </p>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                Stronger readings may support greater exposure,
                while weaker readings may justify smaller
                positions, more selective entries, and tighter
                risk controls.
              </p>
            </div>

            <div>
              <p className="font-semibold text-slate-200">
                Confirm trade setups
              </p>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                The score should support your analysis, not replace
                chart structure, catalysts, entries, stops, or
                trade management.
              </p>
            </div>
          </div>
        </section>

        <p className="mt-8 text-center text-xs text-slate-600">
          The MaicaTrades Market Score is an educational
          market-analysis tool and is not financial advice.
        </p>
      </div>
    </main>
  );
}
