"use client";

import Script from "next/script";
import { ADSENSE_CLIENT, adsenseScriptEnabled } from "@/lib/ads/config";

/**
 * Loads the Google AdSense script exactly once for the whole app, only when a
 * publisher client ID is configured. Rendered in the root layout so client-side
 * navigation between pages never re-injects it.
 *
 * Uses the `afterInteractive` strategy so the script never blocks calculator
 * rendering or interactivity. If the script fails to load (e.g. ad blocker,
 * network), nothing breaks — ad slots simply remain empty reserved space.
 *
 * Renders nothing when AdSense is not configured.
 */
export function AdSenseScript() {
  if (!adsenseScriptEnabled()) return null;
  return (
    <Script
      id="adsense-script"
      strategy="afterInteractive"
      async
      crossOrigin="anonymous"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
    />
  );
}
