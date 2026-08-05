import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  ExternalLink,
  ShieldAlert,
  TrendingUp,
} from "lucide-react";

export default function DisclaimerPage() {
  return (
    <main className="min-h-screen bg-[#050b12] text-white">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-medium text-blue-400 transition hover:text-blue-300"
        >
          <ArrowLeft size={18} />
          Back to Dashboard
        </Link>

        <section className="mt-8 rounded-2xl border border-slate-800 bg-[#09131d] p-8 sm:p-10">
          <div className="flex items-center gap-3 text-sm font-semibold uppercase tracking-wide text-yellow-400">
            <ShieldAlert size={21} />
            Important Information
          </div>

          <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
            Financial Disclaimer
          </h1>

          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-400">
            Please read this disclaimer carefully before using MaicaTrades,
            relying on any market commentary, or making a financial decision.
          </p>

          <p className="mt-4 text-sm text-slate-500">
            Last updated: July 22, 2026
          </p>
        </section>

        <section className="mt-8 rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-6">
          <div className="flex items-start gap-4">
            <AlertTriangle
              size={26}
              className="mt-1 shrink-0 text-yellow-400"
            />

            <div>
              <h2 className="text-xl font-semibold text-yellow-300">
                Educational purposes only
              </h2>

              <p className="mt-3 leading-7 text-slate-300">
                All information provided through MaicaTrades, including market
                scores, watchlists, trade ideas, charts, articles, videos,
                calculators, commentary, and other content, is provided solely
                for educational and informational purposes.
              </p>
            </div>
          </div>
        </section>

        <div className="mt-8 space-y-6">
          <DisclaimerSection
            icon={BookOpen}
            title="Not financial or investment advice"
          >
            MaicaTrades does not provide personalized investment, financial,
            legal, accounting, or tax advice. Nothing on this website should be
            understood as a recommendation or solicitation to buy, sell, hold,
            or trade any security, financial product, or investment strategy.
          </DisclaimerSection>

          <DisclaimerSection
            icon={TrendingUp}
            title="Trading and investing involve risk"
          >
            Trading and investing can result in substantial financial losses.
            You may lose some or all of the money you invest. Past performance,
            historical results, technical patterns, market scores, and simulated
            outcomes do not guarantee future results.
          </DisclaimerSection>

          <DisclaimerSection
            icon={ShieldAlert}
            title="Do your own research"
          >
            You are responsible for independently evaluating every investment
            decision. Consider your financial situation, experience, objectives,
            and risk tolerance before acting. Consult a properly qualified and
            licensed professional when appropriate.
          </DisclaimerSection>

          <DisclaimerSection
            icon={AlertTriangle}
            title="No guarantees"
          >
            MaicaTrades makes no guarantee regarding the accuracy,
            completeness, reliability, timeliness, availability, or usefulness
            of any information displayed on the website. Market information may
            be delayed, incomplete, estimated, or supplied by third-party data
            providers.
          </DisclaimerSection>

          <DisclaimerSection
            icon={ExternalLink}
            title="Third-party content and links"
          >
            MaicaTrades may display information, articles, quotations, charts,
            links, or other content provided by third parties. Third-party
            content is provided for convenience and does not represent an
            endorsement. MaicaTrades is not responsible for the availability,
            accuracy, practices, or content of external websites or services.
          </DisclaimerSection>

          <DisclaimerSection
            icon={ShieldAlert}
            title="Positions and conflicts of interest"
          >
            MaicaTrades, its owner, contributors, or affiliates may hold or
            trade securities discussed on the website or related social-media
            channels. Any material sponsorship, compensation, or promotional
            relationship should be disclosed when applicable.
          </DisclaimerSection>

          <DisclaimerSection
            icon={BookOpen}
            title="Hypothetical and simulated results"
          >
            Backtests, examples, model portfolios, hypothetical trades, and
            simulated results have inherent limitations. They do not represent
            actual trading and may not account for commissions, taxes,
            liquidity, slippage, execution delays, changing market conditions,
            or emotional decision-making.
          </DisclaimerSection>

          <DisclaimerSection
            icon={ShieldAlert}
            title="Limitation of responsibility"
          >
            By using MaicaTrades, you acknowledge that your financial decisions
            are made at your own risk. To the fullest extent permitted by law,
            MaicaTrades and its owner will not be responsible for trading
            losses, missed opportunities, data errors, service interruptions,
            or other damages arising from your use of or reliance on the
            website.
          </DisclaimerSection>
        </div>

        <section className="mt-8 rounded-xl border border-blue-500/20 bg-blue-500/10 p-6">
          <h2 className="text-xl font-semibold text-blue-300">
            Your responsibility
          </h2>

          <p className="mt-3 leading-7 text-slate-300">
            By continuing to use MaicaTrades, you confirm that you understand
            this disclaimer and accept full responsibility for your own
            research, trading activity, investment decisions, and financial
            results.
          </p>
        </section>

        
      </div>
    </main>
  );
}

function DisclaimerSection({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-800 bg-[#09131d] p-6">
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10">
          <Icon size={22} className="text-blue-400" />
        </div>

        <div>
          <h2 className="text-xl font-semibold">{title}</h2>

          <p className="mt-3 leading-7 text-slate-400">{children}</p>
        </div>
      </div>
    </section>
  );
}