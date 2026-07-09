const features = [
  {
    title: "Position Size Calculator",
    href: "/Tools/position-size",
    status: "Live",
    description:
      "Calculate share size, buying power, risk, reward, and trade quality before entering a position.",
  },
  {
    title: "Live Market Data",
    href: "/Tools/market-data",
    status: "Live",
    description:
      "Search stocks, view live quotes, company data, news, and build a local watchlist.",
  },
  {
    title: "Earnings Calendar",
    href: "#",
    status: "Coming Soon",
    description:
      "Track upcoming earnings reports and prepare for major market-moving events.",
  },
  {
    title: "IPO Calendar",
    href: "#",
    status: "Coming Soon",
    description:
      "Follow upcoming IPOs, expected dates, price ranges, and new listings.",
  },
  {
    title: "Watchlists",
    href: "#",
    status: "Coming Soon",
    description:
      "Build and monitor your favorite stocks before the trading day starts.",
  },
  {
    title: "Sector Rotation",
    href: "#",
    status: "Coming Soon",
    description:
      "See which sectors are leading or lagging so you can trade with market strength.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <div className="text-xl font-bold tracking-wide">
          Maica<span className="text-emerald-400">Trades</span>
        </div>

        <div className="hidden gap-6 text-sm text-zinc-400 md:flex">
          <a href="#tools" className="hover:text-white">Tools</a>
          <a href="/Tools/market-data" className="hover:text-white">Markets</a>
          <a href="#" className="hover:text-white">Blog</a>
          <a href="#" className="hover:text-white">Login</a>
        </div>
      </nav>

      <section className="mx-auto flex max-w-7xl flex-col items-center px-6 py-24 text-center">
        <p className="mb-4 rounded-full border border-emerald-500/30 px-4 py-2 text-sm text-emerald-400">
          Free trading tools for swing traders
        </p>

        <h1 className="max-w-4xl text-5xl font-bold tracking-tight md:text-7xl">
          Trade smarter with tools built for market preparation.
        </h1>

        <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-400">
          MaicaTrades helps traders plan better with position sizing, live market
          data, watchlists, earnings research, IPO tracking, and sector rotation.
        </p>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <a
            href="#tools"
            className="rounded-full bg-emerald-500 px-8 py-3 font-semibold text-black hover:bg-emerald-400"
          >
            Explore Tools
          </a>

          <a
            href="/Tools/market-data"
            className="rounded-full border border-zinc-700 px-8 py-3 font-semibold text-white hover:border-emerald-400"
          >
            View Market Data
          </a>
        </div>
      </section>

      <section id="tools" className="mx-auto max-w-7xl px-6 pb-24">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-emerald-400">
              Phase 1 Tools
            </p>
            <h2 className="mt-2 text-3xl font-bold">Trading Tools</h2>
          </div>

          <p className="hidden max-w-md text-right text-sm text-zinc-500 md:block">
            Start with free tools. Upgrade later with saved trades, synced
            watchlists, and AI trade analysis.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <a
              key={feature.title}
              href={feature.href}
              className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 transition hover:-translate-y-1 hover:border-emerald-400"
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="h-2 w-12 rounded-full bg-emerald-400" />

                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${
                    feature.status === "Live"
                      ? "bg-emerald-500/10 text-emerald-400"
                      : "bg-zinc-800 text-zinc-400"
                  }`}
                >
                  {feature.status}
                </span>
              </div>

              <h3 className="text-xl font-semibold">{feature.title}</h3>

              <p className="mt-3 text-sm leading-6 text-zinc-400">
                {feature.description}
              </p>

              <p className="mt-5 text-sm font-bold text-emerald-400">
                {feature.status === "Live" ? "Launch Tool →" : "Coming Soon"}
              </p>
            </a>
          ))}
        </div>
      </section>

      <footer className="border-t border-zinc-900 px-6 py-8 text-center text-sm text-zinc-500">
        © 2026 MaicaTrades. Built for traders who prepare.
      </footer>
    </main>
  );
}