import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, ArrowRight, Calculator, CheckCircle2, Clock3, ShieldCheck } from "lucide-react";

const title = "Position Sizing Explained: How Much Should You Risk on a Trade?";
const description =
  "Learn how position sizing works, how many shares fit your risk, and how to use the free MaicaTrades Position Size Calculator before entering a trade.";
const canonicalPath = "/blog/position-sizing-explained";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "position sizing",
    "position size calculator",
    "how many shares to buy",
    "risk per trade",
    "swing trading risk management",
    "risk reward ratio",
    "portfolio heat",
  ],
  alternates: { canonical: canonicalPath },
  openGraph: {
    title: `${title} | MaicaTrades`,
    description,
    url: canonicalPath,
    type: "article",
    publishedTime: "2026-08-24T17:00:00-04:00",
  },
  twitter: {
    card: "summary_large_image",
    title: `${title} | MaicaTrades`,
    description,
  },
};

const articleJsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: title,
  description,
  datePublished: "2026-08-24",
  dateModified: "2026-08-24",
  author: { "@type": "Organization", name: "MaicaTrades" },
  publisher: {
    "@type": "Organization",
    name: "MaicaTrades",
    logo: { "@type": "ImageObject", url: "https://maicatrades.com/maica-logo.png" },
  },
  mainEntityOfPage: `https://maicatrades.com${canonicalPath}`,
};

const mistakes = [
  ["Buying the same number of shares every time", "Every setup has a different stop distance. The same share count can create very different dollar risk from one trade to the next."],
  ["Using all available buying power", "What your account can purchase is not the same as what your plan should risk."],
  ["Moving the stop after sizing the trade", "Widening a stop without reducing the share count increases the loss beyond the original plan."],
  ["Ignoring other open positions", "Several individually manageable trades can create too much combined risk, especially when they are correlated."],
  ["Treating a stop as a guaranteed exit price", "Gaps, fast markets, limited liquidity, slippage, fees, and partial fills can make the actual loss larger than the estimate."],
] as const;

export default function PositionSizingArticlePage() {
  return (
    <main className="min-h-screen bg-[#050b12] text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />

      <header className="border-b border-slate-800/80 bg-[#050b12]/95 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link href="/" className="flex items-center gap-3" aria-label="MaicaTrades home">
            <Image src="/maica-logo.png" alt="" width={38} height={38} className="h-9 w-9 object-contain" />
            <span className="text-xl font-black tracking-tight">Maica<span className="text-emerald-400">Trades</span></span>
          </Link>
          <Link href="/tools/position-size" className="rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-black text-black transition hover:bg-emerald-400">
            Open Calculator
          </Link>
        </nav>
      </header>

      <article>
        <section className="border-b border-slate-800/80 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.13),_transparent_48%)]">
          <div className="mx-auto max-w-4xl px-6 py-16 sm:py-24">
            <Link href="/blog" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-400 transition hover:text-emerald-400">
              <ArrowLeft size={16} /> Back to the blog
            </Link>
            <div className="mt-9 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-bold text-emerald-400">
              <ShieldCheck size={16} /> Risk Management
            </div>
            <h1 className="mt-7 text-4xl font-black leading-tight tracking-tight sm:text-6xl">
              Position Sizing Explained: <span className="text-emerald-400">How Much Should You Risk on a Trade?</span>
            </h1>
            <p className="mt-7 max-w-3xl text-lg leading-8 text-slate-300 sm:text-xl">
              A practical guide to turning your account size, entry, and stop into a controlled number of shares before you place the trade.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-5 text-sm text-slate-500">
              <span>MaicaTrades</span><span>August 24, 2026</span>
              <span className="inline-flex items-center gap-2"><Clock3 size={15} /> 8 min read</span>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-4xl px-6 py-14 sm:py-20">
          <div className="rounded-3xl border border-emerald-500/30 bg-[#09131d] p-6 shadow-2xl shadow-black/30 sm:p-9">
            <div className="flex items-center gap-3 text-emerald-400"><Calculator size={24} /><strong>Position-size example</strong></div>
            <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[["Account", "$10,000"], ["Risk goal", "1% / $100"], ["Entry / Stop", "$50 / $48"], ["Shares", "50"]].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-slate-800 bg-[#050b12] p-5">
                  <p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-xl font-black">{value}</p>
                </div>
              ))}
            </div>
            <p className="mt-6 text-sm leading-6 text-slate-500">$100 maximum planned risk ÷ $2 risk per share = 50 shares. Estimates exclude slippage, gaps, fees, taxes, and execution differences.</p>
          </div>

          <div className="mt-14 space-y-7 text-lg leading-8 text-slate-300">
            <p>Finding a promising stock is only part of building a trade. Before entering, you still need to answer one of the most important questions in trading: <strong className="text-white">How many shares should I buy?</strong></p>
            <p>Buy too many shares and a normal price movement can cause a painful loss. Buy too few and the position may not meaningfully contribute to your results. Position sizing creates a repeatable middle ground by connecting your account risk, entry price, and stop-loss level.</p>

            <h2 className="pt-5 text-3xl font-black tracking-tight text-white">What is position sizing?</h2>
            <p>Position sizing is the process of determining how many shares fit a predetermined risk limit. Instead of choosing an arbitrary number—or buying as much as your account allows—you begin by deciding how much money you are prepared to lose if the trade fails.</p>
            <p>That amount becomes your <strong className="text-white">maximum planned risk</strong>. Position sizing does not predict whether a stock will rise or fall. It helps control how much damage one unsuccessful trade could do to your account.</p>

            <h2 className="pt-5 text-3xl font-black tracking-tight text-white">The position-size formula</h2>
            <div className="rounded-2xl border border-slate-800 bg-[#09131d] p-6 font-mono text-base leading-8 text-emerald-400 sm:text-lg">
              Position size = Maximum dollar risk ÷ Risk per share
            </div>
            <p>For a long trade, risk per share is the entry price minus the stop price. For a short trade, it is the stop price minus the entry price. The MaicaTrades calculator performs the calculation and rounds down to a whole number of shares.</p>

            <h2 className="pt-5 text-3xl font-black tracking-tight text-white">A simple example</h2>
            <p>Assume you have a $10,000 account, plan to risk 1%, want to enter at $50, and place the stop at $48. One percent of the account is $100. The distance from entry to stop is $2 per share. Dividing $100 by $2 produces a risk-based position size of 50 shares.</p>
            <p>The position would use $2,500 of capital. If it is entered at $50 and exited at the planned $48 stop, the estimated loss would be approximately $100 before real-world execution costs and differences.</p>

            <h2 className="pt-5 text-3xl font-black tracking-tight text-white">Why the stop comes before the share count</h2>
            <p>A stronger process is to identify the setup, choose the planned entry, place the stop where the setup would be invalidated, select the maximum risk, and only then calculate the shares.</p>
            <p>Your stop should be based on the chart and the logic of the setup—not pulled closer simply to justify a larger position. A wider stop means more risk per share, so the share count must become smaller. A tighter stop allows more shares for the same risk, but only when that stop still makes sense for the trade.</p>
          </div>

          <section className="mt-14 overflow-hidden rounded-2xl border border-slate-800 bg-[#09131d]">
            <div className="grid grid-cols-3 border-b border-slate-800 bg-slate-900/60 px-5 py-4 text-sm font-bold text-slate-400">
              <span>Stop distance</span><span>Maximum risk</span><span>Position size</span>
            </div>
            {[["$1 per share", "$100", "100 shares"], ["$2 per share", "$100", "50 shares"], ["$4 per share", "$100", "25 shares"]].map((row) => (
              <div key={row[0]} className="grid grid-cols-3 border-b border-slate-800/70 px-5 py-4 text-sm last:border-0 sm:text-base">
                {row.map((item, index) => <span key={item} className={index === 2 ? "font-bold text-emerald-400" : "text-slate-300"}>{item}</span>)}
              </div>
            ))}
          </section>

          <div className="mt-14 space-y-7 text-lg leading-8 text-slate-300">
            <h2 className="text-3xl font-black tracking-tight text-white">Understanding reward to risk</h2>
            <p>If the $50 entry also has a $56 target, the trade risks $2 per share for a potential $6 reward per share. That creates a 3-to-1 reward-to-risk ratio, commonly described as 3R. With 50 shares, the planned loss is approximately $100 and the potential profit at the target is approximately $300.</p>
            <p>A favorable ratio does not guarantee a favorable result. A distant target means little if the setup has a low probability of reaching it. Reward to risk is one part of a complete plan, not a replacement for setup quality.</p>

            <h2 className="pt-5 text-3xl font-black tracking-tight text-white">How to use the MaicaTrades calculator</h2>
            <ol className="space-y-4">
              {[
                "Select Long if you expect the price to rise or Short if you expect it to fall.",
                "Enter your account capital and risk goal.",
                "Enter the planned entry and the stop where the setup becomes invalid.",
                "Add a target to evaluate the potential reward and R multiple.",
                "Enter existing open risk so you can see projected portfolio heat.",
                "Review the risk-based shares, affordable shares, capital used, maximum planned loss, potential profit, buying-power use, and risk profile.",
              ].map((item, index) => <li key={item} className="flex gap-4"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500 font-black text-black">{index + 1}</span><span>{item}</span></li>)}
            </ol>
            <p>If the risk-based share count requires more cash than the account has available, the calculator caps the result at the maximum affordable shares. This keeps buying power separate from risk: a trade can fit your risk limit while still demanding more capital than you want to commit.</p>

            <h2 className="pt-5 text-3xl font-black tracking-tight text-white">Do not ignore portfolio heat</h2>
            <p>Risk does not end with one trade. If you already have open positions, their remaining planned risk should be considered before adding another. The calculator combines existing open risk with the new trade&apos;s actual risk percentage to estimate projected portfolio heat.</p>
            <p>Correlation matters too. Several technology positions may behave like one large technology trade during a broad sector decline. Each setup can look reasonable alone while the account carries too much exposure to the same market theme.</p>
          </div>

          <section className="mt-16 rounded-3xl border border-slate-800 bg-[#09131d] p-6 sm:p-10">
            <h2 className="text-3xl font-black tracking-tight">Common position-sizing mistakes</h2>
            <div className="mt-8 space-y-6">
              {mistakes.map(([lead, body]) => (
                <div key={lead} className="flex gap-4">
                  <CheckCircle2 className="mt-1 shrink-0 text-emerald-400" size={22} />
                  <p className="leading-7 text-slate-300"><strong className="text-white">{lead}:</strong> {body}</p>
                </div>
              ))}
            </div>
          </section>

          <div className="mt-14 space-y-7 text-lg leading-8 text-slate-300">
            <h2 className="text-3xl font-black tracking-tight text-white">How much should you risk?</h2>
            <p>There is no single percentage that is right for every trader. Some use a fixed percentage such as 1% or 2%, while others choose less depending on account size, experience, market conditions, setup quality, or the number of positions already open.</p>
            <p>The percentage is not the main lesson. The discipline comes from choosing a limit that fits your circumstances, calculating it before entry, and following it consistently. Newer traders may prefer smaller risk—or simulated trading—while learning how their strategy behaves.</p>
            <p>Position sizing cannot eliminate losses. Its purpose is to help prevent one trade from becoming unnecessarily damaging.</p>

            <h2 className="pt-5 text-3xl font-black tracking-tight text-white">The bottom line</h2>
            <p>Good trading is not only about finding winners. It is also about staying in control when a trade does not work. Before entering, know why the setup is valid, where it becomes invalid, how much you are willing to lose, how many shares fit that risk, and how the trade affects your total account exposure.</p>
            <p>You cannot control what the market does after you enter. You can control how much risk you accept before you enter.</p>
          </div>

          <section className="mt-16 rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-8 text-center sm:p-10">
            <h2 className="text-2xl font-black sm:text-3xl">Calculate the risk before you place the trade</h2>
            <p className="mx-auto mt-4 max-w-2xl leading-7 text-slate-300">Enter your account, entry, stop, target, and existing open risk to turn your setup into a clear position plan.</p>
            <Link href="/tools/position-size" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 font-black text-black transition hover:bg-emerald-400">Open the Position Size Calculator <ArrowRight size={18} /></Link>
          </section>

          <p className="mt-10 text-center text-sm italic leading-6 text-slate-500">Educational purposes only. MaicaTrades does not provide financial advice. Calculations are estimates and cannot account for slippage, price gaps, liquidity, fees, taxes, or execution differences. All trading involves risk, including possible loss of principal.</p>
        </div>
      </article>
    </main>
  );
}
