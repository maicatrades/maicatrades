"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ChevronRight,
  Menu,
  Search,
  X,
} from "lucide-react";

type HeaderProps = {
  openSidebar: () => void;
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

export default function Header({
  openSidebar,
}: HeaderProps) {
  const pathname = usePathname();

  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false);

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

  function handleLogoClick(
    event: React.MouseEvent<HTMLAnchorElement>,
  ) {
    setMobileMenuOpen(false);

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
  }

  function handleDashboardMenuClick() {
    setMobileMenuOpen(false);
    openSidebar();
  }

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    function handleResize() {
      if (window.innerWidth >= 1280) {
        setMobileMenuOpen(false);
      }
    }

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener(
        "resize",
        handleResize,
      );
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800 bg-[#050b12]/95 backdrop-blur">
      <div className="flex h-16 items-center px-4">
        <button
          type="button"
          onClick={() =>
            setMobileMenuOpen(
              (currentValue) => !currentValue,
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
            const active = isActiveRoute(item.href);

            return (
              <Link
                key={item.label}
                href={item.href}
                aria-current={
                  active ? "page" : undefined
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
            className="flex h-9 w-9 items-center justify-center rounded-full text-slate-300 transition hover:bg-slate-800 hover:text-white"
            aria-label="Search"
          >
            <Search size={20} />
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
            onClick={handleDashboardMenuClick}
            className="mb-3 flex w-full items-center justify-between rounded-lg border border-slate-700 bg-[#09131d] px-4 py-3 text-left text-sm font-semibold text-white transition hover:border-emerald-500/50 hover:bg-slate-900"
          >
            <span>Open Dashboard Menu</span>

            <ChevronRight
              size={17}
              className="text-emerald-400"
            />
          </button>

          <nav
            aria-label="Mobile navigation"
            className="overflow-hidden rounded-lg border border-slate-800 bg-[#09131d]"
          >
            {navigationItems.map((item) => {
              const active = isActiveRoute(
                item.href,
              );

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={handleNavigationClick}
                  aria-current={
                    active ? "page" : undefined
                  }
                  className={`flex items-center justify-between border-b border-slate-800 px-4 py-3 text-sm font-medium transition last:border-b-0 ${
                    active
                      ? "bg-emerald-500/10 text-emerald-400"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <span>{item.label}</span>

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
            })}
          </nav>
        </div>
      )}
    </header>
  );
}