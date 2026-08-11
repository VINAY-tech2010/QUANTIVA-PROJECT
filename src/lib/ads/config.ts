/**
 * Centralized advertising configuration.
 *
 * This is the single place that knows about the ad network. Ad slots across
 * the app reference a placement; the actual network IDs live here, not spread
 * across components.
 *
 * The app is "AdSense-ready": until a publisher ID and slot IDs are configured
 * (via NEXT_PUBLIC_ADSENSE_CLIENT and the slot map below), slots render as
 * graceful, space-reserving placeholders with no network calls and no fake ads.
 *
 * Note: the AdSense client ID is public by design (it appears in the ad script
 * Google serves), so a NEXT_PUBLIC_* variable is appropriate. Slot IDs are also
 * public. No secrets here.
 */

export type AdPlacement = "top" | "rail" | "incontent" | "sidebar" | "bottom" | "footer";

/** Google AdSense publisher/client ID, e.g. "ca-pub-1234567890123456". */
export const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? "";

/**
 * AdSense ad-unit slot IDs per placement. Fill these in after creating ad
 * units in the AdSense console. Leave empty to keep slots as placeholders.
 */
export const ADSENSE_SLOTS: Record<AdPlacement, string> = {
  top: process.env.NEXT_PUBLIC_ADSENSE_SLOT_TOP ?? "",
  rail: process.env.NEXT_PUBLIC_ADSENSE_SLOT_RAIL ?? "",
  incontent: process.env.NEXT_PUBLIC_ADSENSE_SLOT_INCONTENT ?? "",
  sidebar: process.env.NEXT_PUBLIC_ADSENSE_SLOT_SIDEBAR ?? "",
  bottom: process.env.NEXT_PUBLIC_ADSENSE_SLOT_BOTTOM ?? "",
  footer: process.env.NEXT_PUBLIC_ADSENSE_SLOT_FOOTER ?? "",
};

/** True when a real ad can be requested for a placement. */
export function isAdEnabled(placement: AdPlacement): boolean {
  return Boolean(ADSENSE_CLIENT && ADSENSE_SLOTS[placement]);
}

/** True when the AdSense script should be loaded at all. */
export function adsenseScriptEnabled(): boolean {
  return Boolean(ADSENSE_CLIENT);
}
