import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Market Score | Swing Trading Market Conditions",

  description:
    "See the MaicaTrades Market Score, a simplified view of current market conditions using trend, momentum, sector strength, volatility, and market breadth confirmation.",

  alternates: {
    canonical: "/markets/market-score",
  },

  openGraph: {
    title: "MaicaTrades Market Score",
    description:
      "See current market conditions through the MaicaTrades Market Score, combining trend, momentum, sector strength, volatility, and market breadth confirmation.",
    url: "/markets/market-score",
    type: "website",
  },
};

export default function MarketScoreLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}