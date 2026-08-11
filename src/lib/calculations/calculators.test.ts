import { describe, it, expect } from "vitest";
import { calculateLoan } from "./loan";
import { calculateCompoundGrowth } from "./compound-growth";
import { calculateSavingsGoal } from "./savings-goal";
import { calculateEmergencyFund } from "./emergency-fund";
import { calculateDebtPayoff } from "./debt-payoff";
import { calculateMortgage } from "./mortgage";
import { calculateAffordability } from "./affordability";
import { calculateDiscount } from "./discount";
import { calculateUnitPrice } from "./unit-price";
import { calculateRentAffordability } from "./rent-affordability";
import { calculateSalesTax } from "./sales-tax";
import { calculateTip } from "./tip";
import { calculateTimeDuration } from "./time-duration";
import { calculateDateDuration } from "./date-duration";
import { calculateAge } from "./age";
import { calculateCountdown } from "./countdown";
import { calculatePercentage } from "./percentage";
import { calculateFreelanceRate } from "./freelance-rate";
import { calculateMeetingCost } from "./meeting-cost";
import { calculateBreakEven } from "./break-even";

function metric(result: ReturnType<typeof calculateLoan>, key: string) {
  const m = result.metrics.find((x) => x.key === key);
  if (!m) throw new Error(`metric ${key} missing`);
  return m.value as number;
}

describe("loan", () => {
  it("computes a standard amortizing payment", () => {
    const r = calculateLoan({ principal: 20000, interestRate: 7, termYears: 5 });
    expect(r.ok).toBe(true);
    // Known value: ~396.02
    expect(metric(r, "monthlyPayment")).toBeCloseTo(396.02, 2);
    expect(metric(r, "totalInterest")).toBeCloseTo(3761.2, 1);
  });
  it("handles zero interest", () => {
    const r = calculateLoan({ principal: 1200, interestRate: 0, termYears: 1 });
    expect(metric(r, "monthlyPayment")).toBeCloseTo(100, 2);
  });
  it("rejects non-positive principal", () => {
    expect(calculateLoan({ principal: 0, interestRate: 5, termYears: 5 }).ok).toBe(false);
  });
});

describe("compound growth", () => {
  it("grows a starting amount with no contributions", () => {
    const r = calculateCompoundGrowth({ startingAmount: 1000, contribution: 0, frequency: "monthly", growthRate: 12, years: 1 });
    // 1000 * 1.01^12 = 1126.83
    expect(metric(r, "finalValue")).toBeCloseTo(1126.83, 1);
  });
  it("separates contributions from growth", () => {
    const r = calculateCompoundGrowth({ startingAmount: 0, contribution: 100, frequency: "monthly", growthRate: 0, years: 1 });
    expect(metric(r, "finalValue")).toBeCloseTo(1200, 2);
    expect(metric(r, "growthEarned")).toBeCloseTo(0, 2);
  });
  it("rejects when nothing is invested", () => {
    expect(calculateCompoundGrowth({ startingAmount: 0, contribution: 0, frequency: "monthly", growthRate: 5, years: 5 }).ok).toBe(false);
  });
});

describe("savings goal", () => {
  it("computes required monthly contribution with no growth", () => {
    const r = calculateSavingsGoal({ targetAmount: 12000, currentSavings: 0, years: 1, frequency: "monthly", growthRate: 0 });
    expect(metric(r, "requiredContribution")).toBeCloseTo(1000, 2);
  });
  it("accounts for current savings", () => {
    const r = calculateSavingsGoal({ targetAmount: 10000, currentSavings: 4000, years: 1, frequency: "monthly", growthRate: 0 });
    expect(metric(r, "requiredContribution")).toBeCloseTo(500, 2);
  });
  it("reports when the goal is already met", () => {
    const r = calculateSavingsGoal({ targetAmount: 1000, currentSavings: 2000, years: 1, frequency: "monthly", growthRate: 0 });
    expect(metric(r, "requiredContribution")).toBe(0);
  });
});

describe("emergency fund", () => {
  it("computes target and shortfall", () => {
    const r = calculateEmergencyFund({ monthlyExpenses: 2000, months: 6, currentSavings: 3000 });
    expect(metric(r, "target")).toBe(12000);
    expect(metric(r, "shortfall")).toBe(9000);
  });
  it("caps funded percent at 100", () => {
    const r = calculateEmergencyFund({ monthlyExpenses: 1000, months: 3, currentSavings: 5000 });
    expect(metric(r, "fundedPercent")).toBe(100);
  });
});

describe("debt payoff", () => {
  it("computes months and interest", () => {
    const r = calculateDebtPayoff({ balance: 8000, interestRate: 18, monthlyPayment: 250, extraPayment: 0 });
    expect(r.ok).toBe(true);
    expect(metric(r, "months")).toBeGreaterThan(0);
    expect(metric(r, "totalInterest")).toBeGreaterThan(0);
  });
  it("shows savings from extra payments", () => {
    const base = calculateDebtPayoff({ balance: 8000, interestRate: 18, monthlyPayment: 250, extraPayment: 0 });
    const extra = calculateDebtPayoff({ balance: 8000, interestRate: 18, monthlyPayment: 250, extraPayment: 100 });
    expect(metric(extra, "monthsSaved")).toBeGreaterThan(0);
    expect(metric(extra, "interestSaved")).toBeGreaterThan(0);
    // Extra payments must never increase the payoff time.
    expect(metric(extra, "months")).toBeLessThanOrEqual(metric(base, "months"));
  });
  it("rejects when payment does not cover interest", () => {
    const r = calculateDebtPayoff({ balance: 100000, interestRate: 24, monthlyPayment: 100, extraPayment: 0 });
    expect(r.ok).toBe(false);
  });
});

describe("mortgage", () => {
  it("computes payment on the financed principal", () => {
    const r = calculateMortgage({ homePrice: 350000, downPayment: 70000, interestRate: 6.5, termYears: 30 });
    expect(r.ok).toBe(true);
    expect(metric(r, "principal")).toBe(280000);
    expect(metric(r, "monthlyPayment")).toBeCloseTo(1769.79, 1);
  });
  it("rejects down payment >= price", () => {
    expect(calculateMortgage({ homePrice: 100000, downPayment: 100000, interestRate: 5, termYears: 30 }).ok).toBe(false);
  });
});

describe("affordability", () => {
  it("expresses a cash purchase as a monthly equivalent", () => {
    const r = calculateAffordability({ price: 1200, monthlyIncome: 6000, financed: "no", downPayment: 0, interestRate: 0, termMonths: 12 });
    expect(metric(r, "monthlyCost")).toBeCloseTo(100, 2);
    expect(metric(r, "incomePercent")).toBeCloseTo(1.67, 1);
  });
  it("computes a financed monthly cost", () => {
    const r = calculateAffordability({ price: 2000, monthlyIncome: 5000, financed: "yes", downPayment: 0, interestRate: 10, termMonths: 12 });
    expect(metric(r, "monthlyCost")).toBeGreaterThan(0);
  });
});

describe("buying calculators", () => {
  it("discount", () => {
    const r = calculateDiscount({ originalPrice: 100, percentOff: 20 });
    expect(metric(r, "finalPrice")).toBe(80);
    expect(metric(r, "saved")).toBe(20);
  });
  it("unit price", () => {
    const r = calculateUnitPrice({ price: 5, quantity: 16 });
    expect(metric(r, "unitPrice")).toBeCloseTo(0.3125, 4);
  });
  it("rent affordability", () => {
    const r = calculateRentAffordability({ monthlyIncome: 5000, targetPercent: 30 });
    expect(metric(r, "maxRent")).toBe(1500);
  });
  it("sales tax", () => {
    const r = calculateSalesTax({ price: 100, taxRate: 8 });
    expect(metric(r, "total")).toBe(108);
    expect(metric(r, "taxAmount")).toBe(8);
  });
  it("tip with split", () => {
    const r = calculateTip({ billAmount: 80, tipPercent: 20, people: 4 });
    expect(metric(r, "total")).toBe(96);
    expect(metric(r, "perPerson")).toBe(24);
  });
});

describe("time duration", () => {
  it("computes a same-day duration", () => {
    const r = calculateTimeDuration({ startTime: "09:30", endTime: "17:45" });
    expect(metric(r, "totalMinutes")).toBe(495);
    expect(metric(r, "decimalHours")).toBeCloseTo(8.25, 2);
  });
  it("handles crossing midnight without a negative duration", () => {
    const r = calculateTimeDuration({ startTime: "23:00", endTime: "01:30" });
    expect(r.ok).toBe(true);
    expect(metric(r, "totalMinutes")).toBe(150);
    expect(metric(r, "hours")).toBe(2);
    expect(metric(r, "minutes")).toBe(30);
  });
  it("treats equal times as a full day", () => {
    const r = calculateTimeDuration({ startTime: "08:00", endTime: "08:00" });
    expect(metric(r, "totalMinutes")).toBe(1440);
  });
  it("rejects invalid times", () => {
    expect(calculateTimeDuration({ startTime: "25:00", endTime: "10:00" }).ok).toBe(false);
  });
});

describe("date duration", () => {
  it("computes total days", () => {
    const r = calculateDateDuration({ startDate: "2026-01-01", endDate: "2026-01-31" });
    expect(metric(r, "totalDays")).toBe(30);
  });
  it("handles reverse order", () => {
    const r = calculateDateDuration({ startDate: "2026-01-31", endDate: "2026-01-01" });
    expect(metric(r, "totalDays")).toBe(-30);
  });
});

describe("age", () => {
  it("computes an exact age", () => {
    const r = calculateAge({ birthDate: "2000-01-15", asOfDate: "2026-01-15" });
    expect(metric(r, "years")).toBe(26);
  });
  it("rejects a future birth date", () => {
    expect(calculateAge({ birthDate: "2999-01-01", asOfDate: "2026-01-01" }).ok).toBe(false);
  });
});

describe("countdown", () => {
  it("reports a past date as passed", () => {
    const r = calculateCountdown({ targetDate: "2000-01-01" });
    expect(metric(r, "daysAgo")).toBeGreaterThan(0);
    expect(r.narrative).toMatch(/was \d+ days? ago/);
  });
  it("counts days to a future date", () => {
    const future = new Date();
    future.setDate(future.getDate() + 10);
    const iso = future.toISOString().slice(0, 10);
    const r = calculateCountdown({ targetDate: iso });
    expect(metric(r, "daysRemaining")).toBeGreaterThanOrEqual(9);
  });
});

describe("percentage", () => {
  it("X% of Y", () => {
    const r = calculatePercentage({ mode: "of", valueA: 15, valueB: 200 });
    expect(metric(r, "result")).toBe(30);
  });
  it("X as a % of Y", () => {
    const r = calculatePercentage({ mode: "whatPercent", valueA: 30, valueB: 200 });
    expect(metric(r, "result")).toBe(15);
  });
  it("percentage change", () => {
    const r = calculatePercentage({ mode: "change", valueA: 100, valueB: 125 });
    expect(metric(r, "result")).toBe(25);
  });
  it("rejects division by zero", () => {
    expect(calculatePercentage({ mode: "whatPercent", valueA: 5, valueB: 0 }).ok).toBe(false);
  });
});

describe("productivity calculators", () => {
  it("freelance rate", () => {
    const r = calculateFreelanceRate({ targetIncome: 80000, annualExpenses: 5000, taxPercent: 25, hoursPerWeek: 40, weeksPerYear: 48, billablePercent: 60 });
    expect(metric(r, "hourlyRate")).toBeGreaterThan(0);
  });
  it("meeting cost", () => {
    const r = calculateMeetingCost({ attendees: 6, avgHourlyRate: 60, durationMinutes: 60 });
    expect(metric(r, "cost")).toBe(360);
  });
  it("break even", () => {
    const r = calculateBreakEven({ fixedCosts: 10000, pricePerUnit: 50, costPerUnit: 30 });
    expect(metric(r, "units")).toBe(500);
  });
  it("break even rejects non-positive margin", () => {
    expect(calculateBreakEven({ fixedCosts: 10000, pricePerUnit: 30, costPerUnit: 30 }).ok).toBe(false);
  });
});
