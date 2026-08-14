import type { CalcResult } from "@/types";

/** User-facing message when a calculation cannot produce a finite result. */
export const OVERFLOW_ERROR = "These values cannot produce a valid result.";

/**
 * Defensive guard applied to every calculator result before it reaches the
 * UI. Guarantees no NaN/±Infinity ever renders in a metric or is persisted to
 * history/scenarios, even for calculators that miss a guard internally.
 */
export function sanitizeResult(result: CalcResult): CalcResult {
  if (!result.ok) return result;
  const hasNonFinite =
    result.metrics.some((m) => typeof m.value === "number" && !Number.isFinite(m.value)) ||
    (result.data
      ? Object.values(result.data).some((v) => typeof v === "number" && !Number.isFinite(v))
      : false);
  if (hasNonFinite) {
    return { ok: false, error: OVERFLOW_ERROR, metrics: [] };
  }
  return result;
}
