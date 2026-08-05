"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Activity,
  BarChart3,
  BriefcaseBusiness,
  CalendarDays,
  CircleDollarSign,
  Eye,
  Gauge,
  LayoutDashboard,
  LineChart,
  Newspaper,
  Wrench,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

type SidebarProps = {
  open: boolean;
  closeSidebar: () => void;
};

type MarketHoursState = {
  session:
    | "Pre-Market"
    | "Market Open"
    | "After Hours"
    | "Market Closed";
  countdown: string;
  eventLabel: string;
  nextEventTime: string;
  isMarketOpen: boolean;
};

const navigation = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
  },
  {
    label: "Market Overview",
    icon: Activity,
    href: "/markets/market-pulse",
  },
  {
    label: "Sectors",
    icon: BarChart3,
    href: "/markets/sectors",
  },
  {
    label: "Watchlists",
    icon: Eye,
    href: "/markets/watchlist",
  },
  {
    label: "Trade Setups",
    icon: LineChart,
    href: "/markets/trade-idea",
  },
  {
    label: "News",
    icon: Newspaper,
    href: "/markets/news",
  },
  {
    label: "Calendar",
    icon: CalendarDays,
    href: "/markets/calendar",
  },
  {
    label: "Tools",
    icon: Wrench,
    href: "/tools/position-size",
  },
];

const MARKET_TIME_ZONE = "America/New_York";
const MARKET_OPEN_MINUTES = 9 * 60 + 30;
const MARKET_CLOSE_MINUTES = 16 * 60;

function SidebarCard({
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

function getNewYorkParts(date: Date) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: MARKET_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });

  const parts = formatter.formatToParts(date);

  const getPart = (type: Intl.DateTimeFormatPartTypes) =>
    Number(
      parts.find((part) => part.type === type)?.value ?? 0,
    );

  return {
    year: getPart("year"),
    month: getPart("month"),
    day: getPart("day"),
    hour: getPart("hour"),
    minute: getPart("minute"),
    second: getPart("second"),
  };
}

function getTimeZoneOffset(date: Date) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: MARKET_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });

  const parts = formatter.formatToParts(date);
  const values: Record<string, number> = {};

  for (const part of parts) {
    if (part.type !== "literal") {
      values[part.type] = Number(part.value);
    }
  }

  const representedTime = Date.UTC(
    values.year,
    values.month - 1,
    values.day,
    values.hour,
    values.minute,
    values.second,
  );

  return representedTime - date.getTime();
}

function createNewYorkDate(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
) {
  const desiredTime = Date.UTC(
    year,
    month - 1,
    day,
    hour,
    minute,
    0,
  );

  let utcTime = desiredTime;

  for (let index = 0; index < 3; index += 1) {
    const offset = getTimeZoneOffset(new Date(utcTime));
    utcTime = desiredTime - offset;
  }

  return new Date(utcTime);
}

function isWeekday(
  year: number,
  month: number,
  day: number,
) {
  const dayOfWeek = new Date(
    Date.UTC(year, month - 1, day),
  ).getUTCDay();

  return dayOfWeek >= 1 && dayOfWeek <= 5;
}

function getNextTradingDay(
  year: number,
  month: number,
  day: number,
  includeToday: boolean,
) {
  const date = new Date(
    Date.UTC(year, month - 1, day),
  );

  if (!includeToday) {
    date.setUTCDate(date.getUTCDate() + 1);
  }

  while (
    !isWeekday(
      date.getUTCFullYear(),
      date.getUTCMonth() + 1,
      date.getUTCDate(),
    )
  ) {
    date.setUTCDate(date.getUTCDate() + 1);
  }

  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  };
}

function getTradingDayLabel(
  targetYear: number,
  targetMonth: number,
  targetDay: number,
  currentYear: number,
  currentMonth: number,
  currentDay: number,
) {
  const targetDate = new Date(
    Date.UTC(
      targetYear,
      targetMonth - 1,
      targetDay,
    ),
  );

  const currentDate = new Date(
    Date.UTC(
      currentYear,
      currentMonth - 1,
      currentDay,
    ),
  );

  const differenceInDays = Math.round(
    (targetDate.getTime() - currentDate.getTime()) /
      86_400_000,
  );

  if (differenceInDays === 0) {
    return "Today";
  }

  if (differenceInDays === 1) {
    return "Tomorrow";
  }

  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    timeZone: "UTC",
  }).format(targetDate);
}

function formatCountdown(milliseconds: number) {
  const totalSeconds = Math.max(
    0,
    Math.floor(milliseconds / 1000),
  );

  const days = Math.floor(totalSeconds / 86_400);

  const hours = Math.floor(
    (totalSeconds % 86_400) / 3_600,
  );

  const minutes = Math.floor(
    (totalSeconds % 3_600) / 60,
  );

  const seconds = totalSeconds % 60;

  const hourText = String(hours).padStart(2, "0");
  const minuteText = String(minutes).padStart(2, "0");
  const secondText = String(seconds).padStart(2, "0");

  if (days > 0) {
    return `${days}d ${hourText}:${minuteText}:${secondText}`;
  }

  return `${hourText}:${minuteText}:${secondText}`;
}

function calculateMarketHours(
  now: Date,
): MarketHoursState {
  const newYork = getNewYorkParts(now);

  const currentMinutes =
    newYork.hour * 60 + newYork.minute;

  const weekday = isWeekday(
    newYork.year,
    newYork.month,
    newYork.day,
  );

  let session: MarketHoursState["session"];
  let eventLabel: string;
  let nextEventTime: string;
  let targetDate: Date;
  let isMarketOpen = false;

  if (
    weekday &&
    currentMinutes < MARKET_OPEN_MINUTES
  ) {
    session = "Pre-Market";
    eventLabel = "Opens Today";
    nextEventTime = "9:30 AM ET";

    targetDate = createNewYorkDate(
      newYork.year,
      newYork.month,
      newYork.day,
      9,
      30,
    );
  } else if (
    weekday &&
    currentMinutes >= MARKET_OPEN_MINUTES &&
    currentMinutes < MARKET_CLOSE_MINUTES
  ) {
    session = "Market Open";
    eventLabel = "Closes Today";
    nextEventTime = "4:00 PM ET";
    isMarketOpen = true;

    targetDate = createNewYorkDate(
      newYork.year,
      newYork.month,
      newYork.day,
      16,
      0,
    );
  } else {
    session = weekday
      ? "After Hours"
      : "Market Closed";

    nextEventTime = "9:30 AM ET";

    const nextTradingDay = getNextTradingDay(
      newYork.year,
      newYork.month,
      newYork.day,
      !weekday,
    );

    const tradingDayLabel = getTradingDayLabel(
      nextTradingDay.year,
      nextTradingDay.month,
      nextTradingDay.day,
      newYork.year,
      newYork.month,
      newYork.day,
    );

    eventLabel = `Opens ${tradingDayLabel}`;

    targetDate = createNewYorkDate(
      nextTradingDay.year,
      nextTradingDay.month,
      nextTradingDay.day,
      9,
      30,
    );
  }

  return {
    session,
    eventLabel,
    nextEventTime,
    isMarketOpen,
    countdown: formatCountdown(
      targetDate.getTime() - now.getTime(),
    ),
  };
}

function MarketHoursCard() {
  const [marketHours, setMarketHours] =
    useState<MarketHoursState | null>(null);

  useEffect(() => {
    function updateMarketHours() {
      setMarketHours(
        calculateMarketHours(new Date()),
      );
    }

    updateMarketHours();

    const interval = window.setInterval(
      updateMarketHours,
      1000,
    );

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  const statusColor = marketHours?.isMarketOpen
    ? "text-emerald-400"
    : marketHours?.session === "Pre-Market"
      ? "text-blue-400"
      : marketHours?.session === "After Hours"
        ? "text-amber-400"
        : "text-red-400";

  const dotColor = marketHours?.isMarketOpen
    ? "bg-emerald-400"
    : marketHours?.session === "Pre-Market"
      ? "bg-blue-400"
      : marketHours?.session === "After Hours"
        ? "bg-amber-400"
        : "bg-red-400";

  return (
    <SidebarCard className="p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        Market Hours
      </p>

      <div
        className={`mt-4 flex items-center gap-2 text-sm font-medium ${statusColor}`}
      >
        <span
          className={`h-2.5 w-2.5 rounded-full ${dotColor} ${
            marketHours?.isMarketOpen
              ? "animate-pulse"
              : ""
          }`}
        />

        {marketHours?.session ?? "Loading..."}
      </div>

      <p className="mt-4 text-xs font-medium uppercase tracking-wide text-slate-400">
        {marketHours?.eventLabel ??
          "Loading session"}
      </p>

      <p className="mt-1 font-mono text-3xl font-semibold tracking-tight text-slate-100">
        {marketHours?.countdown ?? "00:00:00"}
      </p>

      <div className="mt-4 border-t border-slate-800 pt-3">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
          Next Event
        </p>

        <p className="mt-1 text-sm text-slate-300">
          {marketHours?.nextEventTime ??
            "9:30 AM ET"}
        </p>
      </div>
    </SidebarCard>
  );
}

export default function Sidebar({
  open,
  closeSidebar,
}: SidebarProps) {
  const pathname = usePathname();

  function handleNavigation() {
    if (window.innerWidth < 1024) {
      closeSidebar();
    }
  }

  return (
    <>
      {open && (
        <button
          type="button"
          onClick={closeSidebar}
          className="fixed inset-0 z-40 bg-black/70 lg:hidden"
          aria-label="Close sidebar overlay"
        />
      )}

      <aside
        className={`fixed bottom-0 left-0 top-16 z-50 w-64 overflow-y-auto border-r border-slate-800 bg-[#071019] transition-transform lg:static lg:z-auto lg:block lg:w-60 lg:translate-x-0 ${
          open
            ? "translate-x-0"
            : "-translate-x-full"
        }`}
      >
        <div className="p-3 lg:hidden">
          <button
            type="button"
            onClick={closeSidebar}
            className="ml-auto flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 text-slate-300"
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="space-y-1 p-3">
          {navigation.map((item) => {
            const Icon = item.icon;

            const isActive =
              item.href === "/dashboard"
                ? pathname === item.href
                : pathname === item.href ||
                  pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={handleNavigation}
                aria-current={isActive ? "page" : undefined}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                  isActive
                    ? "bg-blue-600/25 text-white"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Icon
                  size={18}
                  className={isActive ? "text-blue-400" : ""}
                />

                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-800 p-4">
          <MarketHoursCard />
        </div>

        <div className="px-4 pb-4">
          <SidebarCard className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Quick Links
            </p>

            <div className="mt-4 space-y-3 text-sm">
              <Link
                href="/markets/calendar"
                onClick={handleNavigation}
                className="flex items-center gap-2 text-slate-400 transition hover:text-white focus:outline-none focus-visible:text-white"
              >
                <CalendarDays size={15} />
                Economic Calendar
              </Link>

              <div
                className="flex items-center justify-between gap-3 text-slate-600"
                aria-disabled="true"
              >
                <span className="flex items-center gap-2">
                  <BriefcaseBusiness size={15} />
                  Earnings Calendar
                </span>

                <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                  Soon
                </span>
              </div>

              <div
                className="flex items-center justify-between gap-3 text-slate-600"
                aria-disabled="true"
              >
                <span className="flex items-center gap-2">
                  <Gauge size={15} />
                  Fed Watch
                </span>

                <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                  Soon
                </span>
              </div>

              <div
                className="flex items-center justify-between gap-3 text-slate-600"
                aria-disabled="true"
              >
                <span className="flex items-center gap-2">
                  <CircleDollarSign size={15} />
                  Coin Market Cap
                </span>

                <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                  Soon
                </span>
              </div>
            </div>
          </SidebarCard>
        </div>

        <div className="px-4 pb-6">
          <SidebarCard className="p-5">
            <p className="text-4xl leading-none text-slate-300">
              “
            </p>

            <blockquote className="mt-3 text-sm leading-6 text-slate-200">
              The goal is not to predict the future,
              but to prepare for it.
            </blockquote>

            <p className="mt-4 text-right text-xs text-slate-400">
              — Davian
            </p>
          </SidebarCard>
        </div>
      </aside>
    </>
  );
}