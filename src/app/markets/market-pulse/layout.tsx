import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Market Pulse | Stock Market Conditions",

  description:
    "Get a quick snapshot of current U.S. market conditions with MaicaTrades Market Pulse, including trend, momentum, volatility, benchmark status, and overall market tone.",

  alternates: {
    canonical: "/markets/market-pulse",
  },

  openGraph: {
    title: "Market Pulse | MaicaTrades",
    description:
      "Review current U.S. market conditions across major benchmarks using trend, momentum, volatility, and market tone.",
    url: "/markets/market-pulse",
    type: "website",
  },
};

export default function MarketPulseLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}