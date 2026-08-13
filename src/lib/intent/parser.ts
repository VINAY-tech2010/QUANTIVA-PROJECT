import type { IntentResult, IntentCandidate, CalculatorInputs } from "@/types";
import { CALCULATORS, getCalculator } from "@/data/calculators";
import { evaluateExpression } from "@/lib/calculations/classical-parser";
import { convert, formatConverted, getUnit } from "@/lib/units";
import type { Dimension } from "@/lib/units";
import {
  normalize,
  extractMoney,
  extractTimes,
  extractPercents,
  extractNumbers,
  extractUnits,
  extractDates,
  extractDurations,
  expandMagnitude,
  toArithmeticExpression,
} from "./tokenizer";

const firstMoney = (q: string) => extractMoney(q)[0]?.value;
const firstPercent = (q: string) => extractPercents(q)[0]?.value;
const firstNumber = (q: string) => extractNumbers(q)[0]?.value;

/** Extract a term in years from phrases like "for 5 years", "5 yr", "5-year", "36 months". */
function extractYears(q: string): number | undefined {
  const norm = normalize(q);
  const y = /(\d+(?:\.\d+)?)\s?(?:-\s?)?(years?|yrs?|y)\b/.exec(norm);
  if (y) return parseFloat(y[1]);
  const mo = /(\d+(?:\.\d+)?)\s?months?\b/.exec(norm);
  return mo ? parseFloat(mo[1]) / 12 : undefined;
}

/** Recurring contribution frequencies mapped to calculator select values. */
const RECURRING_FREQUENCY: Record<string, string> = {
  week: "weekly",
  fortnight: "bi-weekly",
  month: "monthly",
  year: "yearly",
};

const RECURRING_PERIODS_PER_YEAR: Record<string, number> = {
  week: 52,
  fortnight: 26,
  month: 12,
  year: 1,
};

/**
 * Extract a recurring amount like "5000 every month", "$200 per week",
 * "10k a year". Returns the amount, its raw mention, and the frequency.
 */
function extractRecurring(
  q: string,
): { amount: number; raw: string; frequency: string; periodsPerYear: number } | undefined {
  const norm = normalize(q);
  const m =
    /(?:[$€£₹¥]\s?)?(\d[\d,]*(?:\.\d+)?)\s?(lakh|lakhs|lac|crore|crores|million|millions|billion|billions|thousand)?\s?(?:rupees?|rs|inr|dollars?|usd|euros?|pounds?)?\s*(?:every|per|each|a)\s+(week|month|year|fortnight)\b/.exec(
      norm,
    );
  if (!m) return undefined;
  const amount = expandMagnitude(m[1], m[2]);
  if (amount === undefined) return undefined;
  return {
    amount,
    raw: m[0],
    frequency: RECURRING_FREQUENCY[m[3]],
    periodsPerYear: RECURRING_PERIODS_PER_YEAR[m[3]],
  };
}

interface Rule {
  toolId: string;
  /** Keyword triggers (matched against normalized query). */
  triggers: string[];
  /** Map extracted entities onto calculator input fields. */
  map: (query: string) => CalculatorInputs;
  /** Fields the rule could not fill but the calculator needs. */
  required: string[];
  /** Human label for the recognized intent. */
  label: string;
  /** Build a short human summary of what was understood. */
  summarize?: (params: CalculatorInputs) => string;
}

/** Extract a count of people from "between 4 people", "for 3", "split 3 ways". */
function extractPeople(q: string): number | undefined {
  const m = /(?:between|among|for|split|ways?|people|persons?)\s+(\d+)/.exec(normalize(q))
    ?? /(\d+)\s?(?:people|persons?|ways)\b/.exec(normalize(q));
  return m ? parseInt(m[1], 10) : undefined;
}

/** City / country → IANA time zone. */
const ZONE_ALIASES: Record<string, string> = {
  india: "Asia/Kolkata",
  ist: "Asia/Kolkata",
  delhi: "Asia/Kolkata",
  mumbai: "Asia/Kolkata",
  tokyo: "Asia/Tokyo",
  japan: "Asia/Tokyo",
  london: "Europe/London",
  uk: "Europe/London",
  britain: "Europe/London",
  paris: "Europe/Paris",
  france: "Europe/Paris",
  berlin: "Europe/Berlin",
  germany: "Europe/Berlin",
  "new york": "America/New_York",
  nyc: "America/New_York",
  est: "America/New_York",
  "los angeles": "America/Los_Angeles",
  la: "America/Los_Angeles",
  pst: "America/Los_Angeles",
  chicago: "America/Chicago",
  dubai: "Asia/Dubai",
  uae: "Asia/Dubai",
  singapore: "Asia/Singapore",
  sydney: "Australia/Sydney",
  australia: "Australia/Sydney",
  utc: "UTC",
  gmt: "UTC",
};

function findZones(q: string): string[] {
  const norm = normalize(q);
  const found: string[] = [];
  const aliases = Object.keys(ZONE_ALIASES).sort((a, b) => b.length - a.length);
  for (const alias of aliases) {
    const re = new RegExp(`\\b${alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`);
    if (re.test(norm)) {
      const zone = ZONE_ALIASES[alias];
      if (!found.includes(zone)) found.push(zone);
    }
  }
  return found;
}

const RULES: Rule[] = [
  {
    toolId: "percentage",
    label: "Percentage Calculation",
    triggers: ["percent of", "percentage", "% of", "what percent", "percent of", "pct of"],
    required: ["valueA", "valueB"],
    map: (q) => {
      const norm = normalize(q);
      const pct = firstPercent(q);
      const nums = extractNumbers(q);
      const out: CalculatorInputs = {};
      if (/what\s*(%|percent)|as a (percent|%)|is what/.test(norm) && nums.length >= 2) {
        out.mode = "whatPercent";
        out.valueA = nums[0].value;
        out.valueB = nums[1].value;
        return out;
      }
      if (/change|increase|decrease|from .* to /.test(norm) && nums.length >= 2) {
        out.mode = "change";
        out.valueA = nums[0].value;
        out.valueB = nums[1].value;
        return out;
      }
      out.mode = "of";
      if (pct !== undefined) out.valueA = pct;
      const ofNum = nums.find((n) => n.value !== pct);
      if (ofNum !== undefined) out.valueB = ofNum.value;
      else if (nums[0] !== undefined && pct === undefined) out.valueA = nums[0].value;
      return out;
    },
    summarize: (p) =>
      p.mode === "of"
        ? `${p.valueA}% of ${p.valueB}`
        : p.mode === "whatPercent"
          ? `${p.valueA} as a % of ${p.valueB}`
          : `% change from ${p.valueA} to ${p.valueB}`,
  },
  {
    toolId: "loan",
    label: "Loan Calculation",
    triggers: ["loan", "borrow", "car payment", "monthly payment", "emi"],
    required: ["principal", "interestRate", "termYears"],
    map: (q) => {
      const principal = firstMoney(q) ?? firstNumber(q);
      const rate = firstPercent(q);
      const years = extractYears(q);
      const out: CalculatorInputs = {};
      if (principal !== undefined) out.principal = principal;
      if (rate !== undefined) out.interestRate = rate;
      if (years !== undefined) out.termYears = years;
      return out;
    },
    summarize: (p) =>
      `Loan of ${p.principal ?? "?"} at ${p.interestRate ?? "?"}% for ${p.termYears ?? "?"} years`,
  },
  {
    toolId: "mortgage",
    label: "Mortgage Calculation",
    triggers: ["mortgage", "house payment", "home loan", "home price"],
    required: ["homePrice", "interestRate", "termYears"],
    map: (q) => {
      const price = firstMoney(q) ?? firstNumber(q);
      const rate = firstPercent(q);
      const years = extractYears(q);
      const out: CalculatorInputs = {};
      if (price !== undefined) out.homePrice = price;
      if (rate !== undefined) out.interestRate = rate;
      if (years !== undefined) out.termYears = years;
      return out;
    },
    summarize: (p) =>
      `Mortgage of ${p.homePrice ?? "?"} at ${p.interestRate ?? "?"}% for ${p.termYears ?? "?"} years`,
  },
  {
    toolId: "rent-affordability",
    label: "Rent Affordability",
    // Must stay ahead of the generic affordability rule: "rent" is the
    // stronger signal when both "rent" and "afford" appear.
    triggers: ["rent", "rental", "lease", "apartment", "how much rent", "rent affordability", "rent can", "rent i can afford"],
    required: ["monthlyIncome"],
    map: (q) => {
      const norm = normalize(q);
      const out: CalculatorInputs = {};
      const incomeMatch =
        /(?:salary|income|earn|making|make|on)\s+(?:of\s+)?[$₹]?(\d[\d,]*(?:\.\d+)?)/.exec(norm);
      if (incomeMatch) out.monthlyIncome = parseFloat(incomeMatch[1].replace(/,/g, ""));
      else {
        const money = firstMoney(q) ?? firstNumber(q);
        if (money !== undefined) out.monthlyIncome = money;
      }
      const pct = firstPercent(q);
      if (pct !== undefined) out.targetPercent = pct;
      return out;
    },
    summarize: (p) => `Rent on income ${p.monthlyIncome ?? "?"}`,
  },
  {
    toolId: "age",
    label: "Age Calculation",
    // "born" / "how old" are word-boundary-safe; bare "age" would match inside
    // "mortgage", so it is deliberately not a trigger here.
    triggers: ["how old", "born", "date of birth", "dob", "my age", "birth"],
    required: ["birthDate"],
    map: (q) => {
      const dates = extractDates(q);
      const out: CalculatorInputs = {};
      if (dates[0]) out.birthDate = dates[0].iso;
      if (dates[1]) out.asOfDate = dates[1].iso;
      return out;
    },
    summarize: (p) => `Age from date of birth ${p.birthDate ?? "?"}`,
  },
  {
    toolId: "affordability",
    label: "Affordability Check",
    triggers: ["can i afford", "afford", "should i buy"],
    required: ["price", "monthlyIncome"],
    map: (q) => {
      const monies = extractMoney(q);
      const out: CalculatorInputs = {};
      if (monies[0]) out.price = monies[0].value;
      const incomeMatch = /(?:salary|income|earn|making|make)\s+(?:of\s+)?\$?₹?(\d[\d,]*(?:\.\d+)?)/.exec(normalize(q));
      if (incomeMatch) {
        out.monthlyIncome = parseFloat(incomeMatch[1].replace(/,/g, ""));
      } else if (monies[1]) {
        out.monthlyIncome = monies[1].value;
      }
      if (out.price === undefined) {
        const n = firstNumber(q);
        if (n !== undefined) out.price = n;
      }
      return out;
    },
    summarize: (p) => `Afford ${p.price ?? "?"} on income ${p.monthlyIncome ?? "?"}`,
  },
  {
    toolId: "time-duration",
    label: "Time Duration",
    triggers: ["how long is", "time between", "duration between", "how many hours between", "from"],
    required: ["startTime", "endTime"],
    map: (q) => {
      const times = extractTimes(q);
      const out: CalculatorInputs = {};
      if (times[0]) out.startTime = times[0].time;
      if (times[1]) out.endTime = times[1].time;
      return out;
    },
    summarize: (p) => `${p.startTime ?? "?"} → ${p.endTime ?? "?"}`,
  },
  {
    toolId: "tip",
    label: "Tip Calculation",
    triggers: ["tip", "gratuity"],
    required: ["billAmount"],
    map: (q) => {
      const bill = firstMoney(q) ?? firstNumber(q);
      const pct = firstPercent(q);
      const people = extractPeople(q);
      const out: CalculatorInputs = {};
      if (bill !== undefined) out.billAmount = bill;
      if (pct !== undefined) out.tipPercent = pct;
      if (people !== undefined) out.people = people;
      return out;
    },
    summarize: (p) => `Tip on ${p.billAmount ?? "?"}${p.tipPercent !== undefined ? ` at ${p.tipPercent}%` : ""}`,
  },
  {
    toolId: "debt-payoff",
    label: "Debt Payoff",
    // Phrase triggers ("pay off", "paid off") outrank discount's bare "off".
    triggers: ["debt", "pay off", "paid off", "payoff", "debt-free", "debt free", "owe", "credit card"],
    required: ["balance", "interestRate", "monthlyPayment"],
    map: (q) => {
      const out: CalculatorInputs = {};
      const rec = extractRecurring(q);
      const rate = firstPercent(q);
      if (rec) out.monthlyPayment = rec.amount;
      // Balance = the first money/number that is not the recurring payment.
      const monies = extractMoney(q).filter((x) => !rec || x.raw !== rec.raw.trim());
      const nums = extractNumbers(q).filter((x) => !rec || !rec.raw.includes(x.raw));
      const balance = monies[0]?.value ?? nums[0]?.value;
      if (balance !== undefined) out.balance = balance;
      if (rate !== undefined) out.interestRate = rate;
      return out;
    },
    summarize: (p) =>
      `Pay off ${p.balance ?? "?"} at ${p.interestRate ?? "?"}% paying ${p.monthlyPayment ?? "?"}/month`,
  },
  {
    toolId: "discount",
    label: "Discount Calculation",
    triggers: ["discount", "off", "sale price", "marked down"],
    required: ["originalPrice", "percentOff"],
    map: (q) => {
      const price = firstMoney(q) ?? firstNumber(q);
      const pct = firstPercent(q);
      const out: CalculatorInputs = {};
      if (price !== undefined) out.originalPrice = price;
      if (pct !== undefined) out.percentOff = pct;
      return out;
    },
    summarize: (p) => `${p.percentOff ?? "?"}% off ${p.originalPrice ?? "?"}`,
  },
  {
    toolId: "bill-split",
    label: "Bill Split",
    triggers: ["split bill", "split the bill", "split between", "divide bill", "split"],
    required: ["bill", "people"],
    map: (q) => {
      const bill = firstMoney(q) ?? firstNumber(q);
      const pct = firstPercent(q);
      const people = extractPeople(q);
      const out: CalculatorInputs = {};
      if (bill !== undefined) out.bill = bill;
      if (pct !== undefined) out.tipPercent = pct;
      if (people !== undefined) out.people = people;
      return out;
    },
    summarize: (p) => `Split ${p.bill ?? "?"} between ${p.people ?? "?"} people`,
  },
  {
    toolId: "fuel-cost",
    label: "Fuel Calculation",
    triggers: ["fuel", "petrol", "gas", "mileage", "km per litre", "km/l", "mpg"],
    required: ["distance", "efficiency"],
    map: (q) => {
      const norm = normalize(q);
      const nums = extractNumbers(q);
      const units = extractUnits(q);
      const out: CalculatorInputs = {};
      const distUnit = units.find((u) => u.dimension === "length" && u.value !== undefined);
      if (distUnit && distUnit.value !== undefined) out.distance = distUnit.value;
      else if (nums[0]) out.distance = nums[0].value;
      const effMatch = /(\d+(?:\.\d+)?)\s?(?:km\s?(?:per|\/|p)\s?l(?:itre|iter)?|kmpl|mpg|km\/l)\b/.exec(norm);
      if (effMatch) out.efficiency = parseFloat(effMatch[1]);
      else if (nums[1]) out.efficiency = nums[1].value;
      const price = firstMoney(q);
      if (price !== undefined) out.price = price;
      return out;
    },
    summarize: (p) =>
      `Fuel for ${p.distance ?? "?"} km at ${p.efficiency ?? "?"} km/L${p.price !== undefined ? `, price ${p.price}` : ""}`,
  },
  {
    toolId: "countdown",
    label: "Countdown",
    triggers: ["how long until", "countdown", "days until", "time until", "until"],
    required: ["targetDate"],
    map: (q) => {
      const dates = extractDates(q);
      const out: CalculatorInputs = {};
      if (dates[0]) out.targetDate = dates[0].iso;
      return out;
    },
    summarize: (p) => `Countdown to ${p.targetDate ?? "?"}`,
  },
  {
    toolId: "date-duration",
    label: "Date Difference",
    triggers: ["days between", "between", "date difference", "how many days", "duration between dates"],
    required: ["startDate", "endDate"],
    map: (q) => {
      const dates = extractDates(q);
      const out: CalculatorInputs = {};
      if (dates[0]) out.startDate = dates[0].iso;
      if (dates[1]) out.endDate = dates[1].iso;
      return out;
    },
    summarize: (p) => `${p.startDate ?? "?"} → ${p.endDate ?? "?"}`,
  },
  {
    toolId: "time-zone",
    label: "Time Zone Conversion",
    triggers: ["time in", "what time", "time zone", "timezone", "when it's", "when its"],
    required: ["dateTime", "fromZone", "toZone"],
    map: (q) => {
      const zones = findZones(q);
      const times = extractTimes(q);
      const out: CalculatorInputs = {};
      if (zones[0]) out.fromZone = zones[0];
      if (zones[1]) out.toZone = zones[1];
      if (times[0]) {
        const today = new Date();
        const [hh, mm] = times[0].time.split(":").map((x) => parseInt(x, 10));
        const dt = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hh, mm);
        out.dateTime = dt.toISOString().slice(0, 16);
      }
      return out;
    },
    summarize: (p) => `${p.fromZone ?? "?"} → ${p.toZone ?? "?"}`,
  },
  {
    toolId: "compound-growth",
    label: "Compound Growth",
    triggers: ["compound", "grow", "investment growth", "interest grow"],
    required: ["principal"],
    map: (q) => {
      const principal = firstMoney(q) ?? firstNumber(q);
      const rate = firstPercent(q);
      const years = extractYears(q);
      const out: CalculatorInputs = {};
      if (principal !== undefined) out.principal = principal;
      if (rate !== undefined) out.annualRate = rate;
      if (years !== undefined) out.years = years;
      return out;
    },
    summarize: (p) => `Grow ${p.principal ?? "?"}`,
  },
  {
    toolId: "savings-goal",
    label: "Savings Goal",
    triggers: ["save", "savings", "savings goal", "how long to save", "put away", "set aside"],
    required: ["targetAmount", "years"],
    map: (q) => {
      const out: CalculatorInputs = {};
      const years = extractYears(q);
      if (years !== undefined) out.years = years;
      const rec = extractRecurring(q);
      if (rec) {
        // "save 5000 every month for 3 years" — the user gives a recurring
        // contribution; the implied goal is the total they will put aside.
        out.frequency = rec.frequency;
        if (years !== undefined) {
          out.targetAmount = Math.round(rec.amount * rec.periodsPerYear * years);
        }
      } else {
        const goal = firstMoney(q) ?? firstNumber(q);
        if (goal !== undefined) out.targetAmount = goal;
      }
      const pct = firstPercent(q);
      if (pct !== undefined) out.growthRate = pct;
      return out;
    },
    summarize: (p) =>
      `Save towards ${p.targetAmount ?? "?"} over ${p.years ?? "?"} years (${p.frequency ?? "monthly"})`,
  },
  {
    toolId: "sales-tax",
    label: "Sales Tax",
    triggers: ["sales tax", "tax on", "vat", "gst", "tax"],
    required: ["price"],
    map: (q) => {
      const price = firstMoney(q) ?? firstNumber(q);
      const pct = firstPercent(q);
      const out: CalculatorInputs = {};
      if (price !== undefined) out.price = price;
      if (pct !== undefined) out.taxRate = pct;
      return out;
    },
    summarize: (p) => `Tax on ${p.price ?? "?"}${p.taxRate !== undefined ? ` at ${p.taxRate}%` : ""}`,
  },
  {
    toolId: "meeting-cost",
    label: "Meeting Cost",
    triggers: ["meeting cost", "cost of meeting", "meeting"],
    required: [],
    map: (q) => {
      const people = extractPeople(q) ?? firstNumber(q);
      const out: CalculatorInputs = {};
      if (people !== undefined) out.attendees = people;
      return out;
    },
    summarize: () => "Meeting cost",
  },
  {
    toolId: "break-even",
    label: "Break-Even",
    triggers: ["break even", "break-even", "breakeven"],
    required: [],
    map: () => ({}),
    summarize: () => "Break-even",
  },
  {
    toolId: "freelance-rate",
    label: "Freelance Rate",
    triggers: [
      "freelance rate",
      "freelance",
      "freelancer",
      "hourly rate",
      "charge per hour",
      "day rate",
      "should i charge",
      "what to charge",
      "consulting rate",
      "contractor rate",
    ],
    required: ["targetIncome"],
    map: (q) => {
      const out: CalculatorInputs = {};
      const rec = extractRecurring(q);
      if (rec) {
        // The calculator expects an ANNUAL take-home target; convert
        // "60000 per month" → 720000, "2000 per week" → 104000.
        out.targetIncome = Math.round(rec.amount * rec.periodsPerYear);
      } else {
        const salary = firstMoney(q) ?? firstNumber(q);
        if (salary !== undefined) out.targetIncome = salary;
      }
      const pct = firstPercent(q);
      if (pct !== undefined) out.taxPercent = pct;
      return out;
    },
    summarize: (p) => `Freelance rate for ${p.targetIncome ?? "?"} annual take-home`,
  },
  {
    toolId: "bmi",
    label: "BMI",
    triggers: ["bmi", "body mass index"],
    required: [],
    map: (q) => {
      const nums = extractNumbers(q);
      const out: CalculatorInputs = {};
      if (nums[0] !== undefined) out.weightKg = nums[0].value;
      if (nums[1] !== undefined) out.heightCm = nums[1].value;
      return out;
    },
    summarize: () => "BMI",
  },
];

const HIGH_THRESHOLD = 0.7;
const MEDIUM_THRESHOLD = 0.45;

function scoreRule(rule: Rule, query: string): number {
  const norm = normalize(query);
  let hits = 0;
  for (const t of rule.triggers) {
    // "% of" must not match inside "% off" (that is a discount phrasing).
    const matched = t === "% of" ? /% of(?!f)/.test(norm) : norm.includes(t);
    if (!matched) continue;
    // Multi-word phrase triggers ("pay off", "how old", "can i afford") are a
    // much stronger signal than single words, so they count double.
    hits += t.includes(" ") ? 2 : 1;
  }
  if (hits === 0) return 0;
  const mapped = rule.map(query);
  const filledRequired = rule.required.filter((f) => mapped[f] !== undefined).length;
  const triggerScore = Math.min(1, hits * 0.5);
  const fieldScore = rule.required.length === 0 ? 0.3 : (filledRequired / rule.required.length) * 0.4;
  return Math.min(1, triggerScore + fieldScore);
}

/** Keyword fallback across the whole registry when no rule matches. */
function keywordCandidates(query: string): { toolId: string; score: number }[] {
  const norm = normalize(query);
  const words = norm.split(" ").filter((w) => w.length > 2);
  const scored: { toolId: string; score: number }[] = [];
  for (const calc of CALCULATORS) {
    let hits = 0;
    for (const kw of calc.keywords) {
      if (norm.includes(kw)) hits += 2;
    }
    for (const w of words) {
      if (
        calc.name.toLowerCase().includes(w) ||
        calc.category.includes(w) ||
        calc.keywords.some((k) => k.includes(w))
      ) {
        hits += 1;
      }
    }
    if (hits > 0) scored.push({ toolId: calc.id, score: Math.min(1, hits / 6) });
  }
  if (scored.length === 0) {
    return ["loan", "percentage", "tip"].map((toolId) => ({ toolId, score: 0.1 }));
  }
  return scored.sort((a, b) => b.score - a.score).slice(0, 3);
}

/** Try to detect and compute an inline arithmetic expression. */
function tryArithmetic(query: string): IntentResult | null {
  // Queries containing a recognizable date ("12/03/2027", "25 December 2026")
  // are never arithmetic — otherwise "12/03/2027" would be read as 12÷3÷2027.
  if (extractDates(query).length > 0) return null;
  const expr = toArithmeticExpression(query);
  if (!expr) return null;
  try {
    const value = evaluateExpression(expr);
    const rounded = Math.round(value * 1e10) / 1e10;
    return {
      toolId: null,
      confidence: 1,
      tier: "high",
      parameters: {},
      unresolvedFields: [],
      candidates: [],
      query,
      recognizedLabel: "Arithmetic",
      recognizedSummary: expr.replace(/\s+/g, " "),
      autoCalculable: true,
      inlineResult: { label: expr.replace(/\s+/g, " "), value: String(rounded) },
    };
  } catch {
    return null;
  }
}

/** Try to detect and compute an inline unit conversion. */
function tryUnitConversion(query: string): IntentResult | null {
  const norm = normalize(query);
  if (!/convert|to|into|in\b|how many/.test(norm)) return null;
  const units = extractUnits(query);
  if (units.length < 2) return null;
  const from = units.find((u) => u.value !== undefined) ?? units[0];
  const to = units.find((u) => u !== from && u.dimension === from.dimension);
  if (!to) return null;
  const value = from.value ?? 1;
  try {
    const result = convert(from.dimension as Dimension, value, from.unit, to.unit);
    const fromSym = getUnit(from.dimension as Dimension, from.unit).symbol;
    const toSym = getUnit(from.dimension as Dimension, to.unit).symbol;
    const formatted = formatConverted(result);
    return {
      toolId: "unit-converter",
      confidence: 0.9,
      tier: "high",
      parameters: { dimension: from.dimension, value, from: from.unit, to: to.unit },
      unresolvedFields: [],
      candidates: [],
      query,
      recognizedLabel: "Unit Conversion",
      recognizedSummary: `${value} ${fromSym} → ${toSym}`,
      autoCalculable: true,
      inlineResult: { label: `${value} ${fromSym}`, value: `${formatted} ${toSym}` },
    };
  } catch {
    return null;
  }
}

/** Currency word → code, for scanning unattached currency mentions. */
const CURRENCY_SCAN_WORDS: Record<string, string> = {
  dollar: "USD", dollars: "USD", usd: "USD", euro: "EUR", euros: "EUR",
  pound: "GBP", pounds: "GBP", rupee: "INR", rupees: "INR", inr: "INR",
  yen: "JPY", jpy: "JPY",
};

/** Try to detect a currency conversion (manual reference rate). */
function tryCurrencyConversion(query: string): IntentResult | null {
  const norm = normalize(query);
  const monies = extractMoney(query);
  if (monies.length === 0) return null;
  const codes: string[] = [];
  for (const m of monies) {
    if (m.currency && !codes.includes(m.currency)) codes.push(m.currency);
  }
  for (const [word, code] of Object.entries(CURRENCY_SCAN_WORDS)) {
    if (new RegExp(`\\b${word}\\b`).test(norm) && !codes.includes(code)) codes.push(code);
  }
  if (codes.length < 2) return null;
  if (!/convert|in\b|to\b|into|how much|how many/.test(norm)) return null;
  const [from, to] = codes;
  const amount = monies[0].value;
  return {
    toolId: "currency-converter",
    confidence: 0.8,
    tier: "high",
    parameters: { amount, from, to },
    unresolvedFields: ["rate"],
    candidates: [],
    query,
    recognizedLabel: "Currency Conversion",
    recognizedSummary: `${amount} ${from} → ${to} (manual reference rate)`,
    autoCalculable: false,
    missingLabels: ["Exchange rate (manual reference, not live)"],
  };
}

/** Try to detect a live countdown to a date. */
function tryCountdown(query: string): IntentResult | null {
  const norm = normalize(query);
  if (!/how long until|countdown|days until|time until|until|how many days/.test(norm)) return null;
  const dates = extractDates(query);
  if (dates.length === 0) return null;
  const target = dates[0];
  return {
    toolId: "countdown",
    confidence: 0.9,
    tier: "high",
    parameters: { targetDate: target.iso },
    unresolvedFields: [],
    candidates: [],
    query,
    recognizedLabel: "Countdown",
    recognizedSummary: `Until ${target.iso}${target.yearAssumed ? " (next occurrence)" : ""}${target.ambiguous ? " — interpreted as DD/MM/YYYY" : ""}`,
    autoCalculable: true,
    liveCountdownTarget: target.iso,
  };
}

/** Try to detect a "duration from now" query. */
function tryDurationFromNow(query: string): IntentResult | null {
  const norm = normalize(query);
  if (!/from now|later|in \d/.test(norm)) return null;
  const durations = extractDurations(query);
  if (durations.length === 0) return null;
  const minutes = durations[0].minutes;
  const target = new Date(Date.now() + minutes * 60_000);
  const hh = String(target.getHours()).padStart(2, "0");
  const mm = String(target.getMinutes()).padStart(2, "0");
  return {
    toolId: null,
    confidence: 0.9,
    tier: "high",
    parameters: {},
    unresolvedFields: [],
    candidates: [],
    query,
    recognizedLabel: "Time From Now",
    recognizedSummary: durations[0].raw,
    autoCalculable: true,
    inlineResult: { label: `In ${durations[0].raw}`, value: `${hh}:${mm}` },
  };
}

/**
 * Parse a natural-language query into a calculator intent. Returns the best
 * tool, extracted parameters, any fields still needed, and alternative
 * candidates when confidence is low.
 */
export function parseIntent(query: string): IntentResult {
  const trimmed = query.trim();
  if (!trimmed) {
    return { toolId: null, confidence: 0, tier: "low", parameters: {}, unresolvedFields: [], candidates: [], query };
  }

  const specialized =
    tryArithmetic(trimmed) ??
    tryUnitConversion(trimmed) ??
    tryCurrencyConversion(trimmed) ??
    tryCountdown(trimmed) ??
    tryDurationFromNow(trimmed);
  if (specialized) return specialized;

  let best: { rule: Rule; score: number } | null = null;
  for (const rule of RULES) {
    const score = scoreRule(rule, query);
    if (score > 0 && (!best || score > best.score)) {
      best = { rule, score };
    }
  }

  if (best && best.score >= MEDIUM_THRESHOLD) {
    const parameters = best.rule.map(query);
    const unresolvedFields = best.rule.required.filter((f) => parameters[f] === undefined);
    const calc = getCalculator(best.rule.toolId);
    const missingLabels = unresolvedFields.map(
      (key) => calc?.fields.find((f) => f.key === key)?.label ?? key,
    );
    const autoCalculable = unresolvedFields.length === 0;
    const tier = best.score >= HIGH_THRESHOLD && autoCalculable ? "high" : "medium";
    return {
      toolId: best.rule.toolId,
      confidence: best.score,
      tier,
      parameters,
      unresolvedFields,
      candidates: [],
      query,
      recognizedLabel: best.rule.label,
      recognizedSummary: best.rule.summarize?.(parameters),
      autoCalculable,
      missingLabels,
    };
  }

  const candidates: IntentCandidate[] = keywordCandidates(query).map((c) => ({
    toolId: c.toolId,
    name: CALCULATORS.find((x) => x.id === c.toolId)?.name ?? c.toolId,
    confidence: c.score,
  }));
  const fallbackParams = best ? best.rule.map(query) : {};
  return {
    toolId: best?.rule.toolId ?? candidates[0]?.toolId ?? null,
    confidence: best?.score ?? 0,
    tier: "low",
    parameters: fallbackParams,
    unresolvedFields: best ? best.rule.required.filter((f) => fallbackParams[f] === undefined) : [],
    candidates,
    query,
  };
}
