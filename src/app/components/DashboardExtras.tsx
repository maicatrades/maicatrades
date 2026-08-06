import { ShieldAlert } from "lucide-react";

type DashboardExtrasProps = {
  marketScore: number;
};

function getMarketOutlook(score: number) {
  if (score >= 80) {
    return {
      message:
        "Strong bullish conditions. Focus on leading stocks while continuing to manage risk.",
      iconColor: "text-emerald-400",
    };
  }

  if (score >= 65) {
    return {
      message:
        "Bullish conditions. Look for quality setups while remaining disciplined with entries.",
      iconColor: "text-emerald-400",
    };
  }

  if (score >= 50) {
    return {
      message:
        "Mixed market conditions. Stay selective and wait for confirmation before increasing exposure.",
      iconColor: "text-yellow-400",
    };
  }

  if (score >= 35) {
    return {
      message:
        "Bearish conditions. Protect capital, reduce exposure, and prioritize risk management.",
      iconColor: "text-orange-400",
    };
  }

  return {
    message:
      "High-risk market environment. Preserve capital and avoid forcing trades until conditions improve.",
    iconColor: "text-red-400",
  };
}

export default function DashboardExtras({
  marketScore,
}: DashboardExtrasProps) {
  const outlook = getMarketOutlook(marketScore);

  return (
    <section className="mt-4 grid gap-4 md:grid-cols-[1.4fr_1fr]">
      <section className="flex items-center gap-5 rounded-xl border border-slate-800 bg-[#09131d] px-5 py-4 shadow-[0_10px_30px_rgba(0,0,0,0.16)]">
        <span className="text-3xl text-yellow-400">★</span>

        <div>
          <p className="text-xs font-semibold uppercase text-slate-300">
            Quote of the Day
          </p>

          
  <p className="text-xs font-semibold uppercase text-slate-300">
    Quote of the Day
  </p>

  <p className="mt-1 text-sm text-slate-200">
    “Discipline is choosing between what you want now and what
    you want most.”
  </p>

  <p className="mt-1 text-xs text-slate-500">
    — Augusta F. Kantra
  </p>
</div>
      </section>

      <section className="rounded-xl border border-slate-800 bg-[#09131d] px-5 py-4 shadow-[0_10px_30px_rgba(0,0,0,0.16)]">
        <div className="flex items-center gap-2">
          <ShieldAlert size={17} className={outlook.iconColor} />

          <p className="text-xs font-semibold uppercase text-slate-300">
            Market Outlook
          </p>
        </div>

        <p className="mt-2 text-sm text-slate-300">{outlook.message}</p>
      </section>
    </section>
  );
}