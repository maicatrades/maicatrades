import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  TrendingUp,
  Calculator,
  BarChart3,
} from "lucide-react";

export default function BlogPage() {
  return (
    <main className="min-h-screen bg-[#050b12] text-white">
      <section className="mx-auto max-w-6xl px-6 py-24 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-400">
          <BookOpen size={16} />
          MaicaTrades Blog
        </div>

        <h1 className="mt-8 text-5xl font-bold tracking-tight">
          Market Insights for Busy Swing Traders
        </h1>

        <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-slate-400">
          The MaicaTrades Blog will feature practical market education,
          weekly trading insights, strategy guides, and tutorials designed
          specifically for busy swing traders.
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link
            href="/dashboard"
            className="rounded-lg bg-emerald-500 px-6 py-3 font-semibold text-black transition hover:bg-emerald-400"
          >
            Launch Dashboard
          </Link>

          <Link
            href="/tools/position-size"
            className="rounded-lg border border-slate-700 px-6 py-3 font-semibold transition hover:border-emerald-500"
          >
            Position Size Calculator
          </Link>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-6 pb-24 md:grid-cols-3">
        <div className="rounded-xl border border-slate-800 bg-[#09131d] p-6">
          <TrendingUp
            className="mb-4 text-emerald-400"
            size={28}
          />

          <h2 className="text-xl font-bold">
            Weekly Market Analysis
          </h2>

          <p className="mt-3 text-slate-400">
            Breakdowns of the current market environment, sector
            leadership, and the key levels swing traders should watch
            each week.
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#09131d] p-6">
          <Calculator
            className="mb-4 text-blue-400"
            size={28}
          />

          <h2 className="text-xl font-bold">
            Risk Management
          </h2>

          <p className="mt-3 text-slate-400">
            Learn position sizing, risk management, and techniques
            that help preserve trading capital.
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#09131d] p-6">
          <BarChart3
            className="mb-4 text-yellow-400"
            size={28}
          />

          <h2 className="text-xl font-bold">
            Trading Education
          </h2>

          <p className="mt-3 text-slate-400">
            Tutorials explaining Market Score, Market Breadth, sector
            rotation, and how to use the MaicaTrades platform.
          </p>
        </div>
      </section>

      <section className="border-t border-slate-800 py-20">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-3xl font-bold">
            First Articles Coming Soon
          </h2>

          <p className="mt-5 text-slate-400">
            We&apos;re preparing educational content focused on
            practical, data-driven swing trading. Check back soon as
            new articles are published.
          </p>

          <Link
            href="/dashboard"
            className="mt-8 inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-6 py-3 font-semibold text-black transition hover:bg-emerald-400"
          >
            Explore MaicaTrades
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </main>
  );
}