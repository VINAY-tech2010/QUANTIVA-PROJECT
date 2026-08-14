import type { CalcResult, CalculatorInputs } from "@/types";
import { allFinite, monthlyPayment, roundMoney, toNumber } from "@/lib/utils/math";
import { OVERFLOW_ERROR } from "./sanitize";

/**
 * Affordability — can I afford this purchase? Considers optional financing
 * and expresses the cost as a share of monthly income.
 */
export function calculateAffordability(inputs: CalculatorInputs): CalcResult {
  const price = toNumber(inputs.price);
  const monthlyIncome = toNumber(inputs.monthlyIncome);
  const downPayment = toNumber(inputs.downPayment);
  const annualRate = toNumber(inputs.interestRate);
  const termMonths = Math.round(toNumber(inputs.termMonths));
  const financed = inputs.financed === "yes";

  if (price <= 0) {
    return { ok: false, error: "Enter a purchase price greater than zero.", metrics: [] };
  }
  if (monthlyIncome <= 0) {
    return { ok: false, error: "Enter your monthly income.", metrics: [] };
  }
  if (downPayment < 0) {
    return { ok: false, error: "Down payment cannot be negative.", metrics: [] };
  }

  let monthlyCost: number;
  let upfront = downPayment;
  let totalCost = price;

  if (financed) {
    if (downPayment >= price) {
      return { ok: false, error: "Down payment must be less than the price when financing.", metrics: [] };
    }
    if (termMonths <= 0) {
      return { ok: false, error: "Enter a financing term in months.", metrics: [] };
    }
    const principal = price - downPayment;
    monthlyCost = monthlyPayment(principal, annualRate, termMonths);
    const rawTotalCost = downPayment + monthlyCost * termMonths;
    if (!allFinite(monthlyCost, rawTotalCost)) {
      return { ok: false, error: OVERFLOW_ERROR, metrics: [] };
    }
    totalCost = roundMoney(rawTotalCost);
  } else {
    // Paying in full: express the one-time cost as an equivalent monthly
    // figure over 12 months for an apples-to-apples income comparison.
    if (!Number.isFinite(price / 12)) {
      return { ok: false, error: OVERFLOW_ERROR, metrics: [] };
    }
    monthlyCost = roundMoney(price / 12);
    upfront = price;
  }

  const rawIncomePercent = (monthlyCost / monthlyIncome) * 100;
  if (!allFinite(rawIncomePercent)) {
    return { ok: false, error: OVERFLOW_ERROR, metrics: [] };
  }
  const incomePercent = roundMoney(rawIncomePercent);

  let tone: "positive" | "warning" | "negative";
  let verdict: string;
  if (incomePercent <= 10) {
    tone = "positive";
    verdict = "comfortably affordable";
  } else if (incomePercent <= 20) {
    tone = "warning";
    verdict = "affordable with some care";
  } else {
    tone = "negative";
    verdict = "likely a stretch";
  }

  return {
    ok: true,
    metrics: [
      { key: "monthlyCost", label: financed ? "Monthly cost" : "Equivalent monthly cost", kind: "currency", value: monthlyCost, primary: true, tone },
      { key: "incomePercent", label: "Share of monthly income", kind: "percent", value: incomePercent, tone },
      { key: "upfront", label: "Due up front", kind: "currency", value: upfront },
      { key: "totalCost", label: "Total cost", kind: "currency", value: totalCost },
    ],
    narrative:
      "This purchase is " + verdict + ": it works out to about {monthlyCost} per month, which is {incomePercent} of your monthly income. " +
      "Estimated calculation based on the values you entered.",
    data: { monthlyCost, incomePercent, upfront, totalCost, price },
  };
}
