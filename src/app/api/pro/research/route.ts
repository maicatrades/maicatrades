import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const SYMBOLS = ["SPY", "QQQ", "IWM"] as const;
const HORIZONS = [5, 10, 20] as const;
const SCORE_BANDS = [
  "Strong Bearish",
  "Bearish",
  "Mixed",
  "Bullish",
  "Strong Bullish",
] as const;
const BREADTH_BANDS = ["Weak", "Mixed", "Healthy"] as const;
const REQUEST_TIMEOUT_MS = 12_000;

type ScoreRow = {
  trading_date: string;
  market_score: number | string;
  market_label: string | null;
  snapshot_status: string | null;
};
type BreadthRow = {
  trading_date: string;
  breadth_score: number | string;
  breadth_label: string | null;
};
type PricePoint = { date: string; close: number };
type YahooResponse = {
  chart?: {
    result?: Array<{
      timestamp?: number[];
      indicators?: { quote?: Array<{ close?: Array<number | null> }> };
    }>;
  };
};
type Horizon = (typeof HORIZONS)[number];
type Outcome = {
  date: string;
  score: number;
  breadth: number | null;
  returns: Partial<Record<Horizon, number>>;
};
type ConditionRow = {
  date: string;
  score: number;
  breadth: number | null;
  scoreBand: string;
  breadthBand: string;
  state: string;
};

function round(value: number, digits = 2) {
  return Number(value.toFixed(digits));
}
function dateAt(timestamp: number) {
  return new Date(timestamp * 1000).toISOString().slice(0, 10);
}
function scoreBand(score: number) {
  if (score < 35) return "Strong Bearish";
  if (score < 50) return "Bearish";
  if (score < 65) return "Mixed";
  if (score < 80) return "Bullish";
  return "Strong Bullish";
}
function breadthBand(score: number | null) {
  if (score == null) return "Unavailable";
  // Align Pro with the public dashboard's canonical composite Breadth Score.
  // The dashboard's Very Weak and Weak states collapse into Weak here.
  if (score < 50) return "Weak";
  if (score < 65) return "Mixed";
  return "Healthy";
}

async function fetchPrices(symbol: string): Promise<PricePoint[]> {
  let lastError: unknown;
  for (const host of ["query1", "query2"]) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const url = `https://${host}.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1y&interval=1d&events=history`;
      const response = await fetch(url, {
        signal: controller.signal,
        headers: { Accept: "application/json", "User-Agent": "Mozilla/5.0" },
        next: { revalidate: 3600 },
      });
      if (!response.ok) throw new Error(`Yahoo ${response.status}`);
      const payload = (await response.json()) as YahooResponse;
      const result = payload.chart?.result?.[0];
      const timestamps = result?.timestamp ?? [];
      const closes = result?.indicators?.quote?.[0]?.close ?? [];
      const points = timestamps
        .map((timestamp, index) => ({
          date: dateAt(timestamp),
          close: Number(closes[index]),
        }))
        .filter((point) => Number.isFinite(point.close) && point.close > 0);
      if (points.length > 20) return points;
      throw new Error("Insufficient Yahoo history");
    } catch (error) {
      lastError = error;
    } finally {
      clearTimeout(timeout);
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error(`Unable to load ${symbol}`);
}

function buildOutcomes(
  rows: ScoreRow[],
  breadthByDate: Map<string, BreadthRow>,
  prices: PricePoint[],
): Outcome[] {
  const indexByDate = new Map(
    prices.map((point, index) => [point.date, index]),
  );
  return rows.flatMap((row) => {
    const startIndex = indexByDate.get(row.trading_date);
    const score = Number(row.market_score);
    if (startIndex == null || !Number.isFinite(score)) return [];
    const start = prices[startIndex]?.close;
    if (!start) return [];
    const returns: Partial<Record<Horizon, number>> = {};
    for (const horizon of HORIZONS) {
      const finish = prices[startIndex + horizon]?.close;
      if (finish) returns[horizon] = round(((finish - start) / start) * 100);
    }
    const breadthValue = Number(
      breadthByDate.get(row.trading_date)?.breadth_score,
    );
    return [
      {
        date: row.trading_date,
        score,
        breadth: Number.isFinite(breadthValue) ? breadthValue : null,
        returns,
      },
    ];
  });
}

function summarize(outcomes: Outcome[]) {
  return Object.fromEntries(
    HORIZONS.map((horizon) => {
      const values = outcomes
        .map((item) => item.returns[horizon])
        .filter(
          (value): value is number =>
            typeof value === "number" && Number.isFinite(value),
        );
      const wins = values.filter((value) => value > 0).length;
      return [
        horizon,
        {
          averageReturn: values.length
            ? round(
                values.reduce((sum, value) => sum + value, 0) / values.length,
              )
            : null,
          winRate: values.length
            ? round((wins / values.length) * 100, 1)
            : null,
          sampleSize: values.length,
        },
      ];
    }),
  );
}

function buildConditionRows(
  rows: ScoreRow[],
  breadthByDate: Map<string, BreadthRow>,
): ConditionRow[] {
  return rows.flatMap((row) => {
    const score = Number(row.market_score);
    const breadthValue = Number(
      breadthByDate.get(row.trading_date)?.breadth_score,
    );
    if (!Number.isFinite(score)) return [];
    const breadth = Number.isFinite(breadthValue) ? breadthValue : null;
    const scoreLabel = scoreBand(score);
    const breadthLabel = breadthBand(breadth);
    return [
      {
        date: row.trading_date,
        score,
        breadth,
        scoreBand: scoreLabel,
        breadthBand: breadthLabel,
        state: `${scoreLabel}|${breadthLabel}`,
      },
    ];
  });
}

function buildEpisodes(rows: ConditionRow[]): ConditionRow[] {
  return rows.filter(
    (row, index) => index === 0 || row.state !== rows[index - 1]?.state,
  );
}

function posture(scoreLabel: string, breadthLabel: string) {
  if (scoreLabel === "Strong Bearish" || breadthLabel === "Weak")
    return {
      label: "Defensive",
      description:
        "Reduce aggression, protect capital, and require stronger confirmation before adding long exposure.",
    };
  if (scoreLabel === "Bearish" || breadthLabel === "Mixed")
    return {
      label: "Reduced",
      description: "Use smaller exposure and favor only the clearest setups.",
    };
  if (
    (scoreLabel === "Bullish" || scoreLabel === "Strong Bullish") &&
    breadthLabel === "Healthy"
  )
    return {
      label: "Constructive",
      description:
        "Conditions support normal swing exposure while individual setups still control entries and risk.",
    };
  return {
    label: "Selective",
    description:
      "Conditions conflict. Keep exposure measured until score and breadth confirm each other.",
  };
}

function transitionTracker(rows: ConditionRow[]) {
  const current = rows.at(-1) ?? null;
  const previous = rows.at(-2) ?? null;
  const fiveSessionsAgo = rows.at(-6) ?? rows[0] ?? null;
  if (!current) return null;

  let consecutiveSessions = 1;
  for (let index = rows.length - 2; index >= 0; index -= 1) {
    if (rows[index]?.state !== current.state) break;
    consecutiveSessions += 1;
  }

  const scoreChange1D = previous
    ? round(current.score - previous.score, 1)
    : null;
  const breadthChange1D =
    previous && current.breadth != null && previous.breadth != null
      ? round(current.breadth - previous.breadth, 1)
      : null;
  const scoreChange5D = fiveSessionsAgo
    ? round(current.score - fiveSessionsAgo.score, 1)
    : null;
  const breadthChange5D =
    fiveSessionsAgo &&
    current.breadth != null &&
    fiveSessionsAgo.breadth != null
      ? round(current.breadth - fiveSessionsAgo.breadth, 1)
      : null;

  const scoreDirection =
    scoreChange5D == null || Math.abs(scoreChange5D) < 2
      ? 0
      : Math.sign(scoreChange5D);
  const breadthDirection =
    breadthChange5D == null || Math.abs(breadthChange5D) < 2
      ? 0
      : Math.sign(breadthChange5D);
  const direction =
    scoreDirection < 0 && breadthDirection < 0
      ? "Deteriorating"
      : scoreDirection > 0 && breadthDirection > 0
        ? "Improving"
        : scoreDirection === 0 && breadthDirection === 0
          ? "Stable"
          : "Diverging";
  const currentPosture = posture(current.scoreBand, current.breadthBand).label;
  const confirmation =
    consecutiveSessions >= 3 && currentPosture === "Defensive"
      ? "Confirmed risk-off"
      : consecutiveSessions >= 3 && currentPosture === "Constructive"
        ? "Confirmed risk-on"
        : consecutiveSessions >= 3
          ? "Persistent but mixed"
          : "Early transition";
  const action =
    currentPosture === "Defensive"
      ? "Preserve capital"
      : currentPosture === "Reduced"
        ? "Reduce exposure"
        : currentPosture === "Constructive"
          ? "Normal exposure"
          : direction === "Improving"
            ? "Begin adding selectively"
            : "Maintain selective exposure";

  return {
    direction,
    confirmation,
    action,
    consecutiveSessions,
    changes: {
      score1D: scoreChange1D,
      breadth1D: breadthChange1D,
      score5D: scoreChange5D,
      breadth5D: breadthChange5D,
    },
    fiveSessionsAgo,
    recent: rows
      .slice(-10)
      .map((row) => ({
        date: row.date,
        score: row.score,
        breadth: row.breadth,
        scoreBand: row.scoreBand,
        breadthBand: row.breadthBand,
        state: row.state,
      })),
  };
}

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required." },
        { status: 401, headers: { "Cache-Control": "no-store" } },
      );
    }

    const [
      { data: scoreRows, error: scoreError },
      { data: breadthRows, error: breadthError },
      priceResults,
    ] = await Promise.all([
      supabaseAdmin
        .from("market_score_history")
        .select("trading_date, market_score, market_label, snapshot_status")
        .order("trading_date", { ascending: true })
        .limit(250),
      supabaseAdmin
        .from("market_breadth_history")
        .select("trading_date, breadth_score, breadth_label")
        .order("trading_date", { ascending: true })
        .limit(250),
      Promise.all(
        SYMBOLS.map(
          async (symbol) => [symbol, await fetchPrices(symbol)] as const,
        ),
      ),
    ]);
    if (scoreError) throw scoreError;
    if (breadthError) throw breadthError;
    const scores = (scoreRows ?? []) as ScoreRow[];
    const breadth = (breadthRows ?? []) as BreadthRow[];
    const breadthByDate = new Map(
      breadth.map((row) => [row.trading_date, row]),
    );
    const conditionRows = buildConditionRows(scores, breadthByDate);
    const episodes = buildEpisodes(conditionRows);
    const latest = scores[scores.length - 1] ?? null;
    const latestScore = latest ? Number(latest.market_score) : null;
    const latestBreadthValue = latest
      ? Number(breadthByDate.get(latest.trading_date)?.breadth_score)
      : null;
    const currentScoreBand =
      latestScore != null && Number.isFinite(latestScore)
        ? scoreBand(latestScore)
        : "Unavailable";
    const currentBreadthBand = Number.isFinite(latestBreadthValue)
      ? breadthBand(latestBreadthValue)
      : "Unavailable";
    const tickers = Object.fromEntries(
      priceResults.map(([symbol, prices]) => {
        const outcomes = buildOutcomes(scores, breadthByDate, prices);
        const comparable = outcomes.filter(
          (item) =>
            scoreBand(item.score) === currentScoreBand &&
            breadthBand(item.breadth) === currentBreadthBand,
        );
        const sameScoreBand = outcomes.filter(
          (item) => scoreBand(item.score) === currentScoreBand,
        );
        const episodeDates = new Set(
          episodes
            .filter(
              (episode) =>
                episode.scoreBand === currentScoreBand &&
                episode.breadthBand === currentBreadthBand,
            )
            .map((episode) => episode.date),
        );
        const episodeMatches = outcomes.filter((item) =>
          episodeDates.has(item.date),
        );
        return [
          symbol,
          {
            allHistory: summarize(outcomes),
            scoreBandOnly: summarize(sameScoreBand),
            currentConditions: summarize(comparable),
            currentEpisodes: summarize(episodeMatches),
          },
        ];
      }),
    );
    const spyPrices =
      priceResults.find(([symbol]) => symbol === "SPY")?.[1] ?? [];
    const spyOutcomes = buildOutcomes(scores, breadthByDate, spyPrices);
    const conditionMatrix = {
      scoreBands: Object.fromEntries(
        SCORE_BANDS.map((band) => [
          band,
          summarize(
            spyOutcomes.filter((item) => scoreBand(item.score) === band),
          ),
        ]),
      ),
      breadthBands: Object.fromEntries(
        BREADTH_BANDS.map((band) => [
          band,
          summarize(
            spyOutcomes.filter((item) => breadthBand(item.breadth) === band),
          ),
        ]),
      ),
      benchmark: "SPY",
    };
    const previousCondition =
      conditionRows.length > 1 ? conditionRows[conditionRows.length - 2] : null;
    const currentCondition = conditionRows[conditionRows.length - 1] ?? null;
    const episodeFiveDaySamples =
      tickers.SPY?.currentEpisodes?.[5]?.sampleSize ?? 0;
    const confidence =
      episodeFiveDaySamples >= 30
        ? "High"
        : episodeFiveDaySamples >= 10
          ? "Moderate"
          : episodeFiveDaySamples > 0
            ? "Very Low"
            : "Unavailable";
    return NextResponse.json(
      {
        success: true,
        methodology:
          "Close-to-close forward returns using the next 5, 10, and 20 available trading sessions. Incomplete horizons are excluded.",
        history: {
          recordCount: scores.length,
          breadthRecordCount: breadth.length,
          firstDate: scores[0]?.trading_date ?? null,
          lastDate: latest?.trading_date ?? null,
        },
        currentConditions: {
          scoreBand: currentScoreBand,
          breadthBand: currentBreadthBand,
          score: latestScore,
          breadth: Number.isFinite(latestBreadthValue)
            ? latestBreadthValue
            : null,
        },
        tickers,
        conditionMatrix,
        outlook: {
          current: currentCondition,
          previous: previousCondition,
          changed: Boolean(
            currentCondition &&
            previousCondition &&
            currentCondition.state !== previousCondition.state,
          ),
          posture: posture(currentScoreBand, currentBreadthBand),
          confidence,
          episodeCount: episodes.filter(
            (episode) =>
              episode.scoreBand === currentScoreBand &&
              episode.breadthBand === currentBreadthBand,
          ).length,
          methodology:
            "Episode samples begin only when the combined Market Score and breadth state changes. Consecutive days in one state count as one episode.",
        },
        transition: transitionTracker(conditionRows),
        updatedAt: new Date().toISOString(),
      },
      { headers: { "Cache-Control": "private, no-store, max-age=0" } },
    );
  } catch (error) {
    console.error("Pro research route error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to build research study.",
      },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
