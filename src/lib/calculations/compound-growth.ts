import type { CalcResult, CalculatorInputs } from "@/types";
import { allFinite, futureValue, roundMoney, toNumber } from "@/lib/utils/math";
import { OVERFLOW_ERROR } from "./sanitize";

const CONTRIBUTIONS_PER_YEAR: Record<string, number> = {
  weekly: 52,
  "bi-weekly": 26,
  monthly: 12,
  quarterly: 4,
  yearly: 1,
};

/**
 * Compound growth calculator — starting amount + recurring contributions.
 */
export function calculateCompoundGrowth(inputs: CalculatorInputs): CalcResult {
  const starting = toNumber(inputs.startingAmount);
  const contribution = toNumber(inputs.contribution);
  const frequency = typeof inputs.frequency === "string" ? inputs.frequency : "monthly";
  const annualRate = toNumber(inputs.growthRate);
  const years = toNumber(inputs.years);

  if (starting < 0 || contribution < 0) {
    return { ok: false, error: "Amounts cannot be negative.", metrics: [] };
  }
  if (starting === 0 && contribution === 0) {
    return { ok: false, error: "Enter a starting amount or a recurring contribution.", metrics: [] };
  }
  if (years <= 0) {
    return { ok: false, error: "Enter a time period greater than zero.", metrics: [] };
  }

  const contributionsPerYear = CONTRIBUTIONS_PER_YEAR[frequency] ?? 12;
  const finalValue = futureValue(starting, contribution, annualRate, years, 12, contributionsPerYear);
  const rawContributions = starting + contribution * contributionsPerYear * years;
  if (!allFinite(finalValue, rawContributions)) {
    return { ok: false, error: OVERFLOW_ERROR, metrics: [] };
  }
  const totalContributions = roundMoney(rawContributions);
  const growthEarned = roundMoney(finalValue - totalContributions);

  return {
    ok: true,
    metrics: [
      { key: "finalValue", label: "Final value", kind: "currency", value: finalValue, primary: true },
      { key: "totalContributions", label: "Total you put in", kind: "currency", value: totalContributions },
      { key: "growthEarned", label: "Growth earned", kind: "currency", value: growthEarned, tone: growthEarned >= 0 ? "positive" : "negative" },
      { key: "years", label: "Time period", kind: "number", value: years },
    ],
    narrative:
      "After {years} years you could have {finalValue}. You put in {totalContributions} and growth added {growthEarned}. " +
      "Estimated calculation based on the values you entered.",
    data: { finalValue, totalContributions, growthEarned, years },
  };
}
