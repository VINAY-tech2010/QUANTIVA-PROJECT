"use client";

import { useMemo } from "react";
import type { CalcResult } from "@/types";
import { useCurrency } from "@/lib/currency/context";
import { formatNumber, formatPercent } from "@/lib/currency/formatter";
import { formatDuration } from "@/lib/utils/math";

/**
 * Interpolates {token} placeholders in a calculator narrative using the
 * result's metrics, rendering currency tokens in the active currency.
 */
export function useNarrative(result: CalcResult | null): string {
  const { format } = useCurrency();

  return useMemo(() => {
    if (!result?.narrative) return "";
    const byKey = new Map(result.metrics.map((m) => [m.key, m]));
    return result.narrative.replace(/\{(\w+)\}/g, (match, key: string) => {
      const metric = byKey.get(key);
      if (!metric) return match;
      const v = metric.value;
      switch (metric.kind) {
        case "currency":
          return typeof v === "number" ? format(v) : String(v);
        case "percent":
          return formatPercent(typeof v === "number" ? v : Number(v));
        case "duration":
          return typeof v === "number" ? formatDuration(v) : String(v);
        case "number":
          return formatNumber(typeof v === "number" ? v : Number(v));
        default:
          return String(v);
      }
    });
  }, [result, format]);
}
