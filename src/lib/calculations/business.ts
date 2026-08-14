import type { CalcResult, CalculatorInputs } from "@/types";
import { allFinite, roundMoney, roundTo, toNumber } from "@/lib/utils/math";
import { OVERFLOW_ERROR } from "./sanitize";

/**
 * Overtime pay: regular pay + overtime hours at a multiplier.
 */
export function calculateOvertime(inputs: CalculatorInputs): CalcResult {
  const hourlyRate = toNumber(inputs.hourlyRate);
  const regularHours = toNumber(inputs.regularHours, 40);
  const overtimeHours = toNumber(inputs.overtimeHours, 0);
  const multiplier = toNumber(inputs.multiplier, 1.5);

  if (hourlyRate <= 0) return { ok: false, error: "Hourly rate must be greater than zero.", metrics: [] };
  if (regularHours < 0 || overtimeHours < 0) return { ok: false, error: "Hours cannot be negative.", metrics: [] };

  const rawRegular = hourlyRate * regularHours;
  const rawOvertimeRate = hourlyRate * multiplier;
  const rawOvertimePay = rawOvertimeRate * overtimeHours;
  if (!allFinite(rawRegular, rawOvertimeRate, rawOvertimePay, rawRegular + rawOvertimePay)) {
    return { ok: false, error: OVERFLOW_ERROR, metrics: [] };
  }
  const regularPay = roundMoney(rawRegular);
  const overtimeRate = roundMoney(rawOvertimeRate);
  const overtimePay = roundMoney(rawOvertimePay);
  const total = roundMoney(regularPay + overtimePay);

  return {
    ok: true,
    metrics: [
      { key: "total", label: "Total pay", kind: "currency", value: total, primary: true },
      { key: "regularPay", label: "Regular pay", kind: "currency", value: regularPay },
      { key: "overtimePay", label: "Overtime pay", kind: "currency", value: overtimePay },
      { key: "overtimeRate", label: "Overtime rate", kind: "currency", value: overtimeRate },
      { key: "hourlyRate", label: "Hourly rate", kind: "currency", value: hourlyRate },
    ],
    narrative: `At {hourlyRate}/hr with ${overtimeHours} overtime hour${overtimeHours === 1 ? "" : "s"} at ${multiplier}×, you earn {overtimePay} in overtime on top of {regularPay} regular pay — {total} total.`,
    data: { total, regularPay, overtimePay, overtimeRate },
  };
}

/**
 * Customer acquisition cost (CAC): total spend ÷ customers acquired.
 */
export function calculateCac(inputs: CalculatorInputs): CalcResult {
  const spend = toNumber(inputs.spend);
  const customers = toNumber(inputs.customers);

  if (spend < 0) return { ok: false, error: "Spend cannot be negative.", metrics: [] };
  if (customers <= 0) return { ok: false, error: "Customers acquired must be greater than zero.", metrics: [] };

  const cac = roundMoney(spend / customers);

  return {
    ok: true,
    metrics: [
      { key: "cac", label: "Customer acquisition cost", kind: "currency", value: cac, primary: true },
      { key: "spend", label: "Total spend", kind: "currency", value: spend },
      { key: "customers", label: "Customers acquired", kind: "number", value: customers },
    ],
    narrative: `Spending {spend} to acquire ${customers} customer${customers === 1 ? "" : "s"} gives a customer acquisition cost of {cac} per customer.`,
    data: { cac, spend, customers },
  };
}

/**
 * Customer lifetime value (LTV) and LTV:CAC ratio.
 * LTV = avg revenue per customer per period × gross margin × lifespan (periods).
 */
export function calculateLtv(inputs: CalculatorInputs): CalcResult {
  const revenuePerPeriod = toNumber(inputs.revenuePerPeriod);
  const marginPercent = toNumber(inputs.marginPercent, 100);
  const lifespan = toNumber(inputs.lifespan);
  const cac = toNumber(inputs.cac, 0);

  if (revenuePerPeriod <= 0) return { ok: false, error: "Revenue per period must be greater than zero.", metrics: [] };
  if (lifespan <= 0) return { ok: false, error: "Customer lifespan must be greater than zero.", metrics: [] };

  const rawLtv = revenuePerPeriod * (marginPercent / 100) * lifespan;
  if (!allFinite(rawLtv)) {
    return { ok: false, error: OVERFLOW_ERROR, metrics: [] };
  }
  const ltv = roundMoney(rawLtv);
  const ratio = cac > 0 ? roundTo(ltv / cac, 2) : null;

  const metrics = [
    { key: "ltv", label: "Customer lifetime value", kind: "currency" as const, value: ltv, primary: true },
    { key: "revenuePerPeriod", label: "Revenue per period", kind: "currency" as const, value: revenuePerPeriod },
    { key: "marginPercent", label: "Gross margin", kind: "percent" as const, value: marginPercent },
  ];
  if (ratio !== null) {
    metrics.push({ key: "ratio", label: "LTV : CAC ratio", kind: "text" as const, value: `${ratio} : 1` } as never);
  }

  return {
    ok: true,
    metrics,
    narrative: `With {revenuePerPeriod} revenue per period, a ${marginPercent}% margin and a ${lifespan}-period lifespan, each customer is worth {ltv}.${ratio !== null ? ` Against a CAC of {cac}, that's an LTV:CAC ratio of ${ratio}:1${ratio >= 3 ? " — generally considered healthy" : ratio >= 1 ? " — positive but below the common 3:1 benchmark" : " — you're spending more to acquire customers than they return"}.` : ""}`,
    data: { ltv, ratio: ratio ?? 0 },
  };
}
