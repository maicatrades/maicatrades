const features = [
  "Watchlists",
  "Earnings Calendar",
  "Position Size Calculator",
  "Highest Dividend Stocks",
  "IPO Calendar",
  "Sector Rotation",
];

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <div className="text-xl font-bold tracking-wide">
          Maica<span className="text-emerald-400">Trades</span>
        </div>

        <div className="hidden gap-6 text-sm text-zinc-400 md:flex">
          <a href="#" className="hover:text-white">Tools</a>
          <a href="#" className="hover:text-white">Markets</a>
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
          MaicaTrades helps traders plan better with watchlists, earnings data,
          position sizing, dividend research, IPO tracking, and sector rotation.
        </p>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <a
            href="#tools"
            className="rounded-full bg-emerald-500 px-8 py-3 font-semibold text-black hover:bg-emerald-400"
          >
            Explore Tools
          </a>

          <a
            href="#"
            className="rounded-full border border-zinc-700 px-8 py-3 font-semibold text-white hover:border-emerald-400"
          >
            Learn Swing Trading
          </a>
        </div>
      </section>

      <section id="tools" className="mx-auto max-w-7xl px-6 pb-24">
        <h2 className="mb-8 text-3xl font-bold">Trading Tools</h2>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
  const isCalculator = feature === "Position Size Calculator";

  return (
    <a
      key={feature}
      href={isCalculator ? "/Tools/position-size" : "#"}
      className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 transition hover:-translate-y-1 hover:border-emerald-400"
    >
      <div className="mb-4 h-2 w-12 rounded-full bg-emerald-400" />

      <h3 className="text-xl font-semibold">{feature}</h3>

      <p className="mt-3 text-sm leading-6 text-zinc-400">
        A simple, useful tool designed to help traders prepare, research, and
        manage risk before entering the market.
      </p>
    </a>
  );
})}
        </div>
      </section>

      <footer className="border-t border-zinc-900 px-6 py-8 text-center text-sm text-zinc-500">
        © 2026 MaicaTrades. Built for traders who prepare.
      </footer>
    </main>
  );
}