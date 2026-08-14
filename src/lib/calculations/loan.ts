import type { CalcResult, CalculatorInputs } from "@/types";
import { monthlyPayment, roundMoney, toNumber, allFinite } from "@/lib/utils/math";
import { OVERFLOW_ERROR } from "./sanitize";

/**
 * Loan calculator — standard amortizing loan.
 */
export function calculateLoan(inputs: CalculatorInputs): CalcResult {
  const principal = toNumber(inputs.principal);
  const annualRate = toNumber(inputs.interestRate);
  const termYears = toNumber(inputs.termYears);

  if (principal <= 0) {
    return { ok: false, error: "Enter a loan amount greater than zero.", metrics: [] };
  }
  if (annualRate < 0) {
    return { ok: false, error: "Interest rate cannot be negative.", metrics: [] };
  }
  if (termYears <= 0) {
    return { ok: false, error: "Enter a term greater than zero.", metrics: [] };
  }

    const termMonths = Math.round(termYears * 12);
  if (termMonths < 1) {
    return { ok: false, error: "Enter a term of at least one month.", metrics: [] };
  }
  const payment = monthlyPayment(principal, annualRate, termMonths);
  const rawTotalRepayment = payment * termMonths;
  const totalRepayment = roundMoney(rawTotalRepayment);
  const totalInterest = roundMoney(totalRepayment - principal);

  if (!allFinite(payment, rawTotalRepayment)) {
    return { ok: false, error: OVERFLOW_ERROR, metrics: [] };
  }

  return {
    ok: true,
    metrics: [
      {
        key: "monthlyPayment",
        label: "Monthly payment",
        kind: "currency",
        value: payment,
        primary: true,
      },
      { key: "totalRepayment", label: "Total repayment", kind: "currency", value: totalRepayment },
      { key: "totalInterest", label: "Total interest", kind: "currency", value: totalInterest },
      { key: "termMonths", label: "Term", kind: "number", value: termMonths },
    ],
    narrative:
      "This loan costs approximately {monthlyPayment} per month over {termMonths} months. " +
      "You will repay {totalRepayment} in total, of which {totalInterest} is interest. " +
      "Estimated calculation based on the values you entered.",
    data: {
      monthlyPayment: payment,
      totalRepayment,
      totalInterest,
      principal,
      termMonths,
    },
  };
}
