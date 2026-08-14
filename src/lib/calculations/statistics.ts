import type { CalcResult, CalculatorInputs } from "@/types";
import { roundTo } from "@/lib/utils/math";
import { OVERFLOW_ERROR } from "./sanitize";

/** Parse a textarea/list of numbers separated by commas, spaces, or newlines. */
export function parseNumberList(raw: unknown): number[] {
  if (typeof raw !== "string") return [];
  return raw
    .split(/[\s,;]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .map((s) => Number.parseFloat(s))
    .filter((n) => Number.isFinite(n));
}

/** Descriptive statistics: mean, median, mode, min, max, range, sum, count. */
export function calculateStatistics(inputs: CalculatorInputs): CalcResult {
  const values = parseNumberList(inputs.values);

  if (values.length === 0) {
    return { ok: false, error: "Enter at least one number (separate with commas or spaces).", metrics: [] };
  }

  const sorted = [...values].sort((a, b) => a - b);
  const count = sorted.length;
  const sum = sorted.reduce((acc, v) => acc + v, 0);
  if (!Number.isFinite(sum)) {
    return { ok: false, error: OVERFLOW_ERROR, metrics: [] };
  }
  const mean = sum / count;
  const min = sorted[0];
  const max = sorted[count - 1];
  const range = max - min;

  const mid = Math.floor(count / 2);
  const median = count % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];

  // Mode
  const freq = new Map<number, number>();
  for (const v of sorted) freq.set(v, (freq.get(v) ?? 0) + 1);
  let maxFreq = 0;
  for (const f of freq.values()) maxFreq = Math.max(maxFreq, f);
  const modes = maxFreq > 1 ? [...freq.entries()].filter(([, f]) => f === maxFreq).map(([v]) => v) : [];

  const metrics = [
    { key: "mean", label: "Mean (average)", kind: "number" as const, value: roundTo(mean, 4), primary: true },
    { key: "median", label: "Median", kind: "number" as const, value: roundTo(median, 4) },
    { key: "min", label: "Minimum", kind: "number" as const, value: roundTo(min, 4) },
    { key: "max", label: "Maximum", kind: "number" as const, value: roundTo(max, 4) },
    { key: "range", label: "Range", kind: "number" as const, value: roundTo(range, 4) },
    { key: "sum", label: "Sum", kind: "number" as const, value: roundTo(sum, 4) },
    { key: "count", label: "Count", kind: "number" as const, value: count },
  ];
  if (modes.length > 0 && modes.length < count) {
    metrics.push({
      key: "mode",
      label: "Mode",
      kind: "text" as const,
      value: modes.map((m) => roundTo(m, 4)).join(", "),
    } as never);
  }

  return {
    ok: true,
    metrics,
    narrative: `For ${count} value${count === 1 ? "" : "s"}: the mean is ${roundTo(mean, 4)}, the median is ${roundTo(median, 4)}, ranging from ${roundTo(min, 4)} to ${roundTo(max, 4)}.`,
    data: { mean, median, min, max, range, sum, count, modes: modes.map((m) => roundTo(m, 4)).join(", ") },
  };
}

/** Variance & standard deviation (population or sample). */
export function calculateStdDev(inputs: CalculatorInputs): CalcResult {
  const values = parseNumberList(inputs.values);
  const type = typeof inputs.type === "string" ? inputs.type : "sample";

  if (values.length === 0) {
    return { ok: false, error: "Enter at least one number (separate with commas or spaces).", metrics: [] };
  }
  if (type === "sample" && values.length < 2) {
    return { ok: false, error: "Enter at least two numbers for sample standard deviation.", metrics: [] };
  }

  const count = values.length;
  const mean = values.reduce((a, v) => a + v, 0) / count;
  const squaredDiffs = values.reduce((a, v) => a + (v - mean) ** 2, 0);
  if (!Number.isFinite(mean) || !Number.isFinite(squaredDiffs)) {
    return { ok: false, error: OVERFLOW_ERROR, metrics: [] };
  }
  const divisor = type === "sample" ? count - 1 : count;
  const variance = squaredDiffs / divisor;
  const stdDev = Math.sqrt(variance);

  return {
    ok: true,
    metrics: [
      { key: "stdDev", label: `${type === "sample" ? "Sample" : "Population"} std. deviation`, kind: "number", value: roundTo(stdDev, 6), primary: true },
      { key: "variance", label: "Variance", kind: "number", value: roundTo(variance, 6) },
      { key: "mean", label: "Mean", kind: "number", value: roundTo(mean, 6) },
      { key: "count", label: "Count", kind: "number", value: count },
    ],
    narrative: `The ${type} standard deviation is ${roundTo(stdDev, 6)} with a variance of ${roundTo(variance, 6)} around a mean of ${roundTo(mean, 6)}.`,
    data: { stdDev, variance, mean, count, type },
  };
}

/** Average (mean) calculator — simple focused tool. */
export function calculateAverage(inputs: CalculatorInputs): CalcResult {
  const values = parseNumberList(inputs.values);
  if (values.length === 0) {
    return { ok: false, error: "Enter at least one number (separate with commas or spaces).", metrics: [] };
  }
  const sum = values.reduce((a, v) => a + v, 0);
  if (!Number.isFinite(sum)) {
    return { ok: false, error: OVERFLOW_ERROR, metrics: [] };
  }
  const mean = sum / values.length;
  return {
    ok: true,
    metrics: [
      { key: "mean", label: "Average", kind: "number", value: roundTo(mean, 4), primary: true },
      { key: "sum", label: "Sum", kind: "number", value: roundTo(sum, 4) },
      { key: "count", label: "Count", kind: "number", value: values.length },
    ],
    narrative: `The average of ${values.length} number${values.length === 1 ? "" : "s"} is ${roundTo(mean, 4)} (sum ${roundTo(sum, 4)}).`,
    data: { mean, sum, count: values.length },
  };
}
