import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Economic Calendar | Weekly Market Catalysts",

  description:
    "Track this week's major economic releases and Federal Reserve events with MaicaTrades. Review high-impact market catalysts that may affect volatility, interest rates, and stock market direction.",

  alternates: {
    canonical: "/markets/calendar",
  },

  openGraph: {
    title: "Economic Calendar & Market Catalysts | MaicaTrades",
    description:
      "Review this week's major economic releases, Federal Reserve events, and market catalysts that may affect volatility and market direction.",
    url: "/markets/calendar",
    type: "website",
  },
};

export default function CalendarLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}