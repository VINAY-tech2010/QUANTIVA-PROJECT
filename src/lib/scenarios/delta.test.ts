import { describe, expect, it } from "vitest";
import type { CalcResult } from "@/types";
import { computeScenarioDelta } from "./delta";

const baseline: CalcResult = {
  ok: true,
  metrics: [
    { key: "monthlyPayment", label: "Monthly payment", kind: "currency", value: 396.02, primary: true },
    { key: "totalInterest", label: "Total interest", kind: "currency", value: 3761.2 },
    { key: "termMonths", label: "Term", kind: "number", value: 60 },
  ],
};

describe("computeScenarioDelta", () => {
  it("returns null when baseline failed", () => {
    const bad: CalcResult = { ok: false, error: "x", metrics: [] };
    expect(computeScenarioDelta("s1", "S", bad, baseline)).toBeNull();
  });

  it("returns null when scenario failed", () => {
    const bad: CalcResult = { ok: false, error: "x", metrics: [] };
    expect(computeScenarioDelta("s1", "S", baseline, bad)).toBeNull();
  });

  it("computes numeric differences and improvement flags", () => {
    const scenario: CalcResult = {
      ok: true,
      metrics: [
        { key: "monthlyPayment", label: "Monthly payment", kind: "currency", value: 450 },
        { key: "totalInterest", label: "Total interest", kind: "currency", value: 2000 },
        { key: "termMonths", label: "Term", kind: "number", value: 48 },
      ],
    };
    const d = computeScenarioDelta("s1", "Shorter term", baseline, scenario);
    expect(d).not.toBeNull();
    expect(d!.scenarioName).toBe("Shorter term");

    const interest = d!.deltas.find((x) => x.metricKey === "totalInterest")!;
    expect(interest.difference).toBeCloseTo(2000 - 3761.2);
    // Lower interest is an improvement.
    expect(interest.improved).toBe(true);

    const payment = d!.deltas.find((x) => x.metricKey === "monthlyPayment")!;
    // Higher payment is NOT an improvement.
    expect(payment.improved).toBe(false);
  });

  it("marks equal metrics as neither improved nor worsened", () => {
    const scenario: CalcResult = {
      ok: true,
      metrics: [
        { key: "monthlyPayment", label: "Monthly payment", kind: "currency", value: 396.02 },
        { key: "totalInterest", label: "Total interest", kind: "currency", value: 3761.2 },
        { key: "termMonths", label: "Term", kind: "number", value: 60 },
      ],
    };
    const d = computeScenarioDelta("s1", "Same", baseline, scenario);
    const payment = d!.deltas.find((x) => x.metricKey === "monthlyPayment")!;
    expect(payment.difference).toBe(0);
    expect(payment.improved).toBeUndefined();
  });

  it("returns null when there are no shared metrics", () => {
    const scenario: CalcResult = {
      ok: true,
      metrics: [{ key: "other", label: "Other", kind: "number", value: 1 }],
    };
    expect(computeScenarioDelta("s1", "S", baseline, scenario)).toBeNull();
  });
});
