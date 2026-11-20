import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type RecordRow = {
  id: string; week_key: string; symbol: string; direction: "LONG" | "SHORT";
  status: string; entry_price: number | string; stop_price: number | string;
  target_price: number | string; risk_reward: number | string | null;
  confidence_score: number | null; grade: string | null; locked_at: string;
  entry_triggered_at: string | null; target_hit_at: string | null;
  stopped_out_at: string | null; expired_at: string | null;
  needs_review_at: string | null; outcome_note: string | null;
  last_checked_at: string | null;
};
function outcome(row: RecordRow) {
  const entry = Number(row.entry_price), stop = Number(row.stop_price), target = Number(row.target_price);
  const valid = [entry, stop, target].every(Number.isFinite) && entry > 0 && stop > 0 && target > 0 &&
    (row.direction === "LONG" ? stop < entry && entry < target : target < entry && entry < stop);
  if (!valid || !row.entry_triggered_at) return null;
  if (row.status === "STOPPED_OUT" && row.stopped_out_at) return -1;
  if (row.status === "TARGET_HIT" && row.target_hit_at) return Math.round((Math.abs(target - entry) / Math.abs(entry - stop)) * 1000) / 1000;
  return null;
}
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin.from("trade_ideas_weekly")
      .select("id,week_key,symbol,direction,status,entry_price,stop_price,target_price,risk_reward,confidence_score,grade,locked_at,entry_triggered_at,target_hit_at,stopped_out_at,expired_at,needs_review_at,outcome_note,last_checked_at")
      .order("week_key", { ascending: false }).limit(500);
    if (error) throw error;
    const records = ((data ?? []) as RecordRow[]).map(row => {
      const preEntryInvalidation = row.status === "STOPPED_OUT" && !row.entry_triggered_at &&
        (row.outcome_note ?? "").toLowerCase().includes("invalidation");
      const missingEntry = ["STOPPED_OUT", "TARGET_HIT"].includes(row.status) && !row.entry_triggered_at;
      const staleActive = row.status === "ACTIVE" && (!row.last_checked_at ||
        !Number.isFinite(Date.parse(row.last_checked_at)) ||
        Date.now() - Date.parse(row.last_checked_at) > 48 * 60 * 60 * 1000);
      // A daily OHLC candle is timestamped at its session boundary, not at
      // the precise moment a level was touched. Never count a terminal outcome
      // when its recorded entry predates publication without review.
      const entryBeforePublication = !!row.entry_triggered_at &&
        Number.isFinite(Date.parse(row.entry_triggered_at)) &&
        Number.isFinite(Date.parse(row.locked_at)) &&
        Date.parse(row.entry_triggered_at) < Date.parse(row.locked_at);
      const sameSessionAmbiguity = !!row.entry_triggered_at &&
        row.entry_triggered_at.slice(0, 10) === row.locked_at.slice(0, 10) &&
        row.status !== "WAITING_FOR_ENTRY";
      const inconsistentOrder = !!row.entry_triggered_at && (
        (!!row.stopped_out_at && new Date(row.stopped_out_at) < new Date(row.entry_triggered_at)) ||
        (!!row.target_hit_at && new Date(row.target_hit_at) < new Date(row.entry_triggered_at))
      );
      const auditFlag = preEntryInvalidation ? "PRE_ENTRY_INVALIDATION" :
        missingEntry ? "MISSING_ENTRY" : inconsistentOrder ? "EVENT_ORDER" :
        entryBeforePublication ? "ENTRY_BEFORE_PUBLICATION" :
        sameSessionAmbiguity ? "SAME_DAY_ENTRY_UNVERIFIED" :
        staleActive ? "STALE_ACTIVE" : null;
      return { ...row, auditFlag, realizedR: auditFlag ? null : outcome(row) };
    });
    const completed = records.filter(row => row.realizedR !== null);
    const wins = completed.filter(row => (row.realizedR ?? 0) > 0);
    const losses = completed.filter(row => (row.realizedR ?? 0) < 0);
    const grossWinR = wins.reduce((sum, row) => sum + (row.realizedR ?? 0), 0);
    const grossLossR = -losses.reduce((sum, row) => sum + (row.realizedR ?? 0), 0);
    return NextResponse.json({
      success: true, records, metrics: {
        totalIdeas: records.length, resolvedTrades: completed.length,
        wins: wins.length, losses: losses.length,
        winRate: completed.length ? wins.length / completed.length : null,
        averageR: completed.length ? (grossWinR - grossLossR) / completed.length : null,
        profitFactor: grossLossR ? grossWinR / grossLossR : null,
        unresolved: records.length - completed.length, flagged: records.filter(row => row.auditFlag).length,
      },
      caveat: "Modelled level-to-level R only; no execution, slippage, or fees. Ambiguous, untriggered, and flagged records are excluded from trade statistics. Flags are read-only and do not modify stored history.",
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Trade Idea journal read failed", error);
    return NextResponse.json({ success: false, error: "Trade Idea journal is temporarily unavailable." }, { status: 503 });
  }
}
