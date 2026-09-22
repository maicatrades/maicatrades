import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sector Performance | Stock Market Sector Rankings",

  description:
    "Track the performance of the 11 major S&P 500 sectors with MaicaTrades. See leading and weakest sectors, sector rankings, market participation, and sector rotation analysis.",

  alternates: {
    canonical: "/markets/sectors",
  },

  openGraph: {
    title: "Sector Performance | MaicaTrades",
    description:
      "Compare the 11 major S&P 500 sectors, identify market leadership, and monitor sector rotation and participation.",
    url: "/markets/sectors",
    type: "website",
  },
};

export default function SectorsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}