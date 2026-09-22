import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Stock Market News | News for Swing Traders",

  description:
    "Follow market-moving news with MaicaTrades, including economic developments, technology and semiconductor news, earnings, commodities, and headlines relevant to active swing traders.",

  alternates: {
    canonical: "/markets/news",
  },

  openGraph: {
    title: "Stock Market News for Swing Traders | MaicaTrades",
    description:
      "Follow ranked market headlines, economic developments, earnings, technology news, and other market-moving stories relevant to swing traders.",
    url: "/markets/news",
    type: "website",
  },
};

export default function MarketNewsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}