"use client";

import {
  ArrowDownRight,
  ArrowUpRight,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

type MarketTickerItem = {
  symbol: string;
  apiSymbol: string;
  price: number | null;
  changePercent: number | null;
};

type FlashDirection = "up" | "down" | null;

const tickerSymbols = [
  { symbol: "SPY", apiSymbol: "SPY" },
  { symbol: "QQQ", apiSymbol: "QQQ" },
  { symbol: "DIA", apiSymbol: "DIA" },
  { symbol: "IWM", apiSymbol: "IWM" },
  { symbol: "VIX", apiSymbol: "^VIX" },
];

function createInitialTickerData(): MarketTickerItem[] {
  return tickerSymbols.map((item) => ({
    ...item,
    price: null,
    changePercent: null,
  }));
}

export default function MarketTicker() {
  const [tickerData, setTickerData] = useState<MarketTickerItem[]>(
    createInitialTickerData,
  );

  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState("");
  const [flashState, setFlashState] = useState<
    Record<string, FlashDirection>
  >({});

  const previousPrices = useRef<Record<string, number>>({});

  useEffect(() => {
    let mounted = true;
    let flashTimeout: number | undefined;

    async function fetchTickerData() {
      try {
        const response = await fetch("/api/market-ticker", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Unable to load market ticker");
        }

        const result = await response.json();

        if (!result.success || !Array.isArray(result.data)) {
          throw new Error(
            result.error || "Invalid market ticker response",
          );
        }

        if (!mounted) return;

        const nextFlashState: Record<string, FlashDirection> = {};

        result.data.forEach((ticker: MarketTickerItem) => {
          const previousPrice =
            previousPrices.current[ticker.symbol];

          if (
            previousPrice !== undefined &&
            ticker.price !== null
          ) {
            if (ticker.price > previousPrice) {
              nextFlashState[ticker.symbol] = "up";
            } else if (ticker.price < previousPrice) {
              nextFlashState[ticker.symbol] = "down";
            } else {
              nextFlashState[ticker.symbol] = null;
            }
          }

          if (ticker.price !== null) {
            previousPrices.current[ticker.symbol] =
              ticker.price;
          }
        });

        setTickerData(result.data);
        setFlashState(nextFlashState);

        setLastUpdated(
          new Date(
            result.updatedAt ?? Date.now(),
          ).toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            second: "2-digit",
          }),
        );

        if (flashTimeout) {
          window.clearTimeout(flashTimeout);
        }

        flashTimeout = window.setTimeout(() => {
          if (mounted) {
            setFlashState({});
          }
        }, 900);
      } catch (error) {
        console.error("Market ticker error:", error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchTickerData();

    const interval = window.setInterval(
      fetchTickerData,
      60_000,
    );

    return () => {
      mounted = false;
      window.clearInterval(interval);

      if (flashTimeout) {
        window.clearTimeout(flashTimeout);
      }
    };
  }, []);

  /*
   * The ticker list is duplicated so the horizontal
   * animation can loop without a visible jump.
   */
  const scrollingTickerData = [
    ...tickerData,
    ...tickerData,
  ];

  return (
    <section className="group/ticker relative overflow-hidden border-b border-slate-800 bg-[#071019]">
      <div className="flex min-h-[66px] items-stretch">
        <div className="relative z-20 hidden shrink-0 items-center gap-2 border-r border-slate-800 bg-[#071019] px-5 lg:flex">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />

            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
          </span>

          <span className="whitespace-nowrap text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
            Market Ticker
          </span>
        </div>

        <div className="relative min-w-0 flex-1 overflow-hidden">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-[#071019] to-transparent" />

          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-[#071019] to-transparent" />

          <div className="market-ticker-track flex min-w-max items-stretch group-hover/ticker:[animation-play-state:paused]">
            {scrollingTickerData.map((ticker, index) => {
              const positive =
                ticker.changePercent !== null &&
                ticker.changePercent >= 0;

              const negative =
                ticker.changePercent !== null &&
                ticker.changePercent < 0;

              const flashDirection =
                flashState[ticker.symbol];

              const flashClass =
                flashDirection === "up"
                  ? "bg-emerald-400/[0.12]"
                  : flashDirection === "down"
                    ? "bg-red-400/[0.12]"
                    : "bg-transparent";

              return (
                <div
                  key={`${ticker.symbol}-${index}`}
                  className={`flex min-w-[172px] items-center justify-between gap-5 border-r border-slate-800 px-5 py-3 transition-all duration-500 sm:min-w-[185px] ${flashClass}`}
                >
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold tracking-wide text-white">
                      {ticker.symbol}
                    </p>

                    <p className="mt-0.5 truncate text-[10px] text-slate-500">
                      {ticker.symbol === "VIX"
                        ? "Volatility Index"
                        : "Market ETF"}
                    </p>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="text-sm font-semibold tabular-nums text-slate-200 transition-colors duration-300">
                      {loading && ticker.price === null
                        ? "Loading..."
                        : ticker.price !== null
                          ? ticker.price.toLocaleString(
                              "en-US",
                              {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              },
                            )
                          : "—"}
                    </p>

                    <div
                      className={`mt-0.5 flex items-center justify-end gap-1 text-xs font-semibold tabular-nums transition-colors duration-300 ${
                        positive
                          ? "text-emerald-400"
                          : negative
                            ? "text-red-400"
                            : "text-slate-500"
                      }`}
                    >
                      {ticker.changePercent !== null ? (
                        <>
                          {positive ? (
                            <ArrowUpRight
                              size={13}
                              strokeWidth={2.4}
                            />
                          ) : (
                            <ArrowDownRight
                              size={13}
                              strokeWidth={2.4}
                            />
                          )}

                          <span>
                            {positive ? "+" : ""}
                            {ticker.changePercent.toFixed(2)}
                            %
                          </span>
                        </>
                      ) : (
                        <span>—</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="relative z-20 hidden shrink-0 border-l border-slate-800 bg-[#071019] px-5 py-3 2xl:block">
          <p className="text-[10px] uppercase tracking-wide text-slate-600">
            Last refreshed
          </p>

          <p className="mt-0.5 whitespace-nowrap text-xs text-slate-400">
            {lastUpdated || "Loading..."}
          </p>
        </div>
      </div>
    </section>
  );
}