"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  ArrowRight,
  LoaderCircle,
} from "lucide-react";

type RawMarketPulseStatus =
  | "Bullish"
  | "Neutral"
  | "Watch"
  | "Low";

type DisplayStatus =
  | "Bullish"
  | "Constructive"
  | "Improving"
  | "Neutral"
  | "Weakening"
  | "Bearish"
  | "Watch"
  | "Low";

type ScoreTrend =
  | "Improving"
  | "Weakening"
  | "Stable"
  | "Unavailable";

type MarketPulseItem = {
  symbol: string;
  name: string;
  status: RawMarketPulseStatus;
  price: number;
  previousClose: number;
  change: number;
  changePercent: number;
  positive: boolean;
  description: string;
  trendDescription?: string;
  intradayDescription?: string;
};

type DisplayMarketPulseItem = MarketPulseItem & {
  displayStatus: DisplayStatus;
  displayDescription: string;
};

type MarketPulseResponse = {
  success: boolean;
  benchmarks?: MarketPulseItem[];
  error?: string;
  updatedAt?: string;
};

type MarketTickerItem = {
  symbol: string;
  changePercent: number | null;
  session: "PRE" | "REGULAR" | "AH";
  sessionLabel: "PRE" | "AH" | null;
};

type MarketTickerResponse = {
  success: boolean;
  data?: MarketTickerItem[];
};

type PremarketContext = {
  tone: "Risk-On" | "Mixed" | "Risk-Off";
  description: string;
  averageChange: number;
  positive: number;
  negative: number;
};

type MarketPulseProps = {
  marketScore?: number | null;
  marketLabel?: string | null;
  scoreTrend?: ScoreTrend | string | null;
  marketScoreLoading?: boolean;
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

function getStatusColor(status: DisplayStatus) {
  switch (status) {
    case "Bullish":
    case "Constructive":
    case "Improving":
    case "Low":
      return "text-emerald-400";

    case "Weakening":
    case "Bearish":
    case "Watch":
      return "text-red-400";

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

function getVixDisplay(item: MarketPulseItem): {
  status: DisplayStatus;
  description: string;
} {
  if (item.price >= 25 || item.changePercent >= 7) {
    return {
      status: "Watch",
      description:
        "Volatility is elevated or expanding. Keep position risk controlled.",
    };
  }

  if (item.price < 18 && item.changePercent <= 0) {
    return {
      status: "Low",
      description:
        "Volatility is subdued and currently supportive of risk assets.",
    };
  }

  if (item.changePercent > 0) {
    return {
      status: "Watch",
      description:
        "Volatility is rising. Avoid becoming overly aggressive.",
    };
  }

  return {
    status: "Neutral",
    description:
      "Volatility is contained, but conditions are not exceptionally calm.",
  };
}

function getBenchmarkDisplay(
  item: MarketPulseItem,
  marketScore?: number | null,
  scoreTrend?: string | null,
): {
  status: DisplayStatus;
  description: string;
} {
  if (marketScore === null || marketScore === undefined) {
    return {
      status: item.status,
      description: item.description,
    };
  }

  const isPositive = item.changePercent >= 0;
  const isStronglyPositive = item.changePercent >= 0.75;
  const isStronglyNegative = item.changePercent <= -0.75;

  if (marketScore >= 65) {
    if (isPositive) {
      return {
        status: "Bullish",
        description: isStronglyPositive
          ? "Price action confirms the broader bullish market environment."
          : "The broader trend remains constructive with buyers in control.",
      };
    }

    if (scoreTrend === "Weakening" || isStronglyNegative) {
      return {
        status: "Weakening",
        description:
          "The broader environment remains bullish, but near-term pressure is increasing.",
      };
    }

    return {
      status: "Constructive",
      description:
        "The broader trend is positive, though today’s price action is mixed.",
    };
  }

  if (marketScore >= 50) {
    if (scoreTrend === "Improving" && isPositive) {
      return {
        status: "Improving",
        description:
          "Conditions are strengthening, but confirmation is still developing.",
      };
    }

    if (scoreTrend === "Weakening" && !isPositive) {
      return {
        status: "Weakening",
        description:
          "Momentum is fading inside an otherwise mixed market environment.",
      };
    }

    return {
      status: "Neutral",
      description:
        "Market conditions are mixed. Stay selective and wait for confirmation.",
    };
  }

  if (scoreTrend === "Improving" && isPositive) {
    return {
      status: "Improving",
      description:
        "Price action is improving, but the broader environment remains defensive.",
    };
  }

  if (!isPositive || scoreTrend === "Weakening") {
    return {
      status: "Bearish",
      description:
        "Weak price action confirms a defensive broader market environment.",
    };
  }

  return {
    status: "Watch",
    description:
      "A positive session is not enough to reverse the broader bearish backdrop.",
  };
}

function buildDisplayItem(
  item: MarketPulseItem,
  marketScore?: number | null,
  scoreTrend?: string | null,
): DisplayMarketPulseItem {
  const display =
    item.symbol === "VIX"
      ? getVixDisplay(item)
      : getBenchmarkDisplay(
          item,
          marketScore,
          scoreTrend,
        );

  return {
    ...item,
    displayStatus: display.status,
    displayDescription: display.description,
  };
}

export default function MarketPulse({
  marketScore = null,
  marketLabel = null,
  scoreTrend = "Unavailable",
  marketScoreLoading = false,
}: MarketPulseProps) {
  const [items, setItems] = useState<MarketPulseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [premarketItems, setPremarketItems] = useState<
    MarketTickerItem[]
  >([]);

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

      /*
       * Premarket context is intentionally loaded from the isolated ticker
       * endpoint. It is display-only and never changes Market Pulse's
       * regular-session calculations or the official Market Score.
       */
      try {
        const tickerResponse = await fetch("/api/market-ticker", {
          method: "GET",
          cache: "no-store",
          headers: {
            Accept: "application/json",
          },
        });
        const tickerData =
          (await tickerResponse.json()) as MarketTickerResponse;

        if (tickerResponse.ok && tickerData.success) {
          setPremarketItems(
            tickerData.data?.filter(
              (item) =>
                item.session === "PRE" &&
                item.sessionLabel === "PRE" &&
                ["SPY", "QQQ", "IWM"].includes(item.symbol) &&
                item.changePercent !== null,
            ) ?? [],
          );
        } else {
          setPremarketItems([]);
        }
      } catch (tickerError) {
        console.warn(
          "Premarket context unavailable:",
          tickerError,
        );
        setPremarketItems([]);
      }
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

  const displayItems = useMemo(
    () =>
      items.map((item) =>
        buildDisplayItem(
          item,
          marketScore,
          scoreTrend,
        ),
      ),
    [items, marketScore, scoreTrend],
  );

  const premarketContext = useMemo<PremarketContext | null>(() => {
    const marketItems = premarketItems.filter(
      (item) => ["SPY", "QQQ", "IWM"].includes(item.symbol),
    );

    if (marketItems.length < 3) {
      return null;
    }

    const positive = marketItems.filter(
      (item) => (item.changePercent ?? 0) > 0,
    ).length;
    const negative = marketItems.filter(
      (item) => (item.changePercent ?? 0) < 0,
    ).length;
    const averageChange =
      marketItems.reduce(
        (sum, item) => sum + (item.changePercent ?? 0),
        0,
      ) / marketItems.length;

    if (positive >= 3 && averageChange >= 0.15) {
      return {
        tone: "Risk-On",
        description:
          "Index ETFs are broadly positive before the opening bell.",
        averageChange,
        positive,
        negative,
      };
    }

    if (negative >= 3 && averageChange <= -0.15) {
      return {
        tone: "Risk-Off",
        description:
          "Index ETFs are broadly lower before the opening bell.",
        averageChange,
        positive,
        negative,
      };
    }

    return {
      tone: "Mixed",
      description:
        "Premarket index signals are divided. Wait for clearer confirmation.",
      averageChange,
      positive,
      negative,
    };
  }, [premarketItems]);

  const contextText = marketScoreLoading
    ? "Aligning with Market Score..."
    : marketScore !== null
      ? `Aligned with Market Score ${marketScore}${marketLabel ? ` • ${marketLabel}` : ""}`
      : "Live benchmark conditions";

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

        <div className="border-b border-slate-800 px-4 py-2 text-[11px] text-slate-500">
          {contextText}
        </div>

        {premarketContext && (
          <div className="border-b border-sky-500/20 bg-sky-500/[0.06] px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-sky-400">
                  Pre-Market Context
                </span>
                <span className="rounded border border-sky-500/30 bg-sky-500/10 px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-sky-400">
                  PRE
                </span>
              </div>

              <span
                className={`text-xs font-semibold ${
                  premarketContext.tone === "Risk-On"
                    ? "text-emerald-400"
                    : premarketContext.tone === "Risk-Off"
                      ? "text-red-400"
                      : "text-yellow-400"
                }`}
              >
                {premarketContext.tone}
              </span>
            </div>

            <p className="mt-1.5 text-xs text-slate-400">
              {premarketContext.description}
            </p>

            <p className="mt-1 text-[10px] text-slate-500">
              {premarketContext.positive} positive ·{" "}
              {premarketContext.negative} negative · Average{" "}
              {premarketContext.averageChange >= 0 ? "+" : ""}
              {premarketContext.averageChange.toFixed(2)}%
            </p>
          </div>
        )}

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
            {displayItems.map((item) => (
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
                      item.displayStatus,
                    )}
                  >
                    {item.displayStatus}
                  </p>

                  <p className="truncate text-xs text-slate-500">
                    {item.displayDescription}
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
