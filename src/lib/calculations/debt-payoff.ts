import type { CalcResult, CalculatorInputs } from "@/types";
import { payoffMonths, roundMoney, toNumber } from "@/lib/utils/math";

/**
 * Debt payoff — time and interest to clear a balance, plus the benefit of
 * making an extra monthly payment.
 */
export function calculateDebtPayoff(inputs: CalculatorInputs): CalcResult {
  const balance = toNumber(inputs.balance);
  const annualRate = toNumber(inputs.interestRate);
  const payment = toNumber(inputs.monthlyPayment);
  const extra = toNumber(inputs.extraPayment);

  if (balance <= 0) {
    return { ok: false, error: "Enter a balance greater than zero.", metrics: [] };
  }
  if (annualRate < 0) {
    return { ok: false, error: "Interest rate cannot be negative.", metrics: [] };
  }
  if (payment <= 0) {
    return { ok: false, error: "Enter a monthly payment greater than zero.", metrics: [] };
  }
  if (extra < 0) {
    return { ok: false, error: "Extra payment cannot be negative.", metrics: [] };
  }

  const exactMonths = payoffMonths(balance, annualRate, payment);
  if (!Number.isFinite(exactMonths)) {
    return {
      ok: false,
      error: "Your payment does not cover the monthly interest, so the balance will never be paid off.",
      metrics: [],
    };
  }

  const months = Math.ceil(exactMonths);
  const totalPaid = roundMoney(payment * exactMonths);
  const totalInterest = roundMoney(totalPaid - balance);

  const metrics: CalcResult["metrics"] = [
    { key: "months", label: "Time to pay off", kind: "number", value: months, primary: true },
    { key: "totalInterest", label: "Total interest", kind: "currency", value: totalInterest },
    { key: "totalPaid", label: "Total paid", kind: "currency", value: totalPaid },
  ];

  const data: Record<string, number | string> = {
    months,
    totalInterest,
    totalPaid,
    balance,
  };

  let narrative =
    "At {monthlyPayment} per month, this debt is paid off in {months} months and costs {totalInterest} in interest. ";

  if (extra > 0) {
    const boostedPayment = payment + extra;
    const boostedExactMonths = payoffMonths(balance, annualRate, boostedPayment);
    if (Number.isFinite(boostedExactMonths)) {
      const boostedMonths = Math.ceil(boostedExactMonths);
      const boostedTotal = roundMoney(boostedPayment * boostedExactMonths);
      const boostedInterest = roundMoney(boostedTotal - balance);
      const interestSaved = roundMoney(totalInterest - boostedInterest);
      const monthsSaved = months - boostedMonths;
      metrics.push({
        key: "interestSaved",
        label: "Interest saved with extra",
        kind: "currency",
        value: interestSaved,
        tone: "positive",
      });
      metrics.push({
        key: "monthsSaved",
        label: "Months saved with extra",
        kind: "number",
        value: monthsSaved,
        tone: "positive",
      });
      data.interestSaved = interestSaved;
      data.monthsSaved = monthsSaved;
      narrative +=
        "Adding {extraPayment} extra per month saves {interestSaved} in interest and finishes {monthsSaved} months sooner. ";
    }
  }

  narrative += "Estimated calculation based on the values you entered.";

  return { ok: true, metrics, narrative, data };
}
