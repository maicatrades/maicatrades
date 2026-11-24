import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { replayTradeIdea, type ReplayBar } from "@/lib/trade-idea/replay";

export const dynamic = "force-dynamic";

type SavedIdea = {
  id: string; week_key: string; symbol: string; direction: "LONG" | "SHORT";
  status: string; locked_at: string; entry_price: number | string;
  stop_price: number | string; target_price: number | string;
};
type YahooResult = {
  chart?: {
    result?: Array<{
      timestamp?: number[];
      indicators?: { quote?: Array<{
        open?: Array<number | null>; high?: Array<number | null>;
        low?: Array<number | null>; close?: Array<number | null>;
      }> };
    }>;
    error?: { description?: string } | null;
  };
};

async function getBars(symbol: string): Promise<ReplayBar[]> {
  if (!/^[A-Z0-9.^-]{1,20}$/.test(symbol)) throw Error("Unsupported symbol");
  let lastError: unknown = null;
  for (const host of ["query1", "query2"] as const) {
    try {
      const url = `https://${host}.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=2y&includePrePost=false`;
      const response = await fetch(url, {
        signal: AbortSignal.timeout(12000),
        headers: { Accept: "application/json", "User-Agent": "Mozilla/5.0" },
        next: { revalidate: 900 },
      });
      if (!response.ok) throw Error(`Price provider HTTP ${response.status}`);
      const payload = await response.json() as YahooResult;
      if (payload.chart?.error) throw Error(payload.chart.error.description ?? "Provider error");
      const chart = payload.chart?.result?.[0];
      const quote = chart?.indicators?.quote?.[0];
      if (!chart?.timestamp?.length || !quote) throw Error("No historical candles");
      return chart.timestamp.flatMap((timestamp, index) => {
        const open = quote.open?.[index], high = quote.high?.[index];
        const low = quote.low?.[index], close = quote.close?.[index];
        return [open, high, low, close].every(v => typeof v === "number" && Number.isFinite(v))
          ? [{ timestamp, open: open as number, high: high as number,
            low: low as number, close: close as number }] : [];
      });
    } catch (error) {
      lastError = error;
    }
  }
  throw Error(lastError instanceof Error ? lastError.message : "Historical candles unavailable");
}

export async function GET() {
  try {
    // Read-only endpoint. It never updates journal rows, even if replay differs.
    const { data, error } = await supabaseAdmin.from("trade_ideas_weekly")
      .select("id,week_key,symbol,direction,status,locked_at,entry_price,stop_price,target_price")
      .order("week_key", { ascending: false }).limit(100);
    if (error) throw error;
    const ideas = (data ?? []) as SavedIdea[];
    const symbols = [...new Set(ideas.map(row => row.symbol))];
    const barsBySymbol = new Map<string, ReplayBar[]>();
    const failures = new Map<string, string>();
    // Sequential requests avoid provider bursts; failures remain visible per idea.
    for (const symbol of symbols) {
      try { barsBySymbol.set(symbol, await getBars(symbol)); }
      catch (reason) { failures.set(symbol, reason instanceof Error ? reason.message : String(reason)); }
    }
    const records = ideas.map(row => {
      const bars = barsBySymbol.get(row.symbol);
      const replay = bars ? replayTradeIdea({
        direction: row.direction,
        entry: Number(row.entry_price), stop: Number(row.stop_price),
        target: Number(row.target_price), lockedAt: row.locked_at,
      }, bars) : {
        status: "INSUFFICIENT_DATA" as const, entrySession: null,
        outcomeSession: null, reviewedBars: 0, requiresIntradayConfirmation: false,
        reason: failures.get(row.symbol) ?? "Historical prices unavailable",
      };
      const mismatch = replay.status !== "INSUFFICIENT_DATA" &&
        replay.status !== "NEEDS_REVIEW" &&
        replay.status !== row.status &&
        !(replay.status === "PRE_ENTRY_INVALIDATION" && row.status === "EXPIRED");
      return { id: row.id, weekKey: row.week_key, symbol: row.symbol,
        recordedStatus: row.status, replay, mismatch };
    });
    return NextResponse.json({
      success: true, checked: records.length, mismatches: records.filter(row => row.mismatch).length,
      needsReview: records.filter(row => row.replay.status === "NEEDS_REVIEW").length,
      unavailable: records.filter(row => row.replay.status === "INSUFFICIENT_DATA").length,
      records,
      caveat: "Read-only daily-candle reconstruction, not execution verification. Publication-day and same-candle uncertainty require intraday evidence. No records have been modified.",
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Trade Idea replay audit failed", error);
    return NextResponse.json({ success: false, error: "Historical replay audit unavailable." }, { status: 503 });
  }
}
