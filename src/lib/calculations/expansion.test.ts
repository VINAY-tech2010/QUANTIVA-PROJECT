import { describe, it, expect } from "vitest";
import { convert, convertTemperature, formatConverted } from "@/lib/units";
import { calculateUnitConversion } from "./unit-conversion";
import {
  calculateGcdLcm,
  calculatePrimeFactors,
  calculateQuadratic,
  calculatePower,
  calculateLogarithm,
  calculateFactorial,
  calculateCombinatorics,
} from "./math-tools";
import { calculateGeometry, calculateTrig, calculatePythagorean } from "./geometry";
import { calculateStatistics, calculateStdDev, calculateAverage } from "./statistics";
import {
  calculateSimpleInterest,
  calculateRoi,
  calculateInflation,
  calculateSalary,
  calculateCommission,
  calculateMargin,
} from "./finance";
import { calculateCurrencyConvert } from "./currency-convert";
import { calculateBmi, calculateCalories, calculatePace } from "./health";
import { calculateDateAdd, calculateDayOfWeek, calculateWorkDays } from "./time-tools";
import { calculateBillSplit, calculateFuelCost, calculateElectricityCost, calculatePaint } from "./everyday";
import { calculateOvertime, calculateCac, calculateLtv } from "./business";
import { calculateBaseConvert, calculateDownloadTime, calculateAspectRatio } from "./technology";
import { calculateOhmsLaw, calculateKineticEnergy, calculateSpeedDistanceTime, calculateDensity } from "./science";

function metric(result: { metrics: { key: string; value: number | string }[] }, key: string) {
  const m = result.metrics.find((x) => x.key === key);
  if (!m) throw new Error(`metric ${key} missing`);
  return m.value;
}

/* ------------------------------ UNITS ------------------------------ */
describe("unit conversion engine", () => {
  it("converts length miles to km", () => {
    expect(convert("length", 1, "mi", "km")).toBeCloseTo(1.609344, 5);
  });
  it("converts mass kg to lb", () => {
    expect(convert("mass", 1, "kg", "lb")).toBeCloseTo(2.20462, 4);
  });
  it("converts data GB to MB (binary)", () => {
    expect(convert("data", 1, "gb", "mb")).toBe(1024);
  });
  it("converts temperature C to F", () => {
    expect(convertTemperature(100, "c", "f")).toBeCloseTo(212, 5);
  });
  it("converts temperature F to C", () => {
    expect(convertTemperature(32, "f", "c")).toBeCloseTo(0, 5);
  });
  it("converts temperature C to K", () => {
    expect(convertTemperature(0, "c", "k")).toBeCloseTo(273.15, 2);
  });
  it("formats converted values cleanly", () => {
    expect(formatConverted(1.609344)).toBe("1.609344");
  });
});

describe("unit conversion calculator", () => {
  it("converts via the calculator wrapper", () => {
    const r = calculateUnitConversion("length", { value: 10, from: "mi", to: "km" });
    expect(r.ok).toBe(true);
    expect(String(metric(r, "result"))).toContain("km");
  });
  it("rejects invalid numbers", () => {
    expect(calculateUnitConversion("length", { value: NaN, from: "mi", to: "km" }).ok).toBe(false);
  });
});

/* ------------------------------ MATH ------------------------------ */
describe("gcd & lcm", () => {
  it("computes gcd and lcm", () => {
    const r = calculateGcdLcm({ a: 12, b: 18 });
    expect(metric(r, "gcd")).toBe(6);
    expect(metric(r, "lcm")).toBe(36);
  });
  it("rejects non-integers", () => {
    expect(calculateGcdLcm({ a: 1.5, b: 2 }).ok).toBe(false);
  });
});

describe("prime factors", () => {
  it("factorizes a composite number", () => {
    const r = calculatePrimeFactors({ n: 360 });
    expect(r.ok).toBe(true);
    expect(String(metric(r, "factors"))).toBe("2 × 2 × 2 × 3 × 3 × 5");
  });
  it("detects primes", () => {
    const r = calculatePrimeFactors({ n: 13 });
    expect(String(metric(r, "factors"))).toContain("prime");
  });
});

describe("quadratic", () => {
  it("solves two real roots", () => {
    const r = calculateQuadratic({ a: 1, b: -3, c: 2 });
    expect(metric(r, "root1")).toBeCloseTo(2, 5);
    expect(metric(r, "root2")).toBeCloseTo(1, 5);
  });
  it("handles a repeated root", () => {
    const r = calculateQuadratic({ a: 1, b: -2, c: 1 });
    expect(metric(r, "root")).toBeCloseTo(1, 5);
  });
  it("reports complex roots", () => {
    const r = calculateQuadratic({ a: 1, b: 0, c: 1 });
    expect(String(metric(r, "root1"))).toContain("i");
  });
  it("rejects a = 0", () => {
    expect(calculateQuadratic({ a: 0, b: 1, c: 1 }).ok).toBe(false);
  });
});

describe("power & logarithm & factorial", () => {
  it("computes powers", () => {
    expect(metric(calculatePower({ base: 2, exponent: 10 }), "result")).toBe(1024);
  });
  it("computes logarithms", () => {
    expect(metric(calculateLogarithm({ value: 100, base: 10 }), "result")).toBeCloseTo(2, 6);
  });
  it("computes factorials", () => {
    expect(metric(calculateFactorial({ n: 5 }), "result")).toBe(120);
  });
  it("rejects factorial overflow", () => {
    expect(calculateFactorial({ n: 200 }).ok).toBe(false);
  });
});

describe("combinatorics", () => {
  it("computes combinations and permutations", () => {
    const r = calculateCombinatorics({ n: 10, r: 3 });
    expect(metric(r, "ncr")).toBe(120);
    expect(metric(r, "npr")).toBe(720);
  });
  it("rejects r > n", () => {
    expect(calculateCombinatorics({ n: 3, r: 5 }).ok).toBe(false);
  });
});

describe("geometry", () => {
  it("computes circle area and circumference", () => {
    const r = calculateGeometry({ shape: "circle", a: 1 });
    expect(metric(r, "area")).toBeCloseTo(Math.PI, 3);
  });
  it("computes rectangle area", () => {
    const r = calculateGeometry({ shape: "rectangle", a: 4, b: 3 });
    expect(metric(r, "area")).toBe(12);
  });
});

describe("trigonometry", () => {
  it("computes sin/cos of 90 degrees", () => {
    const r = calculateTrig({ angle: 90, unit: "deg" });
    expect(metric(r, "sin")).toBeCloseTo(1, 5);
    expect(metric(r, "cos")).toBeCloseTo(0, 5);
  });
});

describe("pythagorean", () => {
  it("solves for the hypotenuse", () => {
    expect(metric(calculatePythagorean({ solve: "c", a: 3, b: 4 }), "c")).toBeCloseTo(5, 5);
  });
  it("solves for a missing leg", () => {
    expect(metric(calculatePythagorean({ solve: "a", b: 4, c: 5 }), "a")).toBeCloseTo(3, 5);
  });
});

/* ------------------------------ STATISTICS ------------------------------ */
describe("statistics", () => {
  it("computes mean, median, min, max", () => {
    const r = calculateStatistics({ values: "1, 2, 3, 4, 5" });
    expect(metric(r, "mean")).toBe(3);
    expect(metric(r, "median")).toBe(3);
    expect(metric(r, "min")).toBe(1);
    expect(metric(r, "max")).toBe(5);
  });
  it("computes sample standard deviation", () => {
    const r = calculateStdDev({ values: "2, 4, 4, 4, 5, 5, 7, 9", type: "sample" });
    expect(metric(r, "stdDev")).toBeCloseTo(2.138, 2);
  });
  it("computes average", () => {
    expect(metric(calculateAverage({ values: "10, 20, 30" }), "mean")).toBe(20);
  });
  it("rejects empty input", () => {
    expect(calculateStatistics({ values: "" }).ok).toBe(false);
  });
});

/* ------------------------------ FINANCE ------------------------------ */
describe("finance", () => {
  it("computes simple interest", () => {
    const r = calculateSimpleInterest({ principal: 10000, rate: 5, years: 3 });
    expect(metric(r, "interest")).toBe(1500);
    expect(metric(r, "total")).toBe(11500);
  });
  it("computes ROI", () => {
    const r = calculateRoi({ invested: 5000, returned: 6500 });
    expect(metric(r, "roi")).toBeCloseTo(30, 1);
  });
  it("computes inflation future value", () => {
    const r = calculateInflation({ amount: 1000, rate: 3, years: 10 });
    expect(metric(r, "futureValue")).toBeCloseTo(1343.92, 1);
  });
  it("converts an annual salary to hourly", () => {
    const r = calculateSalary({ amount: 52000, period: "annual", hoursPerWeek: 40, weeksPerYear: 52 });
    expect(metric(r, "hourly")).toBeCloseTo(25, 1);
  });
  it("computes commission", () => {
    const r = calculateCommission({ sales: 20000, rate: 5, base: 0 });
    expect(metric(r, "commission")).toBe(1000);
  });
  it("computes margin and markup", () => {
    const r = calculateMargin({ cost: 30, price: 50 });
    expect(metric(r, "margin")).toBeCloseTo(40, 1);
    expect(metric(r, "markup")).toBeCloseTo(66.67, 1);
  });
});

/* ------------------------------ CURRENCY ------------------------------ */
describe("manual currency converter", () => {
  it("converts using a manual rate", () => {
    const r = calculateCurrencyConvert({ amount: 100, from: "USD", to: "INR", rate: 83.5 });
    expect(r.ok).toBe(true);
    expect(String(metric(r, "converted"))).toContain("8,350");
  });
  it("rejects a non-positive rate", () => {
    expect(calculateCurrencyConvert({ amount: 100, from: "USD", to: "INR", rate: 0 }).ok).toBe(false);
  });
});

/* ------------------------------ HEALTH ------------------------------ */
describe("health", () => {
  it("computes BMI", () => {
    const r = calculateBmi({ weightKg: 70, heightCm: 175 });
    expect(metric(r, "bmi")).toBeCloseTo(22.9, 1);
  });
  it("computes daily calories", () => {
    const r = calculateCalories({ weightKg: 70, heightCm: 175, age: 30, sex: "male", activity: "moderate" });
    expect(Number(metric(r, "maintain"))).toBeGreaterThan(2000);
  });
  it("computes pace", () => {
    const r = calculatePace({ distance: 5, unit: "km", hours: 0, minutes: 25, seconds: 0 });
    expect(String(metric(r, "pace"))).toContain("5:00");
  });
});

/* ------------------------------ TIME & DATE ------------------------------ */
describe("time & date tools", () => {
  it("adds days to a date", () => {
    const r = calculateDateAdd({ startDate: "2026-01-01", direction: "add", years: 0, months: 0, weeks: 0, days: 30 });
    expect(metric(r, "result")).toBe("2026-01-31");
  });
  it("finds the day of week", () => {
    const r = calculateDayOfWeek({ date: "2026-08-10" });
    expect(r.ok).toBe(true);
    expect(String(metric(r, "weekday"))).toBe("Monday");
  });
  it("counts working days", () => {
    // Mon 2026-08-10 to Fri 2026-08-14 = 5 working days.
    const r = calculateWorkDays({ startDate: "2026-08-10", endDate: "2026-08-14" });
    expect(metric(r, "workDays")).toBe(5);
  });
});

/* ------------------------------ EVERYDAY ------------------------------ */
describe("everyday", () => {
  it("splits a bill with tip", () => {
    const r = calculateBillSplit({ bill: 80, tipPercent: 10, people: 4 });
    expect(metric(r, "perPerson")).toBeCloseTo(22, 2);
  });
  it("computes fuel cost", () => {
    const r = calculateFuelCost({ distance: 300, efficiency: 15, price: 1.5 });
    expect(metric(r, "cost")).toBeCloseTo(30, 2);
  });
  it("computes electricity cost", () => {
    const r = calculateElectricityCost({ watts: 1000, hoursPerDay: 1, days: 30, rate: 0.12 });
    expect(metric(r, "cost")).toBeCloseTo(3.6, 2);
  });
  it("computes paint needed", () => {
    const r = calculatePaint({ length: 5, width: 4, height: 2.5, coats: 2, coverage: 10 });
    expect(r.ok).toBe(true);
  });
});

/* ------------------------------ BUSINESS ------------------------------ */
describe("business", () => {
  it("computes overtime pay", () => {
    const r = calculateOvertime({ hourlyRate: 20, regularHours: 40, overtimeHours: 5, multiplier: 1.5 });
    expect(metric(r, "total")).toBeCloseTo(950, 2);
  });
  it("computes CAC", () => {
    expect(metric(calculateCac({ spend: 10000, customers: 200 }), "cac")).toBe(50);
  });
  it("computes LTV and ratio", () => {
    const r = calculateLtv({ revenuePerPeriod: 50, marginPercent: 80, lifespan: 24, cac: 200 });
    expect(metric(r, "ltv")).toBeCloseTo(960, 1);
  });
});

/* ------------------------------ TECHNOLOGY ------------------------------ */
describe("technology", () => {
  it("converts decimal to binary and hex", () => {
    const r = calculateBaseConvert({ value: "255", fromBase: 10 });
    expect(metric(r, "binary")).toBe("11111111");
    expect(metric(r, "hex")).toBe("FF");
  });
  it("parses hexadecimal input", () => {
    const r = calculateBaseConvert({ value: "FF", fromBase: 16 });
    expect(metric(r, "decimal")).toBe("255");
  });
  it("computes download time", () => {
    const r = calculateDownloadTime({ sizeMb: 500, speedMbps: 50 });
    expect(metric(r, "seconds")).toBeCloseTo(80, 1);
  });
  it("simplifies an aspect ratio", () => {
    expect(metric(calculateAspectRatio({ width: 1920, height: 1080 }), "ratio")).toBe("16:9");
  });
});

/* ------------------------------ SCIENCE ------------------------------ */
describe("science", () => {
  it("solves Ohm's law for voltage", () => {
    const r = calculateOhmsLaw({ solve: "v", a: 2, b: 5 });
    expect(String(metric(r, "v"))).toContain("10");
  });
  it("computes kinetic energy", () => {
    const r = calculateKineticEnergy({ mass: 10, velocity: 5 });
    expect(String(metric(r, "ke"))).toContain("125");
  });
  it("solves speed = distance / time", () => {
    expect(metric(calculateSpeedDistanceTime({ solve: "speed", a: 100, b: 2 }), "speed")).toBe(50);
  });
  it("solves density = mass / volume", () => {
    expect(metric(calculateDensity({ solve: "density", a: 200, b: 50 }), "density")).toBe(4);
  });
});
