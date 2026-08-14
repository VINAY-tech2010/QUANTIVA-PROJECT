/**
 * Shared numeric helpers for the calculation engine.
 *
 * These helpers are pure and currency-agnostic. Display formatting that
 * depends on the active currency lives in `@/lib/currency/formatter`.
 */

/** Round to a fixed number of decimal places, avoiding FP presentation noise. */
export function roundTo(value: number, decimals = 2): number {
  if (!Number.isFinite(value)) return 0;
  const factor = 10 ** decimals;
  const scaled = value * factor;
  // Overflow guard: rounding a huge-but-finite value must never return
  // Infinity (or collapse to 0). Return the raw value so callers can still
  // detect the magnitude instead of silently corrupting the result.
  if (!Number.isFinite(scaled)) return value;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

/** Round a monetary amount to 2 decimals. */
export function roundMoney(value: number): number {
  return roundTo(value, 2);
}

/** Clamp a number into [min, max]. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Safe number parse from an input value; returns fallback when invalid. */
export function toNumber(value: number | string | undefined, fallback = 0): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : fallback;
  }
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value.replace(/,/g, ""));
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

/** True when the value is a finite, strictly positive number. */
export function isPositive(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}

/** True when every value is a finite number (rejects NaN/±Infinity/overflow). */
export function allFinite(...values: number[]): boolean {
  return values.every((v) => Number.isFinite(v));
}

/** True when the value is a finite, non-negative number. */
export function isNonNegative(value: number): boolean {
  return Number.isFinite(value) && value >= 0;
}

/**
 * Standard amortizing loan monthly payment.
 * P = principal, r = annual rate (percent), n = term in months.
 */
export function monthlyPayment(
  principal: number,
  annualRatePercent: number,
  termMonths: number,
): number {
  if (!isPositive(principal) || !isPositive(termMonths)) return 0;
  const r = annualRatePercent / 100 / 12;
  if (r === 0) return roundMoney(principal / termMonths);
  const payment =
    (principal * r) / (1 - Math.pow(1 + r, -termMonths));
  return roundMoney(payment);
}

/**
 * Number of months to pay off a balance given a monthly payment.
 * Returns the precise (fractional) month count so scenario comparisons stay
 * accurate; callers round for display. Returns Infinity when the payment does
 * not cover monthly interest.
 */
export function payoffMonths(
  balance: number,
  annualRatePercent: number,
  payment: number,
): number {
  if (!isPositive(balance)) return 0;
  if (!isPositive(payment)) return Infinity;
  const r = annualRatePercent / 100 / 12;
  if (r === 0) return balance / payment;
  const monthlyInterest = balance * r;
  if (payment <= monthlyInterest) return Infinity;
  return -Math.log(1 - (balance * r) / payment) / Math.log(1 + r);
}

/**
 * Future value of a series: starting amount + periodic contributions.
 * Returns NaN when the intermediate arithmetic overflows so callers can
 * reject the input instead of showing a silently corrupt result.
 */
export function futureValue(
  principal: number,
  contribution: number,
  annualRatePercent: number,
  years: number,
  compoundsPerYear: number,
  contributionsPerYear: number,
): number {
  const r = annualRatePercent / 100;
  const totalPeriods = years * compoundsPerYear;
  const periodicRate = r / compoundsPerYear;

  let value = principal;
  if (periodicRate === 0) {
    value = principal + contribution * contributionsPerYear * years;
    return Number.isFinite(value) ? roundMoney(value) : NaN;
  }

  // Compound the principal.
  const grownPrincipal = principal * Math.pow(1 + periodicRate, totalPeriods);

  // Future value of the contribution annuity (contributions at period end).
  const contributionPeriods = years * contributionsPerYear;
  const contributionPeriodicRate = r / contributionsPerYear;
  const grownContributions =
    contributionPeriodicRate === 0
      ? contribution * contributionPeriods
      : contribution *
        ((Math.pow(1 + contributionPeriodicRate, contributionPeriods) - 1) /
          contributionPeriodicRate);

  value = grownPrincipal + grownContributions;
  return Number.isFinite(value) ? roundMoney(value) : NaN;
}

/** Format a duration given in total minutes as "X hours Y minutes". */
export function formatDuration(totalMinutes: number): string {
  const minutes = Math.round(totalMinutes);
  const sign = minutes < 0 ? "-" : "";
  const abs = Math.abs(minutes);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  if (h === 0) return `${sign}${m} minute${m === 1 ? "" : "s"}`;
  if (m === 0) return `${sign}${h} hour${h === 1 ? "" : "s"}`;
  return `${sign}${h} hour${h === 1 ? "" : "s"} ${m} minute${m === 1 ? "" : "s"}`;
}

/** Convert total minutes to decimal hours, rounded to 2 decimals. */
export function minutesToDecimalHours(totalMinutes: number): number {
  return roundTo(totalMinutes / 60, 2);
}
