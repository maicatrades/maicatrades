import { NextResponse } from "next/server";

type FinnhubArticle = {
  category?: string;
  datetime?: number;
  headline?: string;
  id?: number;
  image?: string;
  related?: string;
  source?: string;
  summary?: string;
  url?: string;
};

export type LiveNewsArticle = {
  id: string;
  headline: string;
  summary: string;
  source: string;
  sourceUrl: string;
  category: "Market News" | "Technology" | "Economy" | "Commodities";
  tone: "positive" | "negative" | "highlight" | "neutral";
  publishedAt: string;
};

type RankedArticle = {
  article: FinnhubArticle;
  score: number;
};

function getArticleText(article: FinnhubArticle) {
  return `${article.category ?? ""} ${article.headline ?? ""} ${
    article.summary ?? ""
  } ${article.related ?? ""}`.toLowerCase();
}

function containsAny(text: string, terms: string[]) {
  return terms.some((term) => text.includes(term));
}

function getCategory(article: FinnhubArticle): LiveNewsArticle["category"] {
  const text = getArticleText(article);

  const economyTerms = [
    "federal reserve",
    "fomc",
    "interest rate",
    "rate cut",
    "rate hike",
    "inflation",
    "consumer price index",
    "producer price index",
    "cpi",
    "ppi",
    "jobs report",
    "nonfarm payroll",
    "unemployment",
    "jobless claims",
    "treasury yield",
    "bond yield",
    "gdp",
    "retail sales",
    "consumer confidence",
    "recession",
  ];

  const commodityTerms = [
    "crude oil",
    "oil prices",
    "brent",
    "wti",
    "natural gas",
    "gold prices",
    "silver prices",
    "copper prices",
    "opec",
    "commodities",
  ];

  const technologyTerms = [
    "technology stocks",
    "tech stocks",
    "semiconductor",
    "chip stocks",
    "artificial intelligence",
    "nvidia",
    "nvda",
    "apple",
    "aapl",
    "microsoft",
    "msft",
    "amazon",
    "amzn",
    "alphabet",
    "google",
    "googl",
    "meta",
    "tesla",
    "tsla",
    "broadcom",
    "avgo",
    "advanced micro devices",
    "amd",
    "palantir",
    "pltr",
  ];

  if (containsAny(text, economyTerms)) {
    return "Economy";
  }

  if (containsAny(text, commodityTerms)) {
    return "Commodities";
  }

  if (containsAny(text, technologyTerms)) {
    return "Technology";
  }

  return "Market News";
}

function getTone(article: FinnhubArticle): LiveNewsArticle["tone"] {
  const text = getArticleText(article);

  const positiveTerms = [
    "rallies",
    "rally",
    "surges",
    "surge",
    "soars",
    "jumps",
    "gains",
    "rises",
    "higher",
    "rebounds",
    "breakout",
    "record high",
    "all-time high",
    "beats estimates",
    "raises guidance",
    "upgrade",
    "price target raised",
    "bullish",
  ];

  const negativeTerms = [
    "selloff",
    "sell-off",
    "plunges",
    "tumbles",
    "falls",
    "drops",
    "declines",
    "lower",
    "breakdown",
    "misses estimates",
    "cuts guidance",
    "downgrade",
    "price target cut",
    "recession",
    "bearish",
  ];

  if (containsAny(text, positiveTerms)) {
    return "positive";
  }

  if (containsAny(text, negativeTerms)) {
    return "negative";
  }

  const highlightTerms = [
    "federal reserve",
    "fomc",
    "inflation",
    "cpi",
    "ppi",
    "jobs report",
    "earnings",
    "treasury yield",
    "s&p 500",
    "nasdaq",
    "spy",
    "qqq",
    "nvidia",
    "nvda",
  ];

  if (containsAny(text, highlightTerms)) {
    return "highlight";
  }

  return "neutral";
}

function hasDirectMarketRelevance(article: FinnhubArticle) {
  const text = getArticleText(article);

  const directMarketTerms = [
    "stock market",
    "stocks",
    "wall street",
    "market futures",
    "stock futures",
    "premarket",
    "pre-market",
    "after hours",
    "s&p 500",
    "nasdaq",
    "dow jones",
    "russell 2000",
    "spy",
    "qqq",
    "dia",
    "iwm",
    "vix",
    "earnings",
    "guidance",
    "price target",
    "upgrade",
    "downgrade",
    "analyst rating",
    "shares rise",
    "shares fall",
    "shares jump",
    "shares drop",
    "stock rises",
    "stock falls",
    "stock jumps",
    "stock drops",
    "trading volume",
    "unusual volume",
    "breakout",
    "breakdown",
  ];

  return containsAny(text, directMarketTerms);
}

function hasMajorMacroRelevance(article: FinnhubArticle) {
  const text = getArticleText(article);

  const macroTerms = [
    "federal reserve",
    "fomc",
    "interest rate decision",
    "rate cut",
    "rate hike",
    "inflation report",
    "consumer price index",
    "producer price index",
    "cpi",
    "ppi",
    "jobs report",
    "nonfarm payroll",
    "unemployment rate",
    "jobless claims",
    "treasury yields",
    "bond yields",
    "gross domestic product",
    "gdp",
    "retail sales",
  ];

  return containsAny(text, macroTerms);
}

function hasPriorityStockRelevance(article: FinnhubArticle) {
  const text = getArticleText(article);

  const priorityStocks = [
    "nvidia",
    "nvda",
    "apple",
    "aapl",
    "amazon",
    "amzn",
    "microsoft",
    "msft",
    "alphabet",
    "google",
    "googl",
    "meta platforms",
    "meta stock",
    "tesla",
    "tsla",
    "broadcom",
    "avgo",
    "advanced micro devices",
    "amd",
    "palantir",
    "pltr",
    "micron",
    "mu stock",
  ];

  return containsAny(text, priorityStocks);
}

function hasMarketReaction(article: FinnhubArticle) {
  const text = getArticleText(article);

  const reactionTerms = [
    "stocks rise",
    "stocks fall",
    "stocks gain",
    "stocks drop",
    "market rises",
    "market falls",
    "market gains",
    "market drops",
    "futures rise",
    "futures fall",
    "futures gain",
    "futures drop",
    "shares rise",
    "shares fall",
    "shares jump",
    "shares drop",
    "yield rises",
    "yield falls",
    "oil prices rise",
    "oil prices fall",
    "gold rises",
    "gold falls",
  ];

  return containsAny(text, reactionTerms);
}

function isPromotionalArticle(article: FinnhubArticle) {
  const text = getArticleText(article);

  const promotionalTerms = [
    "investing club",
    "motley fool",
    "buy these stocks",
    "stocks to buy now",
    "could make you rich",
    "millionaire maker",
    "secret stock",
    "must-own stock",
    "best stocks to buy",
    "top stocks to buy",
    "why you should buy",
    "one stock to buy",
    "undervalued stock",
    "high-yield stock",
    "passive income stock",
    "dividend income",
    "retire a millionaire",
    "make you a millionaire",
  ];

  return containsAny(text, promotionalTerms);
}

function isLowValueArticle(article: FinnhubArticle) {
  const text = getArticleText(article);

  const lowValueTerms = [
    "personal finance",
    "retirement planning",
    "retirement savings",
    "mortgage rates",
    "credit card",
    "student loans",
    "real estate listing",
    "celebrity",
    "lifestyle",
    "travel",
    "shopping deals",
    "hiring question",
    "job interview",
    "career advice",
    "social media tip",
    "email shows",
  ];

  return containsAny(text, lowValueTerms);
}

function isGeopoliticalWithoutMarketImpact(article: FinnhubArticle) {
  const text = getArticleText(article);

  const geopoliticalTerms = [
    "war",
    "military",
    "missile",
    "shipping threat",
    "sanctions",
    "ceasefire",
    "iran",
    "israel",
    "russia",
    "ukraine",
    "china tensions",
    "middle east",
    "houthi",
    "pakistan",
  ];

  return (
    containsAny(text, geopoliticalTerms) &&
    !hasDirectMarketRelevance(article) &&
    !hasMarketReaction(article)
  );
}

function isSwingTraderRelevant(article: FinnhubArticle) {
  if (isLowValueArticle(article)) {
    return false;
  }

  if (isPromotionalArticle(article)) {
    return false;
  }

  if (isGeopoliticalWithoutMarketImpact(article)) {
    return false;
  }

  return (
    hasDirectMarketRelevance(article) ||
    hasMajorMacroRelevance(article) ||
    hasPriorityStockRelevance(article)
  );
}

function calculateNewsScore(article: FinnhubArticle) {
  const text = getArticleText(article);
  let score = 0;

  const broadMarketTerms = [
    "s&p 500",
    "nasdaq",
    "dow jones",
    "russell 2000",
    "stock market",
    "wall street",
    "stock futures",
    "market futures",
    "spy",
    "qqq",
    "vix",
  ];

  const majorMacroTerms = [
    "federal reserve",
    "fomc",
    "interest rate decision",
    "rate cut",
    "rate hike",
    "inflation report",
    "consumer price index",
    "producer price index",
    "cpi",
    "ppi",
    "jobs report",
    "nonfarm payroll",
    "unemployment rate",
    "treasury yields",
    "gdp",
    "retail sales",
  ];

  const earningsTerms = [
    "earnings",
    "quarterly results",
    "revenue",
    "profit",
    "guidance",
    "forecast",
    "beats estimates",
    "misses estimates",
  ];

  const analystTerms = [
    "upgrade",
    "downgrade",
    "price target",
    "analyst rating",
    "outperform",
    "underperform",
  ];

  const priceMovementTerms = [
    "shares rise",
    "shares fall",
    "shares jump",
    "shares drop",
    "stock rises",
    "stock falls",
    "stock jumps",
    "stock drops",
    "surges",
    "soars",
    "plunges",
    "tumbles",
    "rallies",
    "selloff",
    "sell-off",
    "breakout",
    "breakdown",
    "record high",
    "all-time high",
  ];

  const sessionTerms = [
    "premarket",
    "pre-market",
    "after hours",
    "market open",
    "market close",
    "stock futures",
    "unusual volume",
    "trading volume",
  ];

  if (containsAny(text, majorMacroTerms)) {
    score += 45;
  }

  if (containsAny(text, broadMarketTerms)) {
    score += 40;
  }

  if (hasPriorityStockRelevance(article)) {
    score += 30;
  }

  if (containsAny(text, earningsTerms)) {
    score += 25;
  }

  if (containsAny(text, analystTerms)) {
    score += 20;
  }

  if (containsAny(text, priceMovementTerms)) {
    score += 20;
  }

  if (containsAny(text, sessionTerms)) {
    score += 15;
  }

  if (hasMarketReaction(article)) {
    score += 15;
  }

  const publishedAt = (article.datetime ?? 0) * 1000;

  const ageInHours = Math.max(
    0,
    (Date.now() - publishedAt) / (1000 * 60 * 60),
  );

  if (ageInHours <= 1) {
    score += 30;
  } else if (ageInHours <= 3) {
    score += 25;
  } else if (ageInHours <= 6) {
    score += 20;
  } else if (ageInHours <= 12) {
    score += 15;
  } else if (ageInHours <= 24) {
    score += 8;
  } else if (ageInHours <= 36) {
    score += 2;
  } else if (ageInHours > 48) {
    score -= 30;
  }

  if (isPromotionalArticle(article)) {
    score -= 100;
  }

  if (isLowValueArticle(article)) {
    score -= 100;
  }

  if (isGeopoliticalWithoutMarketImpact(article)) {
    score -= 80;
  }

  const headlineLength = article.headline?.trim().length ?? 0;

  if (headlineLength >= 35 && headlineLength <= 150) {
    score += 5;
  }

  if ((article.summary?.trim().length ?? 0) >= 80) {
    score += 3;
  }

  return score;
}

function normalizeHeadline(headline: string) {
  return headline
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function removeDuplicateArticles(rankedArticles: RankedArticle[]) {
  const seenHeadlines = new Set<string>();
  const seenUrls = new Set<string>();

  return rankedArticles.filter(({ article }) => {
    const normalizedHeadline = normalizeHeadline(article.headline ?? "");
    const normalizedUrl = article.url?.trim().toLowerCase() ?? "";

    if (!normalizedHeadline || !normalizedUrl) {
      return false;
    }

    if (
      seenHeadlines.has(normalizedHeadline) ||
      seenUrls.has(normalizedUrl)
    ) {
      return false;
    }

    seenHeadlines.add(normalizedHeadline);
    seenUrls.add(normalizedUrl);

    return true;
  });
}

export async function GET() {
  const apiKey = process.env.FINNHUB_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      {
        error: "FINNHUB_API_KEY is not configured.",
        articles: [],
      },
      { status: 500 },
    );
  }

  try {
    const response = await fetch(
      `https://finnhub.io/api/v1/news?category=general&token=${apiKey}`,
      {
        next: {
          revalidate: 900,
        },
      },
    );

    if (!response.ok) {
      throw new Error(
        `Finnhub request failed with status ${response.status}`,
      );
    }

    const rawArticles = (await response.json()) as FinnhubArticle[];

    if (!Array.isArray(rawArticles)) {
      throw new Error("Finnhub returned an unexpected response.");
    }

    const rankedArticles: RankedArticle[] = rawArticles
      .filter((article) => {
        return (
          Boolean(article.headline?.trim()) &&
          Boolean(article.url?.trim()) &&
          isSwingTraderRelevant(article)
        );
      })
      .map((article) => ({
        article,
        score: calculateNewsScore(article),
      }))
      .filter(({ score }) => score >= 20)
      .sort((firstArticle, secondArticle) => {
        if (secondArticle.score !== firstArticle.score) {
          return secondArticle.score - firstArticle.score;
        }

        return (
          (secondArticle.article.datetime ?? 0) -
          (firstArticle.article.datetime ?? 0)
        );
      });

    const uniqueArticles = removeDuplicateArticles(rankedArticles);

    const articles: LiveNewsArticle[] = uniqueArticles
      .slice(0, 12)
      .map(({ article }, index) => ({
        id: String(article.id ?? `${article.datetime ?? 0}-${index}`),
        headline: article.headline?.trim() || "Untitled market story",
        summary:
          article.summary?.trim() ||
          "Open the original article for the complete market update.",
        source: article.source?.trim() || "Market News",
        sourceUrl: article.url?.trim() || "#",
        category: getCategory(article),
        tone: getTone(article),
        publishedAt: new Date(
          (article.datetime ?? Math.floor(Date.now() / 1000)) * 1000,
        ).toISOString(),
      }));

    return NextResponse.json({
      articles,
      articleCount: articles.length,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Market news API error:", error);

    return NextResponse.json(
      {
        error: "Unable to retrieve live market news.",
        articles: [],
      },
      { status: 500 },
    );
  }
}