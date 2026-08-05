import Link from "next/link";
import {
  CalendarDays,
  Eye,
  ShieldAlert,
  Target,
  TrendingUp,
} from "lucide-react";

const weeklyPlan = {
  marketBias:
    "Bullish conditions remain in place. Favor strong momentum setups and leading sectors while continuing to manage position risk.",

  focusStocks:
    "Focus on stocks showing relative strength, holding key support, or forming clean breakout and retest setups within leading sectors.",

  catalysts:
    "Watch upcoming inflation data, labor reports, Federal Reserve commentary, and major earnings releases that could affect market momentum.",

  avoid:
    "Avoid chasing stocks that are extended far above support, entering weak setups, or increasing risk simply because market conditions are favorable.",

  riskManagement:
    "Stay disciplined with position sizing, define risk before entering, and continue prioritizing high-quality setups over excessive trade activity.",
};

function PlanItem({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ElementType;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/25 p-4">
      <div className="flex items-center gap-2">
        <Icon size={17} className="text-emerald-400" />

        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          {label}
        </p>
      </div>

      <p className="mt-2 text-sm leading-6 text-slate-300">
        {children}
      </p>
    </div>
  );
}

export default function WhatImWatching() {
  return (
    <section className="mt-4 rounded-xl border border-slate-800 bg-[#09131d] shadow-[0_10px_30px_rgba(0,0,0,0.16)]">
      <div className="flex flex-col justify-between gap-3 px-5 py-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2 font-semibold uppercase text-emerald-400">
            <Eye size={19} />
            This Week&apos;s Trading Plan
          </div>

          <p className="mt-1 text-xs text-slate-500">
            Updated weekly with the market context and risk factors I&apos;m
            focused on.
          </p>
        </div>

        <Link
          href="/markets/trade-idea"
          className="inline-flex items-center justify-center rounded-lg border border-emerald-500/70 px-4 py-2 text-sm font-medium text-emerald-400 transition hover:bg-emerald-500 hover:text-slate-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
        >
          View Full Trading Plan
        </Link>
      </div>

      <div className="grid gap-3 border-t border-slate-800 px-5 py-5 md:grid-cols-2 xl:grid-cols-3">
        <PlanItem icon={TrendingUp} label="Market Bias">
          {weeklyPlan.marketBias}
        </PlanItem>

        <PlanItem icon={Target} label="Focus Stocks">
          {weeklyPlan.focusStocks}
        </PlanItem>

        <PlanItem icon={CalendarDays} label="Key Catalysts">
          {weeklyPlan.catalysts}
        </PlanItem>

        <PlanItem icon={ShieldAlert} label="What to Avoid">
          {weeklyPlan.avoid}
        </PlanItem>

        <div className="md:col-span-2 xl:col-span-2">
          <PlanItem icon={ShieldAlert} label="Risk Management">
            {weeklyPlan.riskManagement}
          </PlanItem>
        </div>
      </div>
    </section>
  );
}