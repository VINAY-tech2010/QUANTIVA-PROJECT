import { describe, expect, it } from "vitest";
import { roundTo, allFinite, futureValue } from "@/lib/utils/math";
import { sanitizeResult, OVERFLOW_ERROR } from "@/lib/calculations/sanitize";
import { calculateLoan } from "./loan";
import { calculateDateAdd, calculateWorkDays } from "./time-tools";
import { calculatePace } from "./health";
import { calculateBaseConvert, calculateDownloadTime } from "./technology";
import { calculateCombinatorics } from "./math-tools";
import { calculatePythagorean } from "./geometry";
import { calculateSavingsGoal } from "./savings-goal";
import { calculateCurrencyConvert } from "./currency-convert";
import { calculateAffordability } from "./affordability";
import type { CalcResult } from "@/types";

function metric(result: CalcResult, key: string) {
  const m = result.metrics.find((x) => x.key === key);
  if (!m) throw new Error(`metric ${key} missing`);
  return m.value;
}

describe("math rounding overflow guard", () => {
  it("roundTo returns the raw value instead of 0 when scaling overflows", () => {
    const huge = 1e307;
    expect(roundTo(huge, 2)).toBe(huge);
    expect(roundTo(huge, 2)).not.toBe(0);
  });
  it("roundTo still returns 0 for non-finite input", () => {
    expect(roundTo(Number.NaN)).toBe(0);
    expect(roundTo(Infinity)).toBe(0);
  });
  it("allFinite detects any non-finite value", () => {
    expect(allFinite(1, 2, 3)).toBe(true);
    expect(allFinite(1, Number.NaN)).toBe(false);
    expect(allFinite(1, Infinity)).toBe(false);
    expect(allFinite()).toBe(true);
  });
  it("futureValue returns NaN on overflow instead of rounding to 0", () => {
    expect(Number.isNaN(futureValue(1e308, 0, 5, 30, 12, 12))).toBe(true);
  });
});

describe("sanitizeResult", () => {
  it("passes through a healthy result untouched", () => {
    const result: CalcResult = {
      ok: true,
      metrics: [{ key: "x", label: "X", kind: "number", value: 42, primary: true }],
      narrative: "ok",
      data: { x: 42 },
    };
    expect(sanitizeResult(result)).toBe(result);
  });
  it("rejects a result whose metrics are non-finite", () => {
    const result: CalcResult = {
      ok: true,
      metrics: [{ key: "x", label: "X", kind: "number", value: Infinity, primary: true }],
      narrative: "ok",
      data: {},
    };
    const sanitized = sanitizeResult(result);
    expect(sanitized.ok).toBe(false);
    expect(sanitized.ok ? "" : sanitized.error).toBe(OVERFLOW_ERROR);
    expect(sanitized.metrics).toEqual([]);
  });
  it("rejects a result with NaN in data", () => {
    const result: CalcResult = {
      ok: true,
      metrics: [{ key: "x", label: "X", kind: "number", value: 5, primary: true }],
      narrative: "ok",
      data: { x: Number.NaN },
    };
    expect(sanitizeResult(result).ok).toBe(false);
  });
});

describe("loan", () => {
  it("rejects a term shorter than one month", () => {
    // 0.04 years = 0.48 months → rounds to 0 months.
    const r = calculateLoan({ principal: 1000, interestRate: 5, termYears: 0.04 });
    expect(r.ok).toBe(false);
  });
  it("rejects values whose repayment total overflows", () => {
    const r = calculateLoan({ principal: 1e308, interestRate: 5, termYears: 30 });
    expect(r.ok).toBe(false);
  });
});

describe("time tools", () => {
  it("date-add refuses out-of-range results instead of throwing", () => {
    const r = calculateDateAdd({ startDate: "2024-01-01", years: 300000, direction: "add" });
    expect(r.ok).toBe(false);
  });
  it("work-days counts correctly across week boundaries", () => {
    // Fri 2024-01-05 to Mon 2024-01-08 → 2 working days.
    const r = calculateWorkDays({ startDate: "2024-01-05", endDate: "2024-01-08" });
    expect(metric(r, "workDays")).toBe(2);
    expect(metric(r, "weekendDays")).toBe(2);
  });
  it("work-days handles a huge range instantly and correctly", () => {
    // 2024-01-01 (Monday) to 3024-01-01 = 365,243 days inclusive:
    // 52177 full weeks (260,885 working days) plus Mon–Thu (4 more).
    const r = calculateWorkDays({ startDate: "2024-01-01", endDate: "3024-01-01" });
    expect(metric(r, "totalDays")).toBe(365243);
    expect(metric(r, "workDays")).toBe(260889);
    expect(metric(r, "weekendDays")).toBe(104354);
  });
});

describe("pace", () => {
  it("never emits a 60-second carry in the minutes field", () => {
    // 6 km in 11:57.6 → 1:59.6/km rounds to 2:00, not 1:60.
    const r = calculatePace({ distance: 6, hours: 0, minutes: 11, seconds: 57.6, unit: "km" });
    const pace = String(metric(r, "pace"));
    expect(pace).not.toContain(":60");
    expect(pace).toBe("2:00 /km");
  });
});

describe("base conversion", () => {
  it("rejects input with digits invalid for the base", () => {
    expect(calculateBaseConvert({ value: "12", fromBase: 2 }).ok).toBe(false);
    expect(calculateBaseConvert({ value: "101b", fromBase: 2 }).ok).toBe(false);
    expect(calculateBaseConvert({ value: "1.5", fromBase: 10 }).ok).toBe(false);
  });
  it("still accepts valid input", () => {
    const r = calculateBaseConvert({ value: "1010", fromBase: 2 });
    expect(r.ok).toBe(true);
    expect(metric(r, "decimal")).toBe("10");
  });
  it("download time refuses overflow", () => {
    const r = calculateDownloadTime({ sizeMb: 1e308, speedMbps: 10 });
    expect(r.ok).toBe(false);
  });
});

describe("permutations", () => {
  it("refuses overflow instead of emitting Infinity", () => {
    const r = calculateCombinatorics({ n: 1000, r: 104 });
    expect(r.ok).toBe(false);
  });
  it("still computes normal permutations", () => {
    const r = calculateCombinatorics({ n: 10, r: 3 });
    expect(r.ok).toBe(true);
    expect(metric(r, "npr")).toBe(720);
  });
});

describe("pythagorean", () => {
  it("refuses overflow instead of emitting NaN", () => {
    const r = calculatePythagorean({ solve: "c", a: 1e308, b: 1e308 });
    expect(r.ok).toBe(false);
  });
  it("solves a missing leg", () => {
    const r = calculatePythagorean({ solve: "a", c: 5, b: 3 });
    expect(metric(r, "a")).toBe(4);
  });
});

describe("savings goal", () => {
  it("reports a goal metric when already met (narrative token source)", () => {
    const r = calculateSavingsGoal({ targetAmount: 1000, currentSavings: 2000, years: 1, frequency: "monthly", growthRate: 0 });
    expect(r.ok).toBe(true);
    expect(metric(r, "targetAmount")).toBe(1000);
    expect(metric(r, "requiredContribution")).toBe(0);
  });
  it("refuses overflow", () => {
    const r = calculateSavingsGoal({ targetAmount: 1e308, currentSavings: 0, years: 1, frequency: "monthly", growthRate: 1e308 });
    expect(r.ok).toBe(false);
  });
});

describe("currency convert", () => {
  it("converts amount × manual rate", () => {
    const r = calculateCurrencyConvert({ amount: 100, from: "USD", to: "INR", rate: 83.2 });
    expect(r.ok).toBe(true);
    expect(r.data?.converted).toBe(8320);
  });
  it("refuses overflow with an extreme manual rate", () => {
    const r = calculateCurrencyConvert({ amount: 1e308, from: "USD", to: "INR", rate: 10 });
    expect(r.ok).toBe(false);
  });
});

describe("affordability", () => {
  it("refuses overflow on the financed path", () => {
    const r = calculateAffordability({
      price: 1e308,
      downPayment: 1000,
      interestRate: 5,
      termMonths: 1e308,
      monthlyIncome: 5000,
      financed: "yes",
    });
    expect(r.ok).toBe(false);
  });
});

describe("futureValue sanity (no regression)", () => {
  it("still compounds correctly for normal values", () => {
    expect(futureValue(1000, 0, 12, 1, 12, 12)).toBeCloseTo(1126.83, 2);
  });
});