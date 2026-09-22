import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Position Size Calculator | Stock Risk Calculator",

  description:
    "Free stock position size calculator for swing traders. Calculate shares to buy, risk per trade, maximum loss, buying power, capital required, potential profit, and risk-to-reward before entering a trade.",

  alternates: {
    canonical: "/tools/position-size",
  },

  openGraph: {
    title: "Free Position Size Calculator | MaicaTrades",
    description:
      "Calculate stock position size, risk per trade, maximum loss, buying power, potential profit, and risk-to-reward with the free MaicaTrades Position Size Calculator.",
    url: "/tools/position-size",
    type: "website",
  },
};

export default function PositionSizeLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}