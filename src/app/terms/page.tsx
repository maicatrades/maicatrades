import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  FileText,
  Gavel,
  Scale,
  ShieldCheck,
} from "lucide-react";

export default function TermsPage() {
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
          <div className="flex items-center gap-3 text-sm font-semibold uppercase tracking-wide text-blue-400">
            <FileText size={21} />
            Terms of Service
          </div>

          <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
            Terms of Service
          </h1>

          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-400">
            These Terms of Service govern your use of the MaicaTrades website,
            tools, educational content, and related services.
          </p>

          <p className="mt-4 text-sm text-slate-500">
            Last updated: July 22, 2026
          </p>
        </section>

        <div className="mt-8 space-y-6">
          <TermsSection
            icon={BookOpen}
            title="Acceptance of Terms"
          >
            By accessing or using MaicaTrades, you agree to these Terms of
            Service. If you do not agree with these terms, please discontinue
            use of the website.
          </TermsSection>

          <TermsSection
            icon={ShieldCheck}
            title="Educational Use"
          >
            MaicaTrades provides educational information, market commentary,
            calculators, charts, watchlists, and other resources for
            informational purposes only. Nothing on the website constitutes
            financial, investment, legal, or tax advice.
          </TermsSection>

          <TermsSection
            icon={Scale}
            title="User Responsibilities"
          >
            You agree to use the website lawfully and responsibly. You are
            solely responsible for your own investment decisions, trading
            activity, and financial outcomes.
          </TermsSection>

          <TermsSection
            icon={Gavel}
            title="Intellectual Property"
          >
            Unless otherwise stated, the content, branding, graphics, tools,
            articles, videos, and educational materials on MaicaTrades are the
            property of MaicaTrades and may not be copied, redistributed,
            reproduced, or commercially exploited without prior written
            permission.
          </TermsSection>

          <TermsSection
            icon={ShieldCheck}
            title="Third-Party Services"
          >
            MaicaTrades may include links, market data, charts, or services
            provided by third parties. We do not control or guarantee the
            accuracy, availability, or reliability of third-party content.
          </TermsSection>

          <TermsSection
            icon={Scale}
            title="Limitation of Liability"
          >
            To the fullest extent permitted by applicable law, MaicaTrades and
            its owner shall not be liable for any direct, indirect, incidental,
            consequential, or special damages arising from the use of or
            inability to use the website or its content.
          </TermsSection>

          <TermsSection
            icon={BookOpen}
            title="Changes to These Terms"
          >
            These Terms of Service may be updated periodically. Continued use of
            the website after changes become effective constitutes acceptance of
            the revised terms.
          </TermsSection>

          <TermsSection
            icon={FileText}
            title="Contact"
          >
            Questions regarding these Terms of Service may be submitted through
            the contact information that will be provided on the MaicaTrades
            website.
          </TermsSection>
        </div>

        <section className="mt-8 rounded-xl border border-blue-500/20 bg-blue-500/10 p-6">
          <h2 className="text-xl font-semibold text-blue-300">
            Agreement
          </h2>

          <p className="mt-3 leading-7 text-slate-300">
            By continuing to use MaicaTrades, you acknowledge that you have
            read, understood, and agreed to these Terms of Service.
          </p>
        </section>

        
      </div>
    </main>
  );
}

function TermsSection({
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
          <h2 className="text-xl font-semibold">
            {title}
          </h2>

          <p className="mt-3 leading-7 text-slate-400">
            {children}
          </p>
        </div>
      </div>
    </section>
  );
}