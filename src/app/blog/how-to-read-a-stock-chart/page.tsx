import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, ArrowRight, BarChart3, Clock3, ShieldCheck } from "lucide-react";

const title = "How to Read a Stock Chart: Support, Resistance, Trends & Moving Averages";
const description =
  "Learn how to read support, resistance, trend structure, and moving averages—then use the MaicaTrades Market Score and Market Breadth for broader context.";
const canonicalPath = "/blog/how-to-read-a-stock-chart";

export const metadata: Metadata = {
  title: "How to Read a Stock Chart: A Beginner’s Guide",
  description,
  keywords: [
    "how to read a stock chart",
    "stock chart for beginners",
    "support and resistance",
    "higher highs and higher lows",
    "stock market trends",
    "moving averages",
    "20 day moving average",
    "50 day moving average",
    "market breadth",
    "swing trading charts",
  ],
  alternates: { canonical: canonicalPath },
  openGraph: {
    title: `${title} | MaicaTrades`,
    description,
    url: canonicalPath,
    type: "article",
    publishedTime: "2026-08-21T11:00:00-04:00",
    images: [
      {
        url: "/blog-stock-chart/support-resistance.webp",
        width: 1600,
        height: 900,
        alt: "Educational stock chart showing support, resistance, and a confirmed breakout",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${title} | MaicaTrades`,
    description,
    images: ["/blog-stock-chart/support-resistance.webp"],
  },
};

const articleJsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: title,
  description,
  image: "https://maicatrades.com/blog-stock-chart/support-resistance.webp",
  datePublished: "2026-08-21",
  dateModified: "2026-08-21",
  author: { "@type": "Organization", name: "MaicaTrades" },
  publisher: {
    "@type": "Organization",
    name: "MaicaTrades",
    logo: { "@type": "ImageObject", url: "https://maicatrades.com/maica-logo.png" },
  },
  mainEntityOfPage: `https://maicatrades.com${canonicalPath}`,
};

const chartImages = {
  support: "/blog-stock-chart/support-resistance.webp",
  trend: "/blog-stock-chart/trend-structure.webp",
  averages: "/blog-stock-chart/moving-averages.webp",
  breadth: "/blog-stock-chart/market-breadth.webp",
};

function ArticleFigure({ src, alt, caption, priority = false }: { src: string; alt: string; caption: string; priority?: boolean }) {
  return (
    <figure className="my-12 sm:my-14">
      <Image
        src={src}
        alt={alt}
        width={1600}
        height={900}
        priority={priority}
        className="h-auto w-full rounded-2xl border border-slate-700 shadow-2xl shadow-black/40"
      />
      <figcaption className="mt-3 text-center text-sm leading-6 text-slate-500">{caption}</figcaption>
    </figure>
  );
}

export default function StockChartArticlePage() {
  return (
    <main className="min-h-screen bg-[#050b12] text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />

      <header className="border-b border-slate-800/80 bg-[#050b12]/95 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link href="/" className="flex items-center gap-3" aria-label="MaicaTrades home">
            <Image src="/maica-logo.png" alt="" width={38} height={38} className="h-9 w-9 object-contain" />
            <span className="text-xl font-black tracking-tight">Maica<span className="text-emerald-400">Trades</span></span>
          </Link>
          <Link href="/dashboard" className="rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-black text-black transition hover:bg-emerald-400">
            Launch Dashboard
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
              <BarChart3 size={16} /> Trading Education
            </div>
            <h1 className="mt-7 text-4xl font-black leading-tight tracking-tight sm:text-6xl">
              How to Read a Stock Chart: <span className="text-emerald-400">Support, Resistance, Trends & Moving Averages</span>
            </h1>
            <p className="mt-7 max-w-3xl text-lg leading-8 text-slate-300 sm:text-xl">
              Learn to read what price is doing first—then use broader-market context to judge whether the setup has support behind it.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-5 text-sm text-slate-500">
              <span>MaicaTrades</span><span>August 21, 2026</span>
              <span className="inline-flex items-center gap-2"><Clock3 size={15} /> 9 min read</span>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-4xl px-6 py-14 sm:py-20">
          <div className="space-y-7 text-lg leading-8 text-slate-300">
            <p>A stock chart can look like a wall of candles, lines, and indicators. But underneath all that noise, every chart is telling a simple story: <strong className="text-white">where buyers took control, where sellers pushed back, and which side is currently gaining ground.</strong></p>
            <p>You do not need ten indicators to begin reading that story. Start with four building blocks: support, resistance, trend structure, and moving averages.</p>
            <p>Once you understand those concepts on an individual chart, tools such as the <strong className="text-white">MaicaTrades Market Score</strong> and <strong className="text-white">Market Breadth</strong> can add a second layer: whether the broader market is helping or fighting the setup you see.</p>
          </div>

          <div className="mt-10 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-lg leading-8 text-slate-200">
            <strong className="text-emerald-400">The key is order:</strong> Read the stock first. Then read the environment around it.
          </div>

          <section className="mt-16 space-y-7 text-lg leading-8 text-slate-300">
            <h2 className="text-3xl font-black tracking-tight text-white">1. Start with price—not predictions</h2>
            <p>Every candle summarizes price movement during a chosen period. On a daily chart, one candle represents one trading day. A green candle generally means price closed above its open; a red candle means it closed below its open. The thin lines, or wicks, show the session&apos;s high and low.</p>
            <p>One candle matters less than its location. A strong green candle in the middle of a messy range may mean very little. The same candle breaking above a well-tested resistance area—while the broader market is healthy—can be far more meaningful.</p>
            <p>Before asking, “Will this stock go up?” ask:</p>
            <ul className="space-y-3">
              {["Where has price repeatedly changed direction?", "Is the stock forming higher highs and higher lows, or lower highs and lower lows?", "Is price above or below important moving averages?", "Is the move supported by broad market participation?"].map((item) => (
                <li key={item} className="flex gap-3"><span className="mt-3 h-2 w-2 shrink-0 rounded-full bg-emerald-400" /><span>{item}</span></li>
              ))}
            </ul>
          </section>

          <section className="mt-16 space-y-7 text-lg leading-8 text-slate-300">
            <h2 className="text-3xl font-black tracking-tight text-white">2. Support: where buyers have previously stepped in</h2>
            <p><strong className="text-white">Support is an area where buying demand has been strong enough to slow or reverse a decline.</strong> It often forms near a previous low, a breakout level, a moving average, or a price area where heavy trading occurred.</p>
          </section>

          <ArticleFigure
            src={chartImages.support}
            alt="Illustrative candlestick chart showing a support zone, resistance zone, and breakout where former resistance becomes support"
            caption="Support and resistance are usually zones. A confirmed breakout can turn former resistance into new support."
            priority
          />

          <section className="space-y-7 text-lg leading-8 text-slate-300">
            <p>Think of support as a zone rather than an exact price. If a stock bounced near $50.10, $49.85, and $50.35 on different days, the useful conclusion is not that $50.10 is magical. It is that buyers have shown interest around the <strong className="text-white">$50 area</strong>.</p>
            <h3 className="pt-3 text-2xl font-black text-emerald-400">What makes support more meaningful?</h3>
            <ul className="space-y-3">
              {["Price has reacted there more than once.", "The reaction was decisive, not a tiny bounce.", "The area lines up with another reference point, such as a moving average or prior breakout.", "The stock approaches the level in an orderly pullback rather than a disorderly collapse.", "The broader market is stable or improving."].map((item) => (
                <li key={item} className="flex gap-3"><ShieldCheck className="mt-1 shrink-0 text-emerald-400" size={21} /><span>{item}</span></li>
              ))}
            </ul>
            <p>Support is not a guarantee. When buyers stop defending the area, price can break through it quickly. That is why traders often define invalidation or stop placement below the level that must hold for their idea to remain valid.</p>
          </section>

          <section className="mt-16 space-y-7 text-lg leading-8 text-slate-300">
            <h2 className="text-3xl font-black tracking-tight text-white">3. Resistance: where sellers have previously taken control</h2>
            <p><strong className="text-white">Resistance is an area where selling pressure has repeatedly slowed or reversed an advance.</strong> It can form near a prior high, the top of a trading range, or a level where trapped buyers may be waiting to exit.</p>
            <p>As price approaches resistance, watch whether momentum expands, whether price closes above the area instead of only wicking above it, whether the breakout holds on a retest, and whether the broader market confirms the move.</p>
            <p>A breakout is more convincing when price moves through resistance and then treats that old ceiling as a new floor. This is called a <strong className="text-white">resistance-to-support flip</strong>.</p>
            <p>Waiting for confirmation may mean entering slightly higher, but it can also reduce the risk of buying a failed breakout.</p>
          </section>

          <section className="mt-16 space-y-7 text-lg leading-8 text-slate-300">
            <h2 className="text-3xl font-black tracking-tight text-white">4. Trends: read the sequence of highs and lows</h2>
            <p>A trend is not simply whether today&apos;s candle is green or red. It is the structure created over multiple swings.</p>
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                ["Uptrend", "Higher highs and higher lows"],
                ["Downtrend", "Lower highs and lower lows"],
                ["Sideways range", "Movement between support and resistance"],
              ].map(([label, body]) => (
                <div key={label} className="rounded-2xl border border-slate-800 bg-[#09131d] p-5"><strong className="text-emerald-400">{label}</strong><p className="mt-2 text-base leading-7 text-slate-400">{body}</p></div>
              ))}
            </div>
          </section>

          <ArticleFigure
            src={chartImages.trend}
            alt="Illustrative candlestick chart connecting major swing pivots and labeling repeated higher highs and higher lows"
            caption="An uptrend becomes easier to see when you focus on the major swing pivots instead of every individual candle."
          />

          <section className="space-y-7 text-lg leading-8 text-slate-300">
            <p>In an uptrend, buyers are willing to pay higher prices on each advance, and pullbacks are being defended above prior lows. A red day can occur inside a healthy uptrend. Controlled pullbacks are normal.</p>
            <p>The trend becomes questionable when its structure changes—for example, when price fails to make a new high and then breaks below the most recent higher low.</p>
            <h3 className="pt-3 text-2xl font-black text-emerald-400">Use more than one timeframe</h3>
            <p>A stock can be in a short-term downtrend inside a long-term uptrend. That is not a contradiction; it is a pullback viewed from two different distances.</p>
            <ol className="space-y-3 pl-6 marker:font-bold marker:text-emerald-400">
              <li className="pl-2">Use the weekly chart to identify the larger direction and major levels.</li>
              <li className="pl-2">Use the daily chart to evaluate the current setup.</li>
              <li className="pl-2">Use a shorter timeframe only if it helps refine the entry—without overriding the larger structure.</li>
            </ol>
          </section>

          <section className="mt-16 space-y-7 text-lg leading-8 text-slate-300">
            <h2 className="text-3xl font-black tracking-tight text-white">5. Moving averages: a cleaner view of direction</h2>
            <p>A moving average smooths price over a chosen number of periods. It helps organize the chart and makes the prevailing direction easier to see.</p>
          </section>

          <ArticleFigure
            src={chartImages.averages}
            alt="Illustrative price chart comparing a faster 20-day moving average with a slower 50-day moving average"
            caption="The 20-day moving average reacts faster, while the 50-day moving average gives a slower view of the prevailing trend."
          />

          <section className="space-y-7 text-lg leading-8 text-slate-300">
            <p>The <strong className="text-white">20-day moving average</strong> is faster and more responsive to recent price movement. The <strong className="text-white">50-day moving average</strong> is slower and useful for viewing the intermediate trend.</p>
            <p>When price is above a rising moving average, the trend is generally healthier than when price is below a falling one. But the line itself is not a buy signal. Price can cross above and below an average repeatedly in a choppy market.</p>
            <h3 className="pt-3 text-2xl font-black text-emerald-400">Useful moving-average questions</h3>
            <ul className="space-y-3">
              {["Is the average rising, flat, or falling?", "Is price holding above it or repeatedly losing it?", "Does the average line up with prior support or a breakout level?", "Did price reclaim the average with strength, or barely drift above it?", "Is the broader market trend supportive?"].map((item) => (
                <li key={item} className="flex gap-3"><span className="mt-3 h-2 w-2 shrink-0 rounded-full bg-emerald-400" /><span>{item}</span></li>
              ))}
            </ul>
            <p>The strongest use of a moving average is often <strong className="text-white">confluence</strong>. A pullback into the 20-day average becomes more interesting when it also meets a prior breakout area and preserves a higher low.</p>
          </section>

          <section className="mt-16 rounded-3xl border border-slate-800 bg-[#09131d] p-6 sm:p-10">
            <h2 className="text-3xl font-black tracking-tight">6. Put the pieces together</h2>
            <p className="mt-6 text-lg leading-8 text-slate-300">Suppose a stock has a rising 50-day moving average, a sequence of higher highs and higher lows, a controlled pullback toward prior resistance, and the 20-day moving average rising into the same area.</p>
            <p className="mt-5 text-lg leading-8 text-slate-300">That is not four separate signals. It is one story told four ways: the trend is up, the pullback is approaching a logical support zone, and the setup has a clear level that can invalidate the idea.</p>
            <p className="mt-5 text-lg font-bold leading-8 text-emerald-400">Context beats indicator collecting.</p>
          </section>

          <section className="mt-16 space-y-7 text-lg leading-8 text-slate-300">
            <h2 className="text-3xl font-black tracking-tight text-white">7. Add the MaicaTrades Market Score</h2>
            <p>After reading the individual chart, zoom out to the overall market. The <strong className="text-white">MaicaTrades Market Score</strong> combines several parts of the environment—including trend, momentum, breadth, sector strength, and volatility—into one easier-to-read snapshot.</p>
            <p>It does not replace chart analysis, and it does not tell you what stock to buy. Its value is helping you answer a different question: <strong className="text-white">How supportive is the current market environment for taking risk?</strong></p>
            <ul className="space-y-3">
              {["A clean breakout may deserve more confidence when the Market Score shows a broadly healthy environment.", "The same breakout may require more caution when volatility is elevated, breadth is weak, and the market trend is deteriorating.", "A lower score may mean using smaller size, demanding stronger confirmation, taking profits more deliberately, or passing on marginal setups."].map((item) => (
                <li key={item} className="flex gap-3"><ShieldCheck className="mt-1 shrink-0 text-emerald-400" size={21} /><span>{item}</span></li>
              ))}
            </ul>
            <p>The Market Score is best used as a <strong className="text-white">risk-context tool</strong>, not a substitute for judgment.</p>
          </section>

          <section className="mt-16 space-y-7 text-lg leading-8 text-slate-300">
            <h2 className="text-3xl font-black tracking-tight text-white">8. Use Market Breadth to test the trend</h2>
            <p>Major indexes can rise even when only a small group of large stocks is doing most of the work. That is why Market Breadth matters.</p>
            <p><strong className="text-white">Breadth measures participation:</strong> how many stocks are advancing, holding healthy trends, or confirming the index&apos;s direction.</p>
          </section>

          <ArticleFigure
            src={chartImages.breadth}
            alt="Illustrative chart showing an index rising while market participation weakens"
            caption="A rising index with weakening participation can signal a narrower and potentially less durable advance."
          />

          <section className="space-y-7 text-lg leading-8 text-slate-300">
            <p>MaicaTrades tracks participation across a broad group of stocks to help show whether strength is spreading through the market or becoming concentrated in fewer names.</p>
            <p>Imagine the S&amp;P 500 or Nasdaq is making a new high, but fewer stocks are advancing or holding above key trend measures. The index trend is still up, but the foundation beneath it may be narrowing. That does not guarantee an immediate reversal. It tells you the move may be less forgiving.</p>
            <p>For a swing trader, healthy breadth can create a better environment for breakouts and continuation setups. Weak breadth can favor selectivity, faster profit-taking, and tighter risk control.</p>
          </section>

          <section className="mt-16">
            <h2 className="text-3xl font-black tracking-tight">9. A simple chart-reading routine</h2>
            <div className="mt-7 divide-y divide-slate-800 overflow-hidden rounded-2xl border border-slate-800 bg-[#09131d]">
              {[
                ["1", "Mark structure", "Identify the major support and resistance zones. Label the recent swing highs and swing lows."],
                ["2", "Define the trend", "Decide whether the stock is trending up, trending down, or moving sideways."],
                ["3", "Check moving averages", "Note where price sits relative to the 20-day and 50-day averages and whether they are rising or falling."],
                ["4", "Find confluence", "Look for multiple pieces of evidence pointing to the same area."],
                ["5", "Read the environment", "Use Market Score for the risk backdrop and Market Breadth to judge participation."],
                ["6", "Define risk before entry", "Know the price level that proves your idea wrong, then size the position accordingly."],
              ].map(([step, label, body]) => (
                <div key={step} className="grid gap-2 p-5 sm:grid-cols-[48px_180px_1fr] sm:items-center">
                  <strong className="text-2xl text-emerald-400">{step}</strong><strong>{label}</strong><span className="leading-7 text-slate-400">{body}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-16 space-y-6 text-lg leading-8 text-slate-300">
            <h2 className="text-3xl font-black tracking-tight text-white">10. Common chart-reading mistakes</h2>
            {[
              ["Treating a level as an exact penny.", "Support and resistance are usually zones."],
              ["Calling one green candle an uptrend.", "Trend requires a sequence of price swings."],
              ["Using a moving-average cross as a complete strategy.", "Moving averages work best with structure and context."],
              ["Ignoring the broader market.", "Even strong stocks can struggle when the environment becomes hostile."],
              ["Confusing confirmation with certainty.", "A high-quality setup can still fail. Risk management remains essential."],
              ["Adding too many indicators.", "More lines do not always create more clarity."],
            ].map(([lead, body]) => <p key={lead}><strong className="text-white">{lead}</strong> {body}</p>)}
          </section>

          <section className="mt-16 rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-8 sm:p-10">
            <h2 className="text-3xl font-black tracking-tight">Final takeaway</h2>
            <p className="mt-6 text-lg leading-8 text-slate-300">Reading a stock chart starts with the language of price. Support shows where buyers previously defended an area. Resistance shows where sellers stopped an advance. Trend structure reveals which side is gaining control. Moving averages help organize that structure.</p>
            <p className="mt-5 text-lg leading-8 text-slate-300">Once those basics make sense, the MaicaTrades Market Score and Market Breadth become more valuable—not because they replace the chart, but because they help you understand the environment around it.</p>
            <p className="mt-5 text-lg font-black leading-8 text-emerald-400">Depth without complexity. Read the stock. Read the market. Define the risk.</p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 font-black text-black transition hover:bg-emerald-400">Launch Dashboard <ArrowRight size={18} /></Link>
              <Link href="/markets/breadth" className="rounded-xl border border-slate-600 px-6 py-3 font-bold transition hover:border-emerald-400 hover:text-emerald-400">View Market Breadth</Link>
            </div>
          </section>

          <p className="mt-10 text-center text-sm italic leading-6 text-slate-500">Educational content only. Nothing in this article is financial advice or a recommendation to buy or sell any security. Trading involves risk, including the possible loss of principal.</p>
        </div>
      </article>
    </main>
  );
}
