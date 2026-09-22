"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  BarChart3,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  CircleGauge,
  FlaskConical,
  LayoutDashboard,
  Menu,
  Microscope,
  NotebookPen,
  Radar,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react";
import PremiumMarketTicker from "../components/MarketTicker";
import ProLogoutButton from "../components/ProLogoutButton";
import PremarketIntelligence from "../components/PremarketIntelligence";
import { fetchDashboardJson } from "@/lib/dashboard-api";

type ScoreData = {
  success: boolean;
  score: number;
  label: string;
  fiveDayAverage: number | null;
  fiveDayAverageSampleSize: number;
  scoreChange: number | null;
  scoreTrend: "Improving" | "Weakening" | "Stable" | "Unavailable";
  environment: { bias: string; riskLevel: string; approach: string };
  components: Record<string, { score: number; maxScore: number }>;
  updatedAt: string;
  error?: string;
};
type BreadthData = {
  success: boolean;
  breadthScore: number;
  breadthPercent: number;
  decliningPercent: number;
  advancing: number;
  declining: number;
  total: number;
  label: string;
  above20Day: { percent: number };
  above50Day: { percent: number };
  sectors: { positive: number; total: number; positivePercent: number };
  trend: {
    label: string;
    currentScore: number;
    baselineScore: number | null;
    difference: number | null;
    comparisonDays: number;
    comparisonType: string;
  };
  error?: string;
};
type Sector = { name: string; symbol: string; changePercent: number };
type SectorData = {
  success: boolean;
  sectors: Sector[];
  leadingSector: Sector;
  weakestSector: Sector;
  error?: string;
};
type ResearchMetric = {
  averageReturn: number | null;
  winRate: number | null;
  sampleSize: number;
};
type ResearchTicker = {
  allHistory: Record<string, ResearchMetric>;
  scoreBandOnly: Record<string, ResearchMetric>;
  currentConditions: Record<string, ResearchMetric>;
  currentEpisodes: Record<string, ResearchMetric>;
};
type ResearchData = {
  success: boolean;
  methodology: string;
  history: {
    recordCount: number;
    breadthRecordCount: number;
    firstDate: string | null;
    lastDate: string | null;
  };
  currentConditions: {
    scoreBand: string;
    breadthBand: string;
    score: number | null;
    breadth: number | null;
  };
  tickers: Record<string, ResearchTicker>;
  error?: string;
  conditionMatrix: {
    scoreBands: Record<string, Record<string, ResearchMetric>>;
    breadthBands: Record<string, Record<string, ResearchMetric>>;
    benchmark: string;
  };
  outlook: {
    current: {
      date: string;
      score: number;
      breadth: number | null;
      scoreBand: string;
      breadthBand: string;
      state: string;
    } | null;
    previous: {
      date: string;
      score: number;
      breadth: number | null;
      scoreBand: string;
      breadthBand: string;
      state: string;
    } | null;
    changed: boolean;
    posture: { label: string; description: string };
    confidence: string;
    episodeCount: number;
    methodology: string;
  };
  transition: {
    direction: "Deteriorating" | "Improving" | "Stable" | "Diverging";
    confirmation: string;
    action: string;
    consecutiveSessions: number;
    changes: {
      score1D: number | null;
      breadth1D: number | null;
      score5D: number | null;
      breadth5D: number | null;
    };
    fiveSessionsAgo: {
      date: string;
      score: number;
      breadth: number | null;
      scoreBand: string;
      breadthBand: string;
      state: string;
    } | null;
    recent: Array<{
      date: string;
      score: number;
      breadth: number | null;
      scoreBand: string;
      breadthBand: string;
      state: string;
    }>;
  } | null;
};

const nav = [
  ["Dashboard", LayoutDashboard],
  ["Market Intelligence", Radar],
  ["Pro Signals", Sparkles],
  ["Historical Research", FlaskConical],
  ["Sector Analysis", BarChart3],
  ["Economic Calendar", CalendarDays],
  ["Watchlist", Star],
  ["Research Notes", NotebookPen],
] as const;

function Card({
  title,
  icon: Icon,
  children,
  className = "",
  id,
}: {
  title: string;
  icon: typeof Activity;
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section
      id={id}
      className={`rounded-2xl border border-white/10 bg-[#0a0f0e]/95 shadow-[0_18px_50px_rgba(0,0,0,.32)] ${className}`}
    >
      <header className="flex items-center gap-2 border-b border-white/8 px-5 py-4 text-sm font-black uppercase tracking-[.08em] text-zinc-100">
        <Icon size={17} className="text-emerald-400" />
        {title}
      </header>
      {children}
    </section>
  );
}

function Loading() {
  return <div className="h-5 w-28 animate-pulse rounded bg-white/10" />;
}
function signed(value: number | null | undefined, suffix = "") {
  if (value == null || !Number.isFinite(value)) return "—";
  return `${value > 0 ? "+" : ""}${value.toFixed(1)}${suffix}`;
}

function MatrixTable({
  title,
  rows,
}: {
  title: string;
  rows: Record<string, Record<string, ResearchMetric>> | undefined;
}) {
  const entries = Object.entries(rows ?? {});
  return (
    <div className="min-w-0 overflow-hidden rounded-xl border border-white/8">
      <div className="bg-white/[.035] px-4 py-3 text-xs font-black uppercase tracking-[.12em] text-zinc-300">
        {title}
      </div>
      <table className="w-full table-fixed text-left">
        <thead>
          <tr className="text-[9px] uppercase tracking-wider text-zinc-500">
            <th className="w-[28%] px-3 py-3">Condition</th>
            {[5, 10, 20].map((days) => (
              <th key={days} className="px-2 py-3">
                {days}D
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {entries.map(([label, horizons]) => (
            <tr key={label} className="border-t border-white/8">
              <td className="px-3 py-3 text-[11px] font-bold text-zinc-200">
                {label}
              </td>
              {[5, 10, 20].map((days) => {
                const metric = horizons[String(days)];
                return (
                  <td key={days} className="px-2 py-3 align-top">
                    <div
                      className={`text-sm font-black ${(metric?.averageReturn ?? 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}
                    >
                      {metric?.sampleSize
                        ? signed(metric.averageReturn, "%")
                        : "—"}
                    </div>
                    <div className="mt-1 text-[9px] leading-4 text-zinc-500">
                      {metric?.sampleSize ? (
                        <>
                          <span className="block">
                            {metric.winRate}% positive
                          </span>
                          <span>n={metric.sampleSize}</span>
                        </>
                      ) : (
                        "No sample"
                      )}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function ProPage() {
  const [mobileNav, setMobileNav] = useState(false);
  const [score, setScore] = useState<ScoreData | null>(null);
  const [breadth, setBreadth] = useState<BreadthData | null>(null);
  const [sectors, setSectors] = useState<SectorData | null>(null);
  const [research, setResearch] = useState<ResearchData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const [s, b, x, r] = await Promise.all([
          fetchDashboardJson<ScoreData>("/api/market-score"),
          fetchDashboardJson<BreadthData>("/api/market-breadth"),
          fetchDashboardJson<SectorData>("/api/sector-performance"),
          fetchDashboardJson<ResearchData>("/api/pro/research", 25_000),
        ]);
        if (!s.ok || !s.data.success)
          throw new Error(s.data.error || "Market Score unavailable");
        if (!mounted) return;
        setScore(s.data);
        setBreadth(b.ok && b.data.success ? b.data : null);
        setSectors(x.ok && x.data.success ? x.data : null);
        setResearch(r.ok && r.data.success ? r.data : null);
        setError(null);
      } catch (e) {
        if (mounted)
          setError(e instanceof Error ? e.message : "Pro data unavailable");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    void load();
    const timer = window.setInterval(load, 5 * 60_000);
    return () => {
      mounted = false;
      window.clearInterval(timer);
    };
  }, []);

  const regime = useMemo(() => {
    if (!score)
      return { name: "LOADING", tone: "text-zinc-400", notes: [] as string[] };
    const riskOn = score.score >= 65 && (breadth?.breadthScore ?? 50) >= 55;
    const riskOff = score.score < 40 || (breadth?.breadthScore ?? 50) < 35;
    return {
      name: riskOn ? "RISK ON" : riskOff ? "RISK OFF" : "SELECTIVE",
      tone: riskOn
        ? "text-emerald-400"
        : riskOff
          ? "text-red-400"
          : "text-amber-300",
      notes: [
        `Trend: ${score.components.trend?.score >= 17 ? "Up" : score.components.trend?.score >= 10 ? "Mixed" : "Down"}`,
        `Breadth: ${breadth?.trend?.label ?? "Unavailable"}`,
        `Risk: ${score.environment.riskLevel}`,
        `Leadership: ${sectors?.leadingSector?.name ?? "Unavailable"}`,
      ],
    };
  }, [score, breadth, sectors]);

  const signals = useMemo(() => {
    if (!score) return [];
    return [
      { label: "Market Score ≥ 65", active: score.score >= 65 },
      {
        label: "Score trend improving",
        active: score.scoreTrend === "Improving",
      },
      { label: "Breadth above 50", active: (breadth?.breadthScore ?? 0) >= 50 },
      {
        label: "Majority above 20-day MA",
        active: (breadth?.above20Day.percent ?? 0) >= 50,
      },
    ];
  }, [score, breadth]);

  const maxSectorMove = Math.max(
    1,
    ...(sectors?.sectors ?? []).map((s) => Math.abs(s.changePercent)),
  );
  const scoreTone = !score
    ? "#3f3f46"
    : score.score >= 65
      ? "#34d399"
      : score.score >= 50
        ? "#facc15"
        : score.score >= 35
          ? "#fb923c"
          : "#fb5b65";
  const scoreText = !score
    ? "text-zinc-400"
    : score.score >= 65
      ? "text-emerald-400"
      : score.score >= 50
        ? "text-yellow-400"
        : score.score >= 35
          ? "text-orange-400"
          : "text-red-400";
  const breadthTone = !breadth
    ? "#3f3f46"
    : breadth.breadthScore >= 65
      ? "#34d399"
      : breadth.breadthScore >= 50
        ? "#facc15"
        : breadth.breadthScore >= 35
          ? "#fb923c"
          : "#fb5b65";
  const strictResearchSamples =
    research?.tickers?.SPY?.currentEpisodes?.["5"]?.sampleSize ?? 0;
  const postureTheme =
    research?.outlook?.posture.label === "Constructive"
      ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-300"
      : research?.outlook?.posture.label === "Defensive"
        ? "border-red-400/25 bg-red-400/10 text-red-300"
        : "border-amber-400/25 bg-amber-400/10 text-amber-200";
  const transitionTone =
    research?.transition?.direction === "Improving"
      ? "text-emerald-400"
      : research?.transition?.direction === "Deteriorating"
        ? "text-red-400"
        : research?.transition?.direction === "Diverging"
          ? "text-amber-300"
          : "text-zinc-300";

  return (
    <main className="min-h-screen bg-[#030706] text-zinc-100">
      <div className="flex min-h-screen">
        <aside
          className={`${mobileNav ? "translate-x-0" : "-translate-x-full"} fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-white/10 bg-[#050908] transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0`}
        >
          <div className="flex h-28 items-center justify-between border-b border-white/10 px-5">
            <Link href="/pro" className="flex items-center gap-3">
              <Image
                src="/maica-logo.png"
                alt="MaicaTrades"
                width={44}
                height={44}
              />
              <div>
                <div className="text-lg font-black">
                  <span>Maica</span>
                  <span className="text-emerald-400">Trades</span>
                </div>
                <div className="mt-1 text-[10px] font-black tracking-[.34em] text-emerald-400">
                  PRIVATE PRO
                </div>
              </div>
            </Link>
            <button onClick={() => setMobileNav(false)} className="lg:hidden">
              <X />
            </button>
          </div>
          <nav className="flex-1 space-y-1 p-3">
            {nav.map(([label, Icon], index) => (
              <a
                key={label}
                href={
                  index === 0
                    ? "#top"
                    : `#${label.toLowerCase().replaceAll(" ", "-")}`
                }
                onClick={() => setMobileNav(false)}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${index === 0 ? "border border-emerald-400/25 bg-emerald-500/15 text-emerald-300" : "text-zinc-400 hover:bg-white/5 hover:text-white"}`}
              >
                <Icon size={18} />
                {label}
              </a>
            ))}
          </nav>
          <div className="m-4 rounded-xl border border-white/10 p-4 text-xs uppercase leading-5 tracking-[.2em] text-zinc-500">
            Depth without complexity.
          </div>
        </aside>

        <div className="min-w-0 flex-1" id="top">
          <header className="flex h-16 items-center gap-4 border-b border-white/10 bg-black/70 px-4 backdrop-blur sm:px-6">
            <button onClick={() => setMobileNav(true)} className="lg:hidden">
              <Menu />
            </button>
            <div>
              <p className="text-xs font-bold uppercase tracking-[.22em] text-emerald-400">
                Market Intelligence
              </p>
              <h1 className="text-lg font-black">Private Pro Dashboard</h1>
            </div>
            <div className="ml-auto flex items-center gap-3">
              <div className="hidden items-center gap-2 text-xs font-bold text-emerald-300 sm:flex">
                <span className="h-2 w-2 rounded-full bg-emerald-400" /> Live data
              </div>
              <ProLogoutButton />
            </div>
          </header>
          <PremiumMarketTicker />

          <div className="mx-auto max-w-[1600px] p-4 sm:p-6 lg:p-8">
            <section className="mb-5 flex flex-col justify-between gap-3 rounded-2xl border border-white/10 bg-[radial-gradient(circle_at_20%_0%,rgba(16,185,129,.14),transparent_42%)] px-6 py-7 sm:flex-row sm:items-end">
              <div>
                <p className="text-xs font-bold uppercase tracking-[.3em] text-emerald-400">
                  Clarity through data
                </p>
                <h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
                  Your market decision desk.
                </h2>
              </div>
              <p className="max-w-md text-sm leading-6 text-zinc-400">
                Same market data. Deeper context, clearer signals, and research
                built around your swing-trading process.
              </p>
            </section>

            {error && (
              <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            )}

            <div className="mb-4">
              <PremarketIntelligence
                variant="pro"
                environment={{
                  score: score?.score ?? null,
                  scoreTrend: score?.scoreTrend ?? null,
                  breadth: breadth?.breadthScore ?? null,
                  breadthTrend: breadth?.trend?.label ?? null,
                  regime: regime.name,
                }}
              />
            </div>

            <section className="grid gap-4 xl:grid-cols-[1.1fr_.8fr_1.3fr]">
              <Card title="Market Score" icon={CircleGauge}>
                <div className="grid grid-cols-2 items-center gap-4 p-5">
                  <div
                    className="relative mx-auto flex h-36 w-36 items-center justify-center rounded-full p-3"
                    style={{
                      background: `conic-gradient(${scoreTone} ${score?.score ?? 0}%, #202825 0)`,
                    }}
                  >
                    <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-[#080d0c]">
                      <span className="text-4xl font-black">
                        {loading ? "—" : (score?.score ?? "—")}
                      </span>
                      <span
                        className={`whitespace-nowrap text-[9px] font-black uppercase tracking-[.1em] ${scoreText}`}
                      >
                        {score?.label ?? "Loading"}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-zinc-500">
                      5-day average
                    </p>
                    <p className="mt-1 text-4xl font-black">
                      {score?.fiveDayAverage?.toFixed(1) ?? "—"}
                    </p>
                    <p
                      className={`mt-3 text-sm font-bold ${score?.scoreTrend === "Weakening" ? "text-red-400" : "text-emerald-400"}`}
                    >
                      {score?.scoreTrend ?? "Loading"}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {score?.fiveDayAverageSampleSize ?? 0} trading days
                    </p>
                  </div>
                </div>
              </Card>
              <Card title="Market Regime" icon={ShieldCheck}>
                <div className="p-5">
                  <p className={`text-3xl font-black ${regime.tone}`}>
                    {regime.name}
                  </p>
                  <div className="mt-5 space-y-3">
                    {regime.notes.map((note) => (
                      <div
                        key={note}
                        className="flex items-center gap-2 text-sm text-zinc-300"
                      >
                        <CheckCircle2 size={15} className="text-emerald-400" />
                        {note}
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
              <Card title="Breadth Trend" icon={Activity}>
                <div className="p-5">
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-5xl font-black">
                        {breadth?.breadthScore ?? "—"}
                      </p>
                      <p className="mt-1 text-xs uppercase tracking-wider text-zinc-500">
                        Breadth score
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-lg font-black ${(breadth?.trend.difference ?? 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}
                      >
                        {signed(breadth?.trend.difference)}
                      </p>
                      <p className="text-xs text-zinc-500">
                        vs.{" "}
                        {breadth?.trend.comparisonType?.toLowerCase() ??
                          "prior reading"}
                      </p>
                    </div>
                  </div>
                  <div className="mt-6 h-3 overflow-hidden rounded-full bg-white/8">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.max(0, Math.min(100, breadth?.breadthScore ?? 0))}%`,
                        backgroundColor: breadthTone,
                      }}
                    />
                  </div>
                  <div className="mt-5 grid grid-cols-3 gap-2 text-center">
                    <div>
                      <b>{breadth?.breadthPercent ?? "—"}%</b>
                      <span className="block text-[10px] text-zinc-500">
                        ADVANCING
                      </span>
                    </div>
                    <div>
                      <b>{breadth?.above20Day.percent ?? "—"}%</b>
                      <span className="block text-[10px] text-zinc-500">
                        ABOVE 20 MA
                      </span>
                    </div>
                    <div>
                      <b>{breadth?.above50Day.percent ?? "—"}%</b>
                      <span className="block text-[10px] text-zinc-500">
                        ABOVE 50 MA
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            </section>

            <section
              className="mt-4 grid gap-4 xl:grid-cols-[.9fr_1.1fr]"
              id="market-intelligence"
            >
              <Card title="Pro Signal Checklist" icon={Sparkles}>
                <div className="p-5">
                  <div className="mb-5 flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-black">
                        {signals.filter((s) => s.active).length} /{" "}
                        {signals.length} active
                      </p>
                      <p className="text-sm text-zinc-500">
                        Current confirmation stack
                      </p>
                    </div>
                    <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-300">
                      LIVE RULES
                    </span>
                  </div>
                  <div className="space-y-2">
                    {signals.map((signal) => (
                      <div
                        key={signal.label}
                        className="flex items-center justify-between rounded-xl bg-white/[.035] px-4 py-3 text-sm"
                      >
                        <span>{signal.label}</span>
                        <span
                          className={
                            signal.active ? "text-emerald-400" : "text-zinc-600"
                          }
                        >
                          {signal.active ? "Confirmed" : "Not active"}
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="mt-4 text-xs leading-5 text-zinc-500">
                    These are transparent condition checks—not a trade
                    recommendation or a historical win-rate claim.
                  </p>
                </div>
              </Card>
              <Card
                title="Sector Strength"
                icon={BarChart3}
                id="sector-analysis"
              >
                <div className="space-y-3 p-5">
                  {(sectors?.sectors ?? []).slice(0, 8).map((sector) => (
                    <div
                      key={sector.symbol}
                      className="grid grid-cols-[105px_1fr_58px] items-center gap-3 text-xs"
                    >
                      <span className="truncate font-semibold text-zinc-300">
                        {sector.name}
                      </span>
                      <div className="h-2 overflow-hidden rounded-full bg-white/8">
                        <div
                          className={`h-full rounded-full ${sector.changePercent >= 0 ? "bg-emerald-400" : "bg-red-400"}`}
                          style={{
                            width: `${Math.max(4, (Math.abs(sector.changePercent) / maxSectorMove) * 100)}%`,
                          }}
                        />
                      </div>
                      <span
                        className={`text-right font-bold ${sector.changePercent >= 0 ? "text-emerald-400" : "text-red-400"}`}
                      >
                        {signed(sector.changePercent, "%")}
                      </span>
                    </div>
                  ))}
                  {loading && <Loading />}
                </div>
              </Card>
            </section>

            <section className="mt-4 grid gap-4" id="historical-research">
              <Card title="Today’s Pro Outlook" icon={Radar}>
                <div className="grid gap-5 p-5 lg:grid-cols-[1.1fr_.9fr]">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-black uppercase tracking-wider ${postureTheme}`}
                      >
                        {research?.outlook?.posture.label ?? "Loading"}
                      </span>
                      <span className="text-xs text-zinc-500">
                        Evidence: {research?.outlook?.confidence ?? "Loading"}
                      </span>
                    </div>
                    <p className="mt-4 text-xl font-black">
                      {research?.outlook?.current
                        ? `${research.outlook.current.scoreBand} score + ${research.outlook.current.breadthBand} breadth`
                        : "Current condition unavailable"}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-zinc-400">
                      {research?.outlook?.posture.description ??
                        "Loading today’s positioning context."}
                    </p>
                    {research?.outlook?.previous && (
                      <p className="mt-4 text-xs text-zinc-500">
                        Previous session: {research.outlook.previous.scoreBand}{" "}
                        score + {research.outlook.previous.breadthBand} breadth
                        •{" "}
                        {research.outlook.changed
                          ? "State changed"
                          : "State unchanged"}
                      </p>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[5, 10, 20].map((days) => {
                      const metric =
                        research?.tickers?.SPY?.currentEpisodes?.[String(days)];
                      return (
                        <div
                          key={days}
                          className="rounded-xl bg-white/[.035] p-3"
                        >
                          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                            {days}D expectancy
                          </p>
                          <p
                            className={`mt-2 text-xl font-black ${(metric?.averageReturn ?? 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}
                          >
                            {metric?.sampleSize
                              ? signed(metric.averageReturn, "%")
                              : "Unavailable"}
                          </p>
                          <p className="mt-2 text-[10px] leading-4 text-zinc-500">
                            {metric?.sampleSize
                              ? `${metric.winRate}% positive • ${metric.sampleSize} episode${metric.sampleSize === 1 ? "" : "s"}`
                              : "No matured episodes"}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="border-t border-white/8 px-5 py-4 text-xs leading-5 text-zinc-500">
                  {research?.outlook?.methodology ??
                    "Loading episode methodology."}
                </div>
              </Card>
              <Card title="Regime Transition Tracker" icon={Activity}>
                <div className="grid gap-5 p-5 xl:grid-cols-[.8fr_1.2fr]">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[.2em] text-zinc-500">
                      Five-session direction
                    </p>
                    <div className="mt-2 flex flex-wrap items-end gap-3">
                      <p className={`text-3xl font-black ${transitionTone}`}>
                        {research?.transition?.direction ?? "Loading"}
                      </p>
                      <span className="mb-1 rounded-full border border-white/10 bg-white/[.04] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-300">
                        {research?.transition?.confirmation ?? "Evaluating"}
                      </span>
                    </div>
                    <div className="mt-5 grid grid-cols-2 gap-2">
                      {[
                        ["Score · 1D", research?.transition?.changes.score1D],
                        [
                          "Breadth · 1D",
                          research?.transition?.changes.breadth1D,
                        ],
                        ["Score · 5D", research?.transition?.changes.score5D],
                        [
                          "Breadth · 5D",
                          research?.transition?.changes.breadth5D,
                        ],
                      ].map(([label, value]) => (
                        <div
                          key={String(label)}
                          className="rounded-xl bg-white/[.035] p-3"
                        >
                          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                            {label}
                          </p>
                          <p
                            className={`mt-1 text-lg font-black ${typeof value === "number" ? (value > 0 ? "text-emerald-400" : value < 0 ? "text-red-400" : "text-zinc-300") : "text-zinc-500"}`}
                          >
                            {typeof value === "number" ? signed(value) : "—"}
                          </p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 rounded-xl border border-emerald-400/15 bg-emerald-400/[.06] p-4">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                        Current response
                      </p>
                      <p className="mt-1 text-lg font-black">
                        {research?.transition?.action ?? "Loading"}
                      </p>
                      <p className="mt-1 text-xs text-zinc-500">
                        Current combined state:{" "}
                        {research?.transition?.consecutiveSessions ?? "—"}{" "}
                        consecutive session
                        {research?.transition?.consecutiveSessions === 1
                          ? ""
                          : "s"}
                      </p>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-end justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[.2em] text-zinc-500">
                          Last 10 sessions
                        </p>
                        <p className="mt-1 text-xs text-zinc-500">
                          Score and breadth move together only when both
                          readings confirm.
                        </p>
                      </div>
                      <div className="hidden gap-3 text-[10px] text-zinc-500 sm:flex">
                        <span>
                          <i className="mr-1 inline-block h-2 w-2 rounded-full bg-emerald-400" />
                          Improving
                        </span>
                        <span>
                          <i className="mr-1 inline-block h-2 w-2 rounded-full bg-red-400" />
                          Defensive
                        </span>
                      </div>
                    </div>
                    <div className="mt-5 grid grid-cols-5 gap-2 lg:grid-cols-10">
                      {(research?.transition?.recent ?? []).map(
                        (day, index, days) => {
                          const prior = days[index - 1];
                          const improving =
                            prior &&
                            day.score > prior.score &&
                            (day.breadth ?? -1) > (prior.breadth ?? -1);
                          const defensive =
                            day.scoreBand === "Strong Bearish" ||
                            day.breadthBand === "Weak";
                          return (
                            <div
                              key={day.date}
                              className={`rounded-xl border p-2 text-center ${index === days.length - 1 ? "border-emerald-400/35 bg-emerald-400/[.07]" : "border-white/8 bg-white/[.025]"}`}
                            >
                              <p className="text-[9px] text-zinc-500">
                                {day.date.slice(5)}
                              </p>
                              <span
                                className={`mx-auto mt-2 block h-2 w-2 rounded-full ${improving ? "bg-emerald-400" : defensive ? "bg-red-400" : "bg-amber-300"}`}
                              />
                              <p className="mt-2 text-sm font-black">
                                {day.score}
                              </p>
                              <p className="text-[9px] text-zinc-500">
                                B {day.breadth ?? "—"}
                              </p>
                            </div>
                          );
                        },
                      )}
                    </div>
                    <div className="mt-4 rounded-xl bg-white/[.035] px-4 py-3 text-xs leading-5 text-zinc-500">
                      A transition becomes confirmed after the combined
                      score-and-breadth state persists for at least three
                      recorded sessions. One-day changes remain early signals.
                    </div>
                  </div>
                </div>
              </Card>
              <Card
                title="Daily Snapshot Study — Exact Conditions"
                icon={Microscope}
              >
                <div className="p-5">
                  <div className="flex flex-col justify-between gap-3 border-b border-white/8 pb-5 sm:flex-row sm:items-end">
                    <div>
                      <p className="text-lg font-black">
                        {research
                          ? `${research.currentConditions.scoreBand} score + ${research.currentConditions.breadthBand} breadth`
                          : "Building the current-condition study…"}
                      </p>
                      <p className="mt-1 text-sm text-zinc-500">
                        Every matching daily snapshot; consecutive days may
                        belong to the same market episode.
                      </p>
                    </div>
                    <div className="text-xs text-zinc-500">
                      {research
                        ? `${research.history.recordCount} score records • ${research.history.firstDate ?? "—"} to ${research.history.lastDate ?? "—"}`
                        : "Loading verified history"}
                    </div>
                  </div>
                  {research && strictResearchSamples === 0 && (
                    <div className="mt-4 rounded-xl border border-amber-400/20 bg-amber-400/8 px-4 py-3 text-xs leading-5 text-amber-200">
                      No matured episode exists for today’s strict condition.
                      Pro will show expectancy as unavailable until real
                      outcomes develop; the overall market baseline remains in
                      the matrix below and is not presented as today’s forecast.
                    </div>
                  )}
                  <div className="mt-5 overflow-x-auto">
                    <table className="w-full min-w-[720px] text-left">
                      <thead>
                        <tr className="text-xs uppercase tracking-wider text-zinc-500">
                          <th className="pb-3">Ticker</th>
                          {[5, 10, 20].map((days) => (
                            <th key={days} className="pb-3">
                              Forward {days}D
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {["SPY", "QQQ", "IWM"].map((symbol) => (
                          <tr key={symbol} className="border-t border-white/8">
                            <td className="py-4 text-lg font-black">
                              {symbol}
                            </td>
                            {[5, 10, 20].map((days) => {
                              const metric =
                                research?.tickers?.[symbol]
                                  ?.currentConditions?.[String(days)];
                              return (
                                <td key={days} className="py-4">
                                  <div
                                    className={`text-lg font-black ${(metric?.averageReturn ?? 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}
                                  >
                                    {metric?.sampleSize
                                      ? signed(metric.averageReturn, "%")
                                      : "Unavailable"}
                                  </div>
                                  <div className="mt-1 text-xs text-zinc-500">
                                    {metric?.sampleSize
                                      ? `${metric.winRate}% positive • n=${metric.sampleSize}`
                                      : "No completed samples"}
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-4 rounded-xl bg-white/[.035] px-4 py-3 text-xs leading-5 text-zinc-500">
                    {research?.methodology ?? "Research data is loading."} Daily
                    sample counts are descriptive; the episode study above is
                    the cleaner signal test.
                  </div>
                </div>
              </Card>
              <Card title="SPY Condition Matrix" icon={FlaskConical}>
                <div className="grid min-w-0 gap-4 p-5 xl:grid-cols-2">
                  <MatrixTable
                    title="Market Score bands"
                    rows={research?.conditionMatrix?.scoreBands}
                  />
                  <MatrixTable
                    title="Breadth bands"
                    rows={research?.conditionMatrix?.breadthBands}
                  />
                </div>
                <div className="border-t border-white/8 px-5 py-4 text-xs leading-5 text-zinc-500">
                  Compare rows vertically. A useful signal should eventually
                  show materially different outcomes across condition bands—not
                  merely a positive result in one small sample.
                </div>
              </Card>
              <Card title="Key Takeaways" icon={BookOpen}>
                <div className="space-y-3 p-5">
                  <div className="flex gap-3 text-sm">
                    <CheckCircle2
                      className="mt-0.5 shrink-0 text-emerald-400"
                      size={17}
                    />
                    <span>
                      Market Score is{" "}
                      <b>{score?.label?.toLowerCase() ?? "loading"}</b> at{" "}
                      {score?.score ?? "—"}, with the 5-day average at{" "}
                      {score?.fiveDayAverage?.toFixed(1) ?? "—"}.
                    </span>
                  </div>
                  <div className="flex gap-3 text-sm">
                    <CheckCircle2
                      className="mt-0.5 shrink-0 text-emerald-400"
                      size={17}
                    />
                    <span>
                      Breadth is {breadth?.label?.toLowerCase() ?? "loading"};{" "}
                      {breadth?.advancing ?? "—"} of {breadth?.total ?? "—"}{" "}
                      stocks are advancing.
                    </span>
                  </div>
                  <div className="flex gap-3 text-sm">
                    {(sectors?.leadingSector?.changePercent ?? 0) >= 0 ? (
                      <TrendingUp
                        className="mt-0.5 shrink-0 text-emerald-400"
                        size={17}
                      />
                    ) : (
                      <TrendingDown
                        className="mt-0.5 shrink-0 text-red-400"
                        size={17}
                      />
                    )}
                    <span>
                      {sectors?.leadingSector?.name ?? "Sector leadership"}{" "}
                      leads today;{" "}
                      {sectors?.weakestSector?.name ?? "the laggard"} is
                      weakest.
                    </span>
                  </div>
                </div>
              </Card>
            </section>
            <footer className="mt-8 flex flex-col gap-2 border-t border-white/10 py-6 text-xs text-zinc-600 sm:flex-row sm:justify-between">
              <span>MaicaTrades Private Pro</span>
              <span>Research context—not financial advice.</span>
            </footer>
          </div>
        </div>
      </div>
    </main>
  );
}
