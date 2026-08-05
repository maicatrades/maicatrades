import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About MaicaTrades | Built for Busy Swing Traders",
  description:
    "Learn why MaicaTrades was created and how it helps busy swing traders organize market research, manage risk, and prepare more efficiently.",
};

const researchQuestions = [
  "What is the overall market doing?",
  "Which sectors are leading?",
  "How healthy is market participation?",
  "What economic events are coming up?",
  "How much should I risk on my next trade?",
];

const platformFeatures = [
  "Market Score",
  "Market Breadth",
  "Sector Performance",
  "Weekly Trading Plan",
  "Economic Calendar",
  "Watchlists",
  "Trade Ideas",
  "Position Size Calculator",
  "Market Search",
  "Market News",
];

const roadmapItems = [
  {
    title: "Better market context",
    description:
      "Continue refining the Market Score and supporting tools as more real-world market data is collected.",
  },
  {
    title: "More focused research tools",
    description:
      "Build useful features around the information busy swing traders need before planning a trade.",
  },
  {
    title: "Community-driven improvements",
    description:
      "Improve the platform based on feedback from the traders who use it.",
  },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-black text-white">
      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b border-zinc-900 bg-black/95 backdrop-blur">
        <nav className="mx-auto flex h-[86px] max-w-7xl items-center justify-between px-5 sm:px-6 lg:px-8">
          <Link
            href="/"
            aria-label="Go to the MaicaTrades homepage"
            className="flex min-w-0 items-center gap-2.5 sm:gap-3"
          >
            <Image
              src="/maica-logo.png"
              alt="MaicaTrades logo"
              width={52}
              height={52}
              priority
              className="h-10 w-10 shrink-0 object-contain sm:h-12 sm:w-12"
            />

            <div className="truncate text-xl font-black tracking-tight sm:text-3xl">
              <span className="text-white">Maica</span>
              <span className="text-emerald-400">Trades</span>
            </div>
          </Link>

          <div className="hidden items-center gap-8 text-sm font-medium text-zinc-400 lg:flex">
            <Link
              href="/dashboard"
              className="transition hover:text-white"
            >
              Dashboard
            </Link>

            <Link
              href="/markets/market-score"
              className="transition hover:text-white"
            >
              Market Score
            </Link>

            <Link href="/#features" className="transition hover:text-white">
              Features
            </Link>

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
            className="rounded-full bg-emerald-500 px-4 py-3 text-center text-sm font-black text-black transition hover:bg-emerald-400 sm:px-6"
          >
            <span className="hidden sm:inline">Launch Dashboard</span>
            <span className="sm:hidden">Dashboard</span>
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative border-b border-zinc-900">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.13),_transparent_44%)]" />

        <div className="relative mx-auto flex max-w-7xl flex-col items-center px-6 py-24 text-center sm:py-28 lg:px-8 lg:py-32">
          <Image
            src="/maica-logo.png"
            alt=""
            width={90}
            height={90}
            className="mb-8 h-20 w-20 object-contain sm:h-24 sm:w-24"
          />

          <p className="text-sm font-black uppercase tracking-[0.35em] text-emerald-400">
            About MaicaTrades
          </p>

          <h1 className="mt-7 max-w-5xl text-4xl font-black leading-[1.08] tracking-tight sm:text-6xl lg:text-7xl">
            Helping Busy Swing Traders
            <span className="mt-3 block text-emerald-400">
              Spend Less Time Researching.
            </span>
          </h1>

          <p className="mt-8 max-w-3xl text-lg leading-8 text-zinc-400 sm:text-xl">
            MaicaTrades was built to simplify market preparation by bringing
            together the information swing traders need most—all in one
            focused place.
          </p>
        </div>
      </section>

      {/* Founder Story */}
      <section className="mx-auto max-w-5xl px-6 py-20 lg:px-8 lg:py-28">
        <div className="grid gap-12 lg:grid-cols-[0.75fr_1.25fr] lg:gap-16">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.3em] text-emerald-400">
              The story
            </p>

            <h2 className="mt-5 text-3xl font-black tracking-tight sm:text-4xl">
              Why I Built MaicaTrades
            </h2>
          </div>

          <div className="space-y-7 text-lg leading-8 text-zinc-300">
            <p>
              Hi, I&apos;m Davian. I&apos;m a swing trader who understands how
              overwhelming market research can become when trading is not your
              only responsibility.
            </p>

            <p>
              Every week, I found myself opening multiple websites just to
              answer a few important questions before building my trading
              plan.
            </p>

            <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6 sm:p-8">
              <ul className="space-y-4">
                {researchQuestions.map((question) => (
                  <li
                    key={question}
                    className="flex items-start gap-3 text-base leading-7 text-zinc-300 sm:text-lg"
                  >
                    <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-emerald-400" />
                    <span>{question}</span>
                  </li>
                ))}
              </ul>
            </div>

            <p>
              Instead of having one organized workflow, I was constantly moving
              between charting platforms, news websites, calendars,
              watchlists, and market data.
            </p>

            <p className="font-bold text-white">
              I created MaicaTrades to help solve that problem.
            </p>

            <p>
              MaicaTrades is not trying to replace professional charting
              platforms or become another website filled with endless market
              information. Its purpose is to help traders organize the market,
              understand the current environment, manage risk, and prepare
              more efficiently.
            </p>
          </div>
        </div>
      </section>

      {/* Differentiator */}
      <section className="border-y border-zinc-900 bg-zinc-950/55">
        <div className="mx-auto max-w-5xl px-6 py-20 lg:px-8 lg:py-28">
          <p className="text-sm font-black uppercase tracking-[0.3em] text-emerald-400">
            The standard
          </p>

          <h2 className="mt-5 text-3xl font-black tracking-tight sm:text-5xl">
            What Makes MaicaTrades Different
          </h2>

          <p className="mt-6 max-w-3xl text-lg leading-8 text-zinc-400">
            Every feature is evaluated around one simple question:
          </p>

          <div className="mt-10 rounded-3xl border border-emerald-500/35 bg-emerald-500/10 px-6 py-10 text-center sm:px-10">
            <p className="text-2xl font-black leading-tight text-emerald-400 sm:text-3xl">
              “Does this help a busy swing trader prepare faster?”
            </p>
          </div>

          <p className="mt-8 text-lg leading-8 text-zinc-300">
            If the answer is no, it does not belong on the platform.
            MaicaTrades focuses on organizing the information that matters most
            rather than overwhelming traders with unnecessary data.
          </p>

          <div className="mt-12 grid gap-4 sm:grid-cols-2">
            {platformFeatures.map((feature) => (
              <div
                key={feature}
                className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-black px-5 py-5"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-sm font-black text-emerald-400">
                  ✓
                </span>

                <span className="font-bold text-zinc-200">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Philosophy */}
      <section className="mx-auto max-w-5xl px-6 py-20 lg:px-8 lg:py-28">
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-7 sm:p-10">
            <p className="text-sm font-black uppercase tracking-[0.3em] text-emerald-400">
              Process over predictions
            </p>

            <h2 className="mt-5 text-3xl font-black tracking-tight">
              My Trading Philosophy
            </h2>

            <div className="mt-7 space-y-5 text-lg leading-8 text-zinc-400">
              <p>
                Successful trading is not about predicting every market move.
              </p>

              <p>
                It is about managing risk, following a repeatable process, and
                making disciplined decisions over time.
              </p>

              <p>
                No indicator, model, score, or analysis can guarantee future
                results.
              </p>

              <p>
                MaicaTrades exists to support better preparation—not to tell
                people what to buy or sell.
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-7 sm:p-10">
            <p className="text-sm font-black uppercase tracking-[0.3em] text-emerald-400">
              Our mission
            </p>

            <h2 className="mt-5 text-3xl font-black leading-tight tracking-tight sm:text-4xl">
              Help swing traders spend less time researching and more time
              preparing with confidence.
            </h2>

            <p className="mt-7 text-lg leading-8 text-zinc-300">
              The goal is to give traders a clearer understanding of market
              conditions while keeping every trading decision in their own
              hands.
            </p>
          </div>
        </div>
      </section>

      {/* Roadmap */}
      <section className="border-y border-zinc-900 bg-zinc-950/55">
        <div className="mx-auto max-w-5xl px-6 py-20 lg:px-8 lg:py-28">
          <div className="text-center">
            <p className="text-sm font-black uppercase tracking-[0.3em] text-emerald-400">
              Building for the long term
            </p>

            <h2 className="mt-5 text-3xl font-black tracking-tight sm:text-5xl">
              What&apos;s Next for MaicaTrades
            </h2>

            <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-zinc-400">
              MaicaTrades will continue improving as more market data is
              collected and more traders begin using the platform.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {roadmapItems.map((item) => (
              <article
                key={item.title}
                className="rounded-3xl border border-zinc-800 bg-black p-7"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/10 font-black text-emerald-400">
                  M
                </div>

                <h3 className="mt-6 text-xl font-black">{item.title}</h3>

                <p className="mt-4 leading-7 text-zinc-400">
                  {item.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Transparency */}
      <section className="mx-auto max-w-5xl px-6 py-20 lg:px-8 lg:py-28">
        <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-7 sm:p-10">
          <p className="text-sm font-black uppercase tracking-[0.3em] text-emerald-400">
            Transparency
          </p>

          <h2 className="mt-5 text-3xl font-black tracking-tight">
            You Remain in Control
          </h2>

          <div className="mt-7 space-y-5 text-lg leading-8 text-zinc-400">
            <p>
              MaicaTrades provides educational content, market-analysis tools,
              and research resources.
            </p>

            <p>
              Nothing on this website should be considered personalized
              financial advice or a recommendation to buy or sell any security.
            </p>

            <p>
              All investing and trading involves risk. Every trader is
              responsible for conducting their own research and making their
              own decisions.
            </p>
          </div>

          <Link
            href="/disclaimer"
            className="mt-8 inline-flex rounded-full border border-zinc-700 px-6 py-3 font-black text-white transition hover:border-emerald-500 hover:text-emerald-400"
          >
            Read the Full Disclaimer
          </Link>
        </div>
      </section>

      {/* Closing */}
      <section className="border-t border-zinc-900">
        <div className="mx-auto max-w-5xl px-6 py-20 text-center lg:px-8 lg:py-28">
          <p className="text-sm font-black uppercase tracking-[0.3em] text-emerald-400">
            Thank you
          </p>

          <h2 className="mx-auto mt-5 max-w-3xl text-3xl font-black leading-tight tracking-tight sm:text-5xl">
            Thanks for Being Part of the MaicaTrades Journey.
          </h2>

          <p className="mx-auto mt-7 max-w-2xl text-lg leading-8 text-zinc-400">
            Every feature is being built with one goal: help busy swing traders
            prepare faster, understand risk, and focus on the information that
            matters.
          </p>

          <p className="mt-7 text-lg font-bold text-white">— Davian</p>

          <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              href="/dashboard"
              className="rounded-full bg-emerald-500 px-8 py-4 font-black text-black transition hover:bg-emerald-400"
            >
              Launch Market Dashboard
            </Link>

            <Link
              href="/tools/position-size"
              className="rounded-full border border-zinc-700 px-8 py-4 font-black text-white transition hover:border-zinc-500 hover:bg-zinc-900"
            >
              Calculate Position Size
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-900">
        <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
          <div className="flex flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
            <Link
              href="/"
              className="flex items-center gap-3"
              aria-label="MaicaTrades homepage"
            >
              <Image
                src="/maica-logo.png"
                alt=""
                width={38}
                height={38}
                className="h-9 w-9 object-contain"
              />

              <div>
                <div className="text-xl font-black tracking-tight">
                  <span className="text-white">Maica</span>
                  <span className="text-emerald-400">Trades</span>
                </div>

                <p className="mt-1 text-sm text-zinc-500">
                  Built for busy swing traders.
                </p>
              </div>
            </Link>

            <nav
              aria-label="Footer navigation"
              className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-zinc-500"
            >
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
            </nav>
          </div>

          <div className="mt-8 border-t border-zinc-900 pt-7 text-center text-xs leading-6 text-zinc-600">
            © 2026 MaicaTrades. Market information is provided for educational
            purposes only and is not financial advice.
          </div>
        </div>
      </footer>
    </main>
  );
}