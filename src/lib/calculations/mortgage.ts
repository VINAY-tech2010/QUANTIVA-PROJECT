import type { CalcResult, CalculatorInputs } from "@/types";
import { monthlyPayment, roundMoney, toNumber } from "@/lib/utils/math";

/**
 * Mortgage — home loan payment, total cost and interest.
 */
export function calculateMortgage(inputs: CalculatorInputs): CalcResult {
  const homePrice = toNumber(inputs.homePrice);
  const downPayment = toNumber(inputs.downPayment);
  const annualRate = toNumber(inputs.interestRate);
  const termYears = toNumber(inputs.termYears);

  if (homePrice <= 0) {
    return { ok: false, error: "Enter a home price greater than zero.", metrics: [] };
  }
  if (downPayment < 0) {
    return { ok: false, error: "Down payment cannot be negative.", metrics: [] };
  }
  if (downPayment >= homePrice) {
    return { ok: false, error: "Down payment must be less than the home price.", metrics: [] };
  }
  if (annualRate < 0) {
    return { ok: false, error: "Interest rate cannot be negative.", metrics: [] };
  }
  if (termYears <= 0) {
    return { ok: false, error: "Enter a term greater than zero.", metrics: [] };
  }

  const principal = roundMoney(homePrice - downPayment);
  const termMonths = Math.round(termYears * 12);
  const payment = monthlyPayment(principal, annualRate, termMonths);
  const totalRepayment = roundMoney(payment * termMonths);
  const totalInterest = roundMoney(totalRepayment - principal);
  const downPercent = roundMoney((downPayment / homePrice) * 100);
  const totalCost = roundMoney(totalRepayment + downPayment);

  return {
    ok: true,
    metrics: [
      { key: "monthlyPayment", label: "Monthly payment", kind: "currency", value: payment, primary: true },
      { key: "principal", label: "Loan amount", kind: "currency", value: principal },
      { key: "totalInterest", label: "Total interest", kind: "currency", value: totalInterest },
      { key: "totalCost", label: "Total cost of home", kind: "currency", value: totalCost },
      { key: "downPercent", label: "Down payment", kind: "percent", value: downPercent },
    ],
    narrative:
      "With {downPayment} down, your loan is {principal} and the monthly payment is about {monthlyPayment} over {termMonths} months. " +
      "Including the down payment, the home costs {totalCost} in total. Estimated calculation based on the values you entered.",
    data: { monthlyPayment: payment, principal, totalInterest, totalCost, downPercent, termMonths },
  };
}
