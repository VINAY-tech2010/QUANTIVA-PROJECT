import { getCurrency } from "@/data/currencies";
import type { CurrencyCode } from "@/types";

/**
 * Central currency formatter. All monetary display in the app goes through
 * here so a currency switch updates every value consistently.
 */
export function formatCurrency(
  value: number,
  currency: CurrencyCode,
  options?: { maximumFractionDigits?: number; minimumFractionDigits?: number },
): string {
  const meta = getCurrency(currency);
  if (!Number.isFinite(value)) return "—";
  try {
    return new Intl.NumberFormat(meta.locale, {
      style: "currency",
      currency: meta.code,
      maximumFractionDigits: options?.maximumFractionDigits ?? meta.decimals,
      minimumFractionDigits: options?.minimumFractionDigits ?? meta.decimals,
    }).format(value);
  } catch {
    // Fallback if the locale/currency pair is unsupported by the runtime.
    return `${meta.symbol}${value.toFixed(meta.decimals)}`;
  }
}

/** Format a plain number with grouping, no currency symbol. */
export function formatNumber(value: number, decimals = 2): string {
  if (!Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: decimals,
    minimumFractionDigits: 0,
  }).format(value);
}

/** Format a percentage value (already expressed as a number like 12.5). */
export function formatPercent(value: number, decimals = 1): string {
  if (!Number.isFinite(value)) return "—";
  return `${formatNumber(value, decimals)}%`;
}
