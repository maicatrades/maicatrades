"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  AlertCircle,
  ArrowRight,
  LoaderCircle,
} from "lucide-react";

type MarketPulseItem = {
  symbol: string;
  name: string;
  status: "Bullish" | "Neutral" | "Watch" | "Low";
  price: number;
  previousClose: number;
  change: number;
  changePercent: number;
  positive: boolean;
  description: string;
  trendDescription?: string;
  intradayDescription?: string;
};

type MarketPulseResponse = {
  success: boolean;
  benchmarks?: MarketPulseItem[];
  error?: string;
  updatedAt?: string;
};

const DISPLAY_SYMBOLS = ["SPY", "QQQ", "IWM", "VIX"];

function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-xl border border-slate-800 bg-[#09131d] shadow-[0_10px_30px_rgba(0,0,0,0.16)] ${className}`}
    >
      {children}
    </section>
  );
}

function CardTitle({
  icon: Icon,
  children,
}: {
  icon?: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
      <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-blue-400">
        {Icon && <Icon size={17} />}
        {children}
      </div>

      <ArrowRight
        size={16}
        className="text-slate-500 transition group-hover:translate-x-1 group-hover:text-blue-400"
      />
    </div>
  );
}

function getStatusColor(status: MarketPulseItem["status"]) {
  switch (status) {
    case "Bullish":
      return "text-emerald-400";

    case "Watch":
      return "text-red-400";

    case "Low":
      return "text-emerald-400";

    case "Neutral":
    default:
      return "text-yellow-400";
  }
}

function getDotColor(item: MarketPulseItem) {
  if (item.symbol === "VIX") {
    return item.changePercent > 0
      ? "border-red-400"
      : "border-emerald-400";
  }

  return item.changePercent >= 0
    ? "border-emerald-400"
    : "border-red-400";
}

function ChangeText({
  item,
}: {
  item: MarketPulseItem;
}) {
  const isVix = item.symbol === "VIX";

  const favorable = isVix
    ? item.changePercent <= 0
    : item.changePercent >= 0;

  const formattedChange = `${item.changePercent >= 0 ? "+" : ""}${item.changePercent.toFixed(2)}%`;

  return (
    <span
      className={
        favorable
          ? "font-medium text-emerald-400"
          : "font-medium text-red-400"
      }
    >
      {formattedChange}
    </span>
  );
}

export default function MarketPulse() {
  const [items, setItems] = useState<MarketPulseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMarketPulse = useCallback(async () => {
    try {
      setError(null);

      const response = await fetch("/api/market-pulse", {
        method: "GET",
        cache: "no-store",
        headers: {
          Accept: "application/json",
        },
      });

      const data =
        (await response.json()) as MarketPulseResponse;

      if (!response.ok || !data.success) {
        throw new Error(
          data.error ??
            "Unable to load Market Pulse.",
        );
      }

      const displayedItems =
        data.benchmarks
          ?.filter((item) =>
            DISPLAY_SYMBOLS.includes(item.symbol),
          )
          .sort(
            (firstItem, secondItem) =>
              DISPLAY_SYMBOLS.indexOf(
                firstItem.symbol,
              ) -
              DISPLAY_SYMBOLS.indexOf(
                secondItem.symbol,
              ),
          ) ?? [];

      if (displayedItems.length === 0) {
        throw new Error(
          "No Market Pulse data was returned.",
        );
      }

      setItems(displayedItems);
    } catch (loadError) {
      console.error(
        "Dashboard Market Pulse error:",
        loadError,
      );

      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load Market Pulse.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMarketPulse();

    const refreshInterval = window.setInterval(
      () => {
        void loadMarketPulse();
      },
      15 * 60 * 1000,
    );

    return () => {
      window.clearInterval(refreshInterval);
    };
  }, [loadMarketPulse]);

  return (
    <Link
      href="/markets/market-pulse"
      aria-label="View full market pulse"
      className="group block rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
    >
      <Card className="h-full transition duration-200 group-hover:-translate-y-1 group-hover:border-blue-500/60 group-hover:shadow-[0_16px_40px_rgba(0,0,0,0.28)]">
        <CardTitle icon={Activity}>
          Market Pulse
        </CardTitle>

        {loading && items.length === 0 ? (
          <div className="flex min-h-[300px] items-center justify-center px-4">
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <LoaderCircle
                size={18}
                className="animate-spin text-blue-400"
              />

              Loading market data...
            </div>
          </div>
        ) : error && items.length === 0 ? (
          <div className="flex min-h-[300px] items-center justify-center px-6 text-center">
            <div>
              <AlertCircle
                size={24}
                className="mx-auto mb-3 text-red-400"
              />

              <p className="text-sm font-medium text-red-400">
                Market Pulse unavailable
              </p>

              <p className="mt-1 text-xs text-slate-500">
                {error}
              </p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-800 px-4">
            {items.map((item) => (
              <div
                key={item.symbol}
                className="grid grid-cols-[60px_1fr_auto] items-center gap-3 py-4"
              >
                <div className="flex items-center gap-2 font-semibold">
                  <span
                    className={`h-3 w-3 rounded-full border-2 ${getDotColor(item)}`}
                  />

                  {item.symbol}
                </div>

                <div className="min-w-0">
                  <p
                    className={getStatusColor(
                      item.status,
                    )}
                  >
                    {item.status}
                  </p>

                  <p className="truncate text-xs text-slate-500">
                    {item.description}
                  </p>
                </div>

                <ChangeText item={item} />
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between border-t border-slate-800 px-4 py-4 text-sm font-medium text-blue-400">
          <span>View Full Market Pulse</span>

          <ArrowRight
            size={15}
            className="transition group-hover:translate-x-1"
          />
        </div>
      </Card>
    </Link>
  );
}