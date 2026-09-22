import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Swing Trading Dashboard | Market Analysis & Trading Tools",

  description:
    "Use the MaicaTrades swing trading dashboard to monitor Market Score, market breadth, sector performance, market news, economic catalysts, trade ideas, watchlists, and current market conditions.",

  alternates: {
    canonical: "/dashboard",
  },

  openGraph: {
    title: "Swing Trading Dashboard | MaicaTrades",
    description:
      "Monitor market conditions, Market Score, breadth, sectors, catalysts, trade ideas, watchlists, and other swing-trading insights in one dashboard.",
    url: "/dashboard",
    type: "website",
  },
};

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}