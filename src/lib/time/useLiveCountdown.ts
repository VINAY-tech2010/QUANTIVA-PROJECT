"use client";

import { useEffect, useRef, useState } from "react";

export interface CountdownParts {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  /** Total whole milliseconds remaining (negative when passed). */
  totalMs: number;
  /** True when the target is in the past. */
  passed: boolean;
}

function computeParts(targetMs: number, nowMs: number): CountdownParts {
  const totalMs = targetMs - nowMs;
  const abs = Math.abs(totalMs);
  const days = Math.floor(abs / 86_400_000);
  const hours = Math.floor((abs % 86_400_000) / 3_600_000);
  const minutes = Math.floor((abs % 3_600_000) / 60_000);
  const seconds = Math.floor((abs % 60_000) / 1000);
  return { days, hours, minutes, seconds, totalMs, passed: totalMs < 0 };
}

/**
 * Live countdown engine.
 *
 * Recomputes `targetTime - Date.now()` on every tick (never a naive
 * `seconds--`), recalculates immediately when the tab regains focus, and
 * always cleans up its interval. Returns null until mounted to avoid
 * server/client hydration mismatch.
 */
export function useLiveCountdown(targetIso: string | null): CountdownParts | null {
  const [parts, setParts] = useState<CountdownParts | null>(null);
  const targetRef = useRef<number | null>(null);

  useEffect(() => {
    if (!targetIso) {
      targetRef.current = null;
      return;
    }
    const target = Date.parse(targetIso);
    if (Number.isNaN(target)) {
      targetRef.current = null;
      return;
    }
    targetRef.current = target;

    const update = () => {
      if (targetRef.current === null) return;
      setParts(computeParts(targetRef.current, Date.now()));
    };

    // Seed the first value in a microtask so the effect body itself does not
    // synchronously set state (avoids cascading renders), then tick each second.
    const seed = window.setTimeout(update, 0);
    const id = window.setInterval(update, 1000);

    const onVisibility = () => {
      if (document.visibilityState === "visible") update();
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", update);

    return () => {
      window.clearTimeout(seed);
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", update);
    };
  }, [targetIso]);

  return parts;
}

/** Format countdown parts into a natural phrase with correct singular/plural. */
export function formatCountdown(parts: CountdownParts): string {
  const segments: string[] = [];
  if (parts.days > 0) segments.push(`${parts.days} day${parts.days === 1 ? "" : "s"}`);
  if (parts.hours > 0) segments.push(`${parts.hours} hour${parts.hours === 1 ? "" : "s"}`);
  if (parts.minutes > 0) segments.push(`${parts.minutes} minute${parts.minutes === 1 ? "" : "s"}`);
  if (segments.length === 0 || parts.days === 0) {
    segments.push(`${parts.seconds} second${parts.seconds === 1 ? "" : "s"}`);
  }
  return segments.slice(0, 3).join(", ");
}
