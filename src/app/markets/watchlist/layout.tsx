import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Stock Watchlist | Swing Trading Watchlist",

  description:
    "Follow the MaicaTrades stock watchlist with current prices, daily movement, market status, and trading notes for stocks being monitored by swing traders.",

  alternates: {
    canonical: "/markets/watchlist",
  },

  openGraph: {
    title: "Swing Trading Stock Watchlist | MaicaTrades",
    description:
      "Track stocks on the MaicaTrades radar with current prices, daily movement, market status, and trading notes.",
    url: "/markets/watchlist",
    type: "website",
  },
};

export default function WatchlistLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}