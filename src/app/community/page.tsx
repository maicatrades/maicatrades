import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  MessageCircle,
  PlaySquare,
  Users,
} from "lucide-react";

export default function CommunityPage() {
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

        <section className="mt-8 rounded-2xl border border-slate-800 bg-[#09131d] p-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-400">
            MaicaTrades Community
          </p>

          <h1 className="mt-3 text-4xl font-bold sm:text-5xl">
            Learn. Share. Grow Together.
          </h1>

          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-400">
            The MaicaTrades community is being built to help swing traders
            improve through education, trade reviews, market discussions, and
            weekly trading plans.
          </p>
        </section>

        <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <section className="rounded-xl border border-slate-800 bg-[#09131d] p-6">
            <PlaySquare className="mb-4 text-red-500" size={30} />

            <h2 className="text-xl font-semibold">YouTube</h2>

            <p className="mt-3 text-sm leading-6 text-slate-400">
              Daily market analysis, swing trade ideas, and educational videos.
            </p>

            <p className="mt-6 text-xs uppercase tracking-wide text-slate-500">
              Coming Soon
            </p>
          </section>

          <section className="rounded-xl border border-slate-800 bg-[#09131d] p-6">
            <Users className="mb-4 text-blue-400" size={30} />

            <h2 className="text-xl font-semibold">Members</h2>

            <p className="mt-3 text-sm leading-6 text-slate-400">
              Connect with other traders, share ideas, and learn together.
            </p>

            <p className="mt-6 text-xs uppercase tracking-wide text-slate-500">
              Planned Feature
            </p>
          </section>

          <section className="rounded-xl border border-slate-800 bg-[#09131d] p-6">
            <Calendar className="mb-4 text-emerald-400" size={30} />

            <h2 className="text-xl font-semibold">Weekly Plans</h2>

            <p className="mt-3 text-sm leading-6 text-slate-400">
              Weekly market outlooks, focus stocks, and trading plans.
            </p>

            <p className="mt-6 text-xs uppercase tracking-wide text-slate-500">
              Coming Soon
            </p>
          </section>

          <section className="rounded-xl border border-slate-800 bg-[#09131d] p-6">
            <MessageCircle className="mb-4 text-yellow-400" size={30} />

            <h2 className="text-xl font-semibold">Discussions</h2>

            <p className="mt-3 text-sm leading-6 text-slate-400">
              Ask questions, review charts, and discuss current market
              conditions.
            </p>

            <p className="mt-6 text-xs uppercase tracking-wide text-slate-500">
              Future Expansion
            </p>
          </section>
        </div>

        <section className="mt-8 rounded-xl border border-blue-500/20 bg-blue-500/10 p-6">
          <h3 className="text-xl font-semibold text-blue-400">Our Goal</h3>

          <p className="mt-3 max-w-4xl leading-7 text-slate-300">
            MaicaTrades is being built to provide free, high-quality market
            analysis and practical swing trading education. As the community
            grows, additional tools and member features will be added while
            keeping the platform focused on helping traders make better
            decisions.
          </p>
        </section>
      </div>
    </main>
  );
}