"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Newspaper,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

import {
  dashboardNews,
  type NewsArticle,
  type NewsTone,
} from "@/data/marketNews";

type TopNewsProps = {
  items?: NewsArticle[];
};

type LiveNewsArticle = {
  id: string;
  headline: string;
  summary: string;
  source: string;
  sourceUrl: string;
  category: NewsArticle["category"];
  tone: NewsTone;
  publishedAt: string;
};

type MarketNewsResponse = {
  articles?: LiveNewsArticle[];
  updatedAt?: string;
  error?: string;
};

type DisplayNewsArticle = {
  id: string;
  headline: string;
  category: NewsArticle["category"];
  tone: NewsTone;
  timeAgo: string;
};

function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-xl border border-slate-800 bg-[#09131d] shadow-[0_10px_30px_rgba(0,0,0,0.16)] ${className}`}
    >
      {children}
    </section>
  );
}

function CardTitle({
  icon: Icon,
  children,
}: {
  icon?: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
      <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-blue-400">
        {Icon && <Icon size={17} />}
        {children}
      </div>

      <ArrowRight
        size={16}
        className="text-slate-500 transition group-hover:translate-x-1 group-hover:text-blue-400"
      />
    </div>
  );
}

function NewsIcon({ tone }: { tone: NewsTone }) {
  if (tone === "highlight") {
    return <Sparkles size={13} className="text-yellow-400" />;
  }

  if (tone === "negative") {
    return <TrendingDown size={13} className="text-orange-400" />;
  }

  if (tone === "positive") {
    return <TrendingUp size={13} className="text-emerald-400" />;
  }

  return <Newspaper size={13} className="text-blue-400" />;
}

function formatTimeAgo(publishedAt: string) {
  const publishedTime = new Date(publishedAt).getTime();

  if (Number.isNaN(publishedTime)) {
    return "Recently";
  }

  const differenceInMilliseconds = Date.now() - publishedTime;
  const differenceInMinutes = Math.max(
    0,
    Math.floor(differenceInMilliseconds / 60_000),
  );

  if (differenceInMinutes < 1) {
    return "Just now";
  }

  if (differenceInMinutes < 60) {
    return `${differenceInMinutes} min ago`;
  }

  const differenceInHours = Math.floor(differenceInMinutes / 60);

  if (differenceInHours < 24) {
    return `${differenceInHours} hr ago`;
  }

  const differenceInDays = Math.floor(differenceInHours / 24);

  if (differenceInDays === 1) {
    return "1 day ago";
  }

  return `${differenceInDays} days ago`;
}

function convertFallbackArticle(
  article: NewsArticle,
): DisplayNewsArticle {
  return {
    id: article.id,
    headline: article.headline,
    category: article.category,
    tone: article.tone,
    timeAgo: `${article.timeAgo} ago`,
  };
}

function convertLiveArticle(
  article: LiveNewsArticle,
): DisplayNewsArticle {
  return {
    id: article.id,
    headline: article.headline,
    category: article.category,
    tone: article.tone,
    timeAgo: formatTimeAgo(article.publishedAt),
  };
}

export default function TopNews({ items }: TopNewsProps) {
  const fallbackItems = (items ?? dashboardNews)
    .slice(0, 5)
    .map(convertFallbackArticle);

  const [newsItems, setNewsItems] =
    useState<DisplayNewsArticle[]>(fallbackItems);

  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    if (items) {
      setNewsItems(items.slice(0, 5).map(convertFallbackArticle));
      setIsLive(false);
      return;
    }

    const controller = new AbortController();

    async function loadLiveNews() {
      try {
        const response = await fetch("/api/market-news", {
          method: "GET",
          signal: controller.signal,
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(
            `Market news request failed with status ${response.status}.`,
          );
        }

        const data = (await response.json()) as MarketNewsResponse;

        if (!data.articles?.length) {
          throw new Error(
            data.error || "The market news API returned no articles.",
          );
        }

        setNewsItems(
          data.articles.slice(0, 5).map(convertLiveArticle),
        );

        setIsLive(true);
      } catch (error) {
        if (
          error instanceof Error &&
          error.name === "AbortError"
        ) {
          return;
        }

        console.error("Unable to load dashboard market news:", error);

        setNewsItems(
          dashboardNews.slice(0, 5).map(convertFallbackArticle),
        );

        setIsLive(false);
      }
    }

    loadLiveNews();

    const refreshInterval = window.setInterval(
      loadLiveNews,
      15 * 60 * 1000,
    );

    return () => {
      controller.abort();
      window.clearInterval(refreshInterval);
    };
  }, [items]);

  return (
    <Link
      href="/markets/news"
      aria-label="View all market news"
      className="group block rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
    >
      <Card className="h-full transition duration-200 group-hover:-translate-y-1 group-hover:border-blue-500/60 group-hover:shadow-[0_16px_40px_rgba(0,0,0,0.28)]">
        <CardTitle icon={Newspaper}>
          <span className="flex items-center gap-2">
            Top News

            <span
              className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-normal ${
                isLive
                  ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                  : "border-slate-700 bg-slate-800 text-slate-400"
              }`}
            >
              {isLive ? "Live" : "Fallback"}
            </span>
          </span>
        </CardTitle>

        <div className="divide-y divide-slate-800 px-4">
          {newsItems.map((item) => (
            <article
              key={item.id}
              className="flex gap-3 py-4 text-sm"
            >
              <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-800">
                <NewsIcon tone={item.tone} />
              </div>

              <div className="min-w-0">
                <p className="leading-5 text-slate-200">
                  {item.headline}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  {item.timeAgo} · {item.category}
                </p>
              </div>
            </article>
          ))}

          <div className="flex items-center justify-center gap-2 py-4 text-sm font-medium text-blue-400">
            <span>View All News</span>

            <ArrowRight
              size={15}
              className="transition group-hover:translate-x-1"
            />
          </div>
        </div>
      </Card>
    </Link>
  );
}