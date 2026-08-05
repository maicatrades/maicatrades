import Link from "next/link";
import {
  ArrowLeft,
  BarChart3,
  BookOpen,
  CandlestickChart,
  GraduationCap,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";

const lessons = [
  {
    title: "Trend Analysis",
    description:
      "Learn how trends, support, resistance, and momentum shape trading opportunities.",
    icon: CandlestickChart,
    status: "Coming Soon",
  },
  {
    title: "Risk Management",
    description:
      "Understand position sizing, stop placement, risk-to-reward, and protecting capital.",
    icon: ShieldCheck,
    status: "Available Tool",
    href: "/tools/position-size",
  },
  {
    title: "Market Breadth",
    description:
      "Learn how participation beneath the indexes can confirm or weaken a market move.",
    icon: BarChart3,
    status: "Available Now",
    href: "/markets/breadth",
  },
  {
    title: "Swing Trade Setups",
    description:
      "Study breakouts, pullbacks, consolidations, and momentum continuation patterns.",
    icon: TrendingUp,
    status: "Coming Soon",
  },
];

export default function EducationPage() {
  return (
    <main className="min-h-screen bg-[#050b12] text-white">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-medium text-blue-400 transition hover:text-blue-300"
        >
          <ArrowLeft size={18} />
          Back to Dashboard
        </Link>

        <section className="mt-8 overflow-hidden rounded-2xl border border-slate-800 bg-[#09131d]">
          <div className="grid gap-8 p-8 lg:grid-cols-[1fr_260px] lg:items-center">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-blue-400">
                <GraduationCap size={20} />
                MaicaTrades Education
              </div>

              <h1 className="mt-4 max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
                Build stronger trading habits.
              </h1>

              <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-400">
                Learn the concepts behind the tools, market signals, and swing
                trading setups used throughout MaicaTrades.
              </p>
            </div>

            <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-6">
              <BookOpen size={34} className="text-blue-400" />

              <p className="mt-4 text-sm font-semibold uppercase tracking-wide text-blue-400">
                Learning Focus
              </p>

              <p className="mt-2 text-lg font-semibold">
                Simple, practical, and risk-focused education.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-8">
          <div className="mb-5">
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-400">
              Learning Library
            </p>

            <h2 className="mt-2 text-3xl font-bold">
              Start with the fundamentals
            </h2>

            <p className="mt-3 max-w-3xl leading-7 text-slate-400">
              These lessons will help traders understand how to evaluate market
              conditions, manage risk, and recognize higher-quality setups.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {lessons.map((lesson) => {
              const Icon = lesson.icon;

              const cardContent = (
                <>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10">
                      <Icon size={25} className="text-blue-400" />
                    </div>

                    <span className="rounded-full border border-slate-700 px-3 py-1 text-xs font-medium text-slate-400">
                      {lesson.status}
                    </span>
                  </div>

                  <h3 className="mt-5 text-2xl font-semibold">
                    {lesson.title}
                  </h3>

                  <p className="mt-3 leading-7 text-slate-400">
                    {lesson.description}
                  </p>

                  <div className="mt-6 text-sm font-medium text-blue-400">
                    {lesson.href ? "Open lesson →" : "Lesson in development"}
                  </div>
                </>
              );

              if (lesson.href) {
                return (
                  <Link
                    key={lesson.title}
                    href={lesson.href}
                    className="group rounded-xl border border-slate-800 bg-[#09131d] p-6 transition hover:-translate-y-1 hover:border-blue-500/50 hover:shadow-[0_16px_40px_rgba(0,0,0,0.24)] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                  >
                    {cardContent}
                  </Link>
                );
              }

              return (
                <article
                  key={lesson.title}
                  className="rounded-xl border border-slate-800 bg-[#09131d] p-6"
                >
                  {cardContent}
                </article>
              );
            })}
          </div>
        </section>

        <section className="mt-8 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-400">
            Education Goal
          </p>

          <p className="mt-3 max-w-4xl text-lg leading-8 text-slate-300">
            The goal is not to provide trade alerts or guaranteed outcomes. It
            is to help traders build a repeatable process, understand risk, and
            make more informed decisions.
          </p>
        </section>
      </div>
    </main>
  );
}