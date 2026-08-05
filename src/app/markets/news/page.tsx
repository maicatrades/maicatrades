"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Clock3,
  Cpu,
  Landmark,
  Newspaper,
  RefreshCw,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

type NewsCategory =
  | "Market News"
  | "Technology"
  | "Economy"
  | "Commodities";

type NewsTone =
  | "positive"
  | "negative"
  | "highlight"
  | "neutral";

type LiveNewsArticle = {
  id: string;
  headline: string;
  summary: string;
  source: string;
  sourceUrl: string;
  category: NewsCategory;
  tone: NewsTone;
  publishedAt: string;
};

type MarketNewsResponse = {
  articles?: LiveNewsArticle[];
  articleCount?: number;
  updatedAt?: string;
  error?: string;
};

function getCategoryClasses(category: NewsCategory) {
  if (category === "Technology") {
    return "border-violet-500/20 bg-violet-500/10 text-violet-400";
  }

  if (category === "Commodities") {
    return "border-orange-500/20 bg-orange-500/10 text-orange-400";
  }

  if (category === "Economy") {
    return "border-amber-500/20 bg-amber-500/10 text-amber-400";
  }

  return "border-blue-500/20 bg-blue-500/10 text-blue-400";
}

function getToneClasses(tone: NewsTone) {
  if (tone === "positive") {
    return "border-emerald-500/20 bg-emerald-500/5";
  }

  if (tone === "highlight") {
    return "border-violet-500/20 bg-violet-500/5";
  }

  if (tone === "negative") {
    return "border-orange-500/20 bg-orange-500/5";
  }

  return "border-slate-800 bg-[#09131d]";
}

function CategoryIcon({
  category,
}: {
  category: NewsCategory;
}) {
  if (category === "Technology") {
    return <Cpu size={16} />;
  }

  if (category === "Commodities") {
    return <TrendingDown size={16} />;
  }

  if (category === "Economy") {
    return <Landmark size={16} />;
  }

  return <BarChart3 size={16} />;
}

function ToneIcon({ tone }: { tone: NewsTone }) {
  if (tone === "negative") {
    return (
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-orange-500/20 bg-orange-500/10 text-orange-400">
        <TrendingDown size={19} />
      </div>
    );
  }

  if (tone === "highlight") {
    return (
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-violet-500/20 bg-violet-500/10 text-violet-400">
        <Cpu size={19} />
      </div>
    );
  }

  if (tone === "positive") {
    return (
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
        <TrendingUp size={19} />
      </div>
    );
  }

  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10 text-blue-400">
      <Newspaper size={19} />
    </div>
  );
}

function formatRelativeTime(publishedAt: string) {
  const publishedTime = new Date(publishedAt).getTime();

  if (Number.isNaN(publishedTime)) {
    return "Recently";
  }

  const differenceInSeconds = Math.max(
    0,
    Math.floor((Date.now() - publishedTime) / 1000),
  );

  if (differenceInSeconds < 60) {
    return "Just now";
  }

  const differenceInMinutes = Math.floor(
    differenceInSeconds / 60,
  );

  if (differenceInMinutes < 60) {
    return `${differenceInMinutes} min ago`;
  }

  const differenceInHours = Math.floor(
    differenceInMinutes / 60,
  );

  if (differenceInHours < 24) {
    return `${differenceInHours} hr${
      differenceInHours === 1 ? "" : "s"
    } ago`;
  }

  const differenceInDays = Math.floor(
    differenceInHours / 24,
  );

  if (differenceInDays < 7) {
    return `${differenceInDays} day${
      differenceInDays === 1 ? "" : "s"
    } ago`;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(publishedAt));
}

function formatUpdatedAt(updatedAt: string | null) {
  if (!updatedAt) {
    return "Waiting for update";
  }

  const date = new Date(updatedAt);

  if (Number.isNaN(date.getTime())) {
    return "Recently updated";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function NewsLoadingSkeleton() {
  return (
    <div className="divide-y divide-slate-800">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="animate-pulse p-5 sm:p-6"
        >
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="h-10 w-10 shrink-0 rounded-xl bg-slate-800" />

            <div className="flex-1">
              <div className="mb-4 flex gap-2">
                <div className="h-6 w-28 rounded-full bg-slate-800" />
                <div className="h-6 w-20 rounded-full bg-slate-800" />
              </div>

              <div className="h-6 w-full max-w-3xl rounded bg-slate-800" />
              <div className="mt-3 h-4 w-full max-w-4xl rounded bg-slate-800/80" />
              <div className="mt-2 h-4 w-3/4 max-w-3xl rounded bg-slate-800/80" />
              <div className="mt-5 h-4 w-28 rounded bg-slate-800" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function NewsPage() {
  const [marketNews, setMarketNews] = useState<
    LiveNewsArticle[]
  >([]);

  const [updatedAt, setUpdatedAt] = useState<string | null>(
    null,
  );

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMarketNews = useCallback(
    async (isManualRefresh = false) => {
      if (isManualRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      setError(null);

      try {
        const response = await fetch("/api/market-news", {
          method: "GET",
          cache: "no-store",
        });

        const data =
          (await response.json()) as MarketNewsResponse;

        if (!response.ok) {
          throw new Error(
            data.error ||
              "Unable to retrieve market news.",
          );
        }

        const articles = Array.isArray(data.articles)
          ? data.articles
          : [];

        setMarketNews(articles);
        setUpdatedAt(
          data.updatedAt ?? new Date().toISOString(),
        );
      } catch (requestError) {
        console.error(
          "Unable to load market news:",
          requestError,
        );

        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to retrieve market news.",
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [],
  );

  useEffect(() => {
    void loadMarketNews();
  }, [loadMarketNews]);

  const marketNewsCount = marketNews.filter(
    (article) => article.category === "Market News",
  ).length;

  const technologyCount = marketNews.filter(
    (article) => article.category === "Technology",
  ).length;

  const economicCount = marketNews.filter(
    (article) => article.category === "Economy",
  ).length;

  return (
    <main className="min-h-screen bg-[#050b11] text-white">
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-6 lg:px-8">
        <Link
          href="/dashboard"
          className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-slate-400 transition hover:text-blue-400"
        >
          <ArrowLeft size={17} />
          Back to Dashboard
        </Link>

        <section className="mb-8 overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-[#0b1722] to-[#071019] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.25)] sm:p-8">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-400">
                <Newspaper size={14} />
                Live Market Intelligence
              </div>

              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Top Market News
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
                Follow ranked market headlines, economic
                developments, earnings, and sector news relevant to
                active swing traders.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 text-xs text-slate-400">
              <button
                type="button"
                onClick={() => void loadMarketNews(true)}
                disabled={isRefreshing}
                className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2 transition hover:border-blue-500/30 hover:text-blue-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw
                  size={15}
                  className={`text-blue-400 ${
                    isRefreshing ? "animate-spin" : ""
                  }`}
                />

                {isRefreshing
                  ? "Refreshing..."
                  : "Refresh News"}
              </button>

              <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2">
                <Clock3 size={15} className="text-blue-400" />
                Updated {formatUpdatedAt(updatedAt)}
              </div>
            </div>
          </div>
        </section>

        <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-slate-800 bg-[#09131d] p-5">
            <div className="flex items-center gap-2 text-blue-400">
              <Newspaper size={17} />

              <p className="text-xs font-semibold uppercase tracking-wide">
                Top Stories
              </p>
            </div>

            <p className="mt-3 text-3xl font-bold">
              {isLoading ? "—" : marketNews.length}
            </p>

            <p className="mt-1 text-sm text-slate-400">
              Ranked headlines currently displayed
            </p>
          </div>

          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5">
            <div className="flex items-center gap-2 text-emerald-400">
              <TrendingUp size={17} />

              <p className="text-xs font-semibold uppercase tracking-wide">
                Market News
              </p>
            </div>

            <p className="mt-3 text-3xl font-bold">
              {isLoading ? "—" : marketNewsCount}
            </p>

            <p className="mt-1 text-sm text-slate-400">
              Broad-market developments
            </p>
          </div>

          <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-5">
            <div className="flex items-center gap-2 text-violet-400">
              <Cpu size={17} />

              <p className="text-xs font-semibold uppercase tracking-wide">
                Technology
              </p>
            </div>

            <p className="mt-3 text-3xl font-bold">
              {isLoading ? "—" : technologyCount}
            </p>

            <p className="mt-1 text-sm text-slate-400">
              Technology and semiconductor news
            </p>
          </div>

          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5">
            <div className="flex items-center gap-2 text-amber-400">
              <Landmark size={17} />

              <p className="text-xs font-semibold uppercase tracking-wide">
                Economy
              </p>
            </div>

            <p className="mt-3 text-3xl font-bold">
              {isLoading ? "—" : economicCount}
            </p>

            <p className="mt-1 text-sm text-slate-400">
              Economic and policy developments
            </p>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-800 bg-[#09131d]">
          <div className="flex flex-col justify-between gap-4 border-b border-slate-800 px-5 py-5 sm:flex-row sm:items-center">
            <div>
              <div className="flex items-center gap-2">
                <Newspaper
                  size={18}
                  className="text-blue-400"
                />

                <h2 className="text-lg font-semibold">
                  Latest Headlines
                </h2>
              </div>

              <p className="mt-1 text-sm text-slate-400">
                Market-moving news ranked by relevance,
                importance, and recency.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Clock3 size={15} className="text-blue-400" />
              Highest-ranked stories appear first
            </div>
          </div>

          {isLoading ? <NewsLoadingSkeleton /> : null}

          {!isLoading && error ? (
            <div className="flex min-h-72 flex-col items-center justify-center px-6 py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-orange-500/20 bg-orange-500/10 text-orange-400">
                <TrendingDown size={22} />
              </div>

              <h3 className="mt-4 text-lg font-semibold text-slate-100">
                Market news is temporarily unavailable
              </h3>

              <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">
                {error}
              </p>

              <button
                type="button"
                onClick={() => void loadMarketNews()}
                className="mt-5 inline-flex items-center gap-2 rounded-lg border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-sm font-semibold text-blue-400 transition hover:bg-blue-500/15 hover:text-blue-300"
              >
                <RefreshCw size={15} />
                Try Again
              </button>
            </div>
          ) : null}

          {!isLoading &&
          !error &&
          marketNews.length === 0 ? (
            <div className="flex min-h-72 flex-col items-center justify-center px-6 py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-700 bg-slate-800/50 text-slate-400">
                <Newspaper size={22} />
              </div>

              <h3 className="mt-4 text-lg font-semibold text-slate-100">
                No qualifying stories found
              </h3>

              <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">
                The live feed did not return any stories that met
                the current swing-trader relevance requirements.
              </p>

              <button
                type="button"
                onClick={() => void loadMarketNews(true)}
                className="mt-5 inline-flex items-center gap-2 rounded-lg border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-sm font-semibold text-blue-400 transition hover:bg-blue-500/15 hover:text-blue-300"
              >
                <RefreshCw size={15} />
                Refresh Feed
              </button>
            </div>
          ) : null}

          {!isLoading &&
          !error &&
          marketNews.length > 0 ? (
  <div className="space-y-6">
  {marketNews.map((article) => (
    <a
      key={article.id}
      href={article.sourceUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Read full story: ${article.headline}`}
      className="group block rounded-2xl outline-none transition focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050b11]"
    >
      <article
        className={`rounded-2xl border border-slate-800 p-5 transition duration-200 hover:-translate-y-0.5 hover:border-blue-500/40 hover:bg-slate-800/30 hover:shadow-[0_14px_35px_rgba(0,0,0,0.22)] sm:p-6 ${getToneClasses(
          article.tone,
        )}`}
      >
        <div className="flex flex-col gap-4 sm:flex-row">
          <ToneIcon tone={article.tone} />

          <div className="min-w-0 flex-1">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${getCategoryClasses(
                  article.category,
                )}`}
              >
                <CategoryIcon category={article.category} />

                {article.category}
              </span>

              <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                <Clock3 size={13} />

                {formatRelativeTime(article.publishedAt)}
              </span>
            </div>

            <h3 className="text-lg font-semibold leading-7 text-slate-100 transition group-hover:text-blue-400 sm:text-xl">
              {article.headline}
            </h3>

            <p className="mt-2 max-w-4xl text-sm leading-7 text-slate-400">
              {article.summary}
            </p>

            <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-400 transition group-hover:text-blue-300">
              Read Full Story

              <ArrowRight
                size={15}
                className="transition group-hover:translate-x-1"
              />
            </span>
          </div>

          <div className="text-xs text-slate-500 sm:max-w-36 sm:text-right">
            {article.source}
          </div>
        </div>
      </article>
    </a>
  ))}
</div>
  
          ) : null}
        </section>

        <div className="mt-6 rounded-xl border border-blue-500/20 bg-blue-500/5 px-4 py-3 text-xs leading-5 text-slate-400">
          Headlines are retrieved from the live Finnhub market-news
          feed and ranked by MaicaTrades for swing-trader relevance.
          Article links open the original publisher in a new tab.
        </div>
      </div>
    </main>
  );
}