"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowDownRight,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  Clock3,
  LoaderCircle,
  RefreshCw,
  ShieldAlert,
  Star,
  Target,
} from "lucide-react";

type Direction = "LONG" | "SHORT";
type ChartPoint = {
  date: string;
  close: number;
  sma20: number | null;
};
type ScoreBreakdown = {
  trend: number; marketDirection: number; priceAction: number; sectorStrength: number;
  distanceToLevel: number; riskReward: number; relativeStrength: number;
  earningsNews: number; momentum: number; total: number; availableMaximum: number;
};
type TradeIdea = {
  symbol: string; companyName: string; direction: Direction; price: number; previousClose: number;
  change: number; changePercent: number; setup: string; setupType: string; holdingPeriod: string;
  entry: number; stopLoss: number; target: number; riskReward: number; confidenceScore: number;
  confidenceStars: number; grade: string; tradeBias: string; patternDescription: string;
  biasDescription: string; whyItMatters: string[]; managementPlan: string[];
  sma20: number | null; sma160: number | null; rsi14: number | null;
  marketDirection: string; scoreBreakdown: ScoreBreakdown; chart: ChartPoint[];
};
type TradeIdeaResponse = {
  success: boolean; hasQualifiedSetup?: boolean; idea?: TradeIdea; updatedAt?: string; error?: string;
};

function formatMoney(
  value: number | null | undefined,
) {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value)
  ) {
    return "—";
  }

  return `$${value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
function formatTime(value?: string) {
  if (!value) return "Recently updated";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Recently updated" : date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function ConfidenceStars({ confidence }: { confidence: number }) {
  const normalized = Math.max(0, Math.min(5, Math.round(confidence)));
  return <div className="mt-2 flex text-amber-400" aria-label={`${normalized} out of 5 confidence`}>
    {Array.from({ length: 5 }, (_, index) => <Star key={index} size={19} fill={index < normalized ? "currentColor" : "none"} className={index < normalized ? "text-amber-400" : "text-slate-600"} />)}
  </div>;
}

function TradeChart({
  points,
  entry,
  stopLoss,
  target,
  direction,
}: {
  points: ChartPoint[];
  entry: number;
  stopLoss: number;
  target: number;
  direction: Direction;
}) {
  const chart = useMemo(() => {
    const validPoints = points.filter(
      (point) =>
        Number.isFinite(point.close) &&
        (point.sma20 === null || Number.isFinite(point.sma20)),
    );

    if (
      validPoints.length < 2 ||
      !Number.isFinite(entry) ||
      !Number.isFinite(stopLoss) ||
      !Number.isFinite(target)
    ) {
      return null;
    }

    const width = 900;
    const height = 360;
    const paddingX = 36;
    const paddingY = 28;

    const values = validPoints.flatMap((point) =>
      typeof point.sma20 === "number" && Number.isFinite(point.sma20)
        ? [point.close, point.sma20]
        : [point.close],
    );

    values.push(entry, stopLoss, target);

    const finiteValues = values.filter(Number.isFinite);

    if (finiteValues.length < 2) {
      return null;
    }

    const minimum = Math.min(...finiteValues);
    const maximum = Math.max(...finiteValues);
    const range = maximum - minimum || 1;

    const toX = (index: number) =>
      paddingX +
      (index / (validPoints.length - 1)) * (width - paddingX * 2);

    const toY = (value: number) =>
      height -
      paddingY -
      ((value - minimum) / range) * (height - paddingY * 2);

    const pricePath = validPoints
      .map(
        (point, index) =>
          `${index === 0 ? "M" : "L"} ${toX(index)} ${toY(point.close)}`,
      )
      .join(" ");

    const smaPoints = validPoints
      .map((point, index) => ({ point, index }))
      .filter(
        ({ point }) =>
          typeof point.sma20 === "number" &&
          Number.isFinite(point.sma20),
      );

    const smaPath = smaPoints
      .map(
        ({ point, index }, pathIndex) =>
          `${pathIndex === 0 ? "M" : "L"} ${toX(index)} ${toY(
            point.sma20 as number,
          )}`,
      )
      .join(" ");

    const entryY = toY(entry);
    const stopY = toY(stopLoss);
    const targetY = toY(target);

    if (
      !Number.isFinite(entryY) ||
      !Number.isFinite(stopY) ||
      !Number.isFinite(targetY)
    ) {
      return null;
    }

    return {
      pricePath,
      smaPath,
      entryY,
      stopY,
      targetY,
    };
  }, [points, entry, stopLoss, target]);

  if (!chart) {
    return (
      <div className="flex h-[360px] items-center justify-center rounded-xl border border-slate-800 bg-[#06101a] px-6 text-center text-sm text-slate-500">
        Technical chart data is temporarily unavailable. Refresh the scanner
        to try again.
      </div>
    );
  }

  const priceColor = direction === "LONG" ? "#22c55e" : "#ef4444";

  return (
    <div className="relative h-[360px] overflow-hidden rounded-xl border border-slate-800 bg-[#06101a]">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.05)_1px,transparent_1px)] bg-[size:48px_48px]" />

      <svg
        viewBox="0 0 900 360"
        className="relative h-full w-full"
        role="img"
        aria-label={`${direction.toLowerCase()} technical chart`}
      >
        <path
          d={chart.pricePath}
          fill="none"
          stroke={priceColor}
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {chart.smaPath && (
          <path
            d={chart.smaPath}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        <line
          x1="0"
          y1={chart.targetY}
          x2="900"
          y2={chart.targetY}
          stroke="#22c55e"
          strokeWidth="2"
          strokeDasharray="10 10"
        />

        <line
          x1="0"
          y1={chart.entryY}
          x2="900"
          y2={chart.entryY}
          stroke="#f59e0b"
          strokeWidth="2"
          strokeDasharray="10 10"
        />

        <line
          x1="0"
          y1={chart.stopY}
          x2="900"
          y2={chart.stopY}
          stroke="#ef4444"
          strokeWidth="2"
          strokeDasharray="10 10"
        />
      </svg>
    </div>
  );
}

function LoadingState() { return <main className="flex min-h-screen items-center justify-center bg-[#050b11] px-5 text-white"><div className="text-center"><LoaderCircle size={38} className="mx-auto animate-spin text-blue-400" /><p className="mt-4 font-semibold text-slate-200">Scanning long and short setups</p><p className="mt-2 text-sm text-slate-500">Comparing trend, market direction, price action, sector strength, and risk.</p></div></main>; }
function ErrorState({ message }: { message: string }) { return <main className="flex min-h-screen items-center justify-center bg-[#050b11] px-5 text-white"><div className="max-w-md rounded-2xl border border-red-500/20 bg-[#09131d] p-8 text-center"><AlertCircle size={34} className="mx-auto text-red-400" /><h1 className="mt-4 text-xl font-bold">Trade idea is unavailable</h1><p className="mt-3 text-sm leading-6 text-slate-400">{message}</p><Link href="/dashboard" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-blue-400"><ArrowLeft size={16} />Back to Dashboard</Link></div></main>; }

export default function TradeIdeaPage() {
  const [data, setData] = useState<TradeIdeaResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTradeIdea = useCallback(async (background = false) => {
    try {
      background ? setRefreshing(true) : setLoading(true);
      setError(null);
      const response = await fetch("/api/trade-idea", { cache: "no-store" });
      const result = (await response.json()) as TradeIdeaResponse;
      if (!response.ok || !result.success || !result.idea) throw new Error(result.error ?? "Unable to load the trade idea.");
      setData(result);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to load the trade idea.");
    } finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => {
    void loadTradeIdea();
    const interval = window.setInterval(() => void loadTradeIdea(true), 15 * 60 * 1000);
    return () => window.clearInterval(interval);
  }, [loadTradeIdea]);

  if (loading) return <LoadingState />;
  if (error && !data) return <ErrorState message={error} />;
  if (!data?.idea) return <ErrorState message="No valid trade idea data was returned." />;

  const idea = data.idea;
  const isLong = idea.direction === "LONG";
  const qualified = data.hasQualifiedSetup !== false;
  const accentText = isLong ? "text-emerald-400" : "text-red-400";
  const accentBorder = isLong ? "border-emerald-500/20 bg-emerald-500/10" : "border-red-500/20 bg-red-500/10";
  const DirectionIcon = isLong ? ArrowUpRight : ArrowDownRight;
  const positiveChange = idea.changePercent >= 0;

  return <main className="min-h-screen bg-[#050b11] text-white"><div className="mx-auto max-w-7xl px-5 py-8 sm:px-6 lg:px-8">
    <div className="mb-8 flex flex-wrap items-center justify-between gap-4"><Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 transition hover:text-blue-400"><ArrowLeft size={17} />Back to Dashboard</Link><p className="text-xs text-slate-600">Updated {formatTime(data.updatedAt)}</p></div>

    {!qualified && <section className="mb-6 rounded-2xl border border-amber-500/25 bg-amber-500/5 p-5"><div className="flex items-start gap-3"><ShieldAlert className="mt-0.5 shrink-0 text-amber-400" size={20} /><div><h2 className="font-semibold text-amber-300">No high-quality setup met the full threshold</h2><p className="mt-1 text-sm leading-6 text-slate-400">The scanner is showing the highest-ranked candidate for monitoring only. Wait for confirmation rather than forcing a trade.</p></div></div></section>}

    <section className="mb-8 overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-[#0b1722] to-[#071019] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.25)] sm:p-8">
      <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end"><div><div className={`mb-3 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${accentBorder} ${accentText}`}><DirectionIcon size={14} />{idea.direction} setup · Grade {idea.grade}</div><h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Today&apos;s {isLong ? "Long" : "Short"} Trade Idea</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">The adaptive scanner compared both long and short opportunities and selected the strongest market-aligned candidate.</p></div>
      <div className="flex flex-wrap gap-3"><div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2 text-xs text-slate-400"><Clock3 size={15} className="text-blue-400" />Delayed market data</div><div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2 text-xs text-slate-400"><CalendarDays size={15} className="text-blue-400" />{idea.holdingPeriod}</div><button type="button" onClick={() => void loadTradeIdea(true)} disabled={refreshing} className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-950/40 px-3 py-2 text-xs font-medium text-slate-300 transition hover:border-blue-500/40 hover:text-blue-400 disabled:opacity-60"><RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />Refresh</button></div></div>
    </section>

    <section className="mb-6 grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-[#09131d]"><div className="flex flex-col justify-between gap-4 border-b border-slate-800 px-5 py-5 sm:flex-row sm:items-end"><div><p className="text-3xl font-bold">{idea.symbol}</p><p className="mt-1 text-sm text-slate-500">{idea.companyName}</p></div><div className="sm:text-right"><p className="text-3xl font-semibold">{formatMoney(idea.price)}</p><p className={`mt-1 text-sm font-semibold ${positiveChange ? "text-emerald-400" : "text-red-400"}`}>{positiveChange ? "+" : ""}{idea.changePercent.toFixed(2)}%</p></div></div><div className="p-5"><TradeChart points={idea.chart} entry={idea.entry} stopLoss={idea.stopLoss} target={idea.target} direction={idea.direction} /><div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-500"><div>Price</div><div>20 SMA</div><div>Entry</div><div>Stop</div><div>Target</div></div></div></div>
      <aside className="rounded-2xl border border-slate-800 bg-[#09131d] p-5"><div className="flex items-center gap-2"><DirectionIcon size={18} className={accentText} /><h2 className="text-lg font-semibold">Setup Overview</h2></div><div className="mt-5 space-y-5"><div><p className={`text-xs font-semibold uppercase tracking-wide ${accentText}`}>Pattern</p><p className="mt-1 text-lg font-semibold">{idea.setup}</p><p className="mt-1 text-sm leading-6 text-slate-400">{idea.patternDescription}</p></div><div><p className="text-xs font-semibold uppercase tracking-wide text-blue-400">Market Regime</p><p className="mt-1 text-lg font-semibold">{idea.marketDirection}</p><p className="mt-1 text-sm leading-6 text-slate-400">{idea.biasDescription}</p></div><div className="grid grid-cols-2 gap-3"><div className="rounded-xl border border-slate-800 bg-slate-950/35 p-3"><p className="text-xs uppercase tracking-wide text-slate-500">Score</p><p className="mt-1 text-lg font-semibold">{idea.confidenceScore}/96</p><ConfidenceStars confidence={idea.confidenceStars} /></div><div className="rounded-xl border border-slate-800 bg-slate-950/35 p-3"><p className="text-xs uppercase tracking-wide text-slate-500">Grade</p><p className={`mt-1 text-2xl font-bold ${accentText}`}>{idea.grade}</p><p className="mt-2 text-xs text-slate-500">{idea.setupType}</p></div></div><div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4"><div className="flex items-start gap-3"><ShieldAlert size={18} className="mt-0.5 shrink-0 text-red-400" /><div><p className="text-sm font-semibold text-red-400">Risk Reminder</p><p className="mt-1 text-xs leading-5 text-slate-400">Trade setups identify potential opportunities, not guarantees. Confirm the trigger and size positions appropriately.</p></div></div></div></div></aside>
    </section>

    <section className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[
      ["Entry", `${isLong ? "Above" : "Below"} ${formatMoney(idea.entry)}`, isLong ? "Wait for confirmation above resistance." : "Wait for confirmation below support."],
      ["Stop Loss", formatMoney(idea.stopLoss), isLong ? "Invalidation below support." : "Invalidation above resistance."],
      ["Target", formatMoney(idea.target), isLong ? "Initial upside objective." : "Initial downside objective."],
      ["Risk / Reward", `1 : ${idea.riskReward.toFixed(2)}`, "Based on the current entry, stop, and target."],
    ].map(([label, value, description]) => <div key={label} className="rounded-xl border border-slate-800 bg-[#09131d] p-5"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p><p className="mt-2 text-xl font-bold text-white">{value}</p><p className="mt-2 text-sm leading-5 text-slate-400">{description}</p></div>)}</section>

    <section className="mb-6 grid gap-4 sm:grid-cols-3">
      <div className="rounded-xl border border-slate-800 bg-[#09131d] p-5">
        <p className="text-xs uppercase tracking-wide text-slate-500">20 SMA</p>
        <p className="mt-2 text-xl font-bold">
          {idea.sma20 === null || idea.sma20 === undefined
            ? "—"
            : formatMoney(idea.sma20)}
        </p>
      </div>

      <div className="rounded-xl border border-slate-800 bg-[#09131d] p-5">
        <p className="text-xs uppercase tracking-wide text-slate-500">160 SMA</p>
        <p className="mt-2 text-xl font-bold">
          {idea.sma160 === null || idea.sma160 === undefined
            ? "—"
            : formatMoney(idea.sma160)}
        </p>
      </div>

      <div className="rounded-xl border border-slate-800 bg-[#09131d] p-5">
        <p className="text-xs uppercase tracking-wide text-slate-500">RSI 14</p>
        <p className="mt-2 text-xl font-bold">
          {idea.rsi14 === null || !Number.isFinite(idea.rsi14)
            ? "—"
            : idea.rsi14.toFixed(1)}
        </p>
        {idea.rsi14 !== null && Number.isFinite(idea.rsi14) && (
          <p className="mt-1 text-xs text-slate-500">
            {idea.rsi14 >= 70
              ? "Overbought"
              : idea.rsi14 <= 30
                ? "Oversold"
                : idea.rsi14 >= 50
                  ? "Positive momentum"
                  : "Neutral momentum"}
          </p>
        )}
      </div>
    </section>

    <section className="grid gap-6 lg:grid-cols-2"><div className="rounded-2xl border border-slate-800 bg-[#09131d] p-5"><div className="flex items-center gap-2"><Target size={18} className="text-blue-400" /><h2 className="text-lg font-semibold">Why This Setup Matters</h2></div><div className="mt-4 space-y-4">{idea.whyItMatters.map((paragraph, index) => <p key={index} className="text-sm leading-7 text-slate-400">{paragraph}</p>)}</div></div><div className="rounded-2xl border border-slate-800 bg-[#09131d] p-5"><div className="flex items-center gap-2"><BarChart3 size={18} className="text-blue-400" /><h2 className="text-lg font-semibold">Trade Management Plan</h2></div><div className="mt-4 space-y-4 text-sm text-slate-400">{idea.managementPlan.map((step, index) => <div key={index} className="flex gap-3"><ArrowRight size={16} className="mt-0.5 shrink-0 text-blue-400" /><p>{step}</p></div>)}</div></div></section>
    <p className="mt-8 text-center text-xs text-slate-600">Market data is supplied by Yahoo Finance and may be delayed. Trade setups are educational and are not financial advice.</p>
  </div></main>;
}