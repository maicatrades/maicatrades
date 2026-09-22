import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const STOCK_UNIVERSE = [
  { symbol: "AAPL", companyName: "Apple Inc.", sectorSymbol: "XLK" },
  { symbol: "AMD", companyName: "Advanced Micro Devices, Inc.", sectorSymbol: "SMH" },
  { symbol: "AMZN", companyName: "Amazon.com, Inc.", sectorSymbol: "XLY" },
  { symbol: "ABBV", companyName: "AbbVie Inc.", sectorSymbol: "XLV" },
  { symbol: "AMT", companyName: "American Tower Corporation", sectorSymbol: "XLRE" },
  { symbol: "AVGO", companyName: "Broadcom Inc.", sectorSymbol: "SMH" },
  { symbol: "BA", companyName: "The Boeing Company", sectorSymbol: "XLI" },
  { symbol: "BAC", companyName: "Bank of America Corporation", sectorSymbol: "XLF" },
  { symbol: "BKNG", companyName: "Booking Holdings Inc.", sectorSymbol: "XLY" },
  { symbol: "CAT", companyName: "Caterpillar Inc.", sectorSymbol: "XLI" },
  { symbol: "CEG", companyName: "Constellation Energy Corporation", sectorSymbol: "XLU" },
  { symbol: "COIN", companyName: "Coinbase Global, Inc.", sectorSymbol: "XLF" },
  { symbol: "COP", companyName: "ConocoPhillips", sectorSymbol: "XLE" },
  { symbol: "COST", companyName: "Costco Wholesale Corporation", sectorSymbol: "XLP" },
  { symbol: "CRM", companyName: "Salesforce, Inc.", sectorSymbol: "XLK" },
  { symbol: "CVX", companyName: "Chevron Corporation", sectorSymbol: "XLE" },
  { symbol: "DIS", companyName: "The Walt Disney Company", sectorSymbol: "XLC" },
  { symbol: "FCX", companyName: "Freeport-McMoRan Inc.", sectorSymbol: "XLB" },
  { symbol: "GE", companyName: "GE Aerospace", sectorSymbol: "XLI" },
  { symbol: "GOOGL", companyName: "Alphabet Inc.", sectorSymbol: "XLC" },
  { symbol: "GS", companyName: "The Goldman Sachs Group, Inc.", sectorSymbol: "XLF" },
  { symbol: "HD", companyName: "The Home Depot, Inc.", sectorSymbol: "XLY" },
  { symbol: "JPM", companyName: "JPMorgan Chase & Co.", sectorSymbol: "XLF" },
  { symbol: "LLY", companyName: "Eli Lilly and Company", sectorSymbol: "XLV" },
  { symbol: "LOW", companyName: "Lowe's Companies, Inc.", sectorSymbol: "XLY" },
  { symbol: "META", companyName: "Meta Platforms, Inc.", sectorSymbol: "XLC" },
  { symbol: "MSFT", companyName: "Microsoft Corporation", sectorSymbol: "XLK" },
  { symbol: "MU", companyName: "Micron Technology, Inc.", sectorSymbol: "SMH" },
  { symbol: "NEE", companyName: "NextEra Energy, Inc.", sectorSymbol: "XLU" },
  { symbol: "NEM", companyName: "Newmont Corporation", sectorSymbol: "XLB" },
  { symbol: "NFLX", companyName: "Netflix, Inc.", sectorSymbol: "XLC" },
  { symbol: "NVDA", companyName: "NVIDIA Corporation", sectorSymbol: "SMH" },
  { symbol: "NOW", companyName: "ServiceNow, Inc.", sectorSymbol: "XLK" },
  { symbol: "ORCL", companyName: "Oracle Corporation", sectorSymbol: "XLK" },
  { symbol: "PLTR", companyName: "Palantir Technologies Inc.", sectorSymbol: "XLK" },
  { symbol: "PLD", companyName: "Prologis, Inc.", sectorSymbol: "XLRE" },
  { symbol: "QCOM", companyName: "QUALCOMM Incorporated", sectorSymbol: "SMH" },
  { symbol: "RCL", companyName: "Royal Caribbean Cruises Ltd.", sectorSymbol: "XLY" },
  { symbol: "SMCI", companyName: "Super Micro Computer, Inc.", sectorSymbol: "SMH" },
  { symbol: "SOFI", companyName: "SoFi Technologies, Inc.", sectorSymbol: "XLF" },
  { symbol: "TSLA", companyName: "Tesla, Inc.", sectorSymbol: "XLY" },
  { symbol: "TSM", companyName: "Taiwan Semiconductor Manufacturing Company Limited", sectorSymbol: "SMH" },
  { symbol: "UNH", companyName: "UnitedHealth Group Incorporated", sectorSymbol: "XLV" },
  { symbol: "WMT", companyName: "Walmart Inc.", sectorSymbol: "XLP" },
  { symbol: "XOM", companyName: "Exxon Mobil Corporation", sectorSymbol: "XLE" },
] as const;

const CONTEXT_SYMBOLS = [
  "SPY",
  "QQQ",
  "XLK",
  "SMH",
  "XLY",
  "XLF",
  "XLC",
  "XLV",
  "XLI",
  "XLE",
  "XLP",
  "XLB",
  "XLRE",
  "XLU",
] as const;
const BATCH_SIZE = 5;
const MINIMUM_ACTIONABLE_SCORE = 62;

type Direction = "LONG" | "SHORT";
type MarketRegime = "Bullish" | "Bearish" | "Neutral";

type YahooChartResponse = {
  chart?: {
    result?: Array<{
      timestamp?: number[];
      indicators?: {
        quote?: Array<{
          open?: Array<number | null>;
          close?: Array<number | null>;
          high?: Array<number | null>;
          low?: Array<number | null>;
          volume?: Array<number | null>;
        }>;
      };
    }>;
    error?: { code?: string; description?: string } | null;
  };
};

type PriceRow = {
  timestamp: number;
  open: number;
  close: number;
  high: number;
  low: number;
  volume: number | null;
};

type ChartPoint = {
  date: string;
  close: number;
  sma20: number | null;
};

type MarketSeries = {
  symbol: string;
  rows: PriceRow[];
  closes: number[];
  sma20Series: Array<number | null>;
  sma160Series: Array<number | null>;
  sma20: number | null;
  sma160: number | null;
  sma20SlopePercent: number;
  sma160SlopePercent: number;
  rsi14: number | null;
  atr14: number | null;
  averageRange126: number | null;
  averageRangePercent126: number | null;
  price: number;
  previousClose: number;
  change: number;
  changePercent: number;
  return20: number;
};

type ScoreBreakdown = {
  trend: number;
  marketDirection: number;
  priceAction: number;
  sectorStrength: number;
  distanceToLevel: number;
  riskReward: number;
  relativeStrength: number;
  earningsNews: number;
  momentum: number;
  total: number;
  availableMaximum: number;
};

type EntryFramework = "PULLBACK_CONFIRMATION" | "BREAKOUT";

type EntryStructure = {
  framework: EntryFramework;
  triggerPrice: number;
  confirmationRow: PriceRow | null;
  pullbackLow: number | null;
  pullbackHigh: number | null;
};

type TradeLevels = {
  entry: number;
  stopLoss: number;
  target: number;
  riskReward: number;
  stopDistancePercent: number;
  targetDistancePercent: number;
};

type QualificationFailure = {
  code: string;
  label: string;
  detail: string;
};

type WeeklyTradeStatus =
  | "WAITING_FOR_ENTRY"
  | "ACTIVE"
  | "TARGET_HIT"
  | "STOPPED_OUT"
  | "EXPIRED"
  | "NEEDS_REVIEW";

type WeeklyTradeRow = {
  id: string;
  week_key: string;
  symbol: string;
  direction: Direction;
  status: WeeklyTradeStatus;
  entry_price: number | string;
  stop_price: number | string;
  target_price: number | string;
  idea_snapshot: TradeIdea;
  market_context: Record<string, unknown> | null;
  locked_at: string;
  entry_triggered_at: string | null;
  target_hit_at: string | null;
  stopped_out_at: string | null;
  expired_at: string | null;
  needs_review_at: string | null;
  outcome_note: string | null;
  last_checked_at: string | null;
};

type TradeIdea = {
  symbol: string;
  companyName: string;
  sectorSymbol: string;
  direction: Direction;
  price: number;
  selectedPrice?: number;
  previousClose: number;
  change: number;
  changePercent: number;
  setup: string;
  setupType: string;
  holdingPeriod: string;
  entry: number;
  stopLoss: number;
  target: number;
  riskReward: number;
  confidenceScore: number;
  confidenceStars: number;
  grade: string;
  tradeBias: string;
  patternDescription: string;
  biasDescription: string;
  whyItMatters: string[];
  managementPlan: string[];
  sma20: number | null;
  sma160: number | null;
  sma20SlopePercent: number;
  sma160SlopePercent: number;
  trendAlignment: string;
  extensionPercent: number | null;
  extensionInAtr: number | null;
  extended: boolean;
  rsi14: number | null;
  atr14: number | null;
  averageRange126: number | null;
  averageRangePercent126: number | null;
  recentHigh: number;
  recentLow: number;
  triggerDistancePercent: number;
  entryFramework?: EntryFramework;
  confirmationDate?: string | null;
  confirmationHigh?: number | null;
  confirmationLow?: number | null;
  structureInvalidation?: number | null;
  relativeStrength20: number;
  sectorRelativeStrength20: number;
  marketDirection: MarketRegime;
  scoreBreakdown: ScoreBreakdown;
  chart: ChartPoint[];
};

function buildSeriesChart(series: MarketSeries): ChartPoint[] {
  return series.rows.slice(-90).map((row, index, slicedRows) => {
    const originalIndex = series.rows.length - slicedRows.length + index;
    const sma = series.sma20Series[originalIndex];

    return {
      date: new Date(row.timestamp * 1000).toISOString().slice(0, 10),
      close: round(row.close),
      sma20: sma === null ? null : round(sma),
    };
  });
}

type FetchOptions = RequestInit & { next?: { revalidate?: number } };

function isValidNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function round(value: number, decimals = 2) {
  return Number(value.toFixed(decimals));
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function formatDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getEasternDateParts(now = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    hourCycle: "h23",
  });

  const parts = Object.fromEntries(
    formatter
      .formatToParts(now)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );

  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    weekday: parts.weekday,
    hour: Number(parts.hour),
  };
}

function getTradingWeekKey(now = new Date()) {
  const eastern = getEasternDateParts(now);
  const localDate = new Date(
    Date.UTC(eastern.year, eastern.month - 1, eastern.day),
  );

  const weekdayNumber: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };

  const weekday = weekdayNumber[eastern.weekday] ?? localDate.getUTCDay();

  if (weekday === 0 && eastern.hour >= 19) {
    localDate.setUTCDate(localDate.getUTCDate() + 1);
    return formatDateKey(localDate);
  }

  const daysSinceMonday = weekday === 0 ? 6 : weekday - 1;
  localDate.setUTCDate(localDate.getUTCDate() - daysSinceMonday);
  return formatDateKey(localDate);
}

function toNumber(value: number | string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function weeklyMetadata(row: WeeklyTradeRow) {
  return {
    locked: true,
    weekKey: row.week_key,
    lockedAt: row.locked_at,
    status: row.status,
    entryTriggeredAt: row.entry_triggered_at,
    targetHitAt: row.target_hit_at,
    stoppedOutAt: row.stopped_out_at,
    expiredAt: row.expired_at,
    needsReviewAt: row.needs_review_at,
    outcomeNote: row.outcome_note,
    lastCheckedAt: row.last_checked_at,
  };
}

function calculateSmaSeries(values: number[], period: number) {
  const series: Array<number | null> = Array(values.length).fill(null);

  if (values.length < period) {
    return series;
  }

  let rollingSum = values
    .slice(0, period)
    .reduce((sum, value) => sum + value, 0);

  series[period - 1] = rollingSum / period;

  for (let index = period; index < values.length; index += 1) {
    rollingSum += values[index] - values[index - period];
    series[index] = rollingSum / period;
  }

  return series;
}

function calculateSlopePercent(
  series: Array<number | null>,
  lookbackSessions: number,
) {
  const current = series.at(-1) ?? null;
  const pastIndex = series.length - 1 - lookbackSessions;
  const past = pastIndex >= 0 ? series[pastIndex] : null;

  if (current === null || past === null || past === 0) {
    return 0;
  }

  return ((current - past) / past) * 100;
}

function classifySlope(slopePercent: number) {
  if (slopePercent >= 1) return "Strongly Rising";
  if (slopePercent >= 0.2) return "Rising";
  if (slopePercent > -0.2) return "Flat";
  if (slopePercent > -1) return "Falling";
  return "Strongly Falling";
}

function calculateRsi(values: number[], period = 14) {
  if (values.length <= period) return null;

  const changes = values
    .slice(1)
    .map((value, index) => value - values[index]);

  let averageGain =
    changes
      .slice(0, period)
      .reduce((sum, change) => sum + Math.max(change, 0), 0) /
    period;

  let averageLoss =
    changes
      .slice(0, period)
      .reduce((sum, change) => sum + Math.max(-change, 0), 0) /
    period;

  for (const change of changes.slice(period)) {
    averageGain =
      (averageGain * (period - 1) + Math.max(change, 0)) / period;
    averageLoss =
      (averageLoss * (period - 1) + Math.max(-change, 0)) / period;
  }

  if (averageLoss === 0) return 100;
  return 100 - 100 / (1 + averageGain / averageLoss);
}

function calculateAtr(rows: PriceRow[], period = 14) {
  if (rows.length <= period) return null;
  const ranges: number[] = [];
  for (let index = 1; index < rows.length; index += 1) {
    const current = rows[index];
    const previousClose = rows[index - 1].close;
    ranges.push(
      Math.max(
        current.high - current.low,
        Math.abs(current.high - previousClose),
        Math.abs(current.low - previousClose),
      ),
    );
  }
  const recent = ranges.slice(-period);
  return recent.reduce((sum, value) => sum + value, 0) / recent.length;
}

function calculateAverageRange(rows: PriceRow[], period = 126) {
  if (rows.length <= period) return null;

  const recentRows = rows.slice(-(period + 1));
  const trueRanges = recentRows.slice(1).map((row, index) => {
    const previousClose = recentRows[index].close;

    return Math.max(
      row.high - row.low,
      Math.abs(row.high - previousClose),
      Math.abs(row.low - previousClose),
    );
  });

  return (
    trueRanges.reduce((sum, value) => sum + value, 0) /
    trueRanges.length
  );
}

function calculateReturn(closes: number[], sessions: number) {
  if (closes.length <= sessions) return 0;
  const current = closes.at(-1) ?? 0;
  const starting = closes[closes.length - 1 - sessions];
  return starting === 0 ? 0 : ((current - starting) / starting) * 100;
}

async function fetchWithTimeout(url: string, options: FetchOptions, timeoutMs = 10_000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function requestYahooChart(host: "query1" | "query2", symbol: string) {
  const url =
    `https://${host}.finance.yahoo.com/v8/finance/chart/` +
    `${encodeURIComponent(symbol)}?interval=1d&range=2y&includePrePost=false`;

  const response = await fetchWithTimeout(url, {
    next: { revalidate: 900 },
    headers: {
      Accept: "application/json",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
    },
  });

  if (!response.ok) throw new Error(`Yahoo ${host} returned HTTP ${response.status} for ${symbol}`);
  const data = (await response.json()) as YahooChartResponse;
  if (data.chart?.error) throw new Error(data.chart.error.description ?? `Yahoo error for ${symbol}`);
  if (!data.chart?.result?.[0]) throw new Error(`Yahoo returned no chart data for ${symbol}`);
  return data;
}

async function fetchYahooChart(symbol: string) {
  try {
    return await requestYahooChart("query1", symbol);
  } catch {
    return requestYahooChart("query2", symbol);
  }
}

async function loadMarketSeries(symbol: string): Promise<MarketSeries> {
  const data = await fetchYahooChart(symbol);
  const result = data.chart?.result?.[0];
  const quote = result?.indicators?.quote?.[0];
  const timestamps = result?.timestamp ?? [];
  const opens = quote?.open ?? [];
  const closes = quote?.close ?? [];
  const highs = quote?.high ?? [];
  const lows = quote?.low ?? [];
  const volumes = quote?.volume ?? [];

  const rows = timestamps
    .map((timestamp, index) => {
      const close = closes[index];
      if (!isValidNumber(close)) return null;
      return {
        timestamp,
        open: isValidNumber(opens[index]) ? opens[index] : close,
        close,
        high: isValidNumber(highs[index]) ? highs[index] : close,
        low: isValidNumber(lows[index]) ? lows[index] : close,
        volume: isValidNumber(volumes[index]) ? volumes[index] : null,
      };
    })
    .filter((row): row is PriceRow => row !== null);

  if (rows.length < 175) throw new Error(`Not enough historical data for ${symbol}`);

  const cleanCloses = rows.map((row) => row.close);
  const sma20Series = calculateSmaSeries(cleanCloses, 20);
  const sma160Series = calculateSmaSeries(cleanCloses, 160);
  const price = cleanCloses.at(-1) as number;
  const previousClose = cleanCloses.at(-2) as number;
  const sma20 = sma20Series.at(-1) ?? null;
  const sma160 = sma160Series.at(-1) ?? null;
  const sma20SlopePercent = calculateSlopePercent(sma20Series, 5);
  const sma160SlopePercent = calculateSlopePercent(sma160Series, 10);
  const averageRange126 = calculateAverageRange(rows);

  return {
    symbol,
    rows,
    closes: cleanCloses,
    sma20Series,
    sma160Series,
    sma20,
    sma160,
    sma20SlopePercent,
    sma160SlopePercent,
    rsi14: calculateRsi(cleanCloses),
    atr14: calculateAtr(rows),
    averageRange126,
    averageRangePercent126:
      averageRange126 === null
        ? null
        : (averageRange126 / price) * 100,
    price,
    previousClose,
    change: price - previousClose,
    changePercent: ((price - previousClose) / previousClose) * 100,
    return20: calculateReturn(cleanCloses, 20),
  };
}


function rebuildSeriesFromRows(
  baseSeries: MarketSeries,
  rows: PriceRow[],
): MarketSeries {
  if (rows.length < 175) {
    return baseSeries;
  }

  const cleanCloses = rows.map((row) => row.close);
  const sma20Series = calculateSmaSeries(cleanCloses, 20);
  const sma160Series = calculateSmaSeries(cleanCloses, 160);
  const price = cleanCloses.at(-1) as number;
  const previousClose = cleanCloses.at(-2) as number;
  const sma20 = sma20Series.at(-1) ?? null;
  const sma160 = sma160Series.at(-1) ?? null;
  const averageRange126 = calculateAverageRange(rows);

  return {
    symbol: baseSeries.symbol,
    rows,
    closes: cleanCloses,
    sma20Series,
    sma160Series,
    sma20,
    sma160,
    sma20SlopePercent: calculateSlopePercent(sma20Series, 5),
    sma160SlopePercent: calculateSlopePercent(sma160Series, 10),
    rsi14: calculateRsi(cleanCloses),
    atr14: calculateAtr(rows),
    averageRange126,
    averageRangePercent126:
      averageRange126 === null
        ? null
        : (averageRange126 / price) * 100,
    price,
    previousClose,
    change: price - previousClose,
    changePercent: ((price - previousClose) / previousClose) * 100,
    return20: calculateReturn(cleanCloses, 20),
  };
}

async function getWeeklyTrade(weekKey: string) {
  const { data, error } = await supabaseAdmin
    .from("trade_ideas_weekly")
    .select("*")
    .eq("week_key", weekKey)
    .maybeSingle();

  if (error) {
    throw new Error(`Unable to load weekly Trade Idea: ${error.message}`);
  }

  return (data as WeeklyTradeRow | null) ?? null;
}

async function getPreviousWeeklyTrade(weekKey: string) {
  const { data, error } = await supabaseAdmin
    .from("trade_ideas_weekly")
    .select("*")
    .lt("week_key", weekKey)
    .order("week_key", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Unable to load last week's Trade Idea: ${error.message}`);
  }

  return (data as WeeklyTradeRow | null) ?? null;
}

async function updateWeeklyOutcome(
  weeklyTrade: WeeklyTradeRow,
  series: MarketSeries,
) {
  if (
    ["TARGET_HIT", "STOPPED_OUT", "EXPIRED", "NEEDS_REVIEW"].includes(
      weeklyTrade.status,
    )
  ) {
    return weeklyTrade;
  }

  const lockedAtMs = new Date(weeklyTrade.locked_at).getTime();
  const relevantRows = series.rows.filter(
    (row) => row.timestamp * 1000 >= lockedAtMs,
  );

  const entry = toNumber(weeklyTrade.entry_price);
  const stop = toNumber(weeklyTrade.stop_price);
  const target = toNumber(weeklyTrade.target_price);
  // Rebuild the outcome chronologically from the original lock on every check.
  // Starting from a stored ACTIVE status would let a pre-entry candle trigger
  // the stop when older candles are scanned again.
  let status: WeeklyTradeStatus = "WAITING_FOR_ENTRY";
  let entryTriggeredAt: string | null = null;
  let targetHitAt: string | null = null;
  let stoppedOutAt: string | null = null;
  let expiredAt: string | null = null;
  let needsReviewAt: string | null = null;
  let outcomeNote: string | null = null;

  for (const row of relevantRows) {
    if (["TARGET_HIT", "STOPPED_OUT", "NEEDS_REVIEW"].includes(status)) {
      break;
    }

    const eventTime = new Date(row.timestamp * 1000).toISOString();
    const entryTouched =
      weeklyTrade.direction === "LONG"
        ? row.high >= entry
        : row.low <= entry;
    const targetTouched =
      weeklyTrade.direction === "LONG"
        ? row.high >= target
        : row.low <= target;
    const stopTouched =
      weeklyTrade.direction === "LONG"
        ? row.low <= stop
        : row.high >= stop;

    if (status === "WAITING_FOR_ENTRY") {
      if (!entryTouched) {
        if (stopTouched) {
          // This was never a trade. A pre-entry structural failure invalidates
          // the setup, but it must not be recorded as a stopped-out trade.
          // EXPIRED is used because it is already supported by the database
          // status constraint and keeps stopped_out_at null.
          status = "EXPIRED";
          expiredAt = eventTime;
          outcomeNote =
            "The setup was invalidated before the published entry was confirmed.";
        }

        continue;
      }

      entryTriggeredAt = eventTime;

      if (stopTouched) {
        status = "NEEDS_REVIEW";
        needsReviewAt = eventTime;
        outcomeNote =
          "Entry and stop were both touched within the same daily candle, so the intraday order cannot be verified.";
      } else if (targetTouched) {
        status = "TARGET_HIT";
        targetHitAt = eventTime;
        outcomeNote = "Entry and target were reached without the stop being touched.";
      } else {
        status = "ACTIVE";
        outcomeNote = "The published entry was confirmed.";
      }

      continue;
    }

    if (status === "ACTIVE") {
      if (targetTouched && stopTouched) {
        status = "NEEDS_REVIEW";
        needsReviewAt = eventTime;
        outcomeNote =
          "Target and stop were both touched within the same daily candle, so the intraday order cannot be verified.";
      } else if (targetTouched) {
        status = "TARGET_HIT";
        targetHitAt = eventTime;
        outcomeNote = "The published target was reached.";
      } else if (stopTouched) {
        status = "STOPPED_OUT";
        stoppedOutAt = eventTime;
        outcomeNote = "The published stop was reached.";
      }
    }
  }

  const now = new Date().toISOString();
  const { data, error } = await supabaseAdmin
    .from("trade_ideas_weekly")
    .update({
      status,
      entry_triggered_at: entryTriggeredAt,
      target_hit_at: targetHitAt,
      stopped_out_at: stoppedOutAt,
      expired_at: expiredAt,
      needs_review_at: needsReviewAt,
      outcome_note: outcomeNote,
      last_checked_at: now,
      updated_at: now,
    })
    .eq("id", weeklyTrade.id)
    .select("*")
    .single();

  if (error) {
    throw new Error(`Unable to update weekly Trade Idea: ${error.message}`);
  }

  return data as WeeklyTradeRow;
}

async function refreshPreviousWeeklyTrade(weekKey: string) {
  const previous = await getPreviousWeeklyTrade(weekKey);

  if (!previous) {
    return null;
  }

  let updated = previous;
  let series: MarketSeries | null = null;

  const wasAutomaticallyExpired =
    previous.status === "EXPIRED" &&
    (previous.outcome_note ===
      "The entry was not confirmed before the weekly window ended." ||
      previous.outcome_note ===
        "The trade remained active when the weekly tracking window ended.");

  const entryTime = previous.entry_triggered_at
    ? new Date(previous.entry_triggered_at).getTime()
    : null;
  const stopTime = previous.stopped_out_at
    ? new Date(previous.stopped_out_at).getTime()
    : null;
  const targetTime = previous.target_hit_at
    ? new Date(previous.target_hit_at).getTime()
    : null;
  const hasImpossibleOutcomeOrder =
    entryTime !== null &&
    ((previous.status === "STOPPED_OUT" &&
      stopTime !== null &&
      stopTime < entryTime) ||
      (previous.status === "TARGET_HIT" &&
        targetTime !== null &&
        targetTime < entryTime));

  if (wasAutomaticallyExpired || hasImpossibleOutcomeOrder) {
    const restoredStatus: WeeklyTradeStatus = previous.entry_triggered_at
      ? "ACTIVE"
      : "WAITING_FOR_ENTRY";
    const now = new Date().toISOString();
    const { data, error } = await supabaseAdmin
      .from("trade_ideas_weekly")
      .update({
        status: restoredStatus,
        expired_at: null,
        target_hit_at: null,
        stopped_out_at: null,
        needs_review_at: null,
        outcome_note:
          restoredStatus === "ACTIVE"
            ? "The published entry was confirmed. Tracking continues until the target or stop is reached."
            : "The setup remains open and is still waiting for the published entry.",
        updated_at: now,
      })
      .eq("id", previous.id)
      .select("*")
      .single();

    if (error) {
      throw new Error(`Unable to restore last week's Trade Idea: ${error.message}`);
    }

    updated = data as WeeklyTradeRow;
  }

  if (updated.status === "WAITING_FOR_ENTRY" || updated.status === "ACTIVE") {
    series = await loadMarketSeries(updated.symbol);
    updated = await updateWeeklyOutcome(updated, series);
  }

  if (!series) {
    return {
      idea: updated.idea_snapshot,
      ...weeklyMetadata(updated),
    };
  }

  const snapshot = updated.idea_snapshot;

  return {
    idea: {
      ...snapshot,
      selectedPrice: snapshot.selectedPrice ?? snapshot.price,
      price: round(series.price),
      previousClose: round(series.previousClose),
      change: round(series.change),
      changePercent: round(series.changePercent),
      chart: buildSeriesChart(series),
    },
    ...weeklyMetadata(updated),
  };
}

async function loadSeriesMap(symbols: string[]) {
  const map = new Map<string, MarketSeries>();
  const failures: Array<{ symbol: string; error: string }> = [];

  for (let index = 0; index < symbols.length; index += BATCH_SIZE) {
    const batch = symbols.slice(index, index + BATCH_SIZE);
    const results = await Promise.allSettled(batch.map((symbol) => loadMarketSeries(symbol)));
    results.forEach((result, resultIndex) => {
      const symbol = batch[resultIndex];
      if (result.status === "fulfilled") map.set(symbol, result.value);
      else failures.push({ symbol, error: result.reason instanceof Error ? result.reason.message : String(result.reason) });
    });
  }

  return { map, failures };
}

function seriesRegimeScore(series: MarketSeries) {
  let score = 0;

  if (series.sma20 !== null && series.price > series.sma20) score += 1;
  if (series.sma160 !== null && series.price > series.sma160) score += 1;
  if (
    series.sma20 !== null &&
    series.sma160 !== null &&
    series.sma20 > series.sma160
  ) {
    score += 1;
  }

  if (series.sma20SlopePercent > 0.2) score += 0.5;
  if (series.sma160SlopePercent > 0.2) score += 0.5;

  return score;
}

function getMarketRegime(spy: MarketSeries, qqq: MarketSeries): MarketRegime {
  const combined = seriesRegimeScore(spy) + seriesRegimeScore(qqq);
  if (combined >= 5) return "Bullish";
  if (combined <= 2) return "Bearish";
  return "Neutral";
}

function scoreMarketDirection(direction: Direction, regime: MarketRegime) {
  if (regime === "Neutral") return 10;
  if ((direction === "LONG" && regime === "Bullish") || (direction === "SHORT" && regime === "Bearish")) return 18;
  return 0;
}

function scoreTrend(series: MarketSeries, direction: Direction) {
  let score = 0;

  const above20 = series.sma20 !== null && series.price > series.sma20;
  const above160 = series.sma160 !== null && series.price > series.sma160;
  const bullishAlignment =
    series.sma20 !== null &&
    series.sma160 !== null &&
    series.sma20 > series.sma160;

  if (direction === "LONG") {
    if (above20) score += 5;
    if (above160) score += 5;
    if (bullishAlignment) score += 4;

    if (series.sma20SlopePercent >= 0.2) score += 3;
    else if (series.sma20SlopePercent < -0.2) score -= 6;

    if (series.sma160SlopePercent >= 0.2) score += 5;
    else if (series.sma160SlopePercent < -0.2) score -= 12;

    if (
      series.sma20SlopePercent < -0.2 &&
      series.sma160SlopePercent < -0.2
    ) {
      score -= 8;
    }
  } else {
    if (!above20) score += 5;
    if (!above160) score += 5;
    if (!bullishAlignment) score += 4;

    if (series.sma20SlopePercent <= -0.2) score += 3;
    else if (series.sma20SlopePercent > 0.2) score -= 6;

    if (series.sma160SlopePercent <= -0.2) score += 5;
    else if (series.sma160SlopePercent > 0.2) score -= 12;

    if (
      series.sma20SlopePercent > 0.2 &&
      series.sma160SlopePercent > 0.2
    ) {
      score -= 8;
    }
  }

  return score;
}

function getExtensionMetrics(series: MarketSeries, direction: Direction) {
  if (series.sma20 === null) {
    return {
      extensionPercent: null,
      extensionInAtr: null,
      extended: false,
    };
  }

  const directionalDistance =
    direction === "LONG"
      ? series.price - series.sma20
      : series.sma20 - series.price;

  const extensionPercent =
    (directionalDistance / series.sma20) * 100;

  const extensionInAtr =
    series.atr14 && series.atr14 > 0
      ? directionalDistance / series.atr14
      : null;

  const extended =
    extensionPercent > 8 ||
    (extensionInAtr !== null && extensionInAtr > 2);

  return {
    extensionPercent,
    extensionInAtr,
    extended,
  };
}

function getTrendAlignment(series: MarketSeries, direction: Direction) {
  const shortSlope = classifySlope(series.sma20SlopePercent);
  const longSlope = classifySlope(series.sma160SlopePercent);

  if (direction === "LONG") {
    if (
      series.sma20SlopePercent >= 0.2 &&
      series.sma160SlopePercent >= 0.2
    ) {
      return `Aligned bullish: 20 SMA ${shortSlope.toLowerCase()}, 160 SMA ${longSlope.toLowerCase()}.`;
    }

    if (series.sma160SlopePercent < -0.2) {
      return `Long-term warning: 160 SMA ${longSlope.toLowerCase()}.`;
    }

    return `Mixed alignment: 20 SMA ${shortSlope.toLowerCase()}, 160 SMA ${longSlope.toLowerCase()}.`;
  }

  if (
    series.sma20SlopePercent <= -0.2 &&
    series.sma160SlopePercent <= -0.2
  ) {
    return `Aligned bearish: 20 SMA ${shortSlope.toLowerCase()}, 160 SMA ${longSlope.toLowerCase()}.`;
  }

  if (series.sma160SlopePercent > 0.2) {
    return `Long-term warning: 160 SMA ${longSlope.toLowerCase()}.`;
  }

  return `Mixed alignment: 20 SMA ${shortSlope.toLowerCase()}, 160 SMA ${longSlope.toLowerCase()}.`;
}

function recentLevels(series: MarketSeries) {
  // Exclude the current session so today's move is measured against levels
  // that existed before the session began.
  const twenty = series.rows.slice(-21, -1);
  const ten = series.rows.slice(-11, -1);
  return {
    recentHigh: Math.max(...twenty.map((row) => row.high)),
    recentLow: Math.min(...twenty.map((row) => row.low)),
    swingHigh: Math.max(...ten.map((row) => row.high)),
    swingLow: Math.min(...ten.map((row) => row.low)),
  };
}

function scorePriceAction(series: MarketSeries, direction: Direction, recentHigh: number, recentLow: number) {
  const last = series.rows.at(-1) as PriceRow;
  const prior = series.rows.at(-2) as PriceRow;
  const range = Math.max(0.01, last.high - last.low);
  const closeLocation = (last.close - last.low) / range;
  let score = 0;

  if (direction === "LONG") {
    if (last.close > prior.close) score += 4;
    if (closeLocation >= 0.65) score += 4;
    if (((recentHigh - series.price) / recentHigh) * 100 <= 3) score += 5;
    if (last.high > prior.high && last.low > prior.low) score += 3;
  } else {
    if (last.close < prior.close) score += 4;
    if (closeLocation <= 0.35) score += 4;
    if (((series.price - recentLow) / series.price) * 100 <= 3) score += 5;
    if (last.high < prior.high && last.low < prior.low) score += 3;
  }
  return score;
}

function scoreSectorStrength(direction: Direction, sector: MarketSeries, spy: MarketSeries) {
  const relative = sector.return20 - spy.return20;
  if (direction === "LONG") {
    if (relative >= 3) return 12;
    if (relative >= 1) return 9;
    if (relative >= 0) return 6;
    if (relative >= -2) return 3;
    return 0;
  }
  if (relative <= -3) return 12;
  if (relative <= -1) return 9;
  if (relative <= 0) return 6;
  if (relative <= 2) return 3;
  return 0;
}

function scoreDistanceToTrigger(
  direction: Direction,
  price: number,
  entry: number,
) {
  const distance =
    direction === "LONG"
      ? ((entry - price) / price) * 100
      : ((price - entry) / price) * 100;

  // The setup has already moved too far beyond its planned trigger.
  // Avoid rewarding trades that would require chasing.
  if (distance < -3) return 0;
  if (distance < -1.5) return 2;
  if (distance < -0.5) return 5;

  // Best setups are sitting directly beneath/above the actual planned entry
  // or have only just confirmed through it.
  if (distance <= 1) return 10;
  if (distance <= 2.5) return 8;
  if (distance <= 4.5) return 5;
  if (distance <= 7) return 2;

  return 0;
}

function scoreRiskReward(value: number) {
  if (value >= 2) return 9;
  if (value >= 1.8) return 7;
  if (value >= 1.5) return 4;
  return 0;
}

function scoreRelativeStrength(direction: Direction, stockReturn: number, spyReturn: number, qqqReturn: number) {
  const benchmark = (spyReturn + qqqReturn) / 2;
  const difference = stockReturn - benchmark;
  if (direction === "LONG") {
    if (difference >= 5) return 7;
    if (difference >= 2) return 6;
    if (difference >= 0) return 4;
    if (difference >= -3) return 2;
    return 0;
  }
  if (difference <= -5) return 7;
  if (difference <= -2) return 6;
  if (difference <= 0) return 4;
  if (difference <= 3) return 2;
  return 0;
}

function scoreMomentum(direction: Direction, rsi: number | null) {
  if (rsi === null) return 0;
  if (direction === "LONG") {
    if (rsi >= 50 && rsi <= 65) return 2;
    if (rsi >= 45 && rsi <= 72) return 1;
    return 0;
  }
  if (rsi >= 35 && rsi <= 50) return 2;
  if (rsi >= 28 && rsi <= 55) return 1;
  return 0;
}

function findEntryStructure(
  series: MarketSeries,
  direction: Direction,
  recentHigh: number,
  recentLow: number,
): EntryStructure {
  const atr = series.atr14 ?? series.price * 0.025;
  const bufferPercent = clamp((atr / series.price) * 0.05, 0.0005, 0.0015);

  // We want the latest meaningful pullback/reversal structure, not simply
  // the highest/lowest price of the last 20 sessions. The final row is
  // allowed to be the confirmation candle because weekly ideas lock after
  // Sunday 7 PM ET, when Friday's daily candle is complete.
  const lookback = series.rows.slice(-10);
  const globalOffset = series.rows.length - lookback.length;

  if (direction === "LONG") {
    const candidateIndices: number[] = [];

    for (let index = 1; index < lookback.length; index += 1) {
      const row = lookback[index];
      const prior = lookback[index - 1];
      const range = Math.max(0.01, row.high - row.low);
      const closeLocation = (row.close - row.low) / range;
      const bullishBody = row.close > row.open;
      const improvingClose = row.close > prior.close;
      const reclaimingPrice = row.high >= prior.high || row.close > prior.high;

      if (
        bullishBody &&
        improvingClose &&
        closeLocation >= 0.6 &&
        reclaimingPrice
      ) {
        candidateIndices.push(index);
      }
    }

    for (let scan = candidateIndices.length - 1; scan >= 0; scan -= 1) {
      const confirmationIndex = candidateIndices[scan];
      const confirmation = lookback[confirmationIndex];

      // The pullback must occur before or on the confirmation candle and
      // should contain at least two sessions of structure.
      const pullbackStart = Math.max(0, confirmationIndex - 5);
      const pullbackRows = lookback.slice(
        pullbackStart,
        confirmationIndex + 1,
      );

      if (pullbackRows.length < 2) continue;

      const pullbackLow = Math.min(...pullbackRows.map((row) => row.low));
      const pullbackHigh = Math.max(...pullbackRows.map((row) => row.high));
      const lowIndex = pullbackRows.findIndex((row) => row.low === pullbackLow);
      const lowOccurredBeforeOrOnConfirmation =
        lowIndex >= 0 && lowIndex <= pullbackRows.length - 1;

      const priorHighRows = series.rows.slice(
        Math.max(0, globalOffset + pullbackStart - 8),
        globalOffset + pullbackStart,
      );
      const priorHigh =
        priorHighRows.length > 0
          ? Math.max(...priorHighRows.map((row) => row.high))
          : recentHigh;

      const meaningfulPullback =
        lowOccurredBeforeOrOnConfirmation &&
        priorHigh > 0 &&
        ((priorHigh - pullbackLow) / priorHigh) * 100 >= 1;

      if (!meaningfulPullback) continue;

      return {
        framework: "PULLBACK_CONFIRMATION",
        triggerPrice: confirmation.high * (1 + bufferPercent),
        confirmationRow: confirmation,
        pullbackLow,
        pullbackHigh,
      };
    }

    return {
      framework: "BREAKOUT",
      triggerPrice: recentHigh * (1 + clamp(bufferPercent * 2, 0.001, 0.003)),
      confirmationRow: null,
      pullbackLow: null,
      pullbackHigh: null,
    };
  }

  const candidateIndices: number[] = [];

  for (let index = 1; index < lookback.length; index += 1) {
    const row = lookback[index];
    const prior = lookback[index - 1];
    const range = Math.max(0.01, row.high - row.low);
    const closeLocation = (row.close - row.low) / range;
    const bearishBody = row.close < row.open;
    const weakeningClose = row.close < prior.close;
    const rejectingPrice = row.low <= prior.low || row.close < prior.low;

    if (
      bearishBody &&
      weakeningClose &&
      closeLocation <= 0.4 &&
      rejectingPrice
    ) {
      candidateIndices.push(index);
    }
  }

  for (let scan = candidateIndices.length - 1; scan >= 0; scan -= 1) {
    const confirmationIndex = candidateIndices[scan];
    const confirmation = lookback[confirmationIndex];
    const pullbackStart = Math.max(0, confirmationIndex - 5);
    const pullbackRows = lookback.slice(
      pullbackStart,
      confirmationIndex + 1,
    );

    if (pullbackRows.length < 2) continue;

    const pullbackLow = Math.min(...pullbackRows.map((row) => row.low));
    const pullbackHigh = Math.max(...pullbackRows.map((row) => row.high));

    const priorLowRows = series.rows.slice(
      Math.max(0, globalOffset + pullbackStart - 8),
      globalOffset + pullbackStart,
    );
    const priorLow =
      priorLowRows.length > 0
        ? Math.min(...priorLowRows.map((row) => row.low))
        : recentLow;

    const meaningfulBounce =
      priorLow > 0 &&
      ((pullbackHigh - priorLow) / priorLow) * 100 >= 1;

    if (!meaningfulBounce) continue;

    return {
      framework: "PULLBACK_CONFIRMATION",
      triggerPrice: confirmation.low * (1 - bufferPercent),
      confirmationRow: confirmation,
      pullbackLow,
      pullbackHigh,
    };
  }

  return {
    framework: "BREAKOUT",
    triggerPrice: recentLow * (1 - clamp(bufferPercent * 2, 0.001, 0.003)),
    confirmationRow: null,
    pullbackLow: null,
    pullbackHigh: null,
  };
}

function calculateLevels(
  series: MarketSeries,
  direction: Direction,
  recentHigh: number,
  recentLow: number,
  swingHigh: number,
  swingLow: number,
  structure: EntryStructure,
): TradeLevels {
  const atr = series.atr14 ?? series.price * 0.025;
  const sixMonthAverageRange = series.averageRange126 ?? atr;
  const projectedSwingMove = sixMonthAverageRange * 3;

  if (direction === "LONG") {
    const entry = structure.triggerPrice;

    // Pullback setups use the actual pullback low as the structural
    // invalidation. Breakout setups retain the shorter swing-low framework.
    const structuralLow =
      structure.framework === "PULLBACK_CONFIRMATION" &&
      structure.pullbackLow !== null
        ? structure.pullbackLow
        : swingLow;

    const rawStop = Math.min(
      entry - atr * 0.75,
      structuralLow - atr * 0.1,
    );
    const stopLoss = clamp(rawStop, entry * 0.94, entry * 0.985);
    const risk = Math.max(0.01, entry - stopLoss);
    const target = Math.min(entry + projectedSwingMove, entry * 1.12);

    return {
      entry: round(entry),
      stopLoss: round(stopLoss),
      target: round(target),
      riskReward: round((target - entry) / risk, 2),
      stopDistancePercent: round(((entry - stopLoss) / entry) * 100),
      targetDistancePercent: round(((target - entry) / entry) * 100),
    };
  }

  const entry = structure.triggerPrice;
  const structuralHigh =
    structure.framework === "PULLBACK_CONFIRMATION" &&
    structure.pullbackHigh !== null
      ? structure.pullbackHigh
      : swingHigh;

  const rawStop = Math.max(
    entry + atr * 0.75,
    structuralHigh + atr * 0.1,
  );
  const stopLoss = clamp(rawStop, entry * 1.015, entry * 1.06);
  const risk = Math.max(0.01, stopLoss - entry);
  const target = Math.max(entry - projectedSwingMove, entry * 0.88);

  return {
    entry: round(entry),
    stopLoss: round(stopLoss),
    target: round(target),
    riskReward: round((entry - target) / risk, 2),
    stopDistancePercent: round(((stopLoss - entry) / entry) * 100),
    targetDistancePercent: round(((entry - target) / entry) * 100),
  };
}

function gradeFor(score: number) {
  if (score >= 88) return "A+";
  if (score >= 80) return "A";
  if (score >= 72) return "B+";
  if (score >= 62) return "B";
  if (score >= 52) return "C+";
  return "C";
}

function buildCandidate(
  stock: (typeof STOCK_UNIVERSE)[number],
  series: MarketSeries,
  sector: MarketSeries,
  spy: MarketSeries,
  qqq: MarketSeries,
  regime: MarketRegime,
  direction: Direction,
): TradeIdea {
  const { recentHigh, recentLow, swingHigh, swingLow } = recentLevels(series);
  const structure = findEntryStructure(
    series,
    direction,
    recentHigh,
    recentLow,
  );
  const levels = calculateLevels(
    series,
    direction,
    recentHigh,
    recentLow,
    swingHigh,
    swingLow,
    structure,
  );
  const trend = scoreTrend(series, direction);
  const marketDirection = scoreMarketDirection(direction, regime);
  const priceAction = scorePriceAction(series, direction, recentHigh, recentLow);
  const sectorStrength = scoreSectorStrength(direction, sector, spy);
  const distanceToLevel = scoreDistanceToTrigger(
    direction,
    series.price,
    levels.entry,
  );
  const riskReward = scoreRiskReward(levels.riskReward);
  const relativeStrength = scoreRelativeStrength(direction, series.return20, spy.return20, qqq.return20);
  const momentum = scoreMomentum(direction, series.rsi14);
  const earningsNews = 0;
  const total = trend + marketDirection + priceAction + sectorStrength + distanceToLevel + riskReward + relativeStrength + momentum;
  const benchmarkReturn = (spy.return20 + qqq.return20) / 2;
  const relativeStrength20 = series.return20 - benchmarkReturn;
  const sectorRelativeStrength20 = sector.return20 - spy.return20;
  const triggerDistancePercent = direction === "LONG"
    ? ((levels.entry - series.price) / series.price) * 100
    : ((series.price - levels.entry) / series.price) * 100;
  const extension = getExtensionMetrics(series, direction);
  const trendAlignment = getTrendAlignment(series, direction);
  const lastRow = series.rows.at(-1) as PriceRow;
  const priorRow = series.rows.at(-2) as PriceRow;
  const currentSma20 = series.sma20;
  const priorSma20 = series.sma20Series.at(-2) ?? null;

  let adjustedTotal = total;

  if (extension.extended) {
    adjustedTotal -= 10;
  }

  if (
    direction === "LONG" &&
    series.sma160SlopePercent < -0.2
  ) {
    adjustedTotal -= 8;
  }

  if (
    direction === "SHORT" &&
    series.sma160SlopePercent > 0.2
  ) {
    adjustedTotal -= 8;
  }

  adjustedTotal = Math.max(0, adjustedTotal);

  const confirmedBreakout =
    direction === "LONG"
      ? lastRow.close > recentHigh
      : lastRow.close < recentLow;

  const reclaimed20Sma =
    currentSma20 !== null &&
    priorSma20 !== null &&
    (direction === "LONG"
      ? priorRow.close <= priorSma20 && lastRow.close > currentSma20
      : priorRow.close >= priorSma20 && lastRow.close < currentSma20);

  const setup =
    structure.framework === "PULLBACK_CONFIRMATION"
      ? direction === "LONG"
        ? "Trend Continuation"
        : "Bear Flag Continuation"
      : confirmedBreakout
        ? direction === "LONG"
          ? "Confirmed Breakout"
          : "Confirmed Breakdown"
        : triggerDistancePercent >= 0 && triggerDistancePercent <= 2
          ? direction === "LONG"
            ? "Breakout Watch"
            : "Breakdown Watch"
          : reclaimed20Sma
            ? direction === "LONG"
              ? "Bullish 20 SMA Reclaim"
              : "Bearish 20 SMA Rejection"
            : direction === "LONG"
              ? "Trend Continuation"
              : "Bear Flag Continuation";

  const chart = buildSeriesChart(series);

  const directionalWord =
    structure.framework === "PULLBACK_CONFIRMATION"
      ? direction === "LONG"
        ? "above the confirmation candle high"
        : "below the confirmation candle low"
      : direction === "LONG"
        ? "above resistance"
        : "below support";
  const invalidationWord =
    direction === "LONG" ? "below the pullback structure" : "above the pullback structure";
  const marketAligned =
    (direction === "LONG" && regime === "Bullish") ||
    (direction === "SHORT" && regime === "Bearish");

  return {
    symbol: stock.symbol,
    companyName: stock.companyName,
    sectorSymbol: stock.sectorSymbol,
    direction,
    price: round(series.price),
    previousClose: round(series.previousClose),
    change: round(series.change),
    changePercent: round(series.changePercent),
    setup,
    setupType: `${direction === "LONG" ? "Long" : "Short"} swing trade`,
    holdingPeriod: "3–10 trading days",
    entry: levels.entry,
    stopLoss: levels.stopLoss,
    target: levels.target,
    riskReward: levels.riskReward,
    confidenceScore: adjustedTotal,
    confidenceStars: Math.max(1, Math.min(5, Math.round((adjustedTotal / 96) * 5))),
    grade: gradeFor(adjustedTotal),
    tradeBias: direction === "LONG" ? "Bullish" : "Bearish",
    patternDescription:
      structure.framework === "PULLBACK_CONFIRMATION"
        ? `${stock.symbol} is in a ${direction.toLowerCase()} trend-continuation structure after a pullback. The planned entry is a break ${directionalWord}, rather than a break of the prior 20-session extreme.`
        : `${stock.symbol} has the strongest ${direction.toLowerCase()}-side combination of trend, price action, level proximity, and risk structure found by the current scan. Confirmation ${directionalWord} is still required.`,
    biasDescription: marketAligned
      ? `The ${direction.toLowerCase()} setup is aligned with the current ${regime.toLowerCase()} SPY/QQQ market regime.`
      : `This setup is not fully aligned with the current ${regime.toLowerCase()} market regime, so additional confirmation is required.`,
    whyItMatters: [
      `${stock.symbol} scored ${adjustedTotal} out of 96 available points as a ${direction.toLowerCase()} setup and received a ${gradeFor(adjustedTotal)} grade.`,
      `The trigger is approximately ${round(Math.max(0, triggerDistancePercent), 1)}% away. Its 20-session performance differs from the average of SPY and QQQ by ${round(relativeStrength20, 1)} percentage points.`,
      `${stock.sectorSymbol} differs from SPY by ${round(sectorRelativeStrength20, 1)} percentage points over 20 sessions. The planned stop sits ${levels.stopDistancePercent}% from entry with an initial ${levels.riskReward.toFixed(2)}-to-1 reward-to-risk target.`,
      trendAlignment,
      extension.extended
        ? `Extension warning: price is ${round(extension.extensionPercent ?? 0, 1)}% from the 20 SMA${extension.extensionInAtr !== null ? `, or ${round(extension.extensionInAtr, 1)} ATR` : ""}. Wait for a pullback or tighter consolidation before considering entry.`
        : `Price is not excessively extended from the 20 SMA under the current filter.`,
    ],
    managementPlan: [
      `Wait for a confirmed move ${directionalWord} at ${levels.entry.toFixed(2)} rather than anticipating the trigger.`,
      `Use ${levels.stopLoss.toFixed(2)} as the initial invalidation level ${invalidationWord}, and calculate position size from the defined per-share risk.`,
      `Consider taking partial profits near ${levels.target.toFixed(2)} or reducing risk if price fails to follow through after entry.`,
      extension.extended
        ? "Do not chase the setup while it remains extended. Reassess after price pulls back toward the 20 SMA or forms a new base."
        : "Continue monitoring the 20 SMA and 160 SMA slopes for trend deterioration before entry.",
    ],
    sma20: series.sma20 === null ? null : round(series.sma20),
    sma160: series.sma160 === null ? null : round(series.sma160),
    sma20SlopePercent: round(series.sma20SlopePercent, 3),
    sma160SlopePercent: round(series.sma160SlopePercent, 3),
    trendAlignment,
    extensionPercent:
      extension.extensionPercent === null
        ? null
        : round(extension.extensionPercent, 2),
    extensionInAtr:
      extension.extensionInAtr === null
        ? null
        : round(extension.extensionInAtr, 2),
    extended: extension.extended,
    rsi14: series.rsi14 === null ? null : round(series.rsi14),
    atr14: series.atr14 === null ? null : round(series.atr14),
    averageRange126:
      series.averageRange126 === null
        ? null
        : round(series.averageRange126),
    averageRangePercent126:
      series.averageRangePercent126 === null
        ? null
        : round(series.averageRangePercent126),
    recentHigh: round(recentHigh),
    recentLow: round(recentLow),
    triggerDistancePercent: round(triggerDistancePercent),
    entryFramework: structure.framework,
    confirmationDate: structure.confirmationRow
      ? new Date(structure.confirmationRow.timestamp * 1000)
          .toISOString()
          .slice(0, 10)
      : null,
    confirmationHigh:
      structure.confirmationRow === null
        ? null
        : round(structure.confirmationRow.high),
    confirmationLow:
      structure.confirmationRow === null
        ? null
        : round(structure.confirmationRow.low),
    structureInvalidation:
      direction === "LONG"
        ? structure.pullbackLow === null
          ? round(swingLow)
          : round(structure.pullbackLow)
        : structure.pullbackHigh === null
          ? round(swingHigh)
          : round(structure.pullbackHigh),
    relativeStrength20: round(relativeStrength20),
    sectorRelativeStrength20: round(sectorRelativeStrength20),
    marketDirection: regime,
    scoreBreakdown: {
      trend, marketDirection, priceAction, sectorStrength, distanceToLevel, riskReward,
      relativeStrength, earningsNews, momentum, total: adjustedTotal, availableMaximum: 96,
    },
    chart,
  };
}

function getQualificationFailures(
  idea: TradeIdea,
): QualificationFailure[] {
  const failures: QualificationFailure[] = [];

  const longTrendRejected =
    idea.direction === "LONG" &&
    (
      idea.sma160SlopePercent < -0.2 ||
      (
        idea.sma20SlopePercent < -0.2 &&
        idea.sma160SlopePercent < -0.2
      )
    );

  const shortTrendRejected =
    idea.direction === "SHORT" &&
    (
      idea.sma160SlopePercent > 0.2 ||
      (
        idea.sma20SlopePercent > 0.2 &&
        idea.sma160SlopePercent > 0.2
      )
    );

  const triggerIsReasonablyClose =
    idea.triggerDistancePercent >= -1.5 &&
    idea.triggerDistancePercent <= 6;

  const marketAligned =
    (idea.direction === "LONG" && idea.marketDirection === "Bullish") ||
    (idea.direction === "SHORT" && idea.marketDirection === "Bearish");

  const neutralMarket = idea.marketDirection === "Neutral";

  if (idea.confidenceScore < MINIMUM_ACTIONABLE_SCORE) {
    failures.push({
      code: "score",
      label: "Score Below Minimum",
      detail: `${idea.confidenceScore}/96 is below the required ${MINIMUM_ACTIONABLE_SCORE}/96 scanner score.`,
    });
  }

  if (idea.riskReward < 1.8) {
    failures.push({
      code: "risk_reward",
      label: "Risk/Reward Below Minimum",
      detail: `${idea.riskReward.toFixed(2)}R is below the required 1.80R.`,
    });
  }

  if (idea.scoreBreakdown.trend < 11) {
    failures.push({
      code: "trend",
      label: "Trend Score Below Minimum",
      detail: `${idea.scoreBreakdown.trend} trend points is below the required 11.`,
    });
  }

  if (idea.scoreBreakdown.priceAction < 8) {
    failures.push({
      code: "price_action",
      label: "Price Action Below Minimum",
      detail: `${idea.scoreBreakdown.priceAction} price-action points is below the required 8.`,
    });
  }

  if (!triggerIsReasonablyClose) {
    failures.push({
      code: "trigger_distance",
      label: "Entry Trigger Too Far Away",
      detail: `The planned entry is ${idea.triggerDistancePercent.toFixed(2)}% away; qualified setups must be no more than 6% away.`,
    });
  }

  if (!marketAligned && !neutralMarket) {
    failures.push({
      code: "market_alignment",
      label: "Not Aligned With Market",
      detail: `The ${idea.direction.toLowerCase()} candidate conflicts with the ${idea.marketDirection.toLowerCase()} SPY/QQQ regime.`,
    });
  }

  if (idea.extended) {
    failures.push({
      code: "extension",
      label: "Price Too Extended",
      detail: "Price is more than 8% or 2 ATR from the 20 SMA.",
    });
  }

  if (longTrendRejected || shortTrendRejected) {
    failures.push({
      code: "long_term_trend",
      label: "Long-Term Trend Conflict",
      detail: `The 160 SMA slope conflicts with the proposed ${idea.direction.toLowerCase()} direction.`,
    });
  }

  return failures;
}

function isActionable(idea: TradeIdea) {
  return getQualificationFailures(idea).length === 0;
}

function rankIdeas(ideas: TradeIdea[]) {
  const triggerProximity = (idea: TradeIdea) =>
    Math.abs(idea.triggerDistancePercent);

  const marketAlignmentScore = (idea: TradeIdea) => {
    if (
      idea.direction === "LONG" &&
      idea.marketDirection === "Bullish"
    ) {
      return 2;
    }

    if (
      idea.direction === "SHORT" &&
      idea.marketDirection === "Bearish"
    ) {
      return 2;
    }

    if (idea.marketDirection === "Neutral") {
      return 1;
    }

    return 0;
  };

  return [...ideas].sort((a, b) => {
    return (
      Number(isActionable(b)) - Number(isActionable(a)) ||
      b.confidenceScore - a.confidenceScore ||
      marketAlignmentScore(b) - marketAlignmentScore(a) ||
      b.scoreBreakdown.trend - a.scoreBreakdown.trend ||
      b.scoreBreakdown.priceAction - a.scoreBreakdown.priceAction ||
      b.scoreBreakdown.relativeStrength -
        a.scoreBreakdown.relativeStrength ||
      b.riskReward - a.riskReward ||
      triggerProximity(a) - triggerProximity(b)
    );
  });
}

async function lockWeeklyTrade(
  weekKey: string,
  idea: TradeIdea,
  marketContext: Record<string, unknown>,
) {
  const now = new Date().toISOString();
  const { data, error } = await supabaseAdmin
    .from("trade_ideas_weekly")
    .insert({
      week_key: weekKey,
      symbol: idea.symbol,
      company_name: idea.companyName,
      direction: idea.direction,
      setup: idea.setup,
      status: "WAITING_FOR_ENTRY",
      selected_price: idea.price,
      entry_price: idea.entry,
      stop_price: idea.stopLoss,
      target_price: idea.target,
      risk_reward: idea.riskReward,
      confidence_score: idea.confidenceScore,
      grade: idea.grade,
      market_direction: idea.marketDirection,
      idea_snapshot: idea,
      market_context: marketContext,
      locked_at: now,
      last_checked_at: now,
      created_at: now,
      updated_at: now,
    })
    .select("*")
    .maybeSingle();

  if (error && error.code !== "23505") {
    throw new Error(`Unable to lock weekly Trade Idea: ${error.message}`);
  }

  if (data) {
    return data as WeeklyTradeRow;
  }

  const existing = await getWeeklyTrade(weekKey);
  if (!existing) {
    throw new Error("The weekly Trade Idea could not be locked or reloaded.");
  }

  return existing;
}


async function upgradeLegacyWeeklyEntry(
  weeklyTrade: WeeklyTradeRow,
  liveSeries: MarketSeries,
) {
  const snapshot = weeklyTrade.idea_snapshot;

  // New weekly ideas already carry the structural-entry framework.
  if (snapshot.entryFramework) {
    return weeklyTrade;
  }

  // Never rewrite a trade whose old published entry was actually triggered.
  if (weeklyTrade.entry_triggered_at) {
    return weeklyTrade;
  }

  const legacyPreEntryTerminal =
    weeklyTrade.status === "STOPPED_OUT" &&
    weeklyTrade.entry_triggered_at === null;

  const eligible =
    weeklyTrade.status === "WAITING_FOR_ENTRY" ||
    legacyPreEntryTerminal;

  if (!eligible) {
    return weeklyTrade;
  }

  const lockedAtMs = new Date(weeklyTrade.locked_at).getTime();
  const rowsAtLock = liveSeries.rows.filter(
    (row) => row.timestamp * 1000 < lockedAtMs,
  );

  if (rowsAtLock.length < 175) {
    return weeklyTrade;
  }

  const seriesAtLock = rebuildSeriesFromRows(liveSeries, rowsAtLock);
  const { recentHigh, recentLow, swingHigh, swingLow } =
    recentLevels(seriesAtLock);
  const structure = findEntryStructure(
    seriesAtLock,
    weeklyTrade.direction,
    recentHigh,
    recentLow,
  );

  // If the historical chart did not contain a qualifying pullback
  // confirmation, keep the originally published breakout framework.
  if (structure.framework !== "PULLBACK_CONFIRMATION") {
    return weeklyTrade;
  }

  const levels = calculateLevels(
    seriesAtLock,
    weeklyTrade.direction,
    recentHigh,
    recentLow,
    swingHigh,
    swingLow,
    structure,
  );

  const triggerDistancePercent =
    weeklyTrade.direction === "LONG"
      ? ((levels.entry - seriesAtLock.price) / seriesAtLock.price) * 100
      : ((seriesAtLock.price - levels.entry) / seriesAtLock.price) * 100;

  const oldBreakdown = snapshot.scoreBreakdown;
  const newRiskRewardScore = scoreRiskReward(levels.riskReward);
  const newDistanceScore = scoreDistanceToTrigger(
    weeklyTrade.direction,
    seriesAtLock.price,
    levels.entry,
  );
  const newTotal = Math.max(
    0,
    oldBreakdown.total -
      oldBreakdown.riskReward -
      oldBreakdown.distanceToLevel +
      newRiskRewardScore +
      newDistanceScore,
  );

  const confirmationDate = structure.confirmationRow
    ? new Date(structure.confirmationRow.timestamp * 1000)
        .toISOString()
        .slice(0, 10)
    : null;

  const directionWord =
    weeklyTrade.direction === "LONG"
      ? "above the confirmation candle high"
      : "below the confirmation candle low";
  const invalidationWord =
    weeklyTrade.direction === "LONG"
      ? "below the pullback structure"
      : "above the pullback structure";

  const upgradedSnapshot: TradeIdea = {
    ...snapshot,
    setup:
      weeklyTrade.direction === "LONG"
        ? "Trend Continuation"
        : "Bear Flag Continuation",
    entry: levels.entry,
    stopLoss: levels.stopLoss,
    target: levels.target,
    riskReward: levels.riskReward,
    triggerDistancePercent: round(triggerDistancePercent),
    entryFramework: structure.framework,
    confirmationDate,
    confirmationHigh:
      structure.confirmationRow === null
        ? null
        : round(structure.confirmationRow.high),
    confirmationLow:
      structure.confirmationRow === null
        ? null
        : round(structure.confirmationRow.low),
    structureInvalidation:
      weeklyTrade.direction === "LONG"
        ? structure.pullbackLow === null
          ? round(swingLow)
          : round(structure.pullbackLow)
        : structure.pullbackHigh === null
          ? round(swingHigh)
          : round(structure.pullbackHigh),
    confidenceScore: newTotal,
    confidenceStars: Math.max(
      1,
      Math.min(5, Math.round((newTotal / 96) * 5)),
    ),
    grade: gradeFor(newTotal),
    patternDescription:
      `${snapshot.symbol} is in a ${weeklyTrade.direction.toLowerCase()} trend-continuation structure after a pullback. ` +
      `The planned entry is a break ${directionWord}, rather than a break of the prior 20-session extreme.`,
    whyItMatters: [
      `${snapshot.symbol} scored ${newTotal} out of 96 available points after the structural-entry recalculation and received a ${gradeFor(newTotal)} grade.`,
      `The trigger is approximately ${round(Math.max(0, triggerDistancePercent), 1)}% away from the selection price. The entry is based on the confirmation candle that followed the pullback.`,
      `${snapshot.sectorSymbol} differs from SPY by ${round(snapshot.sectorRelativeStrength20, 1)} percentage points over 20 sessions. The planned stop sits ${levels.stopDistancePercent}% from entry with an initial ${levels.riskReward.toFixed(2)}-to-1 reward-to-risk target.`,
      snapshot.trendAlignment,
      snapshot.extended
        ? `Extension warning: price was ${round(snapshot.extensionPercent ?? 0, 1)}% from the 20 SMA at selection.`
        : "Price was not excessively extended from the 20 SMA under the current filter.",
    ],
    managementPlan: [
      `Wait for a confirmed move ${directionWord} at ${levels.entry.toFixed(2)} rather than anticipating the trigger.`,
      `Use ${levels.stopLoss.toFixed(2)} as the initial invalidation level ${invalidationWord}, and calculate position size from the defined per-share risk.`,
      `Consider taking partial profits near ${levels.target.toFixed(2)} or reducing risk if price fails to follow through after entry.`,
      "Continue monitoring the 20 SMA and 160 SMA slopes for trend deterioration after entry.",
    ],
    scoreBreakdown: {
      ...oldBreakdown,
      distanceToLevel: newDistanceScore,
      riskReward: newRiskRewardScore,
      total: newTotal,
    },
  };

  const now = new Date().toISOString();
  const { data, error } = await supabaseAdmin
    .from("trade_ideas_weekly")
    .update({
      setup: upgradedSnapshot.setup,
      status: "WAITING_FOR_ENTRY",
      entry_price: levels.entry,
      stop_price: levels.stopLoss,
      target_price: levels.target,
      risk_reward: levels.riskReward,
      confidence_score: newTotal,
      grade: upgradedSnapshot.grade,
      idea_snapshot: upgradedSnapshot,
      entry_triggered_at: null,
      target_hit_at: null,
      stopped_out_at: null,
      expired_at: null,
      needs_review_at: null,
      outcome_note:
        "Entry methodology upgraded to the pullback confirmation-candle framework.",
      last_checked_at: now,
      updated_at: now,
    })
    .eq("id", weeklyTrade.id)
    .select("*")
    .single();

  if (error) {
    throw new Error(
      `Unable to upgrade weekly Trade Idea entry framework: ${error.message}`,
    );
  }

  return data as WeeklyTradeRow;
}

export async function GET() {
  try {
    const weekKey = getTradingWeekKey();
    const existingWeeklyTrade = await getWeeklyTrade(weekKey);

    if (existingWeeklyTrade) {
      const lockedSeries = await loadMarketSeries(existingWeeklyTrade.symbol);
      const upgradedWeeklyTrade = await upgradeLegacyWeeklyEntry(
        existingWeeklyTrade,
        lockedSeries,
      );
      const updatedWeeklyTrade = await updateWeeklyOutcome(
        upgradedWeeklyTrade,
        lockedSeries,
      );
      const previousWeekly = await refreshPreviousWeeklyTrade(weekKey);
      const lockedSnapshot = updatedWeeklyTrade.idea_snapshot;
      const liveIdea: TradeIdea = {
        ...lockedSnapshot,
        selectedPrice: lockedSnapshot.selectedPrice ?? lockedSnapshot.price,
        price: round(lockedSeries.price),
        previousClose: round(lockedSeries.previousClose),
        change: round(lockedSeries.change),
        changePercent: round(lockedSeries.changePercent),
        chart: buildSeriesChart(lockedSeries),
      };

      const isOpenWeeklyTrade = [
        "WAITING_FOR_ENTRY",
        "ACTIVE",
        "NEEDS_REVIEW",
      ].includes(updatedWeeklyTrade.status);

      return NextResponse.json({
        success: true,
        hasQualifiedSetup: true,
        hasActiveTradeIdea: isOpenWeeklyTrade,
        idea: {
          ...liveIdea,
          qualificationFailures: [],
        },
        rankings: [],
        marketContext: updatedWeeklyTrade.market_context,
        scan: {
          locked: true,
          message:
            isOpenWeeklyTrade
              ? "The scanner is serving this week's locked Trade Idea. Live rankings are not recalculated while an idea is locked."
              : "This week's locked Trade Idea has reached a terminal outcome and is retained as the weekly record.",
        },
        weekly: weeklyMetadata(updatedWeeklyTrade),
        previousWeekly,
        methodology: {
          version: "MaicaTrades structural-entry model 4.4",
          weeklyLock:
            "The first qualified setup after Sunday 7 PM ET is locked through the weekly window.",
        },
        updatedAt: new Date().toISOString(),
      });
    }

    const symbols = Array.from(new Set([...STOCK_UNIVERSE.map((stock) => stock.symbol), ...CONTEXT_SYMBOLS]));
    const { map, failures } = await loadSeriesMap(symbols);
    const spy = map.get("SPY");
    const qqq = map.get("QQQ");
    if (!spy || !qqq) throw new Error("SPY or QQQ market context could not be loaded.");

    const marketRegime = getMarketRegime(spy, qqq);
    const candidates: TradeIdea[] = [];

    for (const stock of STOCK_UNIVERSE) {
      const series = map.get(stock.symbol);
      const sector = map.get(stock.sectorSymbol);
      if (!series || !sector) continue;
      candidates.push(buildCandidate(stock, series, sector, spy, qqq, marketRegime, "LONG"));
      candidates.push(buildCandidate(stock, series, sector, spy, qqq, marketRegime, "SHORT"));
    }

    if (candidates.length === 0) throw new Error("No stock data could be analyzed.");

    const ranked = rankIdeas(candidates);
    const actionable = ranked.filter(isActionable);
    const selectedIdea = actionable[0] ?? ranked[0];
    const hasQualifiedSetup = actionable.length > 0;

    const rankings = ranked.map((idea, index) => ({
      rank: index + 1,
      symbol: idea.symbol,
      companyName: idea.companyName,
      direction: idea.direction,
      grade: idea.grade,
      confidenceScore: idea.confidenceScore,
      setup: idea.setup,
      marketDirection: idea.marketDirection,
      price: idea.price,
      changePercent: idea.changePercent,
      triggerDistancePercent: idea.triggerDistancePercent,
      riskReward: idea.riskReward,
      scoreBreakdown: idea.scoreBreakdown,
      actionable: isActionable(idea),
    }));

    const marketContext = {
      direction: marketRegime,
      spy: {
        price: round(spy.price),
        changePercent: round(spy.changePercent),
        return20: round(spy.return20),
      },
      qqq: {
        price: round(qqq.price),
        changePercent: round(qqq.changePercent),
        return20: round(qqq.return20),
      },
    };

    const scan = {
      universeSize: STOCK_UNIVERSE.length,
      candidatesEvaluated: candidates.length,
      actionableCandidates: actionable.length,
      actionableLongs: actionable.filter((idea) => idea.direction === "LONG").length,
      actionableShorts: actionable.filter((idea) => idea.direction === "SHORT").length,
      failedSymbols: failures.length,
      failures,
    };

    let weeklyTrade: WeeklyTradeRow | null = null;

    if (hasQualifiedSetup) {
      weeklyTrade = await lockWeeklyTrade(
        weekKey,
        selectedIdea,
        {
          ...marketContext,
          scanAtLock: scan,
        },
      );
    }

    const previousWeekly = await refreshPreviousWeeklyTrade(weekKey);

    return NextResponse.json({
      success: true,
      hasQualifiedSetup,
      idea: {
        ...(weeklyTrade?.idea_snapshot ?? selectedIdea),
        qualificationFailures:
          weeklyTrade
            ? []
            : getQualificationFailures(selectedIdea),
      },
      rankings,
      marketContext,
      scan,
      weekly: weeklyTrade
        ? weeklyMetadata(weeklyTrade)
        : {
            locked: false,
            weekKey,
            status: null,
          },
      previousWeekly,
      methodology: {
        version: "MaicaTrades structural-entry model 4.4",
        availableMaximum: 96,
        minimumActionableScore: MINIMUM_ACTIONABLE_SCORE,
        movingAverageFramework:
          "20 SMA slope over 5 sessions and 160 SMA slope over 10 sessions",
        extensionFilter:
          "Rejects actionable setups more than 8% or 2 ATR from the 20 SMA",
        levelFramework:
          "Trend-continuation entries use the high/low of a qualifying pullback confirmation candle; breakout setups continue to use prior 20-session resistance/support.",
        targetFramework:
          "Initial target uses three times the 126-session average true range, capped at 12% from entry; setups below 1.8-to-1 are rejected",
        momentumFramework:
          "14-session RSI using Wilder smoothing",
        weeklyLock:
          "The first qualified setup after Sunday 7 PM ET is locked through the weekly window.",
        earningsNewsFilter: "Reserved for the next update",
        updateFrequency: "Approximately every 15 minutes",
      },
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Trade idea route error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unable to calculate the featured trade idea." },
      { status: 500 },
    );
  }
}
