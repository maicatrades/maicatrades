export type NewsCategory =
  | "Market News"
  | "Technology"
  | "Commodities"
  | "Economy";

export type NewsTone =
  | "positive"
  | "highlight"
  | "negative"
  | "neutral";

export type NewsArticle = {
  id: string;
  headline: string;
  time: string;
  timeAgo: string;
  category: NewsCategory;
  summary: string;
  tone: NewsTone;
  source: string;
  sourceUrl: string;
};

export const marketNews: NewsArticle[] = [
 {
  id: "ai-demand-tech-value",

  headline:
    "AI demand and earnings optimism lift technology giants' market value",

  time: "Today",
  timeAgo: "Today",

  category: "Technology",

  summary:
    "Strong AI demand and upbeat earnings expectations helped lift the market value of several major technology companies, reinforcing investor confidence in the AI sector.",

  tone: "positive",

  source: "Yahoo Finance",

  sourceUrl:
    "https://finance.yahoo.com/sectors/technology/articles/ai-demand-earnings-optimism-lift-145850324.html",
},
  {
    id: "ai-chipmakers-nvda",
    headline: "AI demand boosts chipmakers as NVDA leads rally",
    time: "32 minutes ago",
    timeAgo: "32m",
    category: "Technology",
    summary:
      "Semiconductor stocks continued to outperform as AI-related spending remained a dominant market theme.",
    tone: "highlight",
    source: "Yahoo Finance",
    sourceUrl: "https://finance.yahoo.com/quote/NVDA/news/",
  },
  {
    id: "oil-demand-outlook",
    headline: "Oil prices fall on weaker demand outlook",
    time: "1 hour ago",
    timeAgo: "1h",
    category: "Commodities",
    summary:
      "Crude oil declined after updated forecasts suggested slowing global demand growth.",
    tone: "negative",
    source: "Yahoo Finance",
    sourceUrl: "https://finance.yahoo.com/markets/commodities/",
  },
  {
    id: "interest-rate-expectations",
    headline:
      "Investors monitor economic data and interest-rate expectations",
    time: "2 hours ago",
    timeAgo: "2h",
    category: "Economy",
    summary:
      "Treasury yields and rate-sensitive sectors remained in focus as traders assessed the outlook for inflation and monetary policy.",
    tone: "neutral",
    source: "Yahoo Finance",
    sourceUrl: "https://finance.yahoo.com/topic/economic-news/",
  },
  {
    id: "growth-stocks-momentum",
    headline: "Growth stocks outperform as market momentum improves",
    time: "3 hours ago",
    timeAgo: "3h",
    category: "Market News",
    summary:
      "Large-cap growth stocks gained ground while broader market participation showed signs of improvement.",
    tone: "positive",
    source: "Yahoo Finance",
    sourceUrl: "https://finance.yahoo.com/news/",
  },
];

export const dashboardNews = marketNews.slice(0, 3);