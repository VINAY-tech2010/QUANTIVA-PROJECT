import type { CalcResult, CalculatorInputs } from "@/types";
import { allFinite, roundMoney, toNumber } from "@/lib/utils/math";
import { OVERFLOW_ERROR } from "./sanitize";

/**
 * Rent affordability — recommended maximum rent based on income and a target
 * housing-cost percentage (default the common 30% guideline).
 */
export function calculateRentAffordability(inputs: CalculatorInputs): CalcResult {
  const monthlyIncome = toNumber(inputs.monthlyIncome);
  const targetPercent = toNumber(inputs.targetPercent, 30);

  if (monthlyIncome <= 0) {
    return { ok: false, error: "Enter your monthly income.", metrics: [] };
  }
  if (targetPercent <= 0 || targetPercent > 100) {
    return { ok: false, error: "Target percentage must be between 0 and 100.", metrics: [] };
  }

  const rawMaxRent = (monthlyIncome * targetPercent) / 100;
  const rawYearlyIncome = monthlyIncome * 12;
  if (!allFinite(rawMaxRent, rawYearlyIncome)) {
    return { ok: false, error: OVERFLOW_ERROR, metrics: [] };
  }
  const maxRent = roundMoney(rawMaxRent);
  const yearlyIncome = roundMoney(rawYearlyIncome);

  return {
    ok: true,
    metrics: [
      { key: "maxRent", label: "Recommended max rent", kind: "currency", value: maxRent, primary: true },
      { key: "targetPercent", label: "Housing share", kind: "percent", value: targetPercent },
      { key: "monthlyIncome", label: "Monthly income", kind: "currency", value: monthlyIncome },
    ],
    narrative:
      "Keeping housing at {targetPercent} of income suggests a maximum rent of about {maxRent} per month. Estimated calculation based on the values you entered.",
    data: { maxRent, targetPercent, monthlyIncome, yearlyIncome },
  };
}
