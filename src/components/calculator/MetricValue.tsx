"use client";

import type { CalculatorMetric } from "@/types";
import { useCurrency } from "@/lib/currency/context";
import { formatNumber, formatPercent } from "@/lib/currency/formatter";
import { formatDuration } from "@/lib/utils/math";

/**
 * Renders a metric value according to its kind, using the active currency for
 * currency metrics so a currency switch updates every value reactively.
 */
export function MetricValue({ metric }: { metric: CalculatorMetric }) {
  const { format } = useCurrency();
  const v = metric.value;

  switch (metric.kind) {
    case "currency":
      return <>{typeof v === "number" ? format(v) : v}</>;
    case "percent":
      return <>{formatPercent(typeof v === "number" ? v : Number(v))}</>;
    case "duration":
      return <>{typeof v === "number" ? formatDuration(v) : v}</>;
    case "number":
      return <>{formatNumber(typeof v === "number" ? v : Number(v))}</>;
    case "date":
    case "text":
    default:
      return <>{String(v)}</>;
  }
}
