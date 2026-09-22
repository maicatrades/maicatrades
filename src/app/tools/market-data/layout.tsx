import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Stock Market Data | Stock Quote & Company Research",

  description:
    "Search stocks with MaicaTrades to view current prices, daily performance, company details, valuation metrics, 52-week ranges, recent market news, and more.",

  alternates: {
    canonical: "/tools/market-data",
  },

  openGraph: {
    title: "Stock Market Data & Stock Quotes | MaicaTrades",
    description:
      "Search stocks and review current prices, company information, valuation metrics, 52-week ranges, and recent market news.",
    url: "/tools/market-data",
    type: "website",
  },
};

export default function MarketDataLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}