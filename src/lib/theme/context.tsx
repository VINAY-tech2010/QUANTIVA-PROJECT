"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { ThemeMode } from "@/types";
import { loadPreferences, savePreferences } from "@/lib/storage/preferences";
import { useClientSnapshot } from "@/lib/utils/useClientSnapshot";

interface ThemeContextValue {
  /** The selected mode (dark/light/system/custom). */
  mode: ThemeMode;
  /** The resolved theme actually applied (dark/light). */
  resolved: "dark" | "light";
  /** Custom accent hue (0-360). */
  accentHue: number;
  setMode: (mode: ThemeMode) => void;
  setAccentHue: (hue: number) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function systemPrefersDark(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
}

function applyTheme(resolved: "dark" | "light", accentHue: number) {
  const root = document.documentElement;
  root.dataset.theme = resolved;
  root.style.setProperty("--accent-hue", String(accentHue));
  root.style.colorScheme = resolved;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Hydration-safe reads of persisted preferences. The blocking inline script
  // in layout.tsx already applied the real theme to <html> before paint, so
  // there is no visual flash; React state catches up right after hydration.
  const persistedMode = useClientSnapshot<ThemeMode>(
    "prefs:theme",
    () => loadPreferences().theme ?? "dark",
    "dark",
  );
  const persistedHue = useClientSnapshot<number>(
    "prefs:accentHue",
    () => loadPreferences().accentHue ?? 262,
    262,
  );
  const [modeOverride, setModeOverride] = useState<ThemeMode | null>(null);
  const [hueOverride, setHueOverride] = useState<number | null>(null);
  const mode = modeOverride ?? persistedMode;
  const accentHue = hueOverride ?? persistedHue;

  // OS preference is client-only; read it hydration-safely too.
  const osDark = useClientSnapshot<boolean>("os:prefers-dark", systemPrefersDark, true);
  // Local override for resolved, driven by the OS change subscription.
  const [resolvedOverride, setResolvedOverride] = useState<"dark" | "light" | null>(null);
  const resolved: "dark" | "light" =
    resolvedOverride ??
    (mode === "system" ? (osDark ? "dark" : "light") : mode === "custom" ? "dark" : mode);

  // Apply theme to <html> whenever resolved/accent changes.
  useEffect(() => {
    applyTheme(resolved, accentHue);
  }, [resolved, accentHue]);

  // Track OS preference when in system mode (event-driven subscription).
  useEffect(() => {
    if (mode !== "system" || typeof window.matchMedia !== "function") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setResolvedOverride(mq.matches ? "dark" : "light");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [mode]);

  const setMode = useCallback((m: ThemeMode) => {
    setModeOverride(m);
    savePreferences({ theme: m });
    // Clear any OS-driven override so the explicit choice takes effect.
    setResolvedOverride(null);
  }, []);

  const setAccentHue = useCallback((hue: number) => {
    const h = Math.min(360, Math.max(0, Math.round(hue)));
    setHueOverride(h);
    savePreferences({ accentHue: h });
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({ mode, resolved, accentHue, setMode, setAccentHue }),
    [mode, resolved, accentHue, setMode, setAccentHue],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}
