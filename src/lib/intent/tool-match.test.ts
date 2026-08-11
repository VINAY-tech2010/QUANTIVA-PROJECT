import { describe, it, expect } from "vitest";
import { matchTool, looksLikeToolRequest } from "./tool-match";

describe("matchTool", () => {
  it("matches exact tool names", () => {
    expect(matchTool("Loan Calculator").calculator?.id).toBe("loan");
    expect(matchTool("Loan Calculator").kind).toBe("exact");
    expect(matchTool("Percentage Calculator").calculator?.id).toBe("percentage");
    expect(matchTool("Age Calculator").calculator?.id).toBe("age");
  });

  it("matches bare tool names", () => {
    expect(matchTool("loan").calculator?.id).toBe("loan");
    expect(matchTool("mortgage").calculator?.id).toBe("mortgage");
    expect(matchTool("percentage").calculator?.id).toBe("percentage");
    expect(matchTool("age").calculator?.id).toBe("age");
  });

  it("matches abbreviations and aliases", () => {
    expect(matchTool("EMI").calculator?.id).toBe("loan");
    expect(matchTool("EMI calculator").calculator?.id).toBe("loan");
    expect(matchTool("percent calculator").calculator?.id).toBe("percentage");
  });

  it("matches 'calculate X' phrasing as a tool search", () => {
    expect(matchTool("calculate loan").calculator?.id).toBe("loan");
  });

  it("is case-insensitive", () => {
    expect(matchTool("LOAN CALCULATOR").calculator?.id).toBe("loan");
    expect(matchTool("Mortgage").calculator?.id).toBe("mortgage");
  });

  it("tolerates minor spelling mistakes", () => {
    expect(matchTool("morgage calculator").calculator?.id).toBe("mortgage");
    expect(matchTool("percentge").calculator?.id).toBe("percentage");
  });

  it("handles singular/plural", () => {
    expect(matchTool("prime factor").calculator?.id).toBe("prime-factors");
  });

  it("returns none for unimplemented tools", () => {
    const r = matchTool("Compound Interest Calculator");
    // compound-growth exists, so this should match it via alias
    expect(r.calculator?.id).toBe("compound-growth");
  });

  it("returns none for a genuinely missing tool", () => {
    const r = matchTool("Bitcoin Mining Profitability Calculator");
    expect(r.kind).toBe("none");
    expect(r.requestedName.length).toBeGreaterThan(0);
  });

  it("returns none for gibberish", () => {
    expect(matchTool("asdfqwer zxcv").kind).toBe("none");
  });
});

describe("looksLikeToolRequest", () => {
  it("detects tool-noun phrasing", () => {
    expect(looksLikeToolRequest("Compound Interest Calculator")).toBe(true);
    expect(looksLikeToolRequest("bitcoin converter")).toBe(true);
    expect(looksLikeToolRequest("retirement planner")).toBe(true);
  });

  it("does not flag plain calculations", () => {
    expect(looksLikeToolRequest("10% of 500")).toBe(false);
    expect(looksLikeToolRequest("5000 plus 2500")).toBe(false);
  });
});
