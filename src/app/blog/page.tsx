import Link from "next/link";
import Image from "next/image";
import { ArrowRight, BookOpen, TrendingUp, Calculator, BarChart3 } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Swing Trading Blog | Market Insights & Trading Education",
  description: "Read MaicaTrades swing trading insights, market analysis, risk-management guides, trading education, and tutorials designed for busy swing traders.",
  alternates: { canonical: "/blog" },
  openGraph: { title: "Swing Trading Blog | MaicaTrades", description: "Market analysis, swing trading education, risk-management guides, and practical tutorials for busy traders.", url: "/blog", type: "website" },
};

function ArticleArrow() {
  return <span className="mt-6 inline-flex items-center gap-2 font-bold text-white transition group-hover:text-emerald-400">Read the article <ArrowRight size={18} /></span>;
}

export default function BlogPage() {
  return (
    <main className="min-h-screen bg-[#050b12] text-white">
      <section className="mx-auto max-w-6xl px-6 py-24 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-400"><BookOpen size={16} /> MaicaTrades Blog</div>
        <h1 className="mt-8 text-5xl font-bold tracking-tight">Market Insights for Busy Swing Traders</h1>
        <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-slate-400">The MaicaTrades Blog features practical market education, weekly trading insights, strategy guides, and tutorials designed specifically for busy swing traders.</p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link href="/dashboard" className="rounded-lg bg-emerald-500 px-6 py-3 font-semibold text-black transition hover:bg-emerald-400">Launch Dashboard</Link>
          <Link href="/tools/position-size" className="rounded-lg border border-slate-700 px-6 py-3 font-semibold transition hover:border-emerald-500">Position Size Calculator</Link>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-6 pb-24 md:grid-cols-3">
        <div className="rounded-xl border border-slate-800 bg-[#09131d] p-6"><TrendingUp className="mb-4 text-emerald-400" size={28} /><h2 className="text-xl font-bold">Weekly Market Analysis</h2><p className="mt-3 text-slate-400">Breakdowns of the current market environment, sector leadership, and the key levels swing traders should watch each week.</p></div>
        <div className="rounded-xl border border-slate-800 bg-[#09131d] p-6"><Calculator className="mb-4 text-blue-400" size={28} /><h2 className="text-xl font-bold">Risk Management</h2><p className="mt-3 text-slate-400">Learn position sizing, risk management, and techniques that help preserve trading capital.</p></div>
        <div className="rounded-xl border border-slate-800 bg-[#09131d] p-6"><BarChart3 className="mb-4 text-yellow-400" size={28} /><h2 className="text-xl font-bold">Trading Education</h2><p className="mt-3 text-slate-400">Tutorials explaining Market Score, Market Breadth, sector rotation, and how to use the MaicaTrades platform.</p></div>
      </section>

      <section className="border-t border-slate-800 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-9"><p className="text-sm font-bold uppercase tracking-[0.25em] text-emerald-400">Latest articles</p><h2 className="mt-3 text-3xl font-bold">Build your market-reading process</h2></div>
          <div className="grid gap-6 lg:grid-cols-2">
            <Link href="/blog/how-to-build-a-swing-trading-plan" className="group overflow-hidden rounded-2xl border border-emerald-500/40 bg-[radial-gradient(circle_at_top_right,_rgba(16,185,129,0.20),_transparent_45%),#09131d] transition hover:-translate-y-1 hover:border-emerald-400 lg:col-span-2">
              <div className="grid items-center lg:grid-cols-[1.05fr_0.95fr]">
                <Image src="/images/blog/position-size-calculator-example.png" alt="MaicaTrades position-size calculator showing a worked swing-trade risk example" width={1920} height={1080} className="aspect-video h-full w-full object-cover object-center" priority />
                <div className="p-7 sm:p-9"><div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-sm font-semibold text-emerald-400"><Calculator size={16} /> Foundations &amp; Risk · 12 min read</div><h3 className="mt-5 text-3xl font-black leading-tight sm:text-4xl">How to Build a Swing-Trading Plan Before Entering a Position</h3><p className="mt-4 leading-7 text-slate-300">Define the setup, entry, stop, position size, profit areas, and catalysts before putting money at risk.</p><ArticleArrow /></div>
              </div>
            </Link>

            <Link href="/blog/position-size-vs-buying-power" className="group overflow-hidden rounded-2xl border border-emerald-500/40 bg-[radial-gradient(circle_at_top_right,_rgba(16,185,129,0.20),_transparent_45%),#09131d] transition hover:-translate-y-1 hover:border-emerald-400 lg:col-span-2">
              <div className="grid items-center lg:grid-cols-[1.05fr_0.95fr]">
                <Image src="/blog-position-size-buying-power/calculator-setup.png" alt="MaicaTrades stock position size calculator showing trade setup and risk results" width={1920} height={1080} className="aspect-video h-full w-full object-cover object-center" />
                <div className="p-7 sm:p-9"><div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-sm font-semibold text-emerald-400"><Calculator size={16} /> Risk Management · 13 min read</div><h3 className="mt-5 text-3xl font-black leading-tight sm:text-4xl">Position Size vs. Buying Power: What’s the Difference?</h3><p className="mt-4 leading-7 text-slate-300">Buying power tells you what you can purchase. Position size tells you how many shares fit the risk of the trade.</p><ArticleArrow /></div>
              </div>
            </Link>

            <Link href="/blog/position-sizing-explained" className="group overflow-hidden rounded-2xl border border-slate-800 bg-[#09131d] p-7 transition hover:-translate-y-1 hover:border-emerald-500/60 sm:p-8">
              <div className="flex h-full flex-col justify-between gap-10"><div><div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-sm font-semibold text-emerald-400"><Calculator size={16} /> Risk Management · 8 min read</div><h3 className="mt-5 text-3xl font-black leading-tight">Position Sizing Explained: How Much Should You Risk on a Trade?</h3><p className="mt-4 leading-7 text-slate-300">Learn how to turn your account size, entry, and stop into the right number of shares—and account for buying power and open-position risk before entering.</p></div><ArticleArrow /></div>
            </Link>

            <Link href="/blog/how-to-read-a-stock-chart" className="group overflow-hidden rounded-2xl border border-slate-800 bg-[#09131d] transition hover:-translate-y-1 hover:border-emerald-500/60">
              <Image src="/blog-stock-chart/support-resistance.webp" alt="Stock chart showing support, resistance, and a breakout" width={1600} height={900} className="aspect-video w-full object-cover" />
              <div className="p-7 sm:p-8"><div className="text-sm font-semibold text-emerald-400">Trading Education · 9 min read</div><h3 className="mt-4 text-2xl font-black leading-tight">How to Read a Stock Chart</h3><p className="mt-4 leading-7 text-slate-400">Understand support, resistance, trend structure, moving averages, and how broader-market context can strengthen your decisions.</p><ArticleArrow /></div>
            </Link>

            <Link href="/blog/what-is-maicatrades-market-score" className="group overflow-hidden rounded-2xl border border-slate-800 bg-[#09131d] transition hover:-translate-y-1 hover:border-emerald-500/60">
              <Image src="/market-score-breakdown.webp" alt="MaicaTrades Market Score breakdown" width={1364} height={936} className="aspect-video w-full object-cover" />
              <div className="p-7 sm:p-8"><div className="text-sm font-semibold text-emerald-400">Market Education · 7 min read</div><h3 className="mt-4 text-2xl font-black leading-tight">What Is the MaicaTrades Market Score?</h3><p className="mt-4 leading-7 text-slate-400">See how trend, momentum, sector strength, volatility, and breadth combine to create one clear reading for busy swing traders.</p><ArticleArrow /></div>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
