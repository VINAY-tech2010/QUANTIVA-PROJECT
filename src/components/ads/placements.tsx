import { AdSlot } from "./AdSlot";

/**
 * Named ad placements.
 *
 * These are thin, semantic wrappers around AdSlot so pages read intent clearly
 * ("put a BetweenContentAd here") instead of repeating placement strings. Each
 * maps to a placement in src/lib/ads/config.ts; the actual slot IDs live in
 * environment variables, never in these components.
 *
 * All of these render a graceful, space-reserving placeholder (no network, no
 * fake ad) until the corresponding AdSense slot ID is configured.
 */

/** Below the page header / above primary content. */
export function TopContentAd() {
  return <AdSlot placement="top" label="Advertisement" />;
}

/** Between major content sections (never inside interactive controls). */
export function BetweenContentAd() {
  return <AdSlot placement="incontent" label="Advertisement" />;
}

/** Desktop right-hand rail beside a calculator. */
export function SidebarAd() {
  return <AdSlot placement="rail" label="Advertisement" />;
}

/** After results/explanation, before related tools. */
export function CalculatorBottomAd() {
  return <AdSlot placement="bottom" label="Advertisement" />;
}

/** Category pages, between the calculator grid and related info. */
export function CategoryAd() {
  return <AdSlot placement="incontent" label="Advertisement" />;
}

/** Above the footer on content pages. */
export function FooterAd() {
  return <AdSlot placement="footer" label="Advertisement" />;
}
