import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://maicatrades.com"),

  title: {
    default: "MaicaTrades | Swing Trading Tools & Market Analysis",
    template: "%s | MaicaTrades",
  },

  description:
    "MaicaTrades gives busy swing traders a simplified view of the market through Market Score, market breadth, sector performance, trade ideas, watchlists, and risk-management tools.",

  applicationName: "MaicaTrades",

  keywords: [
    "swing trading",
    "swing trading tools",
    "market analysis",
    "market score",
    "market breadth",
    "sector performance",
    "stock watchlist",
    "trade ideas",
    "position size calculator",
    "risk management",
  ],

  authors: [
    {
      name: "MaicaTrades",
      url: "https://maicatrades.com",
    },
  ],

  creator: "MaicaTrades",
  publisher: "MaicaTrades",

  alternates: {
    canonical: "/",
  },

  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://maicatrades.com",
    siteName: "MaicaTrades",
    title: "MaicaTrades | Swing Trading Tools & Market Analysis",
    description:
      "Market intelligence, swing-trading tools, watchlists, trade ideas, and risk-management resources built for busy traders.",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "MaicaTrades swing trading tools and market analysis",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "MaicaTrades | Swing Trading Tools & Market Analysis",
    description:
      "Market intelligence, swing-trading tools, watchlists, trade ideas, and risk-management resources built for busy traders.",
    images: ["/opengraph-image.png"],
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },

  icons: {
    icon: "/maica-logo.png",
    shortcut: "/maica-logo.png",
    apple: "/maica-logo.png",
  },
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