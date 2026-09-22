"use client";

import Image from "next/image";
import Link from "next/link";
import {
  usePathname,
  useRouter,
} from "next/navigation";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Activity,
  BarChart3,
  Calculator,
  CalendarDays,
  ChevronRight,
  Eye,
  Gauge,
  GraduationCap,
  Home,
  LineChart,
  Menu,
  Newspaper,
  Search,
  Users,
  Wrench,
  X,
} from "lucide-react";

type HeaderProps = {
  openSidebar: () => void;
};

type SearchItem = {
  label: string;
  description: string;
  href: string;
  keywords: string[];
  icon: React.ComponentType<{
    size?: number;
    className?: string;
  }>;
};

const navigationItems = [
  {
    label: "Home",
    href: "/",
  },
  {
    label: "Markets",
    href: "/tools/market-data",
  },
  {
    label: "Setups",
    href: "/markets/trade-idea",
  },
  {
    label: "Education",
    href: "/education",
  },
  {
    label: "Tools",
    href: "/tools/position-size",
  },
  {
    label: "Community",
    href: "/community",
  },
];

const searchItems: SearchItem[] = [
  {
    label: "Dashboard",
    description:
      "Return to the main MaicaTrades market dashboard.",
    href: "/dashboard",
    keywords: [
      "dashboard",
      "overview",
      "home",
      "market",
    ],
    icon: Home,
  },
  {
    label: "Market Score",
    description:
      "View the current market environment and score breakdown.",
    href: "/markets/market-score",
    keywords: [
      "market score",
      "score",
      "environment",
      "risk",
      "trend",
    ],
    icon: Gauge,
  },
  {
    label: "Market Breadth",
    description:
      "Review advancing stocks, participation, and breadth trends.",
    href: "/markets/breadth",
    keywords: [
      "market breadth",
      "breadth",
      "advancing",
      "declining",
      "participation",
    ],
    icon: Activity,
  },
  {
    label: "Sector Performance",
    description:
      "Compare leading and lagging market sectors.",
    href: "/markets/sectors",
    keywords: [
      "sectors",
      "sector performance",
      "leading sector",
      "weakest sector",
    ],
    icon: BarChart3,
  },
  {
    label: "Market Pulse",
    description:
      "Review index trends, momentum, and market direction.",
    href: "/markets/market-pulse",
    keywords: [
      "market pulse",
      "spy",
      "qqq",
      "indexes",
      "momentum",
    ],
    icon: Activity,
  },
  {
    label: "Trade Idea",
    description:
      "View the current MaicaTrades swing-trade setup.",
    href: "/markets/trade-idea",
    keywords: [
      "trade idea",
      "trade setup",
      "setup",
      "entry",
      "stop",
      "target",
    ],
    icon: LineChart,
  },
  {
    label: "Moving Now",
    description:
      "See stocks making notable moves in the market.",
    href: "/markets/moving-now",
    keywords: [
      "moving now",
      "movers",
      "stocks",
      "gainers",
      "losers",
    ],
    icon: Activity,
  },
  {
    label: "Watchlist",
    description:
      "Review the current MaicaTrades market watchlist.",
    href: "/markets/watchlist",
    keywords: [
      "watchlist",
      "stocks",
      "symbols",
      "watch",
    ],
    icon: Eye,
  },
  {
    label: "Market News",
    description:
      "Read market headlines relevant to swing traders.",
    href: "/markets/news",
    keywords: [
      "news",
      "headlines",
      "market news",
      "stocks",
    ],
    icon: Newspaper,
  },
  {
    label: "Economic Calendar",
    description:
      "Review important economic events and market catalysts.",
    href: "/markets/calendar",
    keywords: [
      "calendar",
      "economic calendar",
      "cpi",
      "fed",
      "events",
      "catalysts",
    ],
    icon: CalendarDays,
  },
  {
    label: "Position Size Calculator",
    description:
      "Calculate position size, risk, stop loss, and target.",
    href: "/tools/position-size",
    keywords: [
      "position size",
      "calculator",
      "risk",
      "shares",
      "stop loss",
    ],
    icon: Calculator,
  },
  {
    label: "Market Data",
    description:
      "Explore MaicaTrades market-data tools.",
    href: "/tools/market-data",
    keywords: [
      "market data",
      "markets",
      "data",
      "tools",
    ],
    icon: Wrench,
  },
  {
    label: "Education",
    description:
      "Learn trading concepts and market analysis.",
    href: "/education",
    keywords: [
      "education",
      "learn",
      "trading",
      "lessons",
    ],
    icon: GraduationCap,
  },
  {
    label: "Community",
    description:
      "Visit the MaicaTrades community page.",
    href: "/community",
    keywords: [
      "community",
      "traders",
      "members",
    ],
    icon: Users,
  },
];

export default function Header({
  openSidebar,
}: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();

  const searchInputRef =
    useRef<HTMLInputElement>(null);

  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false);

  const [searchOpen, setSearchOpen] =
    useState(false);

  const [searchQuery, setSearchQuery] =
    useState("");

  function isActiveRoute(href: string) {
    if (href === "/") {
      return pathname === "/";
    }

    if (href === "/tools/market-data") {
      return pathname === "/tools/market-data";
    }

    if (href === "/markets/trade-idea") {
      return pathname.startsWith(
        "/markets/trade-idea",
      );
    }

    if (href === "/tools/position-size") {
      return pathname === "/tools/position-size";
    }

    return pathname.startsWith(href);
  }

  const filteredSearchItems = useMemo(() => {
    const normalizedQuery = searchQuery
      .trim()
      .toLowerCase();

    if (!normalizedQuery) {
      return searchItems;
    }

    return searchItems.filter((item) => {
      const searchableText = [
        item.label,
        item.description,
        ...item.keywords,
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(
        normalizedQuery,
      );
    });
  }, [searchQuery]);

  function openSearch() {
    setMobileMenuOpen(false);
    setSearchOpen(true);
  }

  function closeSearch() {
    setSearchOpen(false);
    setSearchQuery("");
  }

  function navigateToSearchResult(
    href: string,
  ) {
    closeSearch();
    router.push(href);
  }

  function handleLogoClick(
    event: React.MouseEvent<HTMLAnchorElement>,
  ) {
    setMobileMenuOpen(false);
    closeSearch();

    if (pathname === "/dashboard") {
      event.preventDefault();

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  }

  function handleNavigationClick() {
    setMobileMenuOpen(false);
    closeSearch();
  }

  function handleDashboardMenuClick() {
    setMobileMenuOpen(false);
    openSidebar();
  }

  useEffect(() => {
    setMobileMenuOpen(false);
    closeSearch();
  }, [pathname]);

  useEffect(() => {
    function handleResize() {
      if (window.innerWidth >= 1280) {
        setMobileMenuOpen(false);
      }
    }

    window.addEventListener(
      "resize",
      handleResize,
    );

    return () => {
      window.removeEventListener(
        "resize",
        handleResize,
      );
    };
  }, []);

  useEffect(() => {
    function handleKeyDown(
      event: KeyboardEvent,
    ) {
      if (
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === "k"
      ) {
        event.preventDefault();

        if (searchOpen) {
          closeSearch();
        } else {
          openSearch();
        }
      }

      if (
        event.key === "Escape" &&
        searchOpen
      ) {
        closeSearch();
      }
    }

    window.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [searchOpen]);

  useEffect(() => {
    if (!searchOpen) {
      return;
    }

    const timeout = window.setTimeout(() => {
      searchInputRef.current?.focus();
    }, 50);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [searchOpen]);

  useEffect(() => {
    if (!searchOpen) {
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
    };
  }, [searchOpen]);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-slate-800 bg-[#050b12]/95 backdrop-blur">
        <div className="flex h-16 items-center px-4">
          <button
            type="button"
            onClick={() =>
              setMobileMenuOpen(
                (currentValue) =>
                  !currentValue,
              )
            }
            className="mr-3 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-700 text-slate-300 transition hover:border-slate-600 hover:bg-slate-800 hover:text-white xl:hidden"
            aria-label={
              mobileMenuOpen
                ? "Close navigation menu"
                : "Open navigation menu"
            }
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation"
          >
            {mobileMenuOpen ? (
              <X size={19} />
            ) : (
              <Menu size={19} />
            )}
          </button>

          <Link
            href="/dashboard"
            onClick={handleLogoClick}
            aria-label="Return to the top of the MaicaTrades dashboard"
            className="mr-6 flex min-w-0 items-center gap-2 sm:mr-10"
          >
            <Image
              src="/maica-logo.png"
              alt="MaicaTrades logo"
              width={44}
              height={44}
              priority
              className="h-10 w-10 shrink-0 object-contain"
            />

            <span className="truncate text-lg font-extrabold uppercase tracking-tight">
              <span className="text-white">
                Maica
              </span>

              <span className="text-emerald-400">
                Trades
              </span>
            </span>
          </Link>

          <nav
            aria-label="Main navigation"
            className="hidden h-full items-center gap-8 text-sm text-slate-300 xl:flex"
          >
            {navigationItems.map((item) => {
              const active = isActiveRoute(
                item.href,
              );

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  aria-current={
                    active
                      ? "page"
                      : undefined
                  }
                  className={`flex h-full items-center border-b-2 transition ${
                    active
                      ? "border-emerald-500 text-white"
                      : "border-transparent hover:border-slate-600 hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center">
            <button
              type="button"
              onClick={openSearch}
              className="flex h-9 items-center justify-center gap-2 rounded-full px-2 text-slate-300 transition hover:bg-slate-800 hover:text-white sm:px-3"
              aria-label="Search MaicaTrades"
              aria-haspopup="dialog"
              aria-expanded={searchOpen}
            >
              <Search size={20} />

              <span className="hidden text-xs font-medium text-slate-500 sm:inline">
                Ctrl K
              </span>
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div
            id="mobile-navigation"
            className="border-t border-slate-800 bg-[#050b12] px-4 pb-4 pt-3 xl:hidden"
          >
            <button
              type="button"
              onClick={openSearch}
              className="mb-3 flex w-full items-center gap-3 rounded-lg border border-slate-700 bg-[#09131d] px-4 py-3 text-left text-sm font-semibold text-white transition hover:border-emerald-500/50 hover:bg-slate-900"
            >
              <Search
                size={18}
                className="text-emerald-400"
              />

              <span>Search MaicaTrades</span>
            </button>

            <button
              type="button"
              onClick={
                handleDashboardMenuClick
              }
              className="mb-3 flex w-full items-center justify-between rounded-lg border border-slate-700 bg-[#09131d] px-4 py-3 text-left text-sm font-semibold text-white transition hover:border-emerald-500/50 hover:bg-slate-900"
            >
              <span>
                Open Dashboard Menu
              </span>

              <ChevronRight
                size={17}
                className="text-emerald-400"
              />
            </button>

            <nav
              aria-label="Mobile navigation"
              className="overflow-hidden rounded-lg border border-slate-800 bg-[#09131d]"
            >
              {navigationItems.map(
                (item) => {
                  const active =
                    isActiveRoute(
                      item.href,
                    );

                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={
                        handleNavigationClick
                      }
                      aria-current={
                        active
                          ? "page"
                          : undefined
                      }
                      className={`flex items-center justify-between border-b border-slate-800 px-4 py-3 text-sm font-medium transition last:border-b-0 ${
                        active
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "text-slate-300 hover:bg-slate-800 hover:text-white"
                      }`}
                    >
                      <span>
                        {item.label}
                      </span>

                      <ChevronRight
                        size={16}
                        className={
                          active
                            ? "text-emerald-400"
                            : "text-slate-600"
                        }
                      />
                    </Link>
                  );
                },
              )}
            </nav>
          </div>
        )}
      </header>

      {searchOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-start justify-center bg-black/75 px-4 pt-20 backdrop-blur-sm sm:pt-28"
          role="dialog"
          aria-modal="true"
          aria-label="Search MaicaTrades"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeSearch();
            }
          }}
        >
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-700 bg-[#08121c] shadow-2xl shadow-black/50">
            <div className="flex items-center gap-3 border-b border-slate-800 px-4">
              <Search
                size={20}
                className="shrink-0 text-emerald-400"
              />

              <input
                ref={searchInputRef}
                type="search"
                value={searchQuery}
                onChange={(event) =>
                  setSearchQuery(
                    event.target.value,
                  )
                }
                onKeyDown={(event) => {
                  if (
                    event.key === "Enter" &&
                    filteredSearchItems.length >
                      0
                  ) {
                    navigateToSearchResult(
                      filteredSearchItems[0]
                        .href,
                    );
                  }
                }}
                placeholder="Search pages, tools, and market features..."
                className="h-14 min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                aria-label="Search pages and tools"
              />

              <button
                type="button"
                onClick={closeSearch}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-800 hover:text-white"
                aria-label="Close search"
              >
                <X size={19} />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-2">
              {filteredSearchItems.length >
              0 ? (
                <div className="space-y-1">
                  {filteredSearchItems.map(
                    (item) => {
                      const Icon =
                        item.icon;

                      return (
                        <button
                          key={item.href}
                          type="button"
                          onClick={() =>
                            navigateToSearchResult(
                              item.href,
                            )
                          }
                          className="group flex w-full items-center gap-4 rounded-xl px-3 py-3 text-left transition hover:bg-slate-800/80"
                        >
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-700 bg-[#0c1925] text-sky-400 transition group-hover:border-emerald-500/40 group-hover:text-emerald-400">
                            <Icon size={19} />
                          </span>

                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-semibold text-white">
                              {item.label}
                            </span>

                            <span className="mt-1 block text-xs leading-5 text-slate-400">
                              {
                                item.description
                              }
                            </span>
                          </span>

                          <ChevronRight
                            size={17}
                            className="shrink-0 text-slate-600 transition group-hover:translate-x-0.5 group-hover:text-emerald-400"
                          />
                        </button>
                      );
                    },
                  )}
                </div>
              ) : (
                <div className="px-6 py-12 text-center">
                  <Search
                    size={28}
                    className="mx-auto mb-3 text-slate-600"
                  />

                  <p className="text-sm font-semibold text-white">
                    No results found
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Try searching for
                    Market Score, Breadth,
                    Trade Idea, or
                    Calculator.
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-slate-800 px-4 py-3 text-[11px] text-slate-500">
              <span>
                Press Enter to open the
                first result
              </span>

              <span>Esc to close</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}