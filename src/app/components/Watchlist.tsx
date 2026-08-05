"use client";

import Link from "next/link";
import { ArrowRight, ListChecks } from "lucide-react";

type Status =
  | "Bullish"
  | "Extended"
  | "Neutral"
  | "Watch"
  | "Weak";

type WatchlistItem = {
  symbol: string;
  price: string;
  change: string;
  status: Status;
  note?: string;
};

type WatchlistProps = {
  items: WatchlistItem[];
};

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

      <div className="flex items-center gap-2 text-sm text-blue-400">
        <span>View All</span>

        <ArrowRight
          size={16}
          className="transition group-hover:translate-x-1"
        />
      </div>
    </div>
  );
}

function ChangeText({ value }: { value: string }) {
  const numericValue = Number(
    value.replace("%", "").replace("+", ""),
  );

  const positive = numericValue > 0;
  const negative = numericValue < 0;

  const textColor = positive
    ? "text-emerald-400"
    : negative
      ? "text-red-400"
      : "text-slate-400";

  return (
    <span className={`font-medium ${textColor}`}>
      {value}
    </span>
  );
}

function StatusBadge({
  status,
  note,
}: {
  status: Status;
  note?: string;
}) {
  const styles: Record<Status, string> = {
    Bullish:
      "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
    Extended:
      "border-orange-500/30 bg-orange-500/10 text-orange-400",
    Neutral:
      "border-slate-600 bg-slate-800/70 text-slate-300",
    Watch:
      "border-blue-500/30 bg-blue-500/10 text-blue-400",
    Weak:
      "border-red-500/30 bg-red-500/10 text-red-400",
  };

  const dotStyles: Record<Status, string> = {
    Bullish: "bg-emerald-400",
    Extended: "bg-orange-400",
    Neutral: "bg-slate-400",
    Watch: "bg-blue-400",
    Weak: "bg-red-400",
  };

  return (
    <span
      title={note}
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${styles[status]}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${dotStyles[status]}`}
      />

      {status}
    </span>
  );
}

export default function Watchlist({
  items,
}: WatchlistProps) {
  return (
    <Link
      href="/markets/watchlist"
      aria-label="View full watchlist"
      className="group block rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
    >
      <Card className="h-full overflow-hidden transition duration-200 group-hover:-translate-y-1 group-hover:border-blue-500/60 group-hover:shadow-[0_16px_40px_rgba(0,0,0,0.28)]">
        <CardTitle icon={ListChecks}>
          My Watchlist
        </CardTitle>

        <div className="overflow-x-auto p-4">
          {items.length === 0 ? (
            <div className="py-10 text-center text-sm text-slate-500">
              No watchlist data is currently available.
            </div>
          ) : (
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead className="text-xs text-slate-500">
                <tr>
                  <th className="pb-3 font-normal">
                    Symbol
                  </th>

                  <th className="pb-3 font-normal">
                    Price
                  </th>

                  <th className="pb-3 font-normal">
                    % Change
                  </th>

                  <th className="pb-3 font-normal">
                    Setup Status
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-800">
                {items.map((stock) => (
                  <tr
                    key={stock.symbol}
                    title={stock.note}
                    className="transition hover:bg-slate-800/30"
                  >
                    <td className="py-3 font-semibold text-white">
                      {stock.symbol}
                    </td>

                    <td className="py-3 text-slate-300">
                      {stock.price}
                    </td>

                    <td className="py-3">
                      <ChangeText value={stock.change} />
                    </td>

                    <td className="py-3">
                      <StatusBadge
                        status={stock.status}
                        note={stock.note}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-slate-800 px-4 py-4 text-sm font-medium text-blue-400">
          <span>Manage Watchlist</span>

          <ArrowRight
            size={15}
            className="transition group-hover:translate-x-1"
          />
        </div>
      </Card>
    </Link>
  );
}