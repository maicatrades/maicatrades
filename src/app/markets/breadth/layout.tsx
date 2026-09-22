import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Market Breadth | Stock Market Participation",

  description:
    "Track stock market breadth with MaicaTrades. See advancing and declining stocks, sector participation, moving-average breadth, market leadership, and the advance-decline trend.",

  alternates: {
    canonical: "/markets/breadth",
  },

  openGraph: {
    title: "Market Breadth | MaicaTrades",
    description:
      "See whether stock market moves are broadly supported using advancing stocks, sector participation, moving-average breadth, market leadership, and the advance-decline trend.",
    url: "/markets/breadth",
    type: "website",
  },
};

export default function MarketBreadthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}