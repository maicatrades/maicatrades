"use client";

import {
  CalendarDays,
  ChevronDown,
  Clock3,
} from "lucide-react";
import { useEffect, useState } from "react";

const MARKET_TIME_ZONE = "America/New_York";

function getGreeting(date: Date) {
  const hour = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: MARKET_TIME_ZONE,
      hour: "2-digit",
      hourCycle: "h23",
    }).format(date),
  );

  if (hour < 12) return "Good Morning";
  if (hour < 18) return "Good Afternoon";

  return "Good Evening";
}

export default function DashboardHeader() {
  const [greeting, setGreeting] = useState("Good Morning");
  const [currentDate, setCurrentDate] = useState("");
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    function updateDateAndTime() {
      const now = new Date();

      setGreeting(getGreeting(now));

      setCurrentDate(
        now.toLocaleDateString("en-US", {
          timeZone: MARKET_TIME_ZONE,
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric",
        }),
      );

      setCurrentTime(
        now.toLocaleTimeString("en-US", {
          timeZone: MARKET_TIME_ZONE,
          hour: "numeric",
          minute: "2-digit",
          timeZoneName: "short",
        }),
      );
    }

    updateDateAndTime();

    const interval = window.setInterval(
      updateDateAndTime,
      60_000,
    );

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  return (
    <section className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-start">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">
          {greeting}, Davian! ☀️
        </h1>

        <p className="mt-1 text-sm text-slate-400">
          Here&apos;s your market game plan for today.
        </p>
      </div>

      <div className="text-left text-sm text-slate-300 md:text-right">
        <div className="flex items-center gap-2 md:justify-end">
          <CalendarDays size={16} />

          <span>
            {currentDate || "Loading date..."}
          </span>

          <ChevronDown size={15} />
        </div>

        <div className="mt-2 flex items-center gap-2 text-xs text-slate-500 md:justify-end">
          <span>
            Last updated: {currentTime || "Loading..."}
          </span>

          <Clock3 size={13} />
        </div>
      </div>
    </section>
  );
}