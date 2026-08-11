import type { CalcResult, CalculatorInputs } from "@/types";
import { roundTo, roundMoney, toNumber } from "@/lib/utils/math";

/**
 * Simple interest: I = P · r · t.
 */
export function calculateSimpleInterest(inputs: CalculatorInputs): CalcResult {
  const principal = toNumber(inputs.principal);
  const rate = toNumber(inputs.rate);
  const years = toNumber(inputs.years);

  if (principal <= 0) return { ok: false, error: "Principal must be greater than zero.", metrics: [] };
  if (rate < 0) return { ok: false, error: "Rate cannot be negative.", metrics: [] };
  if (years <= 0) return { ok: false, error: "Time must be greater than zero.", metrics: [] };

  const interest = roundMoney((principal * rate * years) / 100);
  const total = roundMoney(principal + interest);

  return {
    ok: true,
    metrics: [
      { key: "interest", label: "Interest earned", kind: "currency", value: interest, primary: true },
      { key: "total", label: "Total value", kind: "currency", value: total },
      { key: "principal", label: "Principal", kind: "currency", value: principal },
    ],
    narrative: `At ${rate}% simple interest over ${years} year${years === 1 ? "" : "s"}, {interest} of interest is earned on {principal}, giving a total of {total}.`,
    data: { interest, total, principal },
  };
}

/**
 * Return on investment (ROI): (gain − cost) / cost × 100.
 */
export function calculateRoi(inputs: CalculatorInputs): CalcResult {
  const invested = toNumber(inputs.invested);
  const returned = toNumber(inputs.returned);

  if (invested <= 0) return { ok: false, error: "The amount invested must be greater than zero.", metrics: [] };

  const gain = roundMoney(returned - invested);
  const roi = roundTo((gain / invested) * 100, 2);

  return {
    ok: true,
    metrics: [
      { key: "roi", label: "Return on investment", kind: "percent", value: roi, primary: true, tone: roi >= 0 ? "positive" : "negative" },
      { key: "gain", label: roi >= 0 ? "Net gain" : "Net loss", kind: "currency", value: gain, tone: roi >= 0 ? "positive" : "negative" },
      { key: "invested", label: "Invested", kind: "currency", value: invested },
      { key: "returned", label: "Returned", kind: "currency", value: returned },
    ],
    narrative: roi >= 0
      ? `You gained {gain} on an investment of {invested} — a return of ${roi}%.`
      : `You lost {gain} on an investment of {invested} — a return of ${roi}%.`,
    data: { roi, gain, invested, returned },
  };
}

/**
 * Inflation: future value needed to match today's purchasing power.
 * FV = PV · (1 + r)^n
 */
export function calculateInflation(inputs: CalculatorInputs): CalcResult {
  const amount = toNumber(inputs.amount);
  const rate = toNumber(inputs.rate);
  const years = toNumber(inputs.years);

  if (amount <= 0) return { ok: false, error: "Amount must be greater than zero.", metrics: [] };
  if (years <= 0) return { ok: false, error: "Years must be greater than zero.", metrics: [] };

  const futureValue = roundMoney(amount * Math.pow(1 + rate / 100, years));
  const increase = roundMoney(futureValue - amount);
  const pctIncrease = roundTo((increase / amount) * 100, 2);

  return {
    ok: true,
    metrics: [
      { key: "futureValue", label: `Equivalent in ${years} years`, kind: "currency", value: futureValue, primary: true },
      { key: "increase", label: "Purchasing power lost", kind: "currency", value: increase, tone: "warning" },
      { key: "pctIncrease", label: "Price increase", kind: "percent", value: pctIncrease },
    ],
    narrative: `At ${rate}% annual inflation, {amount} today will have the same purchasing power as {futureValue} in ${years} year${years === 1 ? "" : "s"} — prices rise by ${pctIncrease}%.`,
    data: { futureValue, increase, pctIncrease },
  };
}

/**
 * Salary converter: convert between annual, monthly, weekly, daily and hourly.
 */
export function calculateSalary(inputs: CalculatorInputs): CalcResult {
  const amount = toNumber(inputs.amount);
  const period = typeof inputs.period === "string" ? inputs.period : "annual";
  const hoursPerWeek = toNumber(inputs.hoursPerWeek, 40);
  const weeksPerYear = toNumber(inputs.weeksPerYear, 52);

  if (amount <= 0) return { ok: false, error: "Enter an amount greater than zero.", metrics: [] };
  if (hoursPerWeek <= 0 || weeksPerYear <= 0) {
    return { ok: false, error: "Hours per week and weeks per year must be greater than zero.", metrics: [] };
  }

  // Normalize to annual.
  let annual: number;
  switch (period) {
    case "annual": annual = amount; break;
    case "monthly": annual = amount * 12; break;
    case "weekly": annual = amount * weeksPerYear; break;
    case "daily": annual = amount * weeksPerYear * 5; break;
    case "hourly": annual = amount * hoursPerWeek * weeksPerYear; break;
    default: annual = amount;
  }

  const monthly = annual / 12;
  const weekly = annual / weeksPerYear;
  const daily = weekly / 5;
  const hourly = weekly / hoursPerWeek;

  return {
    ok: true,
    metrics: [
      { key: "annual", label: "Annual", kind: "currency", value: roundMoney(annual), primary: true },
      { key: "monthly", label: "Monthly", kind: "currency", value: roundMoney(monthly) },
      { key: "weekly", label: "Weekly", kind: "currency", value: roundMoney(weekly) },
      { key: "daily", label: "Daily (5-day week)", kind: "currency", value: roundMoney(daily) },
      { key: "hourly", label: "Hourly", kind: "currency", value: roundMoney(hourly) },
    ],
    narrative: `{annual} per year works out to {monthly} per month, {weekly} per week, or about {hourly} per hour (based on ${hoursPerWeek} hrs/week, ${weeksPerYear} weeks/year).`,
    data: {
      annual: roundMoney(annual),
      monthly: roundMoney(monthly),
      weekly: roundMoney(weekly),
      daily: roundMoney(daily),
      hourly: roundMoney(hourly),
    },
  };
}

/**
 * Sales commission: commission = sales × rate (+ tiered bonus optional).
 */
export function calculateCommission(inputs: CalculatorInputs): CalcResult {
  const sales = toNumber(inputs.sales);
  const rate = toNumber(inputs.rate);
  const base = toNumber(inputs.base, 0);

  if (sales < 0) return { ok: false, error: "Sales cannot be negative.", metrics: [] };
  if (rate < 0) return { ok: false, error: "Commission rate cannot be negative.", metrics: [] };

  const commission = roundMoney((sales * rate) / 100);
  const total = roundMoney(base + commission);

  return {
    ok: true,
    metrics: [
      { key: "commission", label: "Commission earned", kind: "currency", value: commission, primary: true },
      { key: "total", label: "Total pay (incl. base)", kind: "currency", value: total },
      { key: "sales", label: "Sales", kind: "currency", value: sales },
    ],
    narrative: `At a ${rate}% commission rate, {sales} in sales earns {commission} in commission${base > 0 ? `, for a total pay of {total} including your base` : ""}.`,
    data: { commission, total, sales },
  };
}

/**
 * Profit margin & markup.
 * Margin = (price − cost) / price; Markup = (price − cost) / cost.
 */
export function calculateMargin(inputs: CalculatorInputs): CalcResult {
  const cost = toNumber(inputs.cost);
  const price = toNumber(inputs.price);

  if (cost < 0) return { ok: false, error: "Cost cannot be negative.", metrics: [] };
  if (price <= 0) return { ok: false, error: "Price must be greater than zero.", metrics: [] };

  const profit = roundMoney(price - cost);
  const margin = roundTo((profit / price) * 100, 2);
  const markup = cost > 0 ? roundTo((profit / cost) * 100, 2) : 0;

  return {
    ok: true,
    metrics: [
      { key: "profit", label: "Profit per unit", kind: "currency", value: profit, primary: true, tone: profit >= 0 ? "positive" : "negative" },
      { key: "margin", label: "Profit margin", kind: "percent", value: margin },
      { key: "markup", label: "Markup", kind: "percent", value: markup },
    ],
    narrative: `Selling at {price} with a cost of {cost} gives {profit} profit per unit — a ${margin}% margin and a ${markup}% markup.`,
    data: { profit, margin, markup },
  };
}
