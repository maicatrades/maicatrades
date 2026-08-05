"use client";

import type { ComponentType } from "react";
import { useEffect, useState } from "react";

import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import DashboardSummary from "../components/DashboardSummary";
import MarketBreadth from "../components/MarketBreadth";
import SectorPerformance from "../components/SectorPerformance";
import EconomicCalendar from "../components/EconomicCalendar";
import TopNews from "../components/TopNews";
import MovingNow from "../components/MovingNow";
import TradeIdea from "../components/TradeIdea";
import Watchlist from "../components/Watchlist";
import MarketPulse from "../components/MarketPulse";
import DashboardHeader from "../components/DashboardHeader";
import DashboardExtras from "../components/DashboardExtras";
import PremiumMarketTicker from "../components/MarketTicker";
import WhatImWatching from "../components/WhatImWatching";
import MarketHero from "../components/MarketHero";
import Footer from "../components/Footer";

type MarketScoreComponent = {
  score: number;
  maxScore: number;
};

type MarketScoreTrend =
  | "Improving"
  | "Weakening"
  | "Stable"
  | "Unavailable";

type MarketScoreResponse = {
  success: boolean;
  score: number;
  rawScore: number;
  label: string;
  environment: {
    bias: string;
    riskLevel: string;
    approach: string;
  };
  previousScore: number | null;
  previousTradingDate: string | null;
  previousLabel: string | null;
  scoreChange: number | null;
  scoreTrend: MarketScoreTrend;
  components: {
    trend: MarketScoreComponent;
    momentum: MarketScoreComponent;
    sectorStrength: MarketScoreComponent;
    volatility: MarketScoreComponent;
  };
  updatedAt: string;
  error?: string;
};

type MarketPulseComponentProps = {
  marketScore?: number | null;
  marketLabel?: string | null;
  scoreTrend?: MarketScoreTrend;
  marketScoreLoading?: boolean;
};

const TypedMarketPulse =
  MarketPulse as ComponentType<MarketPulseComponentProps>;

type SectorPerformanceItem = {
  name: string;
  symbol: string;
  price: number;
  previousClose: number;
  changePercent: number;
};

type SectorPerformanceResponse = {
  success: boolean;
  leadingSector: SectorPerformanceItem;
  weakestSector: SectorPerformanceItem;
  sectors: SectorPerformanceItem[];
  updatedAt: string;
  error?: string;
};

type CalendarEvent = {
  id: string;
  date: string;
  time: string;
  title: string;
  category: string;
  impact: string;
  previous: string;
  forecast: string;
  actual: string;
  description: string;
};

type EconomicCalendarResponse = {
  success: boolean;
  events: CalendarEvent[];
  updatedAt: string;
  error?: string;
};

type DashboardWatchlistStatus =
  | "Bullish"
  | "Extended"
  | "Neutral"
  | "Watch"
  | "Weak";

type DashboardWatchlistItem = {
  symbol: string;
  price: string;
  change: string;
  status: DashboardWatchlistStatus;
  note?: string;
};

type ApiWatchlistItem = {
  symbol?: string;
  price?: number | string;
  change?: number | string;
  changePercent?: number | string;
  status?: string;
  note?: string;
};

type WatchlistResponse = {
  success?: boolean;
  items?: ApiWatchlistItem[];
  watchlist?: ApiWatchlistItem[];
  stocks?: ApiWatchlistItem[];
  data?: ApiWatchlistItem[];
  error?: string;
};

function getScoreColor(score: number) {
  if (score >= 65) return "text-emerald-400";
  if (score >= 50) return "text-yellow-400";
  return "text-red-400";
}

function formatWatchlistPrice(
  value: number | string | undefined,
) {
  const numericValue =
    typeof value === "number"
      ? value
      : Number.parseFloat(
          String(value ?? "").replace(/[$,]/g, ""),
        );

  if (!Number.isFinite(numericValue)) {
    return "—";
  }

  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericValue);
}

function formatWatchlistChange(
  value: number | string | undefined,
) {
  if (
    typeof value === "number" &&
    Number.isFinite(value)
  ) {
    const prefix = value > 0 ? "+" : "";
    return `${prefix}${value.toFixed(2)}%`;
  }

  const text = String(value ?? "").trim();

  if (!text) {
    return "0.00%";
  }

  const numericValue = Number.parseFloat(
    text.replace(/[+%,]/g, ""),
  );

  if (!Number.isFinite(numericValue)) {
    return text;
  }

  const prefix = numericValue > 0 ? "+" : "";
  return `${prefix}${numericValue.toFixed(2)}%`;
}

function normalizeWatchlistStatus(
  status: string | undefined,
): DashboardWatchlistStatus {
  const normalized = status?.trim().toLowerCase();

  switch (normalized) {
    case "bullish":
    case "strong":
    case "constructive":
      return "Bullish";

    case "extended":
      return "Extended";

    case "weak":
      return "Weak";

    case "watch":
      return "Watch";

    case "neutral":
      return "Neutral";

    default:
      return "Watch";
  }
}

function getWatchlistRows(
  result: WatchlistResponse,
): ApiWatchlistItem[] {
  if (Array.isArray(result.items)) {
    return result.items;
  }

  if (Array.isArray(result.watchlist)) {
    return result.watchlist;
  }

  if (Array.isArray(result.stocks)) {
    return result.stocks;
  }

  if (Array.isArray(result.data)) {
    return result.data;
  }

  return [];
}

export default function DashboardPage() {
  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  const [marketScore, setMarketScore] =
    useState<MarketScoreResponse | null>(null);

  const [
    marketScoreLoading,
    setMarketScoreLoading,
  ] = useState(true);

  const [sectorData, setSectorData] =
    useState<SectorPerformanceResponse | null>(
      null,
    );

  const [sectorLoading, setSectorLoading] =
    useState(true);

  const [calendarEvents, setCalendarEvents] =
    useState<CalendarEvent[]>([]);

  const [watchlistItems, setWatchlistItems] =
    useState<DashboardWatchlistItem[]>([]);

  useEffect(() => {
    let mounted = true;

    async function fetchMarketScore() {
      try {
        const response = await fetch(
          "/api/market-score",
          {
            cache: "no-store",
          },
        );

        const result =
          (await response.json()) as MarketScoreResponse;

        if (!response.ok || !result.success) {
          throw new Error(
            result.error ||
              "Unable to load market score",
          );
        }

        if (mounted) {
          setMarketScore(result);
        }
      } catch (error) {
        console.error(
          "Market score error:",
          error,
        );
      } finally {
        if (mounted) {
          setMarketScoreLoading(false);
        }
      }
    }

    void fetchMarketScore();

    const interval = window.setInterval(
      fetchMarketScore,
      5 * 60_000,
    );

    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    async function fetchSectorPerformance() {
      try {
        const response = await fetch(
          "/api/sector-performance",
          {
            cache: "no-store",
          },
        );

        const result =
          (await response.json()) as SectorPerformanceResponse;

        if (!response.ok || !result.success) {
          throw new Error(
            result.error ||
              "Unable to load sector performance",
          );
        }

        if (mounted) {
          setSectorData(result);
        }
      } catch (error) {
        console.error(
          "Sector performance error:",
          error,
        );
      } finally {
        if (mounted) {
          setSectorLoading(false);
        }
      }
    }

    void fetchSectorPerformance();

    const interval = window.setInterval(
      fetchSectorPerformance,
      5 * 60_000,
    );

    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    async function fetchEconomicCalendar() {
      try {
        const response = await fetch(
          "/api/economic-calendar",
          {
            cache: "no-store",
          },
        );

        const result =
          (await response.json()) as EconomicCalendarResponse;

        if (!response.ok || !result.success) {
          throw new Error(
            result.error ||
              "Unable to load economic calendar",
          );
        }

        if (mounted) {
          setCalendarEvents(result.events);
        }
      } catch (error) {
        console.error(
          "Economic calendar error:",
          error,
        );
      }
    }

    void fetchEconomicCalendar();

    const interval = window.setInterval(
      fetchEconomicCalendar,
      5 * 60_000,
    );

    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    async function fetchWatchlist() {
      try {
        const response = await fetch(
          "/api/watchlist",
          {
            cache: "no-store",
          },
        );

        const result =
          (await response.json()) as WatchlistResponse;

        if (
          !response.ok ||
          result.success === false
        ) {
          throw new Error(
            result.error ||
              "Unable to load watchlist",
          );
        }

        const rows = getWatchlistRows(result);

        if (rows.length === 0) {
          throw new Error(
            "The watchlist API returned no stocks.",
          );
        }

        const normalizedItems = rows
          .filter(
            (
              item,
            ): item is ApiWatchlistItem & {
              symbol: string;
            } =>
              typeof item.symbol === "string" &&
              item.symbol.trim().length > 0,
          )
          .slice(0, 7)
          .map((item) => ({
            symbol: item.symbol
              .trim()
              .toUpperCase(),
            price: formatWatchlistPrice(
              item.price,
            ),
            change: formatWatchlistChange(
              item.changePercent ??
                item.change,
            ),
            status:
              normalizeWatchlistStatus(
                item.status,
              ),
            note:
              typeof item.note === "string"
                ? item.note
                : undefined,
          }));

        if (mounted) {
          setWatchlistItems(
            normalizedItems,
          );
        }
      } catch (error) {
        console.error(
          "Watchlist error:",
          error,
        );
      }
    }

    void fetchWatchlist();

    const interval = window.setInterval(
      fetchWatchlist,
      5 * 60_000,
    );

    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, []);

  const score = marketScore?.score ?? 0;
  const scoreColor = getScoreColor(score);

  const leadingSector =
    sectorData?.leadingSector;

  const weakestSector =
    sectorData?.weakestSector;

  const liveSectors =
    sectorData?.sectors ?? [];

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#050b12] text-slate-100">
      <Header
        openSidebar={() =>
          setSidebarOpen(true)
        }
      />

      <PremiumMarketTicker />

      <div className="flex min-w-0">
        <Sidebar
          open={sidebarOpen}
          closeSidebar={() =>
            setSidebarOpen(false)
          }
        />

        <div className="min-w-0 flex-1 overflow-x-hidden">
          <div className="mx-auto w-full min-w-0 max-w-[1700px] p-4 sm:p-6 lg:p-8">
            <DashboardHeader />

            <section className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
              <div className="min-w-0">
                <MarketHero
                  marketScore={marketScore}
                  loading={
                    marketScoreLoading
                  }
                />
              </div>

              <div className="min-w-0">
                <DashboardSummary
                  environment={
                    marketScore?.environment ??
                    null
                  }
                  score={score}
                  scoreColor={scoreColor}
                  marketScoreLoading={
                    marketScoreLoading
                  }
                  previousScore={
                    marketScore?.previousScore ??
                    null
                  }
                  previousTradingDate={
                    marketScore?.previousTradingDate ??
                    null
                  }
                  scoreChange={
                    marketScore?.scoreChange ??
                    null
                  }
                  scoreTrend={
                    marketScore?.scoreTrend ??
                    "Unavailable"
                  }
                  leadingSector={
                    leadingSector
                  }
                  weakestSector={
                    weakestSector
                  }
                  sectorLoading={
                    sectorLoading
                  }
                />
              </div>
            </section>

            <WhatImWatching />

            <section className="mt-4 grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,0.9fr)_minmax(0,1.4fr)]">
              <div className="min-w-0">
                <TypedMarketPulse
                  marketScore={
                    marketScore?.score ??
                    null
                  }
                  marketLabel={
                    marketScore?.label ??
                    null
                  }
                  scoreTrend={
                    marketScore?.scoreTrend ??
                    "Unavailable"
                  }
                  marketScoreLoading={
                    marketScoreLoading
                  }
                />
              </div>

              <div className="min-w-0">
                <MarketBreadth />
              </div>

              <div className="min-w-0">
                <SectorPerformance
                  sectors={liveSectors}
                  loading={sectorLoading}
                />
              </div>
            </section>

            <section className="mt-4 grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-3">
              <div className="min-w-0">
                <EconomicCalendar
                  events={
                    calendarEvents
                  }
                />
              </div>

              <div className="min-w-0">
                <TopNews />
              </div>

              <div className="min-w-0">
                <MovingNow />
              </div>
            </section>

            <section className="mt-4 grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
              <div className="min-w-0 max-w-full overflow-hidden">
                <TradeIdea />
              </div>

              <div className="min-w-0 max-w-full overflow-hidden">
                <Watchlist
                  items={
                    watchlistItems
                  }
                />
              </div>
            </section>

            <DashboardExtras
              marketScore={score}
            />

            <Footer />
          </div>
        </div>
      </div>
    </main>
  );
}