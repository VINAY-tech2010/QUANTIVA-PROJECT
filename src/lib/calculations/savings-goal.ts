import type { CalcResult, CalculatorInputs } from "@/types";
import { roundMoney, roundTo, toNumber } from "@/lib/utils/math";

const PERIODS_PER_YEAR: Record<string, number> = {
  weekly: 52,
  "bi-weekly": 26,
  monthly: 12,
  quarterly: 4,
  yearly: 1,
};

/**
 * Savings goal — required contribution to reach a target, with optional growth.
 */
export function calculateSavingsGoal(inputs: CalculatorInputs): CalcResult {
  const target = toNumber(inputs.targetAmount);
  const current = toNumber(inputs.currentSavings);
  const years = toNumber(inputs.years);
  const frequency = typeof inputs.frequency === "string" ? inputs.frequency : "monthly";
  const annualRate = toNumber(inputs.growthRate);

  if (target <= 0) {
    return { ok: false, error: "Enter a target amount greater than zero.", metrics: [] };
  }
  if (current < 0) {
    return { ok: false, error: "Current savings cannot be negative.", metrics: [] };
  }
  if (years <= 0) {
    return { ok: false, error: "Enter a time period greater than zero.", metrics: [] };
  }

  const periodsPerYear = PERIODS_PER_YEAR[frequency] ?? 12;
  const totalPeriods = Math.max(1, Math.round(years * periodsPerYear));
  const periodicRate = annualRate / 100 / periodsPerYear;

  const remaining = roundMoney(target - current);
  if (remaining <= 0) {
    return {
      ok: true,
      metrics: [
        { key: "requiredContribution", label: `Required ${frequency} contribution`, kind: "currency", value: 0, primary: true, tone: "positive" },
        { key: "remaining", label: "Remaining to save", kind: "currency", value: 0 },
      ],
      narrative: "You have already reached your goal of {targetAmount}.",
      data: { requiredContribution: 0, remaining: 0, target },
    };
  }

  // Grow current savings to the horizon, then solve the annuity payment.
  const grownCurrent = current * Math.pow(1 + periodicRate, totalPeriods);
  const gap = target - grownCurrent;

  let required: number;
  if (periodicRate === 0) {
    required = gap / totalPeriods;
  } else {
    const annuityFactor = (Math.pow(1 + periodicRate, totalPeriods) - 1) / periodicRate;
    required = gap / annuityFactor;
  }
  required = roundMoney(Math.max(0, required));

  return {
    ok: true,
    metrics: [
      { key: "requiredContribution", label: `Save per ${frequency.replace("bi-weekly", "two weeks").replace("ly", "")}`, kind: "currency", value: required, primary: true },
      { key: "remaining", label: "Remaining to save", kind: "currency", value: remaining },
      { key: "targetAmount", label: "Goal", kind: "currency", value: target },
      { key: "years", label: "Time", kind: "number", value: roundTo(years, 2) },
    ],
    narrative:
      "To reach {targetAmount} in {years} years, save about {requiredContribution} per period. " +
      "You still need {remaining}. Estimated calculation based on the values you entered.",
    data: { requiredContribution: required, remaining, target, years },
  };
}
