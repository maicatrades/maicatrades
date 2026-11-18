import type { SupabaseClient } from '@supabase/supabase-js';
import { previousTradingDate, isTradingDate } from './market-session';
export function validScore(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value>=0 && value<=100;
}
export function rollingScoreWindow(rows: Array<{tradingDate:string;score:unknown}>) {
  const sorted = [...rows].sort((a,b)=>b.tradingDate.localeCompare(a.tradingDate));
  const window: Array<{tradingDate:string;score:number}> = [];
  for (const row of sorted) {
    if (!validScore(row.score) || (window.length && row.tradingDate!==previousTradingDate(window.at(-1)!.tradingDate))) break;
    window.push({tradingDate:row.tradingDate,score:row.score});
    if (window.length===5) break;
  }
  return {average:window.length===5 ? Math.round(window.reduce((s,r)=>s+r.score,0)/5*10)/10 : null,
    dates:window.map(r=>r.tradingDate), sampleSize:window.length};
}
// Both operations are atomic conditional writes. Never read-then-unconditionally-upsert.
// Concurrent finalizers can only promote one intraday row or insert one missing row.
export async function writeScoreSnapshot(db: SupabaseClient, row: Record<string, unknown>) {
  if (!isTradingDate(String(row.trading_date)) || !validScore(row.market_score) || !['intraday','final'].includes(String(row.snapshot_status))) throw Error('Invalid score snapshot');
  const {data,error} = await db.from('market_score_history').update(row)
    .eq('trading_date',row.trading_date).eq('snapshot_status','intraday').select('trading_date');
  if (error) throw error;
  if (data?.length) return;
  const result = await db.from('market_score_history').upsert(row,{onConflict:'trading_date',ignoreDuplicates:true});
  if (result.error) throw result.error;
}

// Breadth predates snapshot_status. A timestamp at/after the session close is
// conservatively immutable; legacy provenance still requires an owner audit.
export async function writeBreadthSnapshot(db: SupabaseClient, row: Record<string, unknown>, closeTime: string) {
  if (!isTradingDate(String(row.trading_date)) || !validScore(row.breadth_score)) throw Error('Invalid breadth snapshot');
  const {data,error} = await db.from('market_breadth_history').update(row)
    .eq('trading_date',row.trading_date).lt('updated_at',closeTime).select('trading_date');
  if (error) throw error;
  if (data?.length) return;
  const result = await db.from('market_breadth_history').upsert(row,{onConflict:'trading_date',ignoreDuplicates:true});
  if (result.error) throw result.error;
}
