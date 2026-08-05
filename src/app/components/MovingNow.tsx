"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Loader2,
  RefreshCw,
  Zap,
} from "lucide-react";

type MarketMover = {
  symbol: string;
  company: string;
  price: number;
  previousClose: number;
  change: number;
  changePercent: number;
  volume: number;
};

type MovingNowResponse = {
  success: boolean;
  topGainers: MarketMover[];
  topLosers: MarketMover[];
  mostActive: MarketMover[];
  error?: string;
};

type ActiveTab = "gainers" | "losers" | "active";

function formatPrice(price: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price);
}

function formatVolume(volume: number) {
  if (volume >= 1_000_000_000) {
    return `${(volume / 1_000_000_000).toFixed(1)}B`;
  }

  if (volume >= 1_000_000) {
    return `${(volume / 1_000_000).toFixed(1)}M`;
  }

  if (volume >= 1_000) {
    return `${(volume / 1_000).toFixed(1)}K`;
  }

  return volume.toLocaleString();
}

export default function MovingNow() {
  const router = useRouter();

  const [data, setData] = useState<MovingNowResponse | null>(null);
  const [tab, setTab] = useState<ActiveTab>("gainers");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (manual = false) => {
    try {
      if (manual) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await fetch("/api/moving-now", {
        cache: "no-store",
      });

      const json = (await response.json()) as MovingNowResponse;
      setData(json);
    } catch (error) {
      console.error("Failed to load Moving Now data:", error);

      setData({
        success: false,
        topGainers: [],
        topLosers: [],
        mostActive: [],
        error: "Unable to load market movers.",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const movers =
    tab === "gainers"
      ? data?.topGainers ?? []
      : tab === "losers"
        ? data?.topLosers ?? []
        : data?.mostActive ?? [];

  function openMovingNowPage() {
    router.push("/markets/moving-now");
  }

  function handleCardKeyDown(
    event: React.KeyboardEvent<HTMLElement>,
  ) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openMovingNowPage();
    }
  }

  function handleRefresh(
    event: React.MouseEvent<HTMLButtonElement>,
  ) {
    event.stopPropagation();
    load(true);
  }

  function changeTab(
    event: React.MouseEvent<HTMLButtonElement>,
    nextTab: ActiveTab,
  ) {
    event.stopPropagation();
    setTab(nextTab);
  }

  return (
    <section
      role="link"
      tabIndex={0}
      aria-label="View all market movers"
      onClick={openMovingNowPage}
      onKeyDown={handleCardKeyDown}
      className="group cursor-pointer rounded-xl border border-slate-800 bg-[#09131d] transition duration-200 hover:-translate-y-1 hover:border-blue-500/60 hover:shadow-[0_16px_40px_rgba(0,0,0,0.28)] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
    >
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-blue-400">
          <Zap size={17} />
          Moving Now
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={refreshing}
          aria-label="Refresh market movers"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw
            size={16}
            className={refreshing ? "animate-spin" : ""}
          />
        </button>
      </div>

      <div className="flex border-b border-slate-800 text-xs">
        <button
          type="button"
          className={`px-3 py-2 transition ${
            tab === "gainers"
              ? "text-emerald-400"
              : "text-slate-500 hover:text-slate-300"
          }`}
          onClick={(event) => changeTab(event, "gainers")}
        >
          Top Gainers
        </button>

        <button
          type="button"
          className={`px-3 py-2 transition ${
            tab === "losers"
              ? "text-red-400"
              : "text-slate-500 hover:text-slate-300"
          }`}
          onClick={(event) => changeTab(event, "losers")}
        >
          Top Losers
        </button>

        <button
          type="button"
          className={`px-3 py-2 transition ${
            tab === "active"
              ? "text-blue-400"
              : "text-slate-500 hover:text-slate-300"
          }`}
          onClick={(event) => changeTab(event, "active")}
        >
          Most Active
        </button>
      </div>

      <div className="p-4">
        {loading ? (
          <div className="py-8 text-center text-slate-400">
            Loading...
          </div>
        ) : data?.error ? (
          <div className="py-8 text-center text-sm text-red-400">
            {data.error}
          </div>
        ) : movers.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-500">
            No market movers are currently available.
          </div>
        ) : (
          <div className="space-y-3">
            {movers.slice(0, 5).map((mover) => (
              <div
                key={mover.symbol}
                className="grid grid-cols-[52px_1fr_auto] gap-3 text-xs"
              >
                <strong>{mover.symbol}</strong>

                <div className="min-w-0">
                  <div className="truncate text-slate-300">
                    {mover.company}
                  </div>

                  <div className="text-[10px] text-slate-500">
                    {formatPrice(mover.price)}
                    {tab === "active" &&
                      ` • ${formatVolume(mover.volume)}`}
                  </div>
                </div>

                <div
                  className={`flex items-center gap-1 font-semibold ${
                    mover.changePercent >= 0
                      ? "text-emerald-400"
                      : "text-red-400"
                  }`}
                >
                  {mover.changePercent >= 0 ? (
                    <ArrowUpRight size={13} />
                  ) : (
                    <ArrowDownRight size={13} />
                  )}

                  {mover.changePercent > 0 ? "+" : ""}
                  {mover.changePercent.toFixed(2)}%
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-5 flex items-center justify-between border-t border-slate-800 pt-4 text-blue-400">
          <span>View All Movers</span>

          <ArrowRight
            size={15}
            className="transition group-hover:translate-x-1"
          />
        </div>

        {refreshing && (
          <div className="mt-3 flex items-center gap-2 text-[10px] text-slate-500">
            <Loader2 size={12} className="animate-spin" />
            Refreshing...
          </div>
        )}
      </div>
    </section>
  );
}