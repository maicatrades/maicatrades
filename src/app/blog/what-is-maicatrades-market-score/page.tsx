import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, ArrowRight, Clock3, Gauge, ShieldCheck } from "lucide-react";

const title = "What Is the MaicaTrades Market Score?";
const description =
  "Learn how the MaicaTrades Market Score combines trend, momentum, sector strength, volatility, and market breadth into clear swing-trading context.";
const canonicalPath = "/blog/what-is-maicatrades-market-score";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "MaicaTrades Market Score",
    "market score",
    "swing trading market analysis",
    "market breadth",
    "sector strength",
    "market momentum",
    "stock market trend",
  ],
  alternates: { canonical: canonicalPath },
  openGraph: {
    title: `${title} | MaicaTrades`,
    description,
    url: canonicalPath,
    type: "article",
    publishedTime: "2026-08-20T20:30:00-04:00",
    images: [
      {
        url: "/market-score-breakdown.webp",
        width: 1364,
        height: 936,
        alt: "MaicaTrades Market Score breakdown showing a bearish score of 48 out of 100",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${title} | MaicaTrades`,
    description,
    images: ["/market-score-breakdown.webp"],
  },
};

const scoreRanges = [
  ["80–100", "Strong Bullish", "Broadly supportive conditions. Look for quality long setups while still respecting entries and stops."],
  ["65–79", "Bullish", "Constructive conditions, but selectivity and confirmation still matter."],
  ["50–64", "Neutral", "Mixed evidence. Reduce assumptions and let individual setups prove themselves."],
  ["35–49", "Bearish", "Cautious conditions. Protect capital, limit new exposure, and require stronger confirmation."],
  ["0–34", "Strong Bearish", "A high-risk environment where defense, patience, and capital preservation take priority."],
] as const;

const articleJsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: title,
  description,
  image: "https://maicatrades.com/market-score-breakdown.webp",
  datePublished: "2026-08-20",
  dateModified: "2026-08-20",
  author: { "@type": "Organization", name: "MaicaTrades" },
  publisher: {
    "@type": "Organization",
    name: "MaicaTrades",
    logo: {
      "@type": "ImageObject",
      url: "https://maicatrades.com/maica-logo.png",
    },
  },
  mainEntityOfPage: `https://maicatrades.com${canonicalPath}`,
};

export default function MarketScoreArticlePage() {
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
            <span className="text-xl font-black tracking-tight">
              Maica<span className="text-emerald-400">Trades</span>
            </span>
          </Link>
          <Link
            href="/dashboard"
            className="rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-black text-black transition hover:bg-emerald-400"
          >
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
              <Gauge size={16} /> Market Education
            </div>
            <h1 className="mt-7 text-4xl font-black leading-tight tracking-tight sm:text-6xl">
              What Is the MaicaTrades <span className="text-emerald-400">Market Score?</span>
            </h1>
            <p className="mt-7 max-w-3xl text-lg leading-8 text-slate-300 sm:text-xl">
              How one number turns market trend, momentum, sector strength, volatility, and breadth into clearer swing-trading context.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-5 text-sm text-slate-500">
              <span>MaicaTrades</span><span>August 20, 2026</span>
              <span className="inline-flex items-center gap-2"><Clock3 size={15} /> 7 min read</span>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-4xl px-6 py-14 sm:py-20">
          <figure>
            <Image
              src="/market-score-breakdown.webp"
              alt="MaicaTrades Market Score page showing a score of 48, a bearish market bias, elevated risk, and the score component breakdown"
              width={1364}
              height={936}
              priority
              className="h-auto w-full rounded-2xl border border-slate-700 shadow-2xl shadow-black/40"
            />
            <figcaption className="mt-3 text-center text-sm leading-6 text-slate-500">
              The detailed page shows the final score, market bias, risk level, suggested approach, and the four core components.
            </figcaption>
          </figure>

          <div className="mt-12 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-lg leading-8 text-slate-200">
            <strong className="text-emerald-400">The short version:</strong> The MaicaTrades Market Score is a 0–100 snapshot of the current market environment. It helps busy swing traders decide whether conditions support being aggressive, selective, defensive, or patient.
          </div>

          <div className="mt-14 space-y-7 text-lg leading-8 text-slate-300">
            <h2 className="text-3xl font-black tracking-tight text-white">The problem the Market Score is designed to solve</h2>
            <p>A market can look strong on the surface while important conditions underneath are weakening. An index may still be above its moving averages, but momentum may be fading, fewer sectors may be participating, breadth may be deteriorating, and volatility may be rising.</p>
            <p>That creates a practical problem for swing traders: there is too much market information to review quickly, and no single indicator tells the whole story. The MaicaTrades Market Score brings several important signals together and turns them into one clear reading without hiding the context behind it.</p>

            <h2 className="pt-5 text-3xl font-black tracking-tight text-white">How the Market Score works</h2>
            <p>The score begins with four core components worth a combined 100 points. Market Breadth is then used as a confirmation layer so the final reading reflects whether apparent market strength is broadly supported.</p>

            <h3 className="pt-3 text-2xl font-black text-emerald-400">1. Trend — up to 40 points</h3>
            <p>Trend carries the largest weight because the broader direction of the market matters most to swing traders. This component evaluates whether the major market indexes are holding constructive trend conditions rather than reacting only to one up or down session.</p>

            <h3 className="pt-3 text-2xl font-black text-emerald-400">2. Momentum — up to 25 points</h3>
            <p>Momentum measures the strength and persistence behind current price action. A market can remain in a longer-term uptrend while short-term momentum weakens. That difference helps explain why Trend can stay strong even on a red day.</p>

            <h3 className="pt-3 text-2xl font-black text-emerald-400">3. Sector Strength — up to 20 points</h3>
            <p>Healthy markets usually have meaningful participation across multiple sectors. When leadership narrows and most sectors are weak, the Sector Strength contribution falls—even if one or two heavyweight areas are holding up.</p>

            <h3 className="pt-3 text-2xl font-black text-emerald-400">4. Volatility — up to 15 points</h3>
            <p>Volatility is the risk-pressure component. Calm, controlled conditions are generally more supportive of swing trades, while expanding volatility can signal uncertainty, wider price swings, and a greater need to protect capital.</p>

            <h3 className="pt-3 text-2xl font-black text-emerald-400">5. Market Breadth — the confirmation layer</h3>
            <p>Market Breadth asks whether strength is widespread or concentrated. MaicaTrades tracks participation across its M122 market basket and compares advancing versus declining stocks, moving-average participation, the advance-decline line, and broad-sector participation. Breadth does not replace the four core components; it confirms or challenges the story they are telling.</p>
          </div>

          <section className="mt-16 rounded-3xl border border-slate-800 bg-[#09131d] p-6 sm:p-10">
            <h2 className="text-3xl font-black tracking-tight">A real example: why a strong trend can still produce a bearish score</h2>
            <p className="mt-6 text-lg leading-8 text-slate-300">In the dashboard example captured on August 20, 2026, the Market Score was 48/100—classified as Bearish. Trend still contributed 32 of 40 points, showing that the broader structure remained relatively constructive. But the rest of the evidence was much weaker:</p>
            <ul className="mt-6 space-y-3 text-lg text-slate-300">
              {[
                "Momentum: 9.5 of 25 points",
                "Sector Strength: 3.7 of 20 points",
                "Volatility: 8.5 of 15 points, classified as Moderate",
                "Market Breadth: 38/100, with only 27.1% advancing and 71.3% declining",
                "Broad sectors: only 1 of 11 positive",
              ].map((item) => <li key={item} className="flex gap-3"><span className="mt-3 h-2 w-2 shrink-0 rounded-full bg-emerald-400" /><span>{item}</span></li>)}
            </ul>
            <p className="mt-7 text-lg leading-8 text-slate-300">This is why the score is not just a trend indicator. Trend answers, “What is the broader structure?” The full Market Score asks, “How supportive is the complete environment right now?” On this day, selling pressure, weak participation, narrow sector strength, and higher volatility outweighed the remaining trend support.</p>
          </section>

          <figure className="mt-14">
            <Image
              src="/market-score-dashboard.webp"
              alt="MaicaTrades dashboard connecting the Market Score to the Market Outlook, market environment, sector leadership, risk, and weekly trading plan"
              width={1348}
              height={1650}
              className="mx-auto h-auto w-full max-w-3xl rounded-2xl border border-slate-700"
            />
            <figcaption className="mt-3 text-center text-sm leading-6 text-slate-500">The dashboard connects the score to Market Outlook, Today&apos;s Risk, sector leadership, Market Pulse, breadth, and the weekly trading plan.</figcaption>
          </figure>

          <section className="mt-16">
            <h2 className="text-3xl font-black tracking-tight">What the score ranges mean</h2>
            <div className="mt-7 divide-y divide-slate-800 overflow-hidden rounded-2xl border border-slate-800 bg-[#09131d]">
              {scoreRanges.map(([range, label, explanation]) => (
                <div key={range} className="grid gap-2 p-5 sm:grid-cols-[100px_160px_1fr] sm:items-center">
                  <strong className="text-emerald-400">{range}</strong>
                  <strong>{label}</strong>
                  <span className="leading-7 text-slate-400">{explanation}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-16">
            <h2 className="text-3xl font-black tracking-tight">How swing traders can use it</h2>
            <ul className="mt-7 space-y-4 text-lg leading-8 text-slate-300">
              {[
                ["Start with the environment.", "Check the score before reviewing individual setups."],
                ["Adjust exposure.", "Stronger conditions may support more exposure; weaker conditions may call for smaller positions or fewer trades."],
                ["Demand alignment.", "Favor setups that agree with sector leadership, breadth, momentum, and current risk conditions."],
                ["Use the breakdown.", "If the score changes, check which component moved instead of reacting to the number alone."],
                ["Keep chart structure in control.", "The score supports trade decisions; it does not replace entries, stops, targets, catalysts, or position sizing."],
              ].map(([lead, body]) => <li key={lead} className="flex gap-3"><ShieldCheck className="mt-1 shrink-0 text-emerald-400" size={22} /><span><strong className="text-white">{lead}</strong> {body}</span></li>)}
            </ul>
          </section>

          <section className="mt-16 space-y-6 text-lg leading-8 text-slate-300">
            <h2 className="text-3xl font-black tracking-tight text-white">What the Market Score is—and what it is not</h2>
            <p>The Market Score is a preparation tool, not a prediction machine. It does not tell traders that the market must rise or fall next. It organizes current evidence so traders can match their level of risk to the environment in front of them.</p>
            <p>That is the MaicaTrades philosophy: <strong className="text-white">depth without complexity.</strong> The calculations happen behind the scenes, while the dashboard presents a clear answer to the question busy swing traders need to ask each day: What kind of market am I trading in right now?</p>
          </section>

          <section className="mt-16 rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-8 text-center sm:p-10">
            <h2 className="text-2xl font-black sm:text-3xl">Check today&apos;s market environment</h2>
            <p className="mx-auto mt-4 max-w-2xl leading-7 text-slate-300">Review the live Market Score before planning your next trade, then open the breakdown to see which conditions are driving the reading.</p>
            <div className="mt-7 flex flex-wrap justify-center gap-4">
              <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 font-black text-black transition hover:bg-emerald-400">Launch Dashboard <ArrowRight size={18} /></Link>
              <Link href="/markets/market-score" className="rounded-xl border border-slate-600 px-6 py-3 font-bold transition hover:border-emerald-400 hover:text-emerald-400">View Score Breakdown</Link>
            </div>
          </section>

          <p className="mt-10 text-center text-sm italic leading-6 text-slate-500">Educational purposes only. The MaicaTrades Market Score is not financial advice and should not replace independent research or risk management.</p>
        </div>
      </article>
    </main>
  );
}
