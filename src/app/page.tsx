import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "MaicaTrades | Swing Trading Tools & Market Analysis",

  description:
    "MaicaTrades helps busy swing traders understand the market faster with Market Score, market breadth, sector performance, trade ideas, watchlists, and risk-management tools.",

  alternates: {
    canonical: "https://maicatrades.com",
  },

  openGraph: {
    title: "MaicaTrades | Swing Trading Tools & Market Analysis",
    description:
      "A simplified market dashboard and swing-trading toolkit built for busy traders.",
    url: "https://maicatrades.com",
    siteName: "MaicaTrades",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "MaicaTrades | Swing Trading Tools & Market Analysis",
    description:
      "A simplified market dashboard and swing-trading toolkit built for busy traders.",
  },
};

const features = [
  {
    title: "Market Score",
    description:
      "A simplified 0–100 view of trend, momentum, sector strength, and volatility.",
  },
  {
    title: "Weekly Trading Plan",
    description:
      "Market bias, focus stocks, key catalysts, risks, and what to avoid this week.",
  },
  {
    title: "Market Breadth",
    description:
      "See whether participation is expanding, weakening, or concentrated in a few leaders.",
  },
  {
    title: "Sector Rotation",
    description:
      "Quickly identify leading and lagging sectors before building your watchlist.",
  },
  {
    title: "Trade Ideas",
    description:
      "Review structured swing-trade setups with entry, stop, target, and risk-to-reward.",
  },
  {
    title: "Economic Calendar",
    description:
      "Focus on the market-moving events that matter most to swing traders.",
  },
  {
    title: "Moving Now",
    description:
      "Track leading gainers, losers, and the most actively traded names.",
  },
  {
    title: "Watchlist",
    description:
      "Monitor developing setups, momentum, and stocks awaiting confirmation.",
  },
];

const marketScoreInputs = [
  "20 charts",
  "VIX",
  "Market breadth",
  "Sector rotation",
  "Momentum",
  "Volatility",
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-black text-white">
      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b border-zinc-900 bg-black/90 backdrop-blur">
        <nav className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="flex min-w-0 items-center gap-1.5 sm:gap-2"
            aria-label="MaicaTrades homepage"
          >
            <Image
              src="/maica-logo.png"
              alt="MaicaTrades logo"
              width={58}
              height={58}
              priority
              className="h-12 w-12 shrink-0 object-contain"
            />

            <div className="truncate text-xl font-black tracking-tight sm:text-3xl">
              Maica<span className="text-emerald-400">Trades</span>
            </div>
          </Link>

          <div className="hidden items-center gap-7 text-sm font-medium text-zinc-400 lg:flex">
            <a
              href="#dashboard-preview"
              className="transition hover:text-white"
            >
              Dashboard
            </a>

            <a href="#market-score" className="transition hover:text-white">
              Market Score
            </a>

            <a href="#features" className="transition hover:text-white">
              Features
            </a>

            <Link
              href="/tools/position-size"
              className="transition hover:text-white"
            >
              Position Size
            </Link>

            <Link
              href="/tools/market-data"
              className="transition hover:text-white"
            >
              Market Search
            </Link>
          </div>

          <Link
            href="/dashboard"
            className="shrink-0 rounded-full bg-emerald-500 px-4 py-2.5 text-xs font-black text-black transition hover:bg-emerald-400 sm:px-5 sm:text-sm"
          >
            <span className="sm:hidden">Dashboard</span>
            <span className="hidden sm:inline">Launch Dashboard</span>
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.16),_transparent_45%)]" />

        <div className="relative mx-auto flex min-h-[680px] max-w-7xl flex-col items-center justify-center px-6 py-20 text-center lg:px-8">
          <div className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.24em] text-emerald-400">
            Built for busy swing traders
          </div>

          <h1 className="mt-8 max-w-5xl text-5xl font-black leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
            Trade Smarter.
            <span className="block text-emerald-400">
              Spend Less Time Researching.
            </span>
          </h1>

          <p className="mt-7 max-w-3xl text-lg leading-8 text-zinc-400 sm:text-xl">
            Get your Market Score, Weekly Trading Plan, Market Breadth, Sector
            Rotation, Trade Ideas, and more in one place—so you can focus on
            trading instead of digging through endless market data.
          </p>

          <div className="mt-10 flex w-full max-w-xl flex-col gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/dashboard"
              className="rounded-full bg-emerald-500 px-8 py-4 text-center font-black text-black transition hover:-translate-y-0.5 hover:bg-emerald-400"
            >
              Launch Market Dashboard
            </Link>

            <Link
              href="/tools/position-size"
              className="rounded-full border border-zinc-700 px-8 py-4 text-center font-black text-white transition hover:-translate-y-0.5 hover:border-zinc-500 hover:bg-zinc-900"
            >
              Free Position Size Calculator
            </Link>
          </div>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-zinc-500">
            <span>Free to use</span>
            <span className="hidden text-zinc-700 sm:inline">•</span>
            <span>No account required</span>
            <span className="hidden text-zinc-700 sm:inline">•</span>
            <span>Updated throughout the trading day</span>
          </div>
        </div>
      </section>

      {/* Dashboard preview */}
      <section
        id="dashboard-preview"
        className="mx-auto max-w-7xl px-6 pb-20 lg:px-8"
      >
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-emerald-400">
            See the market faster
          </p>

          <h2 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
            Your market preparation in one dashboard
          </h2>

          <p className="mt-5 text-lg leading-8 text-zinc-400">
            Review the market environment, breadth, leadership, catalysts,
            movers, and trade setups in one focused view.
          </p>
        </div>

        <div className="mt-12 rounded-[32px] border border-zinc-800 bg-zinc-950 p-4 shadow-[0_30px_100px_rgba(0,0,0,0.45)] sm:p-6">
          <div className="mb-5 flex items-center justify-between border-b border-zinc-800 pb-4">
            <div>
              <p className="text-sm font-semibold text-zinc-500">
                MaicaTrades Market Dashboard
              </p>

              <p className="mt-1 text-xl font-black text-white">
                Today&apos;s Market Overview
              </p>
            </div>

            <div className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-400">
              Live market context
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-3xl border border-zinc-800 bg-black p-6">
              <div className="flex items-start justify-between gap-5">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
                    Market Score
                  </p>

                  <div className="mt-4 flex items-end gap-3">
                    <span className="text-6xl font-black text-emerald-400">
                      69
                    </span>

                    <span className="pb-2 text-lg font-bold text-emerald-400">
                      Bullish
                    </span>
                  </div>
                </div>

                <div className="flex h-28 w-28 items-center justify-center rounded-full border-[10px] border-emerald-500/20">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full border-[10px] border-emerald-400 text-lg font-black text-white">
                    69
                  </div>
                </div>
              </div>

              <p className="mt-6 max-w-xl leading-7 text-zinc-400">
                Buyers remain in control, but participation is not yet broad
                enough to justify aggressive risk. Favor quality pullbacks and
                avoid chasing extended entries.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-4">
                {[
                  ["Trend", "Constructive", "text-emerald-400"],
                  ["Momentum", "Healthy", "text-yellow-400"],
                  ["Sectors", "Strong", "text-emerald-400"],
                  ["Volatility", "Calm", "text-emerald-400"],
                ].map(([label, value, color]) => (
                  <div
                    key={label}
                    className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4"
                  >
                    <p className="text-xs text-zinc-500">{label}</p>
                    <p className={`mt-2 font-black ${color}`}>{value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                ["Market Breadth", "53", "Improving", "text-yellow-400"],
                [
                  "Leading Sector",
                  "XLC",
                  "Communication Services",
                  "text-blue-400",
                ],
                [
                  "Today’s Risk",
                  "Moderate",
                  "Stay selective",
                  "text-yellow-400",
                ],
                [
                  "Trade Idea",
                  "Grade A",
                  "Structured setup",
                  "text-emerald-400",
                ],
              ].map(([label, value, detail, color]) => (
                <div
                  key={label}
                  className="rounded-3xl border border-zinc-800 bg-black p-5"
                >
                  <p className="text-xs font-bold uppercase tracking-[0.15em] text-zinc-500">
                    {label}
                  </p>

                  <p className={`mt-5 text-3xl font-black ${color}`}>
                    {value}
                  </p>

                  <p className="mt-2 text-sm leading-6 text-zinc-500">
                    {detail}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/dashboard"
            className="inline-flex rounded-full bg-emerald-500 px-7 py-3.5 font-black text-black transition hover:bg-emerald-400"
          >
            Explore the Full Dashboard
          </Link>
        </div>
      </section>

      {/* Market Score explanation */}
      <section
        id="market-score"
        className="border-y border-zinc-900 bg-zinc-950/60"
      >
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-emerald-400">
              Why traders use the Market Score
            </p>

            <h2 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
              One clear market read instead of six separate checks
            </h2>

            <p className="mt-5 text-lg leading-8 text-zinc-400">
              Instead of checking charts, breadth, volatility, sector rotation,
              and momentum separately, the Market Score combines them into one
              simplified market reading.
            </p>
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            <div className="rounded-[32px] border border-zinc-800 bg-black p-7 sm:p-9">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-zinc-500">
                Instead of watching
              </p>

              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                {marketScoreInputs.map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-4"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-500/10 text-sm font-black text-red-400">
                      ×
                    </span>

                    <span className="font-semibold text-zinc-200">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[32px] border border-emerald-500/25 bg-emerald-500/[0.06] p-7 sm:p-9">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-400">
                Get one organized view
              </p>

              <div className="mt-7 flex items-center gap-5">
                <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-full border-[10px] border-emerald-500/20">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full border-[10px] border-emerald-400 text-2xl font-black text-white">
                    69
                  </div>
                </div>

                <div>
                  <p className="text-4xl font-black text-emerald-400">
                    Bullish
                  </p>

                  <p className="mt-2 text-sm font-semibold uppercase tracking-[0.16em] text-zinc-500">
                    Current market environment
                  </p>
                </div>
              </div>

              <p className="mt-7 text-lg leading-8 text-zinc-300">
                Quickly see whether conditions are bullish, mixed, cautious, or
                defensive before deciding how aggressively to trade.
              </p>

              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                {[
                  ["Trend", "Constructive"],
                  ["Momentum", "Healthy"],
                  ["Sector strength", "Strong"],
                  ["Volatility", "Calm"],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-2xl border border-zinc-800 bg-black px-4 py-4"
                  >
                    <p className="text-xs uppercase tracking-[0.15em] text-zinc-500">
                      {label}
                    </p>

                    <p className="mt-2 font-black text-emerald-400">{value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-7 rounded-2xl border border-zinc-800 bg-black/70 p-5">
                <p className="font-black text-white">
                  Decision support, not trade signals
                </p>

                <p className="mt-2 leading-7 text-zinc-400">
                  The Market Score helps organize market conditions. You still
                  make every trading decision.
                </p>
              </div>

              <Link
                href="/markets/market-score"
                className="mt-8 inline-flex rounded-full bg-emerald-500 px-7 py-3.5 font-black text-black transition hover:-translate-y-0.5 hover:bg-emerald-400"
              >
                View the Market Score
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-500/25 bg-emerald-500/10 font-black text-emerald-400">
                M
              </div>

              <h3 className="mt-5 text-xl font-black">{feature.title}</h3>

              <p className="mt-3 leading-7 text-zinc-400">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Busy traders */}
      <section
        id="why-maicatrades"
        className="border-y border-zinc-900 bg-zinc-950/60"
      >
        <div className="mx-auto max-w-5xl px-6 py-20 text-center lg:px-8">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-emerald-400">
            Built for busy swing traders
          </p>

          <h2 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
            Built for traders with limited time.
          </h2>

          <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-zinc-400">
            Spend less time searching through charts and more time planning
            quality trades. MaicaTrades organizes the market into one
            streamlined workflow so you can prepare faster without sacrificing
            context.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              href="/dashboard"
              className="rounded-full bg-emerald-500 px-7 py-3.5 text-center font-black text-black transition hover:bg-emerald-400"
            >
              Launch Market Dashboard
            </Link>

            <Link
              href="/about"
              className="rounded-full border border-zinc-700 px-7 py-3.5 text-center font-black transition hover:border-zinc-500 hover:bg-zinc-900"
            >
              Learn About MaicaTrades
            </Link>
          </div>
        </div>
      </section>

      {/* Position size calculator */}
      <section id="position-size" className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="grid gap-10 rounded-[32px] border border-zinc-800 bg-zinc-950 p-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center sm:p-10">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-emerald-400">
              Risk management
            </p>

            <h2 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
              Know your risk before you enter the trade
            </h2>

            <p className="mt-5 text-lg leading-8 text-zinc-400">
              Calculate share size, account risk, buying power, capital
              required, and potential reward before entering a position.
            </p>

            <Link
              href="/tools/position-size"
              className="mt-8 inline-flex rounded-full bg-emerald-500 px-7 py-3.5 font-black text-black transition hover:bg-emerald-400"
            >
              Calculate Position Size
            </Link>
          </div>

          <div className="rounded-3xl border border-zinc-800 bg-black p-6 sm:p-8">
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                ["Account Size", "$10,000"],
                ["Risk Per Trade", "1.00%"],
                ["Entry Price", "$100.00"],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4"
                >
                  <p className="text-xs uppercase tracking-wide text-zinc-500">
                    {label}
                  </p>

                  <p className="mt-2 text-xl font-black text-white">{value}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
                <p className="text-sm text-zinc-500">Maximum loss</p>
                <p className="mt-2 text-3xl font-black text-red-400">$100</p>
              </div>

              <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-5">
                <p className="text-sm text-zinc-400">
                  Recommended position
                </p>

                <p className="mt-2 text-3xl font-black text-emerald-400">
                  20 Shares
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-zinc-900 bg-zinc-950/60">
        <div className="mx-auto max-w-5xl px-6 py-20 text-center lg:px-8">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-emerald-400">
            Start with the full picture
          </p>

          <h2 className="mt-5 text-4xl font-black tracking-tight sm:text-6xl">
            Ready to prepare faster?
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-zinc-400">
            Launch the Market Dashboard and see today&apos;s market
            environment, leadership, breadth, risk, and trade ideas in one
            place.
          </p>

          <Link
            href="/dashboard"
            className="mt-10 inline-flex rounded-full bg-emerald-500 px-9 py-4 text-lg font-black text-black transition hover:-translate-y-0.5 hover:bg-emerald-400"
          >
            Launch Market Dashboard
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-900">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-10 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div>
            <div className="flex items-center gap-3">
              <Image
                src="/maica-logo.png"
                alt="MaicaTrades logo"
                width={34}
                height={34}
                className="h-8 w-8 object-contain"
              />

              <p className="text-xl font-black">
                Maica<span className="text-emerald-400">Trades</span>
              </p>
            </div>

            <p className="mt-3 text-sm text-zinc-500">
              Built for busy swing traders.
            </p>
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-zinc-500">
            <Link href="/about" className="transition hover:text-white">
              About
            </Link>

            <Link href="/blog" className="transition hover:text-white">
              Blog
            </Link>

            <Link href="/privacy" className="transition hover:text-white">
              Privacy
            </Link>

            <Link href="/terms" className="transition hover:text-white">
              Terms
            </Link>

            <Link href="/disclaimer" className="transition hover:text-white">
              Disclaimer
            </Link>
          </div>
        </div>

        <div className="border-t border-zinc-900 px-6 py-6 text-center text-xs leading-6 text-zinc-600">
          © 2026 MaicaTrades. Market information is provided for educational
          purposes only and is not financial advice.
        </div>
      </footer>
    </main>
  );
}