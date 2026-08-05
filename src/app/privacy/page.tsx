import Link from "next/link";
import {
  ArrowLeft,
  Cookie,
  Database,
  Eye,
  Lock,
  ShieldCheck,
  UserCheck,
} from "lucide-react";

export default function PrivacyPage() {
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
          <div className="flex items-center gap-3 text-sm font-semibold uppercase tracking-wide text-emerald-400">
            <ShieldCheck size={21} />
            Privacy Policy
          </div>

          <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
            Your Privacy Matters
          </h1>

          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-400">
            This Privacy Policy explains what information MaicaTrades collects,
            how it is used, and the choices you have regarding your data.
          </p>

          <p className="mt-4 text-sm text-slate-500">
            Last updated: July 22, 2026
          </p>
        </section>

        <div className="mt-8 space-y-6">
          <PolicySection
            icon={Database}
            title="Information We Collect"
          >
            We may collect information you voluntarily provide, such as your
            name or email address when subscribing to newsletters or contacting
            us. We may also collect technical information such as browser type,
            device information, IP address, pages visited, and general usage
            statistics.
          </PolicySection>

          <PolicySection
            icon={Eye}
            title="How We Use Information"
          >
            Information may be used to improve the website, analyze traffic,
            respond to inquiries, deliver requested content, send newsletters,
            and enhance the overall user experience.
          </PolicySection>

          <PolicySection
            icon={Cookie}
            title="Cookies"
          >
            MaicaTrades may use cookies and similar technologies to remember
            preferences, improve website functionality, measure performance,
            and understand how visitors use the site. You can disable cookies
            through your browser settings.
          </PolicySection>

          <PolicySection
            icon={Lock}
            title="Data Security"
          >
            Reasonable security measures are used to protect personal
            information. However, no method of internet transmission or
            electronic storage is completely secure, and absolute security
            cannot be guaranteed.
          </PolicySection>

          <PolicySection
            icon={UserCheck}
            title="Third-Party Services"
          >
            MaicaTrades may use trusted third-party providers such as analytics,
            hosting services, email providers, or market data providers. These
            services operate under their own privacy policies.
          </PolicySection>

          <PolicySection
            icon={ShieldCheck}
            title="Your Choices"
          >
            You may unsubscribe from newsletters at any time, request deletion
            of information where applicable, and control cookie settings through
            your browser.
          </PolicySection>
        </div>

        <section className="mt-8 rounded-xl border border-blue-500/20 bg-blue-500/10 p-6">
          <h2 className="text-xl font-semibold text-blue-300">
            Contact
          </h2>

          <p className="mt-3 leading-7 text-slate-300">
            If you have questions regarding this Privacy Policy, please contact
            MaicaTrades using the contact information that will be provided on
            the website.
          </p>
        </section>

        
      </div>
    </main>
  );
}

function PolicySection({
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
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10">
          <Icon size={22} className="text-emerald-400" />
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