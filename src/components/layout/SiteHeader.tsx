"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CurrencySelector } from "@/components/currency/CurrencySelector";
import { useSidebar } from "@/lib/sidebar/context";

export function SiteHeader() {
  const pathname = usePathname();
  const { open, toggle } = useSidebar();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="btn-ghost"
            aria-label="Toggle sidebar"
            aria-expanded={open}
            onClick={toggle}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {open ? (
                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
              )}
            </svg>
          </button>
          <Link href="/" className="flex items-center gap-2" aria-label="calkulater home">
            <span className="text-lg font-bold tracking-tight text-gradient">calkulater</span>
          </Link>
        </div>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
          <Link
            href="/classical"
            className={`rounded-md px-3 py-2 text-sm transition-colors ${
              isActive("/classical") ? "text-violet-soft" : "text-muted hover:text-foreground"
            }`}
          >
            Calculator
          </Link>
          <Link
            href="/countdown-timer"
            className={`rounded-md px-3 py-2 text-sm transition-colors ${
              isActive("/countdown-timer") ? "text-violet-soft" : "text-muted hover:text-foreground"
            }`}
          >
            Countdown
          </Link>
          <Link
            href="/world-clock"
            className={`rounded-md px-3 py-2 text-sm transition-colors ${
              isActive("/world-clock") ? "text-violet-soft" : "text-muted hover:text-foreground"
            }`}
          >
            World Clock
          </Link>
          <Link
            href="/dashboard"
            className={`rounded-md px-3 py-2 text-sm transition-colors ${
              isActive("/dashboard") ? "text-violet-soft" : "text-muted hover:text-foreground"
            }`}
          >
            Dashboard
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <CurrencySelector />
        </div>
      </div>
    </header>
  );
}
