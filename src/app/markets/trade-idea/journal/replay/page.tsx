"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

type Replay = {
  status: string; entrySession: string | null; outcomeSession: string | null;
  reason: string; reviewedBars: number; requiresIntradayConfirmation: boolean;
};
type Row = {
  id: string; weekKey: string; symbol: string; recordedStatus: string;
  replay: Replay; mismatch: boolean;
};
type Response = {
  success: boolean; checked: number; mismatches: number; needsReview: number;
  unavailable: number; records: Row[]; caveat: string; error?: string;
};
const display = (value: string) => value.replaceAll("_", " ");
export default function ReplayAuditPage() {
  const [data, setData] = useState<Response | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    fetch("/api/trade-idea/journal/replay", { cache: "no-store" })
      .then(async response => {
        const body = await response.json() as Response;
        if (!response.ok || !body.success) throw Error(body.error ?? "Replay unavailable");
        if (active) setData(body);
      })
      .catch(reason => { if (active) setError(String(reason)); });
    return () => { active = false; };
  }, []);
  return <main className="min-h-screen bg-[#050b12] px-4 py-10 text-slate-100 md:px-10">
    <div className="mx-auto max-w-7xl">
      <Link href="/markets/trade-idea/journal" className="text-sm text-blue-400">← Trade Idea Journal</Link>
      <h1 className="mt-5 text-3xl font-bold">Historical Replay Audit</h1>
      <p className="mt-2 text-slate-400">Compare saved Trade Idea outcomes against a conservative, read-only daily-candle reconstruction.</p>
      {error && <p role="alert" className="mt-6 text-red-400">{error}</p>}
      {!data && !error && <p className="mt-6 text-slate-400">Replaying historical ideas…</p>}
      {data && <>
        <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            ["Ideas checked", data.checked], ["Potential mismatches", data.mismatches],
            ["Intraday review needed", data.needsReview], ["Data unavailable", data.unavailable],
          ].map(([label, value]) =>
            <div key={label} className="rounded-xl border border-slate-800 bg-[#09131d] p-4">
              <p className="text-xs text-slate-400">{label}</p>
              <p className="mt-2 text-2xl font-semibold">{value}</p>
            </div>)}
        </div>
        <p className="mt-5 text-xs text-amber-300">{data.caveat}</p>
        <div className="mt-6 overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full min-w-[1000px] text-left text-sm">
            <thead className="bg-slate-900 text-slate-300"><tr>
              {["Week", "Symbol", "Recorded", "Replay", "Entry session", "Outcome session", "Audit", "Reason"].map(title =>
                <th key={title} className="px-4 py-3">{title}</th>)}
            </tr></thead>
            <tbody>{data.records.map(row => <tr key={row.id} className="border-t border-slate-800 align-top">
              <td className="px-4 py-3 whitespace-nowrap">{row.weekKey}</td>
              <td className="px-4 py-3 font-semibold">{row.symbol}</td>
              <td className="px-4 py-3">{display(row.recordedStatus)}</td>
              <td className="px-4 py-3">{display(row.replay.status)}</td>
              <td className="px-4 py-3 whitespace-nowrap">{row.replay.entrySession ?? "—"}</td>
              <td className="px-4 py-3 whitespace-nowrap">{row.replay.outcomeSession ?? "—"}</td>
              <td className="px-4 py-3 text-amber-300">{row.mismatch ? "POTENTIAL MISMATCH" :
                row.replay.requiresIntradayConfirmation ? "INTRADAY REVIEW" :
                row.replay.status === "INSUFFICIENT_DATA" ? "DATA UNAVAILABLE" : "—"}</td>
              <td className="px-4 py-3 text-slate-300">{row.replay.reason}</td>
            </tr>)}</tbody>
          </table>
        </div>
      </>}
    </div>
  </main>;
}
