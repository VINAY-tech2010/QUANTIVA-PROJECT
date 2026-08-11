import { describe, it, expect } from "vitest";
import { parseIntent } from "./parser";
import { extractMoney, extractTimes, extractPercents } from "./tokenizer";

describe("tokenizer", () => {
  it("extracts symbol-prefixed money", () => {
    const m = extractMoney("can I afford a $2000 laptop?");
    expect(m[0].value).toBe(2000);
    expect(m[0].currency).toBe("USD");
  });

  it("extracts word-currency money", () => {
    const m = extractMoney("I have 5000 rupees");
    expect(m[0].value).toBe(5000);
    expect(m[0].currency).toBe("INR");
  });

  it("extracts 24h times", () => {
    const t = extractTimes("how long is 9:30 to 4:45?");
    expect(t.map((x) => x.time)).toEqual(["09:30", "04:45"]);
  });

  it("extracts 12h times with meridiem", () => {
    const t = extractTimes("from 9am to 5pm");
    expect(t.map((x) => x.time)).toEqual(["09:00", "17:00"]);
  });

  it("extracts percents", () => {
    expect(extractPercents("20% off")[0].value).toBe(20);
    expect(extractPercents("7.5 percent")[0].value).toBe(7.5);
  });
});

describe("parseIntent", () => {
  it("routes 'can I afford a $2000 laptop?' to affordability with price", () => {
    const r = parseIntent("can I afford a $2000 laptop?");
    expect(r.toolId).toBe("affordability");
    expect(r.parameters.price).toBe(2000);
    expect(r.confidence).toBeGreaterThanOrEqual(0.45);
  });

  it("routes 'how long is 9:30 to 4:45?' to time-duration with both times", () => {
    const r = parseIntent("how long is 9:30 to 4:45?");
    expect(r.toolId).toBe("time-duration");
    expect(r.parameters.startTime).toBe("09:30");
    expect(r.parameters.endTime).toBe("04:45");
  });

  it("routes a tip query and extracts bill and percent", () => {
    const r = parseIntent("how much tip on $85 at 18%");
    expect(r.toolId).toBe("tip");
    expect(r.parameters.bill).toBe(85);
    expect(r.parameters.tipPercent).toBe(18);
  });

  it("routes a discount query", () => {
    const r = parseIntent("what is 25% off $120");
    expect(r.toolId).toBe("discount");
    expect(r.parameters.originalPrice).toBe(120);
    expect(r.parameters.discountPercent).toBe(25);
  });

  it("routes a loan query and extracts principal and rate", () => {
    const r = parseIntent("monthly payment on a $25000 loan at 6%");
    expect(r.toolId).toBe("loan");
    expect(r.parameters.principal).toBe(25000);
    expect(r.parameters.interestRate).toBe(6);
  });

  it("returns candidates for an ambiguous query", () => {
    const r = parseIntent("money");
    expect(r.candidates.length).toBeGreaterThan(0);
  });

  it("returns null toolId for an empty query", () => {
    const r = parseIntent("   ");
    expect(r.toolId).toBeNull();
    expect(r.confidence).toBe(0);
  });

  it("flags unresolved required fields when missing", () => {
    const r = parseIntent("can I afford something");
    expect(r.toolId).toBe("affordability");
    expect(r.unresolvedFields).toContain("price");
  });
});
