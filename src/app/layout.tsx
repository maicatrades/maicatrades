import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "MaicaTrades | Swing Trading Tools & Market Analysis",
  description:
    "MaicaTrades helps swing traders plan better with position sizing, live market data, watchlists, earnings research, IPO tracking, and sector rotation.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}