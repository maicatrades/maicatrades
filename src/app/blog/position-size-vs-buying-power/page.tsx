import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, ArrowRight, Calculator, CheckCircle2, Clock3, Gauge, ShieldCheck } from "lucide-react";

const title = "Position Size vs. Buying Power: What’s the Difference?";
const description = "Learn the difference between position size and buying power, how to calculate how many shares to buy, and how a position size calculator helps control risk.";
const canonicalPath = "/blog/position-size-vs-buying-power";
const heroImage = "/blog-position-size-buying-power/calculator-setup.png";

export const metadata: Metadata = {
  title,
  description,
  keywords: ["position size calculator", "stock position size calculator", "position size vs buying power", "how many shares to buy", "calculate position size", "risk per trade", "trading buying power"],
  alternates: { canonical: canonicalPath },
  openGraph: {
    title: `${title} | MaicaTrades`, description, url: canonicalPath, type: "article",
    publishedTime: "2026-09-03T12:00:00-04:00",
    images: [{ url: heroImage, width: 1920, height: 1080, alt: "MaicaTrades stock position size calculator showing trade inputs and buying-power results" }],
  },
  twitter: { card: "summary_large_image", title: `${title} | MaicaTrades`, description, images: [heroImage] },
};

const articleJsonLd = {
  "@context": "https://schema.org", "@type": "Article", headline: title, description,
  image: `https://maicatrades.com${heroImage}`, datePublished: "2026-09-03", dateModified: "2026-09-03",
  author: { "@type": "Organization", name: "MaicaTrades" },
  publisher: { "@type": "Organization", name: "MaicaTrades", logo: { "@type": "ImageObject", url: "https://maicatrades.com/maica-logo.png" } },
  mainEntityOfPage: `https://maicatrades.com${canonicalPath}`,
};

const comparisonRows = [
  ["Main question", "How many shares should I trade?", "How much can my account purchase?"],
  ["Determined by", "Maximum risk, entry, and stop", "Cash, margin, open positions, and broker rules"],
  ["Primary purpose", "Control the planned loss", "Measure purchasing capacity"],
  ["Usually expressed as", "Shares and total position value", "Dollar amount"],
  ["Changes when the stop changes?", "Yes", "Not necessarily"],
  ["Represents acceptable risk?", "Yes, when properly calculated", "No"],
] as const;

const mistakes = [
  ["Using all available buying power", "The maximum amount your broker permits is not a recommended trade size."],
  ["Choosing shares before the stop", "Define the setup, entry, and invalidation level before calculating the share quantity."],
  ["Confusing capital used with capital at risk", "A position’s market value and its planned loss at the stop are different numbers."],
  ["Tightening the stop to buy more shares", "A stop should reflect where the setup becomes invalid—not where the math creates more shares."],
  ["Ignoring other positions", "Several manageable trades can create excessive combined risk when they are correlated."],
  ["Rounding the share count up", "Round down when whole shares are required so the estimate stays within the selected risk limit."],
] as const;

const faqs = [
  ["Is position size the same as buying power?", "No. Position size is the number of shares or total value selected for a trade. Buying power is the amount the brokerage account currently allows you to purchase. Buying power sets a ceiling; risk-based position sizing determines an appropriate trade size."],
  ["How do I calculate how many shares to buy?", "Find the distance between the entry and stop-loss prices, then divide your maximum acceptable dollar loss by that risk per share. Round down and confirm that the total purchase fits within your buying power."],
  ["What does a position size calculator calculate?", "It uses your entry, stop, and maximum risk to calculate how many shares fit the plan. A complete calculator can also show capital required, maximum estimated loss, buying-power usage, potential profit, and reward to risk."],
  ["Should I use all of my buying power?", "Not automatically. The appropriate amount depends on your risk limit, stop distance, current positions, strategy, and market conditions. Your broker’s maximum allowance is not a recommended position size."],
  ["What if the calculated position exceeds my buying power?", "Reduce the shares to the maximum your available buying power supports or skip the trade. Do not move the stop to an invalid level or increase risk merely to force the position to fit."],
  ["Does a stop loss guarantee my maximum loss?", "No. Gaps, slippage, halts, and limited liquidity can produce a different execution price. Position-size calculations are estimates, not guaranteed maximum losses."],
  ["Can I use a position size calculator for short trades?", "Yes, if it supports short positions. For a short trade, risk per share is generally the stop price minus the planned entry because the stop is above the entry."],
] as const;

function ArticleFigure({ src, alt, caption, crop = false, dashboard = false }: { src: string; alt: string; caption: string; crop?: boolean; dashboard?: boolean }) {
  const href = dashboard ? "/dashboard" : "/tools/position-size";
  return (
    <figure className="my-12 sm:my-14">
      <Link href={href}>
        {crop ? (
          <div className="relative aspect-[16/7] overflow-hidden rounded-2xl border border-slate-700 shadow-2xl shadow-black/40">
            <Image src={src} alt={alt} fill sizes="(max-width: 896px) 100vw, 896px" className="scale-[1.4] object-cover object-center" />
          </div>
        ) : (
          <Image src={src} alt={alt} width={1920} height={1080} className="h-auto w-full rounded-2xl border border-slate-700 shadow-2xl shadow-black/40 transition hover:border-emerald-500/70" />
        )}
      </Link>
      <figcaption className="mt-3 text-center text-sm leading-6 text-slate-500">{caption}</figcaption>
    </figure>
  );
}

export default function PositionSizeVsBuyingPowerPage() {
  return (
    <main className="min-h-screen bg-[#050b12] text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      <header className="border-b border-slate-800/80 bg-[#050b12]/95 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link href="/" className="flex items-center gap-3" aria-label="MaicaTrades home"><Image src="/maica-logo.png" alt="" width={38} height={38} className="h-9 w-9 object-contain" /><span className="text-xl font-black tracking-tight">Maica<span className="text-emerald-400">Trades</span></span></Link>
          <Link href="/tools/position-size" className="rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-black text-black transition hover:bg-emerald-400">Open Calculator</Link>
        </nav>
      </header>

      <article>
        <section className="border-b border-slate-800/80 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.13),_transparent_48%)]">
          <div className="mx-auto max-w-4xl px-6 py-16 sm:py-24">
            <Link href="/blog" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-400 transition hover:text-emerald-400"><ArrowLeft size={16} /> Back to the blog</Link>
            <div className="mt-9 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-bold text-emerald-400"><ShieldCheck size={16} /> Risk Management</div>
            <h1 className="mt-7 text-4xl font-black leading-tight tracking-tight sm:text-6xl">Position Size vs. Buying Power: <span className="text-emerald-400">What’s the Difference?</span></h1>
            <p className="mt-7 max-w-3xl text-lg leading-8 text-slate-300 sm:text-xl">Buying power tells you what you can purchase. Position size tells you what you should purchase based on the risk of the trade.</p>
            <div className="mt-7 flex flex-wrap items-center gap-5 text-sm text-slate-500"><span>MaicaTrades</span><span>September 3, 2026</span><span className="inline-flex items-center gap-2"><Clock3 size={15} /> 13 min read</span></div>
          </div>
        </section>

        <div className="mx-auto max-w-4xl px-6 py-14 sm:py-20">
          <div className="space-y-7 text-lg leading-8 text-slate-300">
            <p>If your brokerage account says you have $20,000 in buying power, does that mean you should place a $20,000 trade? <strong className="text-white">Usually, no.</strong></p>
            <p>Buying power and position size may both be expressed in dollars, but they answer two different questions. Buying power asks, “How much can I purchase?” Position size asks, “How much should I purchase based on the risk of this trade?”</p>
            <p>A broker may allow you to buy hundreds of shares, but the distance between your entry and stop loss may make that position far too risky for your account.</p>
            <p>A <Link href="/tools/position-size" className="font-bold text-emerald-400 underline decoration-emerald-500/40 underline-offset-4 hover:text-emerald-300">position size calculator</Link> solves this problem by calculating how many shares fit a predetermined risk limit—not the maximum your broker will allow.</p>
          </div>

          <section className="mt-12 grid gap-5 sm:grid-cols-2">
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6"><Calculator className="text-emerald-400" size={27} /><h2 className="mt-4 text-xl font-black">Position size</h2><p className="mt-3 leading-7 text-slate-300">How many shares fit the amount you are prepared to lose if the trade reaches its stop?</p></div>
            <div className="rounded-2xl border border-blue-500/30 bg-blue-500/10 p-6"><Gauge className="text-blue-400" size={27} /><h2 className="mt-4 text-xl font-black">Buying power</h2><p className="mt-3 leading-7 text-slate-300">How much capital does your brokerage currently allow the account to deploy?</p></div>
          </section>

          <section className="mt-16 space-y-7 text-lg leading-8 text-slate-300">
            <h2 className="text-3xl font-black tracking-tight text-white">What is buying power?</h2>
            <p>Buying power is the amount of capital your brokerage makes available for purchasing securities. It may include your cash, additional margin supplied by the broker, or a combination of both.</p>
            <p>A $10,000 deposit may provide approximately $10,000 of buying power in a cash account. An eligible margin account may display more. The available amount can also change because of open positions, unsettled funds, the security being traded, and the broker’s margin requirements.</p>
            <p>Buying power is an <strong className="text-white">account-capacity number</strong>. It does not tell you how much could be lost at the stop, whether the position fits your risk, or whether the potential reward justifies the risk.</p>
            <div className="rounded-2xl border border-blue-500/30 bg-blue-500/10 p-6 text-slate-200"><strong className="text-blue-300">Buying power is a ceiling—not a recommendation.</strong></div>
            <h2 className="pt-6 text-3xl font-black tracking-tight text-white">What is position size?</h2>
            <p>Position size is the amount of a security you choose to trade. For stocks, it is normally expressed as a number of shares. A risk-based position size begins with your maximum acceptable dollar loss, entry price, and stop-loss price.</p>
            <div className="rounded-2xl border border-slate-800 bg-[#09131d] p-6 font-mono text-base leading-8 text-emerald-400 sm:text-lg"><p>Risk per share = | Entry price − Stop price |</p><p className="mt-3">Position size = Maximum dollar risk ÷ Risk per share</p></div>
            <p>Suppose you are willing to risk $100, plan to enter at $50, and place the stop at $48. The risk is $2 per share. Dividing $100 by $2 produces <strong className="text-white">50 shares</strong>, using $2,500 of buying power.</p>
          </section>

          <ArticleFigure src="/blog-position-size-buying-power/calculator-setup.png" alt="MaicaTrades stock position size calculator showing trade inputs, risk profile, and portfolio heat" caption="The MaicaTrades calculator turns your account size, risk goal, entry, and stop into a complete position plan. Select the image to open the calculator." />

          <section className="mt-16">
            <h2 className="text-3xl font-black tracking-tight">Position size vs. buying power at a glance</h2>
            <div className="mt-8 overflow-x-auto rounded-2xl border border-slate-800 bg-[#09131d]"><table className="w-full min-w-[720px] text-left"><thead className="border-b border-slate-800 bg-slate-900/60 text-sm text-slate-400"><tr><th className="p-4">Comparison</th><th className="p-4 text-emerald-400">Position size</th><th className="p-4 text-blue-400">Buying power</th></tr></thead><tbody>{comparisonRows.map(([label, position, buying]) => <tr key={label} className="border-b border-slate-800/70 last:border-0"><th className="p-4 text-sm font-bold text-white">{label}</th><td className="p-4 text-sm leading-6 text-slate-300">{position}</td><td className="p-4 text-sm leading-6 text-slate-300">{buying}</td></tr>)}</tbody></table></div>
            <p className="mt-7 text-lg leading-8 text-slate-300"><strong className="text-white">The practical rule:</strong> calculate your risk-based position size first, then confirm that it fits within your buying power. If it does not fit, reduce the position or skip the trade.</p>
          </section>

          <section className="mt-16 space-y-7 text-lg leading-8 text-slate-300">
            <h2 className="text-3xl font-black tracking-tight text-white">Why buying power cannot decide how many shares to buy</h2>
            <p>Dividing the money available by the stock price tells you what you can afford, but it says nothing about what you can safely risk.</p>
            <p>Imagine two $10,000 positions. Stock A has $1 between its entry and stop. Stock B has $5 between its entry and stop. The capital committed is identical, but the potential losses are dramatically different.</p>
            <p>Position sizing corrects that imbalance. A wider stop generally requires fewer shares, while a tighter stop may allow more shares—provided that stop remains technically valid.</p>
            <h2 className="pt-6 text-3xl font-black tracking-tight text-white">Example 1: plenty of buying power, smaller position size</h2>
            <p>Assume a $25,000 account, 1% maximum risk, an $80 entry, and a $76 stop. The maximum risk is $250 and the risk per share is $4.</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[["Maximum risk", "$250"], ["Risk per share", "$4"], ["Position size", "62 shares"], ["Capital used", "$4,960"]].map(([label, value]) => <div key={label} className="rounded-2xl border border-slate-800 bg-[#09131d] p-5"><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-xl font-black text-white">{value}</p></div>)}</div>
            <p>The exact calculation produces 62.5 shares. Rounding down keeps the planned loss near $248. Although $25,000 is available, the risk plan supports a $4,960 position.</p>
            <h2 className="pt-6 text-3xl font-black tracking-tight text-white">Example 2: buying power limits the position</h2>
            <p>Assume $5,000 in buying power, a $100 risk limit, a $120 entry, and a $118 stop. The $2 risk per share supports 50 shares, but they would cost $6,000.</p>
            <p>The account can afford only 41 whole shares. The estimated risk becomes $82. Here, buying power—not the risk calculation—limits the final position.</p>
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-slate-200">The correct position is the smaller of the shares allowed by your risk limit and the shares allowed by your buying power.</div>
          </section>

          <section className="mt-16 space-y-7 text-lg leading-8 text-slate-300">
            <h2 className="text-3xl font-black tracking-tight text-white">How a position size calculator helps</h2>
            <p>Manual calculations become inconvenient when you compare setups, adjust stops, or prepare an order while the market is moving.</p>
            <p>A stock position size calculator can show shares to buy, capital required, maximum estimated loss, buying-power usage, potential profit, and reward to risk.</p>
            <p>That connects share quantity to the part of the trade that matters most: <strong className="text-white">what happens if you are wrong?</strong></p>
          </section>

          <ArticleFigure src="/blog-position-size-buying-power/calculator-results.png" alt="Position size calculator results showing shares, capital used, maximum loss, reward to risk, and buying-power percentage" caption="The results show the shares, capital used, maximum planned loss, potential profit, reward to risk, and buying-power usage." crop />

          <section className="mt-16 space-y-7 text-lg leading-8 text-slate-300">
            <h2 className="text-3xl font-black tracking-tight text-white">How to calculate position size step by step</h2>
            <ol className="space-y-5">{[
              ["Choose the maximum risk", "Decide the amount or percentage of the account you are prepared to lose if the trade reaches its stop."],
              ["Identify the entry and stop", "The stop should reflect where the thesis becomes invalid—not a convenient distance selected to create more shares."],
              ["Calculate risk per share", "For a long trade, subtract the stop from the entry. For a short trade, subtract the entry from the stop."],
              ["Calculate the risk-based shares", "Divide maximum dollar risk by risk per share and round down when whole shares are required."],
              ["Check the capital required", "Multiply shares by entry price and confirm the position fits within available buying power."],
              ["Review total exposure", "Consider risk already open and whether several positions depend on the same sector or market theme."],
            ].map(([lead, body], index) => <li key={lead} className="flex gap-4"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500 font-black text-black">{index + 1}</span><span><strong className="text-white">{lead}:</strong> {body}</span></li>)}</ol>
            <h2 className="pt-7 text-3xl font-black tracking-tight text-white">Position size also belongs in market context</h2>
            <p>A trade can satisfy an individual risk rule and still create too much total exposure. Several technology stocks, for example, can behave like one large technology trade if the sector falls.</p>
            <p>The broader environment matters too. Some traders reduce risk when market participation weakens or conditions become less favorable. That decision is separate from the formula, but it affects the maximum risk entered into the calculation.</p>
          </section>

          <ArticleFigure src="/blog-position-size-buying-power/dashboard-context.png" alt="MaicaTrades dashboard showing Market Score, five-day average, market environment, sectors, and current risk" caption="Position sizing controls an individual trade. The MaicaTrades dashboard adds the broader market context surrounding that decision." dashboard />

          <section className="mt-16 space-y-7 text-lg leading-8 text-slate-300">
            <h2 className="text-3xl font-black tracking-tight text-white">Buying power, margin, and leverage</h2>
            <p>Margin can increase buying power, but it does not increase the amount you can responsibly afford to lose. If a broker shows $40,000 in buying power on a $20,000 account, the account itself has not doubled. The trader has access to leverage.</p>
            <p>Leverage can amplify gains and losses. It also introduces maintenance requirements, potential margin calls or forced liquidation, interest charges, and greater vulnerability to gaps and fast markets.</p>
            <p>A stop-loss order cannot guarantee execution at the exact stop price. Overnight gaps, halts, limited liquidity, and rapid movement can cause actual losses to exceed a position size calculator’s estimate.</p>
          </section>

          <section className="mt-16 rounded-3xl border border-slate-800 bg-[#09131d] p-6 sm:p-10"><h2 className="text-3xl font-black tracking-tight">Common position size and buying-power mistakes</h2><div className="mt-8 space-y-6">{mistakes.map(([lead, body]) => <div key={lead} className="flex gap-4"><CheckCircle2 className="mt-1 shrink-0 text-emerald-400" size={22} /><p className="leading-7 text-slate-300"><strong className="text-white">{lead}:</strong> {body}</p></div>)}</div></section>

          <section className="mt-16 space-y-7 text-lg leading-8 text-slate-300">
            <h2 className="text-3xl font-black tracking-tight text-white">Which one comes first?</h2>
            <p>Position size comes first in the decision-making process, but buying power has the final veto.</p>
            <ol className="space-y-3">{["Identify a valid trade setup.", "Define the planned entry and stop.", "Choose the maximum acceptable risk.", "Calculate the risk-based position size.", "Confirm that the required capital fits your buying power.", "Review combined portfolio exposure.", "Take the trade only if every condition is acceptable."].map((item, index) => <li key={item} className="flex gap-4"><span className="font-black text-emerald-400">{index + 1}.</span><span>{item}</span></li>)}</ol>
            <p>This changes the question from “How much will my broker let me buy?” to “How much exposure fits this particular trade?”</p>
          </section>

          <section className="mt-16"><h2 className="text-3xl font-black tracking-tight">Frequently asked questions</h2><div className="mt-8 space-y-4">{faqs.map(([question, answer]) => <details key={question} className="rounded-2xl border border-slate-800 bg-[#09131d] p-6 open:border-emerald-500/40"><summary className="cursor-pointer list-none pr-6 text-lg font-black text-white">{question}</summary><p className="mt-4 leading-7 text-slate-300">{answer}</p></details>)}</div></section>

          <section className="mt-16 space-y-7 text-lg leading-8 text-slate-300"><h2 className="text-3xl font-black tracking-tight text-white">The bottom line</h2><p>Buying power tells you what your account is allowed to purchase. Position size tells you how many shares fit the risk you are prepared to accept.</p><p>Your goal is not to use the largest position your broker permits. It is to take a position that allows you to be wrong without causing disproportionate damage to your account.</p><p>For a deeper explanation of choosing risk, read <Link href="/blog/position-sizing-explained" className="font-bold text-emerald-400 underline decoration-emerald-500/40 underline-offset-4 hover:text-emerald-300">Position Sizing Explained: How Much Should You Risk on a Trade?</Link></p></section>

          <section className="mt-16 rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-8 text-center sm:p-10"><h2 className="text-2xl font-black sm:text-3xl">Calculate the shares before you place the trade</h2><p className="mx-auto mt-4 max-w-2xl leading-7 text-slate-300">Enter your account size, risk goal, entry, stop, and target to see the shares, capital required, maximum planned loss, buying-power usage, and reward to risk.</p><Link href="/tools/position-size" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 font-black text-black transition hover:bg-emerald-400">Open the Free Position Size Calculator <ArrowRight size={18} /></Link></section>

          <p className="mt-10 text-center text-sm italic leading-6 text-slate-500">Educational purposes only. MaicaTrades does not provide financial advice. Calculations are estimates and cannot account for slippage, price gaps, liquidity, fees, taxes, or execution differences. All trading involves risk, including possible loss of principal.</p>
        </div>
      </article>
    </main>
  );
}
