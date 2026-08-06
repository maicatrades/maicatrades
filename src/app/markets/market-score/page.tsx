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
  error?: string;
};

function getScoreTheme(score: number) {
  if (score >= 80) {
    return {
      label: "Strong Bullish",
      text: "text-emerald-300",
      border: "border-emerald-500/30",
      background: "bg-emerald-500/10",
      bar: "bg-emerald-400",
    };
  }

  if (score >= 65) {
    return {
      label: "Bullish",
      text: "text-emerald-400",
      border: "border-emerald-500/30",
      background: "bg-emerald-500/10",
      bar: "bg-emerald-400",
    };
  }

  if (score >= 50) {
    return {
      label: "Neutral",
      text: "text-yellow-400",
      border: "border-yellow-500/30",
      background: "bg-yellow-500/10",
      bar: "bg-yellow-400",
    };
  }

  if (score >= 30) {
    return {
      label: "Cautious",
      text: "text-orange-400",
      border: "border-orange-500/30",
      background: "bg-orange-500/10",
      bar: "bg-orange-400",
    };
  }

  return {
    label: "Bearish",
    text: "text-red-400",
    border: "border-red-500/30",
    background: "bg-red-500/10",
    bar: "bg-red-400",
  };
}

function ScoreBar({
  label,
  score,
  maxScore,
  icon: Icon,
}: {
  label: string;
  score: number;
  maxScore: number;
  icon: React.ElementType;
}) {
  const percentage = Math.min((score / maxScore) * 100, 100);

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
              {score} of {maxScore} points
            </p>
          </div>
        </div>

        <p className="text-2xl font-bold text-slate-100">
          {Math.round(percentage)}%
        </p>
      </div>

      <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-slate-800">
        <div
          className="h-full rounded-full bg-blue-400 transition-all duration-700"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </article>
  );
}

export default function MarketScorePage() {
  const [marketScore, setMarketScore] =
    useState<MarketScoreResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function fetchMarketScore() {
      try {
        const response = await fetch("/api/market-score", {
          cache: "no-store",
        });

        const result = (await response.json()) as MarketScoreResponse;

        if (!response.ok || !result.success) {
          throw new Error(result.error || "Unable to load market score");
        }

        if (mounted) {
          setMarketScore(result);
        }
      } catch (error) {
        console.error("Market score page error:", error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchMarketScore();

    const interval = window.setInterval(fetchMarketScore, 5 * 60_000);

    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, []);

  const score = marketScore?.score ?? 0;
  const theme = getScoreTheme(score);

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

        <section className="mt-6 rounded-2xl border border-slate-800 bg-[#09131d] p-6 shadow-[0_18px_50px_rgba(0,0,0,0.22)] sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-blue-400">
                <Gauge size={18} />
                MaicaTrades Market Score
              </div>

              <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
                Today&apos;s Market Score summarizes the current market environment.
              </h1>

              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400 sm:text-base">
                Today&apos;s Market Score combines trend, momentum, sector strength, and
                volatility into one easy-to-read score designed to help swing
                traders quickly understand today&apos;s market conditions. The
                metrics below reflect today&apos;s market environment.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-slate-800 bg-[#050b12] p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    Trend bias
                  </p>
                  <p className="mt-2 font-semibold text-slate-100">
                    {marketScore?.environment.bias ?? "Loading"}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-800 bg-[#050b12] p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    Risk level
                  </p>
                  <p className="mt-2 font-semibold text-slate-100">
                    {marketScore?.environment.riskLevel ?? "Loading"}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-800 bg-[#050b12] p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    Suggested approach
                  </p>
                  <p className="mt-2 font-semibold text-slate-100">
                    {marketScore?.environment.approach ?? "Loading"}
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
                <p className={`text-7xl font-bold ${theme.text}`}>
                  {loading ? "--" : score}
                </p>
                <p className="mb-2 text-xl text-slate-500">/100</p>
              </div>

              <p className={`mt-3 text-xl font-semibold ${theme.text}`}>
                {loading ? "Loading" : theme.label}
              </p>

              <div className="mt-6 h-3 overflow-hidden rounded-full bg-slate-800">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${theme.bar}`}
                  style={{ width: `${score}%` }}
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
              Each component contributes a different amount to the final Market
              Score.
            </p>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <ScoreBar
              label="Trend"
              score={marketScore?.components.trend.score ?? 0}
              maxScore={marketScore?.components.trend.maxScore ?? 1}
              icon={TrendingUp}
            />

            <ScoreBar
              label="Momentum"
              score={marketScore?.components.momentum.score ?? 0}
              maxScore={marketScore?.components.momentum.maxScore ?? 1}
              icon={Activity}
            />

            <ScoreBar
              label="Sector Strength"
              score={marketScore?.components.sectorStrength.score ?? 0}
              maxScore={marketScore?.components.sectorStrength.maxScore ?? 1}
              icon={BarChart3}
            />

            <ScoreBar
              label="Volatility"
              score={marketScore?.components.volatility.score ?? 0}
              maxScore={marketScore?.components.volatility.maxScore ?? 1}
              icon={Waves}
            />
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
          <article className="rounded-xl border border-slate-800 bg-[#09131d] p-6">
            <div className="flex items-center gap-2">
              <Activity size={19} className="text-blue-400" />
              <h2 className="text-lg font-semibold">Today&apos;s Market Outlook</h2>
            </div>

            <p className="mt-4 text-sm leading-7 text-slate-400">
              {score >= 80 &&
                "Today&apos;s Market Score suggests broad strength across trend, momentum, sector participation, and volatility. Conditions may support a more aggressive approach while still maintaining disciplined position sizing and risk management."}

              {score >= 65 &&
                score < 80 &&
                "Today&apos;s Market Score suggests a constructive environment. Trend and participation remain supportive, although traders should continue monitoring weaker areas and avoid chasing extended moves."}

              {score >= 50 &&
                score < 65 &&
                "Today&apos;s Market Score suggests mixed conditions. Some indicators remain supportive while others are less convincing. Selective setups and disciplined position sizing may be more appropriate."}

              {score >= 30 &&
                score < 50 &&
                "Today&apos;s Market Score suggests caution. Participation or momentum may be weakening, making reduced exposure and tighter risk controls appropriate."}

              {score < 30 &&
                "Today&apos;s Market Score suggests a defensive environment. Weak trend, poor participation, or elevated volatility may favor preserving capital until conditions improve."}
            </p>
          </article>

          <article className="rounded-xl border border-slate-800 bg-[#09131d] p-6">
            <div className="flex items-center gap-2">
              <ShieldAlert size={19} className="text-orange-400" />
              <h2 className="text-lg font-semibold">Score ranges</h2>
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
                <span className="font-semibold text-emerald-400">Bullish</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">50–64</span>
                <span className="font-semibold text-yellow-400">Neutral</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">30–49</span>
                <span className="font-semibold text-orange-400">Cautious</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">0–29</span>
                <span className="font-semibold text-red-400">Bearish</span>
              </div>
            </div>
          </article>
        </section>

        <section className="mt-6 rounded-xl border border-slate-800 bg-[#09131d] p-6">
          <h2 className="text-lg font-semibold">How the Market Score is used</h2>

          <div className="mt-5 grid gap-5 md:grid-cols-3">
            <div>
              <p className="font-semibold text-slate-200">
                Understand the environment
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Use the score as a quick summary of whether conditions are
                bullish, mixed, cautious, or defensive.
              </p>
            </div>

            <div>
              <p className="font-semibold text-slate-200">
                Adjust risk exposure
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Stronger scores may support more exposure, while weaker scores
                may justify smaller positions and tighter stops.
              </p>
            </div>

            <div>
              <p className="font-semibold text-slate-200">
                Confirm trade setups
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                The score should support your analysis, not replace chart
                structure, catalysts, entries, stops, or trade management.
              </p>
            </div>
          </div>
        </section>

        <p className="mt-8 text-center text-xs text-slate-600">
          The MaicaTrades Market Score is an educational market-analysis tool
          and is not financial advice.
        </p>
      </div>
    </main>
  );
}