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
    const records = ((data ?? []) as RecordRow[]).map(row => ({ ...row, realizedR: outcome(row) }));
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
        unresolved: records.length - completed.length,
      },
      caveat: "Modelled level-to-level R only; no execution, slippage, or fees. Ambiguous and untriggered records are excluded from trade statistics.",
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Trade Idea journal read failed", error);
    return NextResponse.json({ success: false, error: "Trade Idea journal is temporarily unavailable." }, { status: 503 });
  }
}
