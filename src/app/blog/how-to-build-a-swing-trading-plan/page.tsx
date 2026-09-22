import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, ArrowRight, Calculator, CheckCircle2, Clock3, ShieldCheck } from "lucide-react";

const title = "How to Build a Swing-Trading Plan Before Entering a Position";
const description =
  "Build a practical swing-trading plan with a defined setup, entry, stop, position size, profit targets, and catalyst check before risking your money.";
const canonicalPath = "/blog/how-to-build-a-swing-trading-plan";
const calculatorImage = "/images/blog/position-size-calculator-example.png";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "swing trading plan",
    "how to plan a swing trade",
    "swing trading entry and stop loss",
    "position sizing for swing trading",
    "risk management trading plan",
    "swing trading checklist",
  ],
  alternates: { canonical: canonicalPath },
  openGraph: {
    title: `${title} | MaicaTrades`,
    description,
    url: canonicalPath,
    type: "article",
    publishedTime: "2026-09-17T12:00:00-04:00",
    images: [{ url: calculatorImage, width: 1920, height: 1080, alt: "MaicaTrades position-size calculator worked example" }],
  },
  twitter: { card: "summary_large_image", title: `${title} | MaicaTrades`, description, images: [calculatorImage] },
};

const articleJsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: title,
  description,
  image: `https://maicatrades.com${calculatorImage}`,
  datePublished: "2026-09-17",
  dateModified: "2026-09-17",
  author: { "@type": "Organization", name: "MaicaTrades" },
  publisher: {
    "@type": "Organization",
    name: "MaicaTrades",
    logo: { "@type": "ImageObject", url: "https://maicatrades.com/maica-logo.png" },
  },
  mainEntityOfPage: `https://maicatrades.com${canonicalPath}`,
};

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item} className="flex gap-3">
          <CheckCircle2 className="mt-1 shrink-0 text-emerald-400" size={20} />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default function SwingTradingPlanArticlePage() {
  return (
    <main className="min-h-screen bg-[#050b12] text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />

      <header className="border-b border-slate-800/80 bg-[#050b12]/95 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link href="/" className="flex items-center gap-3" aria-label="MaicaTrades home">
            <Image src="/maica-logo.png" alt="" width={38} height={38} className="h-9 w-9 object-contain" />
            <span className="text-xl font-black tracking-tight">Maica<span className="text-emerald-400">Trades</span></span>
          </Link>
          <Link href="/dashboard" className="rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-black text-black transition hover:bg-emerald-400">Launch Dashboard</Link>
        </nav>
      </header>

      <article>
        <section className="border-b border-slate-800/80 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.13),_transparent_48%)]">
          <div className="mx-auto max-w-4xl px-6 py-16 sm:py-24">
            <Link href="/blog" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-400 transition hover:text-emerald-400"><ArrowLeft size={16} /> Back to the blog</Link>
            <div className="mt-9 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-bold text-emerald-400"><ShieldCheck size={16} /> Foundations &amp; Risk</div>
            <h1 className="mt-7 text-4xl font-black leading-tight tracking-tight sm:text-6xl">How to Build a Swing-Trading Plan <span className="text-emerald-400">Before Entering a Position</span></h1>
            <p className="mt-7 max-w-3xl text-lg leading-8 text-slate-300 sm:text-xl">Decide the setup, entry, stop, position size, and profit plan while your money is still safely outside the trade.</p>
            <div className="mt-7 flex flex-wrap items-center gap-5 text-sm text-slate-500"><span>MaicaTrades</span><span>September 17, 2026</span><span className="inline-flex items-center gap-2"><Clock3 size={15} /> 12 min read</span></div>
          </div>
        </section>

        <div className="mx-auto max-w-4xl px-6 py-14 sm:py-20">
          <div className="space-y-7 text-lg leading-8 text-slate-300">
            <p>Most bad trades do not start with a bad stock. They start with a trader entering before deciding what would prove the idea right or wrong.</p>
            <p>The chart looks good. Price is moving. You do not want to miss it, so you buy first and promise yourself that you will work out the details afterward.</p>
            <p>Then the trade pulls back. Was that a normal retest or has the setup failed? Should you add, hold, or get out? If the stock moves higher, where should you take profit?</p>
            <p>Without a plan, every small move forces another decision while money is on the line. That is exactly when emotions tend to take over.</p>
          </div>

          <div className="mt-10 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 text-sm leading-7 text-slate-300"><strong className="text-amber-300">Affiliate disclosure:</strong> This article contains an affiliate link. If you purchase a TradingView plan through that link, MaicaTrades may earn a commission at no additional cost to you. We only mention tools relevant to the trading process discussed.</div>

          <section className="mt-16 space-y-7 text-lg leading-8 text-slate-300">
            <h2 className="text-3xl font-black tracking-tight text-white">What is a swing-trading plan?</h2>
            <p>A swing-trading plan is a written outline for one specific trade. It defines:</p>
            <BulletList items={["Why you are interested in the setup", "What must happen before you enter", "Where the trade is invalidated", "How much money you are willing to risk", "Where you may take profits", "What could change the trade after entry"]} />
            <p>Think of it as your decision-making work completed in advance. You cannot control whether the trade wins. You can control whether the trade makes sense, whether the risk is acceptable, and whether you follow your process.</p>
          </section>

          <section className="mt-16 space-y-7 text-lg leading-8 text-slate-300">
            <h2 className="text-3xl font-black tracking-tight text-white">Step 1: Start with the market environment</h2>
            <p>Before looking at an individual stock, take a quick look at the broader market. Is it trending higher, trending lower, or moving sideways? Is breadth healthy, or are only a few large stocks holding up the indexes?</p>
            <p>The <Link href="/dashboard" className="font-bold text-emerald-400 hover:text-emerald-300">MaicaTrades Dashboard</Link> brings those questions into one view. Start with the Market Score, then check Market Breadth and Market Pulse. You are not looking for a prediction. You are checking whether conditions support the kind of trade you want to take.</p>
            <BulletList items={["In a strong market, you may be more comfortable holding a breakout through a normal pullback.", "In a mixed market, you may reduce your position size or take profits sooner.", "In a weak market, a bullish setup may require stronger confirmation before it is worth taking."]} />
            <p>A good stock can still struggle when the overall market is working against it.</p>
          </section>

          <section className="mt-16 space-y-7 text-lg leading-8 text-slate-300">
            <h2 className="text-3xl font-black tracking-tight text-white">Step 2: Write down the reason for the trade</h2>
            <p>“The stock looks strong” is not a complete trade idea. Your reason should be specific enough that another trader could look at the chart and understand what you see.</p>
            <blockquote className="rounded-2xl border-l-4 border-emerald-400 bg-[#09131d] p-6 italic">The stock is in an uptrend, pulled back to the rising 20-day moving average, and is forming a tight base above support. I am looking for a move above the base with stronger volume.</blockquote>
            <p>Or: price broke through resistance, returned to test the breakout level, and held. You are looking for a higher low and a move back above the previous session&apos;s high.</p>
            <p>This identifies the actual setup and gives you something useful to review later.</p>
          </section>

          <section className="mt-16 space-y-7 text-lg leading-8 text-slate-300">
            <h2 className="text-3xl font-black tracking-tight text-white">Step 3: Define the entry trigger</h2>
            <p>A setup and an entry are not the same thing. You may like the chart, but what exactly must happen before you put money at risk?</p>
            <BulletList items={["A break above a defined resistance level", "A successful retest followed by a higher low", "A move above the previous day’s high", "A bounce from the 20-day moving average", "A strong reversal candle near support", "A breakout supported by above-average volume"]} />
            <p>Instead of writing “Enter if it looks strong,” write “Enter above $52.40 if price holds above the breakout level.” The second version leaves much less room for an emotional decision.</p>
            <p>Draw the entry, stop, and potential targets before placing an order. You can <a href="https://www.tradingview.com/chart/?aff_id=1171043&aff_sub=swing-trading-plan&source=maicatrades-blog" rel="sponsored nofollow" target="_blank" className="font-bold text-emerald-400 hover:text-emerald-300">map the complete setup on TradingView</a> and see whether the potential reward makes sense compared with the risk.</p>
            <p>Do not treat the planned entry as a command. If the stock gaps far above it, the risk-to-reward calculation may no longer make sense. Missing a trade is usually cheaper than chasing one.</p>
          </section>

          <section className="mt-16 space-y-7 text-lg leading-8 text-slate-300">
            <h2 className="text-3xl font-black tracking-tight text-white">Step 4: Decide where the idea is wrong</h2>
            <p>Your stop should be tied to the chart, not to the amount of pain you can tolerate. Ask: <strong className="text-white">What price action would prove that my original idea is no longer valid?</strong></p>
            <p>If you are trading a breakout and retest, the setup may fail when price closes back below the reclaimed level. If you are buying a pullback to the 20-day moving average, it may fail when price loses that average and breaks the recent swing low.</p>
            <div className="rounded-2xl border border-slate-700 bg-[#09131d] p-6 text-center text-xl font-black text-white">Risk per share = Entry price − Stop price</div>
            <p>If your planned entry is $52.40 and your stop is $50.90, you are risking $1.50 per share.</p>
          </section>

          <section className="mt-16 space-y-7 text-lg leading-8 text-slate-300">
            <h2 className="text-3xl font-black tracking-tight text-white">Step 5: Calculate the position size</h2>
            <p>Once you know the entry and stop, calculate how many shares fit your risk limit.</p>
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center text-xl font-black text-emerald-300">Position size = Maximum dollar risk ÷ Risk per share</div>
            <div className="grid gap-3 sm:grid-cols-2">
              {[["Planned entry", "$52.40"], ["Stop", "$50.90"], ["Risk per share", "$1.50"], ["Maximum risk", "$75"], ["Position size", "50 shares"]].map(([label, value]) => <div key={label} className="flex justify-between rounded-xl border border-slate-800 bg-[#09131d] p-4"><span className="text-slate-400">{label}</span><strong className="text-white">{value}</strong></div>)}
            </div>
            <p>The calculation is $75 divided by $1.50, which equals 50 shares.</p>
          </section>

          <figure className="my-12 sm:my-14">
            <a href="/tools/position-size" aria-label="Open the MaicaTrades Position Size Calculator">
              <Image src={calculatorImage} alt="MaicaTrades Position Size Calculator showing a $7,500 account, 1% risk, $52.40 entry, $50.90 stop, $55.40 target, and a 50-share position" width={1920} height={1080} className="h-auto w-full rounded-2xl border border-emerald-500/40 shadow-2xl shadow-black/40 transition hover:border-emerald-400" />
            </a>
            <figcaption className="mt-4 text-center text-sm leading-6 text-slate-500">This example risks $75 on a 50-share position. Click the image to try the MaicaTrades Position Size Calculator with your own numbers.</figcaption>
          </figure>

          <section className="space-y-7 text-lg leading-8 text-slate-300">
            <p>The <Link href="/tools/position-size" className="font-bold text-emerald-400 hover:text-emerald-300">MaicaTrades Position Size Calculator</Link> can work out the position size from your entry, stop, and maximum account risk.</p>
            <p>Position size comes last. You do not buy 100 shares because that is your usual size and then force the stop to fit. The chart determines the stop, your risk limit determines the position size, and the position size keeps one bad trade from doing serious damage.</p>
            <p>If you trade options, the principle is the same. Decide the maximum amount you can lose before entering, account for expiration and implied volatility, and avoid buying more contracts simply because they appear inexpensive.</p>
          </section>

          <section className="mt-16 space-y-7 text-lg leading-8 text-slate-300">
            <h2 className="text-3xl font-black tracking-tight text-white">Step 6: Identify realistic profit areas</h2>
            <p>You do not need to predict the exact top. You need to know where sellers may appear and whether the potential reward justifies the risk.</p>
            <BulletList items={["The next resistance level", "A prior swing high", "The top of a trading range", "An all-time high", "A fixed multiple of your initial risk"]} />
            <p>Using the earlier example, the risk is $1.50 per share. If the next meaningful resistance is only $1 above the entry, risking $1.50 to make roughly $1 may not be attractive. If resistance is $4 higher, the trade has more room to work.</p>
            <p>You can also scale out—perhaps taking part of the position off at the first resistance level and allowing the remainder to work toward a larger target. Decide this before the trade becomes profitable.</p>
          </section>

          <section className="mt-16 space-y-7 text-lg leading-8 text-slate-300">
            <h2 className="text-3xl font-black tracking-tight text-white">Step 7: Check upcoming catalysts</h2>
            <p>Before entering, check the calendar. Is the company reporting earnings soon? Is a Federal Reserve decision, inflation report, or major industry announcement scheduled during your expected holding period?</p>
            <p>The <Link href="/markets/calendar" className="font-bold text-emerald-400 hover:text-emerald-300">MaicaTrades Economic Calendar</Link> can help you check the week&apos;s major market-moving events before committing to the trade.</p>
            <p>A chart can look perfect and still gap sharply after unexpected news. Some traders intentionally hold through catalysts, but that should be a planned decision—not a surprise discovered after entering.</p>
          </section>

          <section className="mt-16 rounded-3xl border border-slate-800 bg-[#09131d] p-6 sm:p-10">
            <h2 className="text-3xl font-black tracking-tight">A complete swing-trade plan example</h2>
            <div className="mt-7 space-y-5 text-lg leading-8 text-slate-300">
              {[
                ["Market environment", "The broad market is constructive, but momentum has slowed. Position size will be slightly smaller than normal."],
                ["Setup", "ABC is in an uptrend and recently broke above $80 resistance. Price has pulled back for three sessions and is holding the breakout area near the rising 20-day moving average."],
                ["Entry trigger", "Enter above $81.20 after price forms a higher low. Do not enter if the stock gaps above $82.50."],
                ["Stop", "$78.90, below the breakout level and recent swing low."],
                ["Risk per share", "$2.30."], ["Maximum account risk", "$92."], ["Position size", "40 shares."],
                ["First profit area", "$85, near the recent high. Consider selling one-third of the position."],
                ["Second profit area", "$88–$90 if momentum and the market remain supportive."],
                ["Catalyst check", "No earnings scheduled during the next two weeks. Inflation data is due Friday morning."],
                ["Invalidation", "Exit if price breaks the planned stop. Reassess before Friday’s inflation report if the trade has not made progress."],
              ].map(([label, body]) => <p key={label}><strong className="text-emerald-400">{label}:</strong> {body}</p>)}
            </div>
          </section>

          <section className="mt-16">
            <h2 className="text-3xl font-black tracking-tight">Your pre-trade checklist</h2>
            <div className="mt-7 divide-y divide-slate-800 overflow-hidden rounded-2xl border border-slate-800 bg-[#09131d]">
              {["What is the current market environment?", "What specific setup am I trading?", "What price action triggers my entry?", "What price proves the idea wrong?", "How much am I risking per share or contract?", "What position size keeps the loss within my limit?", "Where are the next meaningful resistance or support levels?", "How will I take profits if the trade works?", "Are there any earnings or economic catalysts ahead?", "Am I following the plan, or reacting to fear of missing out?"].map((item, index) => <div key={item} className="grid grid-cols-[42px_1fr] items-center p-5"><strong className="text-xl text-emerald-400">{index + 1}</strong><span className="text-lg text-slate-300">{item}</span></div>)}
            </div>
          </section>

          <section className="mt-16 rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-8 sm:p-10">
            <h2 className="text-3xl font-black tracking-tight">A plan will not eliminate losing trades</h2>
            <p className="mt-6 text-lg leading-8 text-slate-300">Even a well-planned trade can fail. The purpose of the plan is not to avoid every loss. It is to prevent one uncertain chart from turning into an oversized, unmanaged position.</p>
            <p className="mt-5 text-lg leading-8 text-slate-300">The goal is not to know what the market will do next. The goal is to know what <strong className="text-white">you</strong> will do next—whether the trade moves in your favor, moves against you, or never reaches your entry.</p>
            <p className="mt-5 text-lg font-black leading-8 text-emerald-400">That is what turns a chart idea into a trade you can actually manage.</p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 font-black text-black transition hover:bg-emerald-400">Check the Market Environment <ArrowRight size={18} /></Link>
              <Link href="/tools/position-size" className="inline-flex items-center gap-2 rounded-xl border border-slate-600 px-6 py-3 font-bold transition hover:border-emerald-400 hover:text-emerald-400"><Calculator size={18} /> Calculate Position Size</Link>
            </div>
          </section>

          <p className="mt-10 text-center text-sm italic leading-6 text-slate-500">Educational content only. Nothing in this article is financial advice or a recommendation to buy or sell any security. Trading involves risk, including the possible loss of principal.</p>
        </div>
      </article>
    </main>
  );
}
