import type { CalcResult, CalculatorInputs } from "@/types";
import { roundMoney, toNumber } from "@/lib/utils/math";
import { OVERFLOW_ERROR } from "./sanitize";

/** Break-even — units / revenue needed to cover fixed costs. */
export function calculateBreakEven(inputs: CalculatorInputs): CalcResult {
  const fixedCosts = toNumber(inputs.fixedCosts);
  const pricePerUnit = toNumber(inputs.pricePerUnit);
  const costPerUnit = toNumber(inputs.costPerUnit);

  if (fixedCosts < 0) {
    return { ok: false, error: "Fixed costs cannot be negative.", metrics: [] };
  }
  if (pricePerUnit <= 0) {
    return { ok: false, error: "Enter a price per unit greater than zero.", metrics: [] };
  }
  if (costPerUnit < 0) {
    return { ok: false, error: "Variable cost per unit cannot be negative.", metrics: [] };
  }

  const margin = pricePerUnit - costPerUnit;
  if (margin <= 0) {
    return {
      ok: false,
      error: "Price per unit must be greater than the variable cost per unit to break even.",
      metrics: [],
    };
  }

  const units = Math.ceil(fixedCosts / margin);
  const rawRevenue = units * pricePerUnit;
  if (!Number.isFinite(rawRevenue)) {
    return { ok: false, error: OVERFLOW_ERROR, metrics: [] };
  }
  const revenue = roundMoney(rawRevenue);
  const marginPercent = roundMoney((margin / pricePerUnit) * 100);

  return {
    ok: true,
    metrics: [
      { key: "units", label: "Break-even units", kind: "number", value: units, primary: true },
      { key: "revenue", label: "Break-even revenue", kind: "currency", value: revenue },
      { key: "margin", label: "Contribution margin / unit", kind: "currency", value: roundMoney(margin) },
      { key: "marginPercent", label: "Margin", kind: "percent", value: marginPercent },
    ],
    narrative:
      "You break even after selling {units} units ({revenue} in revenue). Each unit contributes {margin} toward fixed costs. Estimated calculation based on the values you entered.",
    data: { units, revenue, margin: roundMoney(margin), marginPercent },
  };
}
