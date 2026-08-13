import { describe, it, expect } from "vitest";
import { parseIntent } from "./parser";
import { matchTool } from "./tool-match";
import { extractDates } from "./tokenizer";

/**
 * Natural-language intent router coverage.
 *
 * Every required phrasing from the intent-router specification is tested here:
 * intent detection, parameter extraction, DD/MM/YYYY date handling (India
 * locale), confidence tiers, and continued keyword search behaviour.
 */
describe("NL intent router — required spec cases", () => {
  it("'calculate live countdown to 12/03/2027' → live countdown, DD/MM date", () => {
    const r = parseIntent("calculate live countdown to 12/03/2027");
    expect(r.toolId).toBe("countdown");
    expect(r.liveCountdownTarget).toBe("2027-03-12"); // 12 March 2027, not 3 Dec
    expect(r.inlineResult).toBeUndefined(); // not hijacked by arithmetic
  });

  it("'how many days until 25 December 2026' → countdown with target date", () => {
    const r = parseIntent("how many days until 25 December 2026");
    expect(r.toolId).toBe("countdown");
    expect(r.liveCountdownTarget).toBe("2026-12-25");
  });

  it("'what is 18% of 4500' → percentage, both operands", () => {
    const r = parseIntent("what is 18% of 4500");
    expect(r.toolId).toBe("percentage");
    expect(r.parameters.mode).toBe("of");
    expect(r.parameters.valueA).toBe(18);
    expect(r.parameters.valueB).toBe(4500);
    expect(r.autoCalculable).toBe(true);
  });

  it("'500000 loan at 8% for 5 years' → loan, all three fields", () => {
    const r = parseIntent("500000 loan at 8% for 5 years");
    expect(r.toolId).toBe("loan");
    expect(r.parameters.principal).toBe(500000);
    expect(r.parameters.interestRate).toBe(8);
    expect(r.parameters.termYears).toBe(5);
    expect(r.autoCalculable).toBe(true);
  });

  it("'if I save 5000 every month for 3 years' → savings goal, recurring + duration", () => {
    const r = parseIntent("if I save 5000 every month for 3 years");
    expect(r.toolId).toBe("savings-goal");
    expect(r.parameters.frequency).toBe("monthly");
    expect(r.parameters.years).toBe(3);
    // Implied goal = 5000 × 12 × 3
    expect(r.parameters.targetAmount).toBe(180000);
  });

  it("'how old am I if I was born 15/08/2009' → age, DD/MM birth date", () => {
    const r = parseIntent("how old am I if I was born 15/08/2009");
    expect(r.toolId).toBe("age");
    expect(r.parameters.birthDate).toBe("2009-08-15");
    expect(r.autoCalculable).toBe(true);
  });

  it("'born 15/08/2009 how old am I' → age regardless of word order", () => {
    const r = parseIntent("born 15/08/2009 how old am I");
    expect(r.toolId).toBe("age");
    expect(r.parameters.birthDate).toBe("2009-08-15");
  });

  it("'convert 10 miles to kilometers' → inline unit conversion", () => {
    const r = parseIntent("convert 10 miles to kilometers");
    expect(r.toolId).toBe("unit-converter");
    expect(r.parameters.from).toBe("mi");
    expect(r.parameters.to).toBe("km");
    expect(r.parameters.value).toBe(10);
    expect(r.inlineResult?.value).toContain("km");
  });

  it("'20% discount on 2500' → discount, price and percent", () => {
    const r = parseIntent("20% discount on 2500");
    expect(r.toolId).toBe("discount");
    expect(r.parameters.originalPrice).toBe(2500);
    expect(r.parameters.percentOff).toBe(20);
  });

  it("'how much rent can I afford' → rent affordability, not generic affordability", () => {
    const r = parseIntent("how much rent can I afford");
    expect(r.toolId).toBe("rent-affordability");
    expect(r.tier).toBe("medium");
    expect(r.unresolvedFields).toContain("monthlyIncome");
  });

  it("'what should I charge as a freelancer if I want 60000 per month' → freelance rate, annualized", () => {
    const r = parseIntent("what should I charge as a freelancer if I want 60000 per month");
    expect(r.toolId).toBe("freelance-rate");
    // 60000/month → 720000 annual take-home target
    expect(r.parameters.targetIncome).toBe(720000);
  });

  it("'how much does this meeting cost' → meeting cost", () => {
    const r = parseIntent("how much does this meeting cost");
    expect(r.toolId).toBe("meeting-cost");
  });

  it("'when will my debt be paid off if I pay 10000 per month' → debt payoff, monthly payment", () => {
    const r = parseIntent("when will my debt be paid off if I pay 10000 per month");
    expect(r.toolId).toBe("debt-payoff");
    expect(r.parameters.monthlyPayment).toBe(10000);
    expect(r.unresolvedFields).toContain("balance");
    expect(r.unresolvedFields).toContain("interestRate");
  });
});

describe("NL intent router — natural variations", () => {
  it("'countdown to...' opens countdown even with no date", () => {
    const r = parseIntent("countdown to...");
    expect(r.toolId).toBe("countdown");
    expect(r.unresolvedFields).toContain("targetDate");
  });

  it("'timer until 5pm' → countdown family", () => {
    const r = parseIntent("timer until 5pm");
    expect(r.toolId).toBe("countdown");
  });

  it("'days left until 12 March 2027' → countdown with date", () => {
    const r = parseIntent("days left until 12 March 2027");
    expect(r.toolId).toBe("countdown");
    expect(r.liveCountdownTarget).toBe("2027-03-12");
  });

  it("'monthly EMI for 200000' → loan with principal only", () => {
    const r = parseIntent("monthly EMI for 200000");
    expect(r.toolId).toBe("loan");
    expect(r.parameters.principal).toBe(200000);
    expect(r.unresolvedFields).toContain("interestRate");
  });

  it("'tax on 500' → sales tax with price", () => {
    const r = parseIntent("tax on 500");
    expect(r.toolId).toBe("sales-tax");
    expect(r.parameters.price).toBe(500);
  });

  it("'break even' → break-even", () => {
    const r = parseIntent("break even");
    expect(r.toolId).toBe("break-even");
  });

  it("a loan term in months is converted to years", () => {
    const r = parseIntent("200000 loan at 9% for 36 months");
    expect(r.toolId).toBe("loan");
    expect(r.parameters.termYears).toBe(3);
  });

  it("incomplete requests keep routing to the best tool with missing fields", () => {
    const r = parseIntent("calculate my loan");
    expect(r.toolId).toBe("loan");
    expect(r.unresolvedFields).toEqual(
      expect.arrayContaining(["principal", "interestRate", "termYears"]),
    );
  });
});

describe("date extraction — DD/MM/YYYY primary (India locale)", () => {
  it("parses 12/03/2027 as 12 March 2027 and flags it ambiguous", () => {
    const d = extractDates("countdown to 12/03/2027")[0];
    expect(d.iso).toBe("2027-03-12");
    expect(d.ambiguous).toBe(true);
  });

  it("parses month-name dates: '12 March 2027', '12 Mar 2027'", () => {
    expect(extractDates("until 12 March 2027")[0].iso).toBe("2027-03-12");
    expect(extractDates("until 12 Mar 2027")[0].iso).toBe("2027-03-12");
  });

  it("parses hyphenated dates: '12-Mar-2027' and '12-03-2027'", () => {
    expect(extractDates("until 12-Mar-2027")[0].iso).toBe("2027-03-12");
    expect(extractDates("until 12-03-2027")[0].iso).toBe("2027-03-12");
  });

  it("parses ISO dates unchanged: '2027-03-12'", () => {
    expect(extractDates("until 2027-03-12")[0].iso).toBe("2027-03-12");
  });

  it("disambiguates when one part exceeds 12: '25/12/2026'", () => {
    const d = extractDates("until 25/12/2026")[0];
    expect(d.iso).toBe("2026-12-25");
    expect(d.ambiguous).toBe(false);
  });

  it("never treats a date query as arithmetic", () => {
    const r = parseIntent("calculate live countdown to 12/03/2027");
    expect(r.recognizedLabel).not.toBe("Arithmetic");
  });
});

describe("keyword search still works alongside NL routing", () => {
  it("'loan' → Loan Calculator", () => {
    expect(matchTool("loan").calculator?.id).toBe("loan");
  });

  it("'countdown' → Countdown Calculator", () => {
    expect(matchTool("countdown").calculator?.id).toBe("countdown");
  });

  it("'mortgage' → Mortgage Calculator", () => {
    expect(matchTool("mortgage").calculator?.id).toBe("mortgage");
  });

  it("low-confidence gibberish does not guess", () => {
    const r = parseIntent("asdkfj qworitu zxcvbn");
    expect(r.tier).toBe("low");
    expect(r.autoCalculable).toBeFalsy();
  });
});
