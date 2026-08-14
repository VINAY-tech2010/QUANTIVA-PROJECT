import type { CalcResult, CalculatorInputs } from "@/types";
import { roundMoney, toNumber } from "@/lib/utils/math";
import { OVERFLOW_ERROR } from "./sanitize";

/**
 * Freelance rate — the hourly rate needed to hit a target income after
 * expenses, taxes and non-billable time.
 */
export function calculateFreelanceRate(inputs: CalculatorInputs): CalcResult {
  const targetIncome = toNumber(inputs.targetIncome);
  const expenses = toNumber(inputs.annualExpenses);
  const taxPercent = toNumber(inputs.taxPercent);
  const hoursPerWeek = toNumber(inputs.hoursPerWeek);
  const weeksPerYear = toNumber(inputs.weeksPerYear);
  const billablePercent = toNumber(inputs.billablePercent);

  if (targetIncome <= 0) {
    return { ok: false, error: "Enter your target annual take-home income.", metrics: [] };
  }
  if (hoursPerWeek <= 0 || weeksPerYear <= 0) {
    return { ok: false, error: "Enter your working hours and weeks.", metrics: [] };
  }
  if (billablePercent <= 0 || billablePercent > 100) {
    return { ok: false, error: "Billable share must be between 0 and 100.", metrics: [] };
  }
  if (taxPercent < 0 || taxPercent >= 100) {
    return { ok: false, error: "Tax rate must be between 0 and 100.", metrics: [] };
  }

  const billableHours = hoursPerWeek * weeksPerYear * (billablePercent / 100);
  if (billableHours <= 0) {
    return { ok: false, error: "You have no billable hours with these settings.", metrics: [] };
  }

  // Gross needed so that after expenses and tax you keep targetIncome.
  const grossNeeded = (targetIncome + expenses) / (1 - taxPercent / 100);
  if (!Number.isFinite(grossNeeded) || !Number.isFinite(grossNeeded / billableHours)) {
    return { ok: false, error: OVERFLOW_ERROR, metrics: [] };
  }
  const hourlyRate = roundMoney(grossNeeded / billableHours);

  return {
    ok: true,
    metrics: [
      { key: "hourlyRate", label: "Required hourly rate", kind: "currency", value: hourlyRate, primary: true },
      { key: "grossNeeded", label: "Gross revenue needed", kind: "currency", value: roundMoney(grossNeeded) },
      { key: "billableHours", label: "Billable hours / year", kind: "number", value: roundMoney(billableHours) },
      { key: "targetIncome", label: "Target income", kind: "currency", value: targetIncome },
      { key: "taxPercent", label: "Tax rate", kind: "percent", value: taxPercent },
    ],
    narrative:
      "To take home {targetIncome} after expenses and {taxPercent} tax, charge about {hourlyRate} per billable hour. Estimated calculation based on the values you entered.",
    data: { hourlyRate, grossNeeded: roundMoney(grossNeeded), billableHours: roundMoney(billableHours) },
  };
}
