import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Swing Trade Idea | Market-Aligned Trade Setup",

  description:
    "Review the current MaicaTrades swing trade idea, including the setup, entry level, stop loss, target, risk-to-reward, technical indicators, and trade management plan.",

  alternates: {
    canonical: "/markets/trade-idea",
  },

  openGraph: {
    title: "Swing Trade Idea | MaicaTrades",
    description:
      "Review the current market-aligned swing trade setup with entry, stop loss, target, risk-to-reward, technical context, and trade management plan.",
    url: "/markets/trade-idea",
    type: "website",
  },
};

export default function TradeIdeaLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}