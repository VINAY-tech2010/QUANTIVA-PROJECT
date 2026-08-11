import type { CalcResult, CalculatorInputs } from "@/types";
import { roundTo, toNumber } from "@/lib/utils/math";

/**
 * Percentage — three modes: X% of Y, X is what % of Y, and percentage change.
 */
export function calculatePercentage(inputs: CalculatorInputs): CalcResult {
  const mode = typeof inputs.mode === "string" ? inputs.mode : "of";
  const a = toNumber(inputs.valueA);
  const b = toNumber(inputs.valueB);

  if (mode === "of") {
    // a% of b
    const result = roundTo((a / 100) * b, 4);
    return {
      ok: true,
      metrics: [
        { key: "result", label: `${a}% of ${b}`, kind: "number", value: result, primary: true },
      ],
      narrative: `${a}% of ${b} is ${result}.`,
      data: { result, mode },
    };
  }

  if (mode === "whatPercent") {
    // a is what % of b
    if (b === 0) {
      return { ok: false, error: "The second value cannot be zero.", metrics: [] };
    }
    const result = roundTo((a / b) * 100, 4);
    return {
      ok: true,
      metrics: [
        { key: "result", label: `${a} as a % of ${b}`, kind: "percent", value: result, primary: true },
      ],
      narrative: `${a} is ${result}% of ${b}.`,
      data: { result, mode },
    };
  }

  // percentage change from a to b
  if (a === 0) {
    return { ok: false, error: "The starting value cannot be zero for percentage change.", metrics: [] };
  }
  const change = roundTo(((b - a) / Math.abs(a)) * 100, 4);
  return {
    ok: true,
    metrics: [
      { key: "result", label: "Percentage change", kind: "percent", value: change, primary: true, tone: change >= 0 ? "positive" : "negative" },
    ],
    narrative: `From ${a} to ${b} is a ${change}% ${change >= 0 ? "increase" : "decrease"}.`,
    data: { result: change, mode },
  };
}
