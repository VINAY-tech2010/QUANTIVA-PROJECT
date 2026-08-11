"use client";

import { useSyncExternalStore } from "react";

/**
 * Hydration-safe read of a localStorage-backed (client-only) value.
 *
 * - On the server and during the first client render, returns `serverSnapshot`
 *   so the server HTML and the first client render match (avoids React
 *   hydration error #418).
 * - Immediately after hydration, React re-renders with the real value.
 *
 * `useSyncExternalStore` requires the client snapshot to be referentially
 * stable across renders until the data actually changes — otherwise React
 * warns "The result of getSnapshot should be cached" and can loop forever.
 * Our loaders parse JSON and return a fresh array/object each call, so we cache
 * the parsed value and return the same reference while its serialized content
 * is unchanged.
 *
 * `cacheKey` must be unique per logical value (e.g. "history", "prefs:theme").
 * Mutations should go through the caller's own override state, since storage
 * writes do not emit an event we subscribe to here.
 */
export function useClientSnapshot<T>(
  cacheKey: string,
  load: () => T,
  serverSnapshot: T,
): T {
  return useSyncExternalStore(
    noopSubscribe,
    () => readCached(cacheKey, load),
    () => serverSnapshot,
  );
}

function noopSubscribe(): () => void {
  return () => {};
}

const cache = new Map<string, { fingerprint: string; value: unknown }>();

function readCached<T>(cacheKey: string, load: () => T): T {
  const value = load();
  let fingerprint: string;
  try {
    fingerprint = JSON.stringify(value) ?? "";
  } catch {
    fingerprint = "";
  }
  const hit = cache.get(cacheKey);
  if (hit && hit.fingerprint === fingerprint) {
    return hit.value as T;
  }
  cache.set(cacheKey, { fingerprint, value });
  return value;
}
