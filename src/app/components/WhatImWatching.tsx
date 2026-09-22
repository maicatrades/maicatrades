"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { ElementType, ReactNode } from "react";
import {
  CalendarDays,
  Eye,
  RefreshCw,
  ShieldAlert,
  Target,
  TrendingUp,
} from "lucide-react";
import { fetchDashboardJson } from "@/lib/dashboard-api";

type MarketScoreResponse = {
  success?: boolean;
  score?: number;
  label?: string;
  environment?: {
    bias?: string;
    riskLevel?: string;
    approach?: string;
  };
};

type UnknownRecord = Record<string, unknown>;

type PlanItemProps = {
  icon: ElementType;
  label: string;
  children: ReactNode;
};

type WeeklyPlan = {
  marketBias: string;
  focusStocks: string;
  catalysts: string;
  avoid: string;
  riskManagement: string;
};

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null;
}

function getString(
  record: UnknownRecord | undefined,
  ...keys: string[]
): string | null {
  if (!record) return null;

  for (const key of keys) {
    const value = record[key];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return null;
}

function getNumber(
  record: UnknownRecord | undefined,
  ...keys: string[]
): number | null {
  if (!record) return null;

  for (const key of keys) {
    const value = record[key];

    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    if (
      typeof value === "string" &&
      value.trim() &&
      Number.isFinite(Number(value))
    ) {
      return Number(value);
    }
  }

  return null;
}

function findArray(
  value: unknown,
  possibleKeys: string[],
): unknown[] {
  if (Array.isArray(value)) {
    return value;
  }

  if (!isRecord(value)) {
    return [];
  }

  for (const key of possibleKeys) {
    const candidate = value[key];

    if (Array.isArray(candidate)) {
      return candidate;
    }
  }

  return [];
}

function extractSectorInfo(data: unknown) {
  const rows = findArray(data, [
    "sectors",
    "data",
    "results",
    "sectorPerformance",
  ]);

  const sectors = rows
    .filter(isRecord)
    .map((row) => {
      const symbol =
        getString(row, "symbol", "ticker", "etf") ?? "";

      const name =
        getString(
          row,
          "name",
          "sector",
          "sectorName",
          "label",
        ) ?? symbol;

      const change =
        getNumber(
          row,
          "changePercent",
          "percentChange",
          "change",
          "performance",
          "returnPct",
        ) ?? 0;

      return {
        symbol,
        name,
        change,
      };
    })
    .filter((sector) => sector.name);

  if (!sectors.length) {
    return {
      leading: null,
      weakest: null,
    };
  }

  const sorted = [...sectors].sort(
    (a, b) => b.change - a.change,
  );

  return {
    leading: sorted[0],
    weakest: sorted[sorted.length - 1],
  };
}

function extractTradeIdeaSymbol(data: unknown): string | null {
  if (!isRecord(data)) return null;

  const direct =
    getString(
      data,
      "symbol",
      "ticker",
      "stock",
    );

  if (direct) return direct.toUpperCase();

  for (const key of ["idea", "tradeIdea", "data"]) {
    const nested = data[key];

    if (isRecord(nested)) {
      const symbol = getString(
        nested,
        "symbol",
        "ticker",
        "stock",
      );

      if (symbol) {
        return symbol.toUpperCase();
      }
    }
  }

  return null;
}

function extractCalendarEvents(data: unknown): string[] {
  const rows = findArray(data, [
    "events",
    "calendarEvents",
    "data",
    "results",
  ]);

  const eventNames = rows
    .filter(isRecord)
    .filter(
      (event) =>
        getString(event, "status") === null ||
        getString(event, "status") === "Scheduled",
    )
    .map((event) =>
      getString(
        event,
        "event",
        "name",
        "title",
        "eventName",
      ),
    )
    .filter((event): event is string => Boolean(event));

  return [...new Set(eventNames)].slice(0, 3);
}

function buildMarketBias(
  scoreData: MarketScoreResponse | null,
): string {
  const score = scoreData?.score;
  const label = scoreData?.label;
  const bias = scoreData?.environment?.bias;
  const riskLevel = scoreData?.environment?.riskLevel;

  if (typeof score !== "number") {
    return (
      "Current market conditions are being evaluated. " +
      "Stay selective until the broader environment is clear."
    );
  }

  if (score >= 80) {
    return (
      `The Market Score is ${score}/100${label ? ` (${label})` : ""}. ` +
      "The broader environment is strongly constructive. " +
      "Favor high-quality long setups, relative strength, and leadership, " +
      "while avoiding the temptation to chase extended stocks."
    );
  }

  if (score >= 65) {
    return (
      `The Market Score is ${score}/100${label ? ` (${label})` : ""}. ` +
      "Conditions remain constructive, but selectivity still matters. " +
      "Favor strong setups in leading areas of the market and require clean entries."
    );
  }

  if (score >= 50) {
    return (
      `The Market Score is ${score}/100${label ? ` (${label})` : ""}. ` +
      "The environment is mixed. Keep exposure measured, favor confirmation, " +
      "and avoid forcing trades when market direction is unclear."
    );
  }

  if (score >= 35) {
    return (
      `The Market Score is ${score}/100${label ? ` (${label})` : ""}. ` +
      "Conditions are cautious. Reduce aggressiveness, protect capital, " +
      "and demand stronger confirmation before taking new risk."
    );
  }

  return (
    `The Market Score is ${score}/100${label ? ` (${label})` : ""}. ` +
    `Risk is elevated${riskLevel ? ` (${riskLevel})` : ""}. ` +
    "Capital preservation takes priority. Keep exposure light and avoid marginal setups."
  );
}

function buildFocusStocks(
  tradeIdeaSymbol: string | null,
  leadingSector:
    | {
        symbol: string;
        name: string;
        change: number;
      }
    | null,
): string {
  const pieces: string[] = [];

  if (tradeIdeaSymbol) {
    pieces.push(
      `${tradeIdeaSymbol} is currently on the MaicaTrades trade-idea radar.`,
    );
  }

  if (leadingSector) {
    const sectorLabel =
      leadingSector.symbol &&
      leadingSector.symbol !== leadingSector.name
        ? `${leadingSector.name} (${leadingSector.symbol})`
        : leadingSector.name;

    pieces.push(
      `${sectorLabel} is showing the strongest sector leadership.`,
    );
  }

  if (pieces.length) {
    return (
      `${pieces.join(" ")} ` +
      "Prioritize stocks showing relative strength, clean structure, " +
      "support at key levels, or constructive breakout-and-retest setups."
    );
  }

  return (
    "Prioritize stocks showing relative strength, clean structure, " +
    "support at key levels, and breakout-and-retest setups. " +
    "Give preference to names participating in the market's strongest areas."
  );
}

function buildCatalysts(events: string[]): string {
  if (!events.length) {
    return (
      "No major catalyst has been pulled into the weekly plan yet. " +
      "Continue checking the Economic Calendar for inflation data, labor reports, " +
      "Federal Reserve events, and other market-moving releases."
    );
  }

  return (
    `Key events currently on the calendar include ${events.join(", ")}. ` +
    "Be aware of scheduled catalysts that could quickly change volatility, " +
    "market direction, or position risk."
  );
}

function buildAvoidText(
  scoreData: MarketScoreResponse | null,
  weakestSector:
    | {
        symbol: string;
        name: string;
        change: number;
      }
    | null,
): string {
  const score = scoreData?.score;

  let text =
    "Avoid chasing stocks extended far above support, low-quality setups, " +
    "and entries where the reward-to-risk no longer makes sense.";

  if (weakestSector) {
    const sectorLabel =
      weakestSector.symbol &&
      weakestSector.symbol !== weakestSector.name
        ? `${weakestSector.name} (${weakestSector.symbol})`
        : weakestSector.name;

    text +=
      ` ${sectorLabel} is currently among the weakest areas, ` +
      "so require additional confirmation before taking exposure there.";
  }

  if (typeof score === "number" && score < 50) {
    text +=
      " With the Market Score below 50, avoid increasing exposure simply because an individual stock looks attractive.";
  }

  return text;
}

function buildRiskManagement(
  scoreData: MarketScoreResponse | null,
): string {
  const score = scoreData?.score;
  const riskLevel = scoreData?.environment?.riskLevel;
  const approach = scoreData?.environment?.approach;

  if (approach) {
    return (
      `${approach} ` +
      "Define your stop and maximum loss before entry, size positions from risk, " +
      "and prioritize quality over trade frequency."
    );
  }

  if (typeof score !== "number") {
    return (
      "Keep position sizing disciplined, define risk before every entry, " +
      "and prioritize capital preservation until market conditions are clear."
    );
  }

  if (score >= 80) {
    return (
      `Current risk level${riskLevel ? ` is ${riskLevel}` : ""}. ` +
      "Favorable conditions can justify normal exposure, but strong markets are not a reason to abandon position sizing, stops, or entry discipline."
    );
  }

  if (score >= 65) {
    return (
      `Current risk level${riskLevel ? ` is ${riskLevel}` : ""}. ` +
      "Maintain disciplined position sizing and allow the quality of the setup—not the bullish market alone—to determine how much risk you take."
    );
  }

  if (score >= 50) {
    return (
      `Current risk level${riskLevel ? ` is ${riskLevel}` : ""}. ` +
      "Consider measured exposure and smaller initial risk while the environment remains mixed."
    );
  }

  return (
    `Current risk level${riskLevel ? ` is ${riskLevel}` : ""}. ` +
    "Keep exposure reduced, size positions conservatively, and prioritize protecting capital over increasing trade activity."
  );
}

function PlanItem({
  icon: Icon,
  label,
  children,
}: PlanItemProps) {
  return (
    <div className="h-full rounded-xl border border-slate-800 bg-slate-950/25 p-4">
      <div className="flex items-center gap-2">
        <Icon size={17} className="text-emerald-400" />

        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          {label}
        </p>
      </div>

      <p className="mt-2 text-sm leading-6 text-slate-300">
        {children}
      </p>
    </div>
  );
}

export default function WhatImWatching() {
  const [marketScore, setMarketScore] =
    useState<MarketScoreResponse | null>(null);

  const [sectorData, setSectorData] =
    useState<unknown>(null);

  const [calendarData, setCalendarData] =
    useState<unknown>(null);

  const [tradeIdeaData, setTradeIdeaData] =
    useState<unknown>(null);

  const [loading, setLoading] = useState(true);

  const [updatedAt, setUpdatedAt] =
    useState<Date | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadWeeklyPlanData() {
      try {
        const results = await Promise.allSettled([
          fetchDashboardJson<MarketScoreResponse>(
            "/api/market-score",
          ).then(({ data, ok }) => {
            if (!ok) {
              throw new Error("Market Score unavailable");
            }

            return data;
          }),

          fetchDashboardJson<unknown>(
            "/api/sector-performance",
          ).then(({ data, ok }) => {
            if (!ok) {
              throw new Error("Sector data unavailable");
            }

            return data;
          }),

          fetchDashboardJson<unknown>(
            "/api/economic-calendar",
          ).then(({ data, ok }) => {
            if (!ok) {
              throw new Error("Calendar unavailable");
            }

            return data;
          }),

          fetchDashboardJson<unknown>(
            "/api/trade-idea",
            45_000,
          ).then(({ data, ok }) => {
            if (!ok) {
              throw new Error("Trade idea unavailable");
            }

            return data;
          }),
        ]);

        if (!mounted) return;

        const [
          marketScoreResult,
          sectorResult,
          calendarResult,
          tradeIdeaResult,
        ] = results;

        if (marketScoreResult.status === "fulfilled") {
          setMarketScore(
            marketScoreResult.value as MarketScoreResponse,
          );
        }

        if (sectorResult.status === "fulfilled") {
          setSectorData(sectorResult.value);
        }

        if (calendarResult.status === "fulfilled") {
          setCalendarData(calendarResult.value);
        }

        if (tradeIdeaResult.status === "fulfilled") {
          setTradeIdeaData(tradeIdeaResult.value);
        }

        setUpdatedAt(new Date());
      } catch (error) {
        console.error(
          "Weekly Trading Plan data error:",
          error,
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadWeeklyPlanData();

    const interval = window.setInterval(
      loadWeeklyPlanData,
      30 * 60_000,
    );

    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, []);

  const sectorInfo = useMemo(
    () => extractSectorInfo(sectorData),
    [sectorData],
  );

  const tradeIdeaSymbol = useMemo(
    () => extractTradeIdeaSymbol(tradeIdeaData),
    [tradeIdeaData],
  );

  const calendarEvents = useMemo(
    () => extractCalendarEvents(calendarData),
    [calendarData],
  );

  const weeklyPlan: WeeklyPlan = useMemo(
    () => ({
      marketBias: buildMarketBias(marketScore),

      focusStocks: buildFocusStocks(
        tradeIdeaSymbol,
        sectorInfo.leading,
      ),

      catalysts: buildCatalysts(calendarEvents),

      avoid: buildAvoidText(
        marketScore,
        sectorInfo.weakest,
      ),

      riskManagement:
        buildRiskManagement(marketScore),
    }),
    [
      marketScore,
      tradeIdeaSymbol,
      sectorInfo,
      calendarEvents,
    ],
  );

  const lastUpdated = updatedAt
    ? updatedAt.toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      })
    : null;

  return (
    <section className="mt-4 rounded-xl border border-slate-800 bg-[#09131d] shadow-[0_10px_30px_rgba(0,0,0,0.16)]">
      <div className="flex flex-col justify-between gap-3 px-5 py-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2 font-semibold uppercase text-emerald-400">
            <Eye size={19} />

            This Week&apos;s Trading Plan
          </div>

          <p className="mt-1 text-xs text-slate-500">
            Built automatically from current MaicaTrades
            market context, leadership, catalysts, and risk.
          </p>

          <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-600">
            <RefreshCw
              size={12}
              className={loading ? "animate-spin" : ""}
            />

            {loading
              ? "Building current trading plan..."
              : lastUpdated
                ? `Market context refreshed at ${lastUpdated}`
                : "Using current market context"}
          </div>
        </div>

        <Link
          href="/markets/trade-idea"
          className="inline-flex items-center justify-center rounded-lg border border-emerald-500/70 px-4 py-2 text-sm font-medium text-emerald-400 transition hover:bg-emerald-500 hover:text-slate-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
        >
          Review Trade Idea
        </Link>
      </div>

      <div className="grid gap-3 border-t border-slate-800 px-5 py-5 md:grid-cols-2 xl:grid-cols-3">
        <PlanItem
          icon={TrendingUp}
          label="Market Bias"
        >
          {loading
            ? "Evaluating the current market environment..."
            : weeklyPlan.marketBias}
        </PlanItem>

        <PlanItem
          icon={Target}
          label="Focus Stocks & Leadership"
        >
          {loading
            ? "Identifying current areas of relative strength..."
            : weeklyPlan.focusStocks}
        </PlanItem>

        <PlanItem
          icon={CalendarDays}
          label="Key Catalysts"
        >
          {loading
            ? "Checking upcoming market-moving events..."
            : weeklyPlan.catalysts}
        </PlanItem>

        <PlanItem
          icon={ShieldAlert}
          label="What to Avoid"
        >
          {loading
            ? "Evaluating current market risks..."
            : weeklyPlan.avoid}
        </PlanItem>

        <div className="md:col-span-2 xl:col-span-2">
          <PlanItem
            icon={ShieldAlert}
            label="Risk Management"
          >
            {loading
              ? "Determining appropriate risk posture..."
              : weeklyPlan.riskManagement}
          </PlanItem>
        </div>
      </div>
    </section>
  );
}
