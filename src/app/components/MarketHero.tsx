"use client";

import Link from "next/link";
import { Activity, Gauge } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import MarketOutlook from "./MarketOutlook";
import PremiumMarketScoreGauge from "./PremiumGauge";

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
  fiveDayAverage: number | null;
  fiveDayAverageSampleSize: number;
  fiveDayAverageDates: string[];
  updatedAt: string;
  isFallback?: boolean;
  fallbackMessage?: string;
  error?: string;
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

type MarketHeroProps = {
  marketScore: MarketScoreResponse | null;
  loading: boolean;
  marketPulseSummary: MarketPulseSummary | null;
  marketPulseLoading: boolean;
};

type TickerItem = {
  symbol: string;
  changePercent: number;
  session: "PRE" | "REGULAR" | "AH";
};

type TickerResponse = {
  success: boolean;
  data?: TickerItem[];
};

function isAfterPremarketCheckpoint() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());

  const weekday = parts.find((part) => part.type === "weekday")?.value;
  const hour = Number(parts.find((part) => part.type === "hour")?.value);
  const minute = Number(parts.find((part) => part.type === "minute")?.value);
  const minutes = hour * 60 + minute;

  return (
    weekday !== "Sat" &&
    weekday !== "Sun" &&
    minutes >= 510 &&
    minutes < 570
  );
}

export default function MarketHero({
  marketScore,
  loading,
  marketPulseSummary,
  marketPulseLoading,
}: MarketHeroProps) {
  const score = marketScore?.score ?? null;
  const scoreLabel = marketScore?.label ?? "Unavailable";
  const fiveDayAverage = marketScore?.fiveDayAverage ?? null;
  const fiveDayDifference =
    fiveDayAverage === null || score === null
      ? null
      : score - fiveDayAverage;
  const fiveDayDirection =
    fiveDayDifference === null
      ? null
      : fiveDayDifference > 2
        ? "Improving"
        : fiveDayDifference < -2
          ? "Weakening"
          : "Flat";
  const fiveDayDirectionClass =
    fiveDayDirection === "Improving"
      ? "text-emerald-400"
      : fiveDayDirection === "Weakening"
        ? "text-red-400"
        : "text-yellow-400";
  const [tickerItems, setTickerItems] = useState<TickerItem[]>([]);
  const [premarketWindowOpen, setPremarketWindowOpen] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadTickerContext() {
      try {
        const response = await fetch("/api/market-ticker", {
          cache: "no-store",
        });
        const result = (await response.json()) as TickerResponse;

        if (mounted && response.ok && result.success) {
          setTickerItems(result.data ?? []);
        }
      } catch (error) {
        console.error("Market outlook ticker context error:", error);
      }

      if (mounted) {
        setPremarketWindowOpen(isAfterPremarketCheckpoint());
      }
    }

    void loadTickerContext();

    const interval = window.setInterval(
      loadTickerContext,
      5 * 60_000,
    );

    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, []);

  const premarketItems = useMemo(
    () =>
      tickerItems.filter(
        (item) =>
          item.session === "PRE" &&
          ["SPY", "QQQ", "IWM"].includes(item.symbol),
      ),
    [tickerItems],
  );

  const isPremarket = premarketItems.length >= 3;

  const premarketTone = useMemo<
    "Risk-On" | "Risk-Off" | "Mixed" | null
  >(() => {
    if (!isPremarket) return null;

    const positive = premarketItems.filter(
      (item) => item.changePercent > 0,
    ).length;
    const negative = premarketItems.filter(
      (item) => item.changePercent < 0,
    ).length;
    const averageChange =
      premarketItems.reduce(
        (sum, item) => sum + item.changePercent,
        0,
      ) / premarketItems.length;

    if (positive >= 3 && averageChange >= 0.15) {
      return "Risk-On";
    }

    if (negative >= 3 && averageChange <= -0.15) {
      return "Risk-Off";
    }

    return "Mixed";
  }, [isPremarket, premarketItems]);

  return (
    <Link
      href="/markets/market-score"
      className="group block rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      aria-label="View detailed Market Score"
    >
      <section className="relative overflow-hidden rounded-xl border border-slate-800 bg-[#09131d] shadow-[0_10px_30px_rgba(0,0,0,0.16)] transition duration-200 group-hover:-translate-y-1 group-hover:border-blue-500/60 group-hover:shadow-[0_16px_40px_rgba(0,0,0,0.28)]">
        <div className="pointer-events-none absolute -left-24 -top-28 h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 right-0 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />

        <div className="absolute right-5 top-4 z-10 text-xs font-medium text-slate-500 transition group-hover:text-blue-400">
          View details →
        </div>

        <div className="relative grid min-h-[390px] gap-8 p-6 sm:p-8 lg:grid-cols-[260px_1fr]">
          <div className="flex flex-col items-center justify-center">
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.15em] text-blue-400">
              <Gauge size={18} />
              {isPremarket
                ? "Latest Market Score"
                : "Today’s Market Score"}
            </div>

            <PremiumMarketScoreGauge
              score={score}
              label={scoreLabel}
              loading={loading}
              contextLabel={
                marketScore?.isFallback
                  ? "Latest verified stored snapshot"
                  : isPremarket
                  ? "Previous regular-session close"
                  : "Live market conditions"
              }
            />

            <div className="mt-5 flex items-center gap-3 rounded-xl border border-slate-700/80 bg-slate-950/50 px-4 py-2.5">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                  5-Day Average
                </p>
                <p className="mt-0.5 text-xs text-slate-400">
                  {fiveDayDirection ? (
                    <span className={`font-semibold ${fiveDayDirectionClass}`}>
                      {fiveDayDirection}
                    </span>
                  ) : (
                    "Building history"
                  )}
                </p>
              </div>

              <div className="h-9 w-px bg-slate-700" />

              <p className="min-w-10 text-center text-2xl font-bold text-white">
                {loading
                  ? "—"
                  : fiveDayAverage?.toFixed(1) ?? "—"}
              </p>
            </div>

            <div className="mt-4 flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-sm text-blue-400">
              <Activity size={16} />
              {isPremarket
                ? "Score frozen until regular session"
                : "Refreshes automatically every 5 minutes"}
            </div>
          </div>

          <MarketOutlook
            marketScore={marketScore}
            loading={loading}
            marketPulseSummary={marketPulseSummary}
            marketPulseLoading={marketPulseLoading}
            isPremarket={isPremarket}
            premarketTone={premarketTone}
            premarketWindowOpen={premarketWindowOpen}
          />
        </div>
      </section>
    </Link>
  );
}
