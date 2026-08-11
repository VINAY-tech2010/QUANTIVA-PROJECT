import type { CalcResult, CalculatorInputs } from "@/types";
import { roundMoney, toNumber } from "@/lib/utils/math";

/**
 * Emergency fund — target vs current savings and the shortfall.
 */
export function calculateEmergencyFund(inputs: CalculatorInputs): CalcResult {
  const monthlyExpenses = toNumber(inputs.monthlyExpenses);
  const months = toNumber(inputs.months);
  const current = toNumber(inputs.currentSavings);

  if (monthlyExpenses <= 0) {
    return { ok: false, error: "Enter your essential monthly expenses.", metrics: [] };
  }
  if (months <= 0) {
    return { ok: false, error: "Enter a target number of months.", metrics: [] };
  }
  if (current < 0) {
    return { ok: false, error: "Current savings cannot be negative.", metrics: [] };
  }

  const target = roundMoney(monthlyExpenses * months);
  const shortfall = roundMoney(Math.max(0, target - current));
  const fundedPercent = target > 0 ? Math.min(100, (current / target) * 100) : 0;
  const monthsCovered = monthlyExpenses > 0 ? current / monthlyExpenses : 0;

  return {
    ok: true,
    metrics: [
      { key: "target", label: "Emergency fund target", kind: "currency", value: target, primary: true },
      { key: "shortfall", label: "Shortfall", kind: "currency", value: shortfall, tone: shortfall > 0 ? "warning" : "positive" },
      { key: "fundedPercent", label: "Funded", kind: "percent", value: roundMoney(fundedPercent) },
      { key: "monthsCovered", label: "Months covered now", kind: "number", value: roundMoney(monthsCovered) },
    ],
    narrative:
      shortfall > 0
        ? "A {months}-month emergency fund needs {target}. You have {currentSavings}, so you are short {shortfall}. Estimated calculation based on the values you entered."
        : "You already have enough to cover {months} months of essential expenses ({target}).",
    data: { target, shortfall, fundedPercent: roundMoney(fundedPercent), monthsCovered: roundMoney(monthsCovered) },
  };
}
