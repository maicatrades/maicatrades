"use client";

import { Clock3, Radar, TrendingUp } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  analyzePremarket,
  type PremarketTicker,
} from "@/lib/premarket-intelligence";
import { fetchDashboardJson } from "@/lib/dashboard-api";

type Props = {
  variant?: "free" | "pro";
  environment?: {
    score: number | null;
    scoreTrend: string | null;
    breadth: number | null;
    breadthTrend: string | null;
    regime: string | null;
  };
};

type Response = { success: boolean; data?: PremarketTicker[]; updatedAt?: string };

function change(value: number) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

function time(value: number) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(new Date(value * 1000));
}

export default function PremarketIntelligence({
  variant = "free",
  environment,
}: Props) {
  const [rows, setRows] = useState<PremarketTicker[]>([]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const result = await fetchDashboardJson<Response>("/api/market-ticker");
        if (mounted && result.ok && result.data.success) setRows(result.data.data ?? []);
      } catch (error) {
        console.warn("Pre-market intelligence unavailable:", error);
      }
    }
    void load();
    const interval = window.setInterval(load, 5 * 60_000);
    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, []);

  const intelligence = useMemo(
    () => analyzePremarket(rows, environment),
    [rows, environment],
  );

  if (!intelligence) return null;

  const stateColor =
    intelligence.state === "Risk-On"
      ? "text-emerald-400"
      : intelligence.state === "Risk-Off"
        ? "text-red-400"
        : "text-amber-300";
  const pro = variant === "pro";

  return (
    <section className={`rounded-2xl border ${pro ? "border-emerald-400/20 bg-[#0a0f0e]/95" : "border-sky-500/20 bg-[#09131d]"}`}>
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
        <div className="flex items-center gap-2 text-sm font-black uppercase tracking-[.1em] text-sky-400">
          {pro ? <Radar size={17} /> : <TrendingUp size={17} />}
          {pro ? "Pre-Market Intelligence" : "Pre-Market Pulse"}
          <span className="rounded border border-sky-500/30 bg-sky-500/10 px-1.5 py-0.5 text-[9px]">PRE</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <Clock3 size={13} /> {time(intelligence.timestamp)}
        </div>
      </header>

      <div className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex gap-5">
            {intelligence.indexes.map((row) => (
              <div key={row.symbol}>
                <p className="text-xs font-bold text-zinc-400">{row.symbol}</p>
                <p className={`text-lg font-black ${row.changePercent >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {change(row.changePercent)}
                </p>
              </div>
            ))}
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Morning state</p>
            <p className={`text-xl font-black ${stateColor}`}>{intelligence.state}</p>
          </div>
        </div>
        <p className="mt-4 text-sm leading-6 text-zinc-300">{intelligence.summary}</p>
        <p className="mt-2 text-xs text-zinc-500">
          Strongest: {intelligence.strongest.symbol} · Weakest: {intelligence.weakest.symbol}
        </p>

        {pro && (
          <div className="mt-5 grid gap-4 xl:grid-cols-[.8fr_1.2fr]">
            <div className="rounded-xl border border-white/8 bg-white/[.025] p-4">
              <p className="text-[10px] font-black uppercase tracking-[.14em] text-zinc-500">Regime alignment</p>
              <p className={`mt-1 text-2xl font-black ${intelligence.alignment === "Confirming" ? "text-emerald-400" : intelligence.alignment === "Diverging" ? "text-amber-300" : "text-zinc-300"}`}>
                {intelligence.alignment}
              </p>
              <p className="mt-3 text-sm leading-6 text-zinc-400">{intelligence.overnightRead}</p>
            </div>
            <div className="rounded-xl border border-white/8 bg-white/[.025] p-4">
              <p className="text-[10px] font-black uppercase tracking-[.14em] text-zinc-500">What matters at the open</p>
              <ul className="mt-3 space-y-2 text-sm text-zinc-300">
                {intelligence.observations.map((observation) => (
                  <li key={observation} className="flex gap-2"><span className="text-emerald-400">•</span>{observation}</li>
                ))}
              </ul>
            </div>
            <div className="overflow-x-auto rounded-xl border border-white/8 xl:col-span-2">
              <table className="w-full min-w-[700px] text-left text-xs">
                <thead className="bg-white/[.035] text-zinc-500"><tr><th className="px-4 py-3">Index</th><th>PRE / Current</th><th>Prev close</th><th>Prev high</th><th>Prev low</th><th>PRE range</th><th>PRE volume</th></tr></thead>
                <tbody>
                  {intelligence.indexes.map((row) => (
                    <tr key={row.symbol} className="border-t border-white/8 text-zinc-300">
                      <td className="px-4 py-3 font-black">{row.symbol}</td><td>{row.price.toFixed(2)}</td><td>{row.previousClose.toFixed(2)}</td><td>{row.previousDayHigh?.toFixed(2) ?? "—"}</td><td>{row.previousDayLow?.toFixed(2) ?? "—"}</td><td>{row.premarketLow?.toFixed(2) ?? "—"}–{row.premarketHigh?.toFixed(2) ?? "—"}</td><td>{row.premarketVolume?.toLocaleString() ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
