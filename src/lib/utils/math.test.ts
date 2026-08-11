import { describe, expect, it } from "vitest";
import {
  clamp,
  formatDuration,
  futureValue,
  isNonNegative,
  isPositive,
  minutesToDecimalHours,
  monthlyPayment,
  payoffMonths,
  roundMoney,
  roundTo,
  toNumber,
} from "./math";

describe("roundTo / roundMoney", () => {
  it("rounds to decimals avoiding FP noise", () => {
    expect(roundTo(1.005, 2)).toBe(1.01);
    expect(roundMoney(396.024)).toBe(396.02);
  });
  it("returns 0 for non-finite input", () => {
    expect(roundTo(Number.NaN)).toBe(0);
    expect(roundTo(Infinity)).toBe(0);
  });
});

describe("clamp", () => {
  it("clamps into range", () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(11, 0, 10)).toBe(10);
  });
});

describe("toNumber", () => {
  it("parses numbers and numeric strings", () => {
    expect(toNumber(5)).toBe(5);
    expect(toNumber("12.5")).toBe(12.5);
    expect(toNumber("1,234.5")).toBe(1234.5);
  });
  it("falls back on invalid input", () => {
    expect(toNumber("abc", 7)).toBe(7);
    expect(toNumber(undefined, 3)).toBe(3);
    expect(toNumber(Number.NaN, 9)).toBe(9);
  });
});

describe("predicates", () => {
  it("isPositive / isNonNegative", () => {
    expect(isPositive(1)).toBe(true);
    expect(isPositive(0)).toBe(false);
    expect(isNonNegative(0)).toBe(true);
    expect(isNonNegative(-1)).toBe(false);
  });
});

describe("monthlyPayment", () => {
  it("computes a standard amortizing payment", () => {
    // $20,000 at 7% for 60 months ≈ $396.02.
    expect(monthlyPayment(20000, 7, 60)).toBeCloseTo(396.02, 2);
  });
  it("handles zero interest", () => {
    expect(monthlyPayment(1200, 0, 12)).toBe(100);
  });
  it("returns 0 for invalid input", () => {
    expect(monthlyPayment(0, 7, 60)).toBe(0);
    expect(monthlyPayment(20000, 7, 0)).toBe(0);
  });
});

describe("payoffMonths", () => {
  it("returns Infinity when payment does not cover interest", () => {
    // $10,000 at 24% -> $200/mo interest; a $150 payment never pays off.
    expect(payoffMonths(10000, 24, 150)).toBe(Infinity);
  });
  it("handles zero interest as linear payoff", () => {
    expect(payoffMonths(1000, 0, 100)).toBe(10);
  });
});

describe("futureValue", () => {
  it("grows principal with zero rate as simple addition", () => {
    expect(futureValue(1000, 100, 0, 2, 12, 12)).toBe(1000 + 100 * 12 * 2);
  });
  it("compounds principal", () => {
    const fv = futureValue(1000, 0, 12, 1, 12, 12);
    expect(fv).toBeCloseTo(1126.83, 1);
  });
});

describe("formatDuration", () => {
  it("formats hours and minutes", () => {
    expect(formatDuration(150)).toBe("2 hours 30 minutes");
    expect(formatDuration(60)).toBe("1 hour");
    expect(formatDuration(45)).toBe("45 minutes");
    expect(formatDuration(61)).toBe("1 hour 1 minute");
  });
  it("handles negative durations", () => {
    expect(formatDuration(-90)).toBe("-1 hour 30 minutes");
  });
});

describe("minutesToDecimalHours", () => {
  it("converts minutes to decimal hours", () => {
    expect(minutesToDecimalHours(90)).toBe(1.5);
    expect(minutesToDecimalHours(150)).toBe(2.5);
  });
});
