import Image from "next/image";
import Link from "next/link";

const tools = [
  {
    title: "Position Size Calculator",
    description:
      "Calculate share size, account risk, buying power, capital required, and risk-to-reward before entering a trade.",
    href: "/tools/position-size",
    label: "Open Calculator",
  },
  {
    title: "Market Data",
    description:
      "Search stock quotes, company details, valuation metrics, recent news, and other useful market information.",
    href: "/tools/market-data",
    label: "View Market Data",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white">
      {/* Navigation */}
      <header className="border-b border-zinc-900">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-8">
          <Link
            href="/"
            className="flex items-center gap-3"
            aria-label="MaicaTrades homepage"
          >
            <Image
              src="/maica-logo.png"
              alt="MaicaTrades logo"
              width={38}
              height={38}
              priority
              className="h-9 w-9 object-contain"
            />

            <div className="text-2xl font-black tracking-tight sm:text-3xl">
              Maica<span className="text-emerald-400">Trades</span>
            </div>
          </Link>

          <div className="hidden items-center gap-8 text-sm text-zinc-400 md:flex">
            <Link
              href="/tools/position-size"
              className="transition hover:text-white"
            >
              Tools
            </Link>

            <Link
              href="/tools/market-data"
              className="transition hover:text-white"
            >
              Market Data
            </Link>

            <a href="#blog" className="transition hover:text-white">
              Blog
            </a>
          </div>

          <Link
            href="/tools/position-size"
            className="rounded-full border border-emerald-500 px-5 py-2.5 text-sm font-bold text-emerald-400 transition hover:bg-emerald-500 hover:text-black"
          >
            Get Started
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="mx-auto flex max-w-7xl flex-col items-center px-6 pb-24 pt-24 text-center lg:px-8 lg:pt-28">
        <p className="mb-8 text-sm font-bold tracking-[0.35em] text-emerald-400">
          MAICATRADES
        </p>

        <h1 className="max-w-5xl text-5xl font-black leading-tight tracking-tight sm:text-6xl lg:text-7xl">
          Trade Smarter With
          <span className="block">Clean Market Tools</span>
        </h1>

        <p className="mt-8 max-w-3xl text-lg leading-8 text-zinc-400 sm:text-xl">
          Track setups, calculate position size, manage risk, and build your
          trading plan with simple tools made for swing traders.
        </p>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <Link
            href="/tools/position-size"
            className="rounded-full bg-emerald-500 px-8 py-4 font-bold text-black transition hover:bg-emerald-400"
          >
            Explore Tools
          </Link>

          <Link
            href="/tools/market-data"
            className="rounded-full border border-zinc-700 px-8 py-4 font-bold text-white transition hover:border-zinc-500 hover:bg-zinc-900"
          >
            View Market Data
          </Link>
        </div>
      </section>

      {/* Clickable tool tiles */}
      <section
        id="tools"
        className="mx-auto max-w-7xl px-6 pb-24 lg:px-8"
      >
        <div className="mb-10">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-emerald-400">
            Trading tools
          </p>

          <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
            Prepare before entering a trade
          </h2>

          <p className="mt-4 max-w-2xl text-lg text-zinc-400">
            Use MaicaTrades to calculate risk and research stocks from one
            clean dashboard.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {tools.map((tool) => (
            <Link
              key={tool.title}
              href={tool.href}
              className="group block rounded-3xl border border-zinc-800 bg-zinc-950 p-8 transition duration-200 hover:-translate-y-1 hover:border-emerald-500/70"
            >
              <div className="flex h-full flex-col justify-between">
                <div>
                  <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-xl font-black text-emerald-400">
                    M
                  </div>

                  <h3 className="text-2xl font-black text-white">
                    {tool.title}
                  </h3>

                  <p className="mt-4 leading-7 text-zinc-400">
                    {tool.description}
                  </p>
                </div>

                <div className="mt-8 flex items-center gap-2 font-bold text-emerald-400">
                  {tool.label}
                  <span
                    aria-hidden="true"
                    className="transition-transform group-hover:translate-x-1"
                  >
                    →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Blog placeholder */}
      <section
        id="blog"
        className="border-y border-zinc-900 bg-zinc-950/60"
      >
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <div className="rounded-3xl border border-zinc-800 bg-black p-8 sm:p-12">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-emerald-400">
              Market breakdowns
            </p>

            <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
              Trading education and market preparation
            </h2>

            <p className="mt-5 max-w-3xl text-lg leading-8 text-zinc-400">
              MaicaTrades market breakdowns, swing-trading education, and
              research articles are coming soon.
            </p>

            <Link
              href="/tools/market-data"
              className="mt-8 inline-flex rounded-full border border-zinc-700 px-6 py-3 font-bold transition hover:border-emerald-500 hover:text-emerald-400"
            >
              Research the Market
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-10 text-sm text-zinc-500 sm:flex-row sm:items-center sm:justify-between lg:px-8">
        <p>© 2026 MaicaTrades. All rights reserved.</p>

        <p>Trading tools for education and market preparation.</p>
      </footer>
    </main>
  );
}