"use client";

import Link from "next/link";
import { BarChart3, ChevronDown } from "lucide-react";

type SectorPerformanceItem = {
  name: string;
  symbol: string;
  price: number;
  previousClose: number;
  changePercent: number;
};

type SectorPerformanceProps = {
  sectors: SectorPerformanceItem[];
  loading: boolean;
};

function CardTitle({
  icon: Icon,
  children,
  action,
}: {
  icon?: React.ElementType;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
      <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-blue-400">
        {Icon && <Icon size={17} />}
        {children}
      </div>

      {action}
    </div>
  );
}

export default function SectorPerformance({
  sectors,
  loading,
}: SectorPerformanceProps) {
  return (
    <Link
      href="/markets/sectors"
      aria-label="View full sector performance"
      className="group block rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
    >
      <section className="overflow-hidden rounded-xl border border-slate-800 bg-[#09131d] shadow-[0_10px_30px_rgba(0,0,0,0.16)] transition duration-200 group-hover:-translate-y-1 group-hover:border-blue-500/60 group-hover:shadow-[0_16px_40px_rgba(0,0,0,0.28)]">
        <CardTitle
          icon={BarChart3}
          action={
            <div className="flex items-center gap-1 text-xs text-slate-400 transition group-hover:text-blue-400">
              Today
              <ChevronDown size={13} />
            </div>
          }
        >
          Sector Performance
        </CardTitle>

        <div className="space-y-3 px-5 py-4">
          {loading ? (
            <p className="py-6 text-center text-sm text-slate-500">
              Loading live sector performance...
            </p>
          ) : sectors.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-500">
              Sector performance is currently unavailable.
            </p>
          ) : (
            sectors.map((sector) => {
              const positive = sector.changePercent >= 0;

              const absoluteChange = Math.min(
                Math.abs(sector.changePercent),
                5,
              );

              const barWidth = Math.max(
                8,
                (absoluteChange / 5) * 100,
              );

              return (
                <div
                  key={sector.symbol}
                  className="grid grid-cols-[minmax(130px,1fr)_1fr_58px] items-center gap-3 text-xs"
                >
                  <span className="truncate text-slate-300">
                    {sector.name} ({sector.symbol})
                  </span>

                  <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        positive ? "bg-emerald-400" : "bg-red-500"
                      }`}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>

                  <span
                    className={
                      positive
                        ? "text-emerald-400"
                        : "text-red-400"
                    }
                  >
                    {positive ? "+" : ""}
                    {sector.changePercent.toFixed(2)}%
                  </span>
                </div>
              );
            })
          )}

          <div className="mt-2 border-t border-slate-800 pt-4 text-center text-sm text-blue-400 transition group-hover:text-blue-300">
            View Full Sector Map →
          </div>
        </div>
      </section>
    </Link>
  );
}