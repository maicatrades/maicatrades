"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
type RecordRow = { id:string;week_key:string;symbol:string;direction:string;status:string;entry_price:number;stop_price:number;target_price:number;grade:string|null;locked_at:string;entry_triggered_at:string|null;target_hit_at:string|null;stopped_out_at:string|null;outcome_note:string|null;realizedR:number|null };
type Payload = {success:boolean;records:RecordRow[];metrics:{totalIdeas:number;resolvedTrades:number;wins:number;losses:number;winRate:number|null;averageR:number|null;profitFactor:number|null;unresolved:number};caveat:string;error?:string};
const money=(n:number)=>Number(n).toFixed(2);
export default function TradeIdeaJournalPage(){
 const [data,setData]=useState<Payload|null>(null);const [error,setError]=useState("");
 useEffect(()=>{let active=true;fetch("/api/trade-idea/journal",{cache:"no-store"}).then(async r=>{const j=await r.json();if(!r.ok||!j.success)throw Error(j.error||"Journal unavailable");if(active)setData(j)}).catch(e=>{if(active)setError(String(e))});return()=>{active=false}},[]);
 return <main className="min-h-screen bg-[#050b12] px-4 py-10 text-slate-100 md:px-10">
 <div className="mx-auto max-w-6xl"><Link href="/markets/trade-idea" className="text-sm text-blue-400">← Trade Idea</Link>
 <h1 className="mt-5 text-3xl font-bold">Trade Idea Journal</h1><p className="mt-2 text-slate-400">Permanent weekly selections and their recorded outcomes. This page does not alter trade rules or historical records.</p>
 {error&&<p role="alert" className="mt-6 text-red-400">{error}</p>}
 {!data&&!error&&<p className="mt-6 text-slate-400">Loading journal…</p>}
 {data&&<><div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">{[
 ["Ideas",String(data.metrics.totalIdeas)],["Resolved trades",String(data.metrics.resolvedTrades)],
 ["Win rate",data.metrics.winRate===null?"—":(data.metrics.winRate*100).toFixed(1)+"%"],
 ["Average R",data.metrics.averageR===null?"—":data.metrics.averageR.toFixed(2)+"R"],
 ["Profit factor",data.metrics.profitFactor===null?"—":data.metrics.profitFactor.toFixed(2)],
 ["Unresolved / untriggered",String(data.metrics.unresolved)]
 ].map(([label,value])=><div key={label} className="rounded-xl border border-slate-800 bg-[#09131d] p-4"><p className="text-xs text-slate-400">{label}</p><p className="mt-2 text-2xl font-semibold">{value}</p></div>)}</div>
 <p className="mt-5 text-xs text-amber-300">{data.caveat}</p>
 <div className="mt-6 overflow-x-auto rounded-xl border border-slate-800"><table className="w-full min-w-[850px] text-left text-sm"><thead className="bg-slate-900 text-slate-300"><tr>{["Week","Symbol","Direction","Status","Entry","Stop","Target","Grade","Result"].map(h=><th key={h} className="px-4 py-3">{h}</th>)}</tr></thead><tbody>{data.records.map(r=><tr key={r.id} className="border-t border-slate-800"><td className="px-4 py-3">{r.week_key}</td><td className="px-4 py-3 font-semibold">{r.symbol}</td><td className="px-4 py-3">{r.direction}</td><td className="px-4 py-3" title={r.outcome_note??""}>{r.status.replaceAll("_"," ")}</td><td className="px-4 py-3">{"$"}{money(r.entry_price)}</td><td className="px-4 py-3">{"$"}{money(r.stop_price)}</td><td className="px-4 py-3">{"$"}{money(r.target_price)}</td><td className="px-4 py-3">{r.grade??"—"}</td><td className="px-4 py-3">{r.realizedR===null?"—":r.realizedR.toFixed(2)+"R"}</td></tr>)}</tbody></table>{data.records.length===0&&<p className="p-5 text-slate-400">No saved Trade Ideas found.</p>}</div>
 </>}</div></main>
}
