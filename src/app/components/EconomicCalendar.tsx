"use client";

import Link from "next/link";
import { CalendarDays } from "lucide-react";

type CalendarEvent = {
  time: string;
  title: string;
  impact: string;
};

type EconomicCalendarProps = {
  events: CalendarEvent[];
};

const MAX_DASHBOARD_EVENTS = 5;

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
    </div>
  );
}

function getImpactPriority(impact: string) {
  const normalizedImpact = impact.toLowerCase();

  if (normalizedImpact === "high") return 0;
  if (normalizedImpact === "medium") return 1;
  if (normalizedImpact === "low") return 2;

  return 3;
}

function getImpactColor(impact: string) {
  const normalizedImpact = impact.toLowerCase();

  if (normalizedImpact === "high") {
    return "text-red-400";
  }

  if (normalizedImpact === "medium") {
    return "text-yellow-400";
  }

  return "text-slate-400";
}

export default function EconomicCalendar({
  events,
}: EconomicCalendarProps) {
  const dashboardEvents = [...events]
    .sort(
      (firstEvent, secondEvent) =>
        getImpactPriority(firstEvent.impact) -
        getImpactPriority(secondEvent.impact),
    )
    .slice(0, MAX_DASHBOARD_EVENTS);

  return (
    <Link
      href="/markets/calendar"
      aria-label="View full economic calendar"
      className="group block rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
    >
      <section className="overflow-hidden rounded-xl border border-slate-800 bg-[#09131d] shadow-[0_10px_30px_rgba(0,0,0,0.16)] transition duration-200 group-hover:-translate-y-1 group-hover:border-blue-500/60 group-hover:shadow-[0_16px_40px_rgba(0,0,0,0.28)]">
        <CardTitle icon={CalendarDays}>Economic Calendar</CardTitle>

        <div className="p-4">
          {dashboardEvents.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-500">
              No upcoming economic events are currently available.
            </div>
          ) : (
            <div className="space-y-5">
              {dashboardEvents.map((event) => (
                <div
                  key={`${event.time}-${event.title}`}
                  className="grid grid-cols-[70px_1fr_auto] items-center gap-3 text-xs"
                >
                  <span className="text-slate-500">{event.time}</span>

                  <span className="line-clamp-2 text-slate-200">
                    {event.title}
                  </span>

                  <span className={getImpactColor(event.impact)}>
                    {event.impact}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 border-t border-slate-800 pt-4 text-center text-sm text-blue-400 transition group-hover:text-blue-300">
            View Full Calendar →
          </div>
        </div>
      </section>
    </Link>
  );
}