import Link from "next/link";
import { Activity, Gauge } from "lucide-react";
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
  updatedAt: string;
  error?: string;
};

type MarketHeroProps = {
  marketScore: MarketScoreResponse | null;
  loading: boolean;
};

export default function MarketHero({
  marketScore,
  loading,
}: MarketHeroProps) {
  const score = marketScore?.score ?? 0;
  const scoreLabel = marketScore?.label ?? "Loading";

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
              Today&apos;s Market Score
            </div>

            <PremiumMarketScoreGauge
              score={score}
              label={scoreLabel}
              loading={loading}
            />

            <div className="mt-5 flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-sm text-blue-400">
              <Activity size={16} />
              Refreshes automatically every 5 minutes
            </div>
          </div>

          <MarketOutlook marketScore={marketScore} loading={loading} />
        </div>
      </section>
    </Link>
  );
}