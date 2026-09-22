import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Stock Market Movers | Top Gainers, Losers & Most Active",

  description:
    "Track stock market movers with MaicaTrades Moving Now. See top gainers, top losers, and the most actively traded stocks across the MaicaTrades liquid-stock universe.",

  alternates: {
    canonical: "/markets/moving-now",
  },

  openGraph: {
    title: "Moving Now | Stock Market Movers | MaicaTrades",
    description:
      "Track top stock gainers, top losers, and the most actively traded stocks with MaicaTrades Moving Now.",
    url: "/markets/moving-now",
    type: "website",
  },
};

export default function MovingNowLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}