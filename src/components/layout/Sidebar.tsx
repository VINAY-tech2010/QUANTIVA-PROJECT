"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { CATEGORIES } from "@/data/categories";
import { playClick } from "@/lib/sound";
import { useSidebar } from "@/lib/sidebar/context";

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

const MAIN_NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: "▦" },
  { href: "/classical", label: "Calculator", icon: "🧮" },
  { href: "/history", label: "History", icon: "🕘" },
  { href: "/scenarios", label: "Scenarios", icon: "⚖" },
  { href: "/improvement", label: "Improvement", icon: "✉" },
  { href: "/settings", label: "Settings", icon: "⚙" },
];

const CATEGORY_ICONS: Record<string, string> = {
  banknote: "💵",
  "shopping-bag": "🛍",
  clock: "⏱",
  zap: "⚡",
  sigma: "∑",
  flask: "🧪",
  chart: "📊",
  heart: "❤️",
  repeat: "🔁",
  home: "🏠",
  briefcase: "💼",
  cpu: "🖥",
};

export function Sidebar() {
  const pathname = usePathname();
  const { open, setOpen } = useSidebar();
  const panelRef = useRef<HTMLElement>(null);

  // Close the drawer on Escape (mobile) and manage focus for accessibility.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, setOpen]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const linkClass = (href: string) =>
    `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
      isActive(href)
        ? "bg-violet/15 text-violet-soft"
        : "text-muted hover:bg-white/5 hover:text-foreground"
    }`;

  const nav = (
    <>
      <div className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-muted">
        Menu
      </div>
      <nav className="flex flex-col gap-0.5" aria-label="Sidebar">
        {MAIN_NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => {
              playClick();
              setOpen(false);
            }}
            className={linkClass(item.href)}
          >
            <span aria-hidden className="w-5 text-center">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
      <div className="px-3 pb-2 pt-5 text-xs font-semibold uppercase tracking-wider text-muted">
        Categories
      </div>
      <nav className="flex flex-col gap-0.5" aria-label="Categories">
        {CATEGORIES.map((c) => (
          <Link
            key={c.slug}
            href={`/${c.slug}`}
            onClick={() => {
              playClick();
              setOpen(false);
            }}
            className={linkClass(`/${c.slug}`)}
          >
            <span aria-hidden className="w-5 text-center">{CATEGORY_ICONS[c.icon] ?? "•"}</span>
            <span>{c.name}</span>
          </Link>
        ))}
      </nav>
    </>
  );

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}

      {/* Sidebar: slide-in drawer on mobile, collapsible column on desktop */}
      <aside
        ref={panelRef}
        className={`fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-border bg-surface/95 backdrop-blur-md transition-transform duration-200 md:static md:top-16 md:z-0 md:h-[calc(100vh-4rem)] md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full md:hidden"
        }`}
        aria-label="Sidebar navigation"
        aria-hidden={!open}
      >
        <div className="flex-1 overflow-y-auto px-2 py-4">{nav}</div>
      </aside>
    </>
  );
}
