"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { ADSENSE_CLIENT, ADSENSE_SLOTS, isAdEnabled, type AdPlacement } from "@/lib/ads/config";

export type { AdPlacement };

interface Props {
  placement: AdPlacement;
  /** Optional label override for accessibility / debugging. */
  label?: string;
  className?: string;
}

const SIZE: Record<AdPlacement, CSSProperties> = {
  top: { minHeight: 90, width: "100%" },
  rail: { minHeight: 600, width: "100%", maxWidth: 300 },
  incontent: { minHeight: 120, width: "100%" },
  sidebar: { minHeight: 250, width: "100%", maxWidth: 300 },
  bottom: { minHeight: 90, width: "100%" },
  footer: { minHeight: 90, width: "100%" },
};

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

/**
 * AdSlot — a responsive, accessible advertising container.
 *
 * Behaviour:
 * - When AdSense is configured (see src/lib/ads/config.ts), renders a real
 *   responsive ad unit and requests one fill after mount.
 * - When not configured, renders nothing at all — no reserved space, no
 *   outline, no placeholder, no network calls and no fake advertisement
 *   content.
 * - If an ad fails to fill, the container simply remains an empty reserved
 *   box — calkulater continues working normally and no error is shown to users.
 *
 * Space is reserved up-front (minHeight) to avoid layout shift (CLS) when an
 * ad loads. The rail variant is desktop-only.
 */
export function AdSlot({ placement, label, className = "" }: Props) {
  const enabled = isAdEnabled(placement);
  const insRef = useRef<HTMLModElement>(null);
  const pushed = useRef(false);
  // Rail and sidebar variants are desktop-only (they'd crowd small screens).
  const hidden = placement === "rail" || placement === "sidebar" ? "hidden lg:block" : "";

  useEffect(() => {
    if (!enabled || pushed.current) return;
    try {
      (window.adsbygoogle = window.adsbygoogle ?? []).push({});
      pushed.current = true;
    } catch {
      // Ad failed to initialize (e.g. blocker). Fail silently — the reserved
      // container stays empty and the app keeps working.
    }
  }, [enabled]);

  if (!enabled) return null;

  return (
    <aside
      aria-label={label ?? "Advertisement"}
      data-ad-slot={placement}
      className={`flex items-center justify-center overflow-hidden ${hidden} ${className}`}
      style={SIZE[placement]}
    >
      <ins
        ref={insRef}
        className="adsbygoogle"
        style={{ display: "block", width: "100%" }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={ADSENSE_SLOTS[placement]}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </aside>
  );
}
