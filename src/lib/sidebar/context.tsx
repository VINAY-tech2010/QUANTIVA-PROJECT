"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

interface SidebarContextValue {
  /** Whether the sidebar is currently open/expanded. */
  open: boolean;
  /** Toggle the sidebar open/closed. */
  toggle: () => void;
  /** Explicitly set the sidebar open state. */
  setOpen: (value: boolean) => void;
}

const SidebarContext = createContext<SidebarContextValue | null>(null);

/** Matches Tailwind's `md` breakpoint. */
const DESKTOP_QUERY = "(min-width: 768px)";

export function SidebarProvider({ children }: { children: ReactNode }) {
  // Lazy-init from the current breakpoint: open on desktop, closed on mobile.
  // Guarded for SSR where window is undefined.
  const [open, setOpen] = useState<boolean>(() => {
    if (typeof window === "undefined" || !window.matchMedia) return true;
    return window.matchMedia(DESKTOP_QUERY).matches;
  });

  const toggle = useCallback(() => setOpen((v) => !v), []);
  const value = useMemo(() => ({ open, toggle, setOpen }), [open, toggle]);
  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
}

export function useSidebar(): SidebarContextValue {
  const ctx = useContext(SidebarContext);
  if (!ctx) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return ctx;
}
