import type { CalcResult, CalculatorInputs } from "@/types";
import { roundMoney, toNumber } from "@/lib/utils/math";

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

  const maxRent = roundMoney((monthlyIncome * targetPercent) / 100);
  const yearlyIncome = roundMoney(monthlyIncome * 12);

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
