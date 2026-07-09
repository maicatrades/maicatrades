import Image from "next/image";

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white">
      <nav className="border-b border-zinc-900/80 bg-black">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <a href="/" className="flex items-center gap-3">
  <div className="relative h-16 w-16">
    <Image
      src="/maica-logo.png"
      alt="MaicaTrades"
      fill
      priority
      className="object-contain"
    />
  </div>

  <div className="text-3xl font-black tracking-tight">
    Maica<span className="text-emerald-400">Trades</span>
  </div>
</a>

          <div className="hidden items-center gap-8 text-sm font-medium text-zinc-400 md:flex">
            <a href="#tools" className="hover:text-white">
              Tools
            </a>
            <a href="#market" className="hover:text-white">
              Market Data
            </a>
            <a href="#blog" className="hover:text-white">
              Blog
            </a>
          </div>

          <a
            href="#tools"
            className="rounded-full border border-emerald-500 px-5 py-2 text-sm font-semibold text-emerald-400 transition hover:bg-emerald-500 hover:text-black"
          >
            Get Started
          </a>
        </div>
      </nav>

      <section className="mx-auto flex min-h-[80vh] max-w-7xl flex-col items-center justify-center px-6 text-center">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-emerald-400">
          MaicaTrades
        </p>

        <h1 className="max-w-4xl text-5xl font-black leading-tight tracking-tight md:text-7xl">
          Trade Smarter With Clean Market Tools
        </h1>

        <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-400">
          Track setups, calculate position size, manage risk, and build your
          trading plan with simple tools made for swing traders.
        </p>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <a
            href="#tools"
            className="rounded-full bg-emerald-500 px-8 py-3 font-bold text-black transition hover:bg-emerald-400"
          >
            Explore Tools
          </a>

          <a
            href="#blog"
            className="rounded-full border border-zinc-700 px-8 py-3 font-bold text-white transition hover:border-emerald-500"
          >
            Read Market Breakdowns
          </a>
        </div>
      </section>

      <section id="tools" className="mx-auto max-w-7xl px-6 py-20">
        <h2 className="text-3xl font-black md:text-5xl">Trading Tools</h2>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
            <h3 className="text-xl font-bold text-emerald-400">
              Position Size
            </h3>
            <p className="mt-3 text-zinc-400">
              Calculate your risk before entering a trade.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
            <h3 className="text-xl font-bold text-emerald-400">Watchlist</h3>
            <p className="mt-3 text-zinc-400">
              Track tickers, setups, and trade ideas in one place.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
            <h3 className="text-xl font-bold text-emerald-400">
              Market Breakdowns
            </h3>
            <p className="mt-3 text-zinc-400">
              Review swing trade ideas and key market levels.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}