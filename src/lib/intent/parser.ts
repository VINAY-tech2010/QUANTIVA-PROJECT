import type { IntentResult } from "@/types";
import { CALCULATORS } from "@/data/calculators";
import {
  normalize,
  extractMoney,
  extractTimes,
  extractPercents,
  extractNumbers,
} from "./tokenizer";

interface Rule {
  toolId: string;
  /** Keyword triggers (matched against normalized query). */
  triggers: string[];
  /** Map extracted entities onto calculator input fields. */
  map: (query: string) => Record<string, number | string>;
  /** Fields the rule could not fill but the calculator needs. */
  required: string[];
}

const firstMoney = (q: string) => extractMoney(q)[0]?.value;
const firstPercent = (q: string) => extractPercents(q)[0]?.value;
const firstNumber = (q: string) => extractNumbers(q)[0]?.value;

const RULES: Rule[] = [
  {
    toolId: "affordability",
    triggers: ["can i afford", "afford", "should i buy"],
    required: ["price"],
    map: (q) => {
      const price = firstMoney(q) ?? firstNumber(q);
      const out: Record<string, number> = {};
      if (price !== undefined) out.price = price;
      return out;
    },
  },
  {
    toolId: "time-duration",
    triggers: ["how long is", "time between", "duration between", "how many hours between", "from"],
    required: ["startTime", "endTime"],
    map: (q) => {
      const times = extractTimes(q);
      const out: Record<string, string> = {};
      if (times[0]) out.startTime = times[0].time;
      if (times[1]) out.endTime = times[1].time;
      return out;
    },
  },
  {
    toolId: "tip",
    triggers: ["tip", "gratuity"],
    required: ["bill"],
    map: (q) => {
      const bill = firstMoney(q) ?? firstNumber(q);
      const pct = firstPercent(q);
      const out: Record<string, number> = {};
      if (bill !== undefined) out.bill = bill;
      if (pct !== undefined) out.tipPercent = pct;
      return out;
    },
  },
  {
    toolId: "discount",
    triggers: ["discount", "off", "sale price", "marked down"],
    required: ["originalPrice"],
    map: (q) => {
      const price = firstMoney(q) ?? firstNumber(q);
      const pct = firstPercent(q);
      const out: Record<string, number> = {};
      if (price !== undefined) out.originalPrice = price;
      if (pct !== undefined) out.discountPercent = pct;
      return out;
    },
  },
  {
    toolId: "loan",
    triggers: ["loan", "borrow", "car payment", "monthly payment"],
    required: ["principal"],
    map: (q) => {
      const principal = firstMoney(q) ?? firstNumber(q);
      const rate = firstPercent(q);
      const out: Record<string, number> = {};
      if (principal !== undefined) out.principal = principal;
      if (rate !== undefined) out.interestRate = rate;
      return out;
    },
  },
  {
    toolId: "mortgage",
    triggers: ["mortgage", "house payment", "home loan"],
    required: ["homePrice"],
    map: (q) => {
      const price = firstMoney(q) ?? firstNumber(q);
      const out: Record<string, number> = {};
      if (price !== undefined) out.homePrice = price;
      return out;
    },
  },
  {
    toolId: "percentage",
    triggers: ["percent of", "percentage", "% of", "what percent"],
    required: [],
    map: (q) => {
      const nums = extractNumbers(q);
      const pct = firstPercent(q);
      const out: Record<string, number> = {};
      if (pct !== undefined && nums[0] !== undefined) {
        out.percent = pct;
        out.of = nums[0].value;
      } else if (nums.length >= 2) {
        out.part = nums[0].value;
        out.whole = nums[1].value;
      }
      return out;
    },
  },
  {
    toolId: "compound-growth",
    triggers: ["compound", "grow", "investment growth", "interest grow"],
    required: ["principal"],
    map: (q) => {
      const principal = firstMoney(q) ?? firstNumber(q);
      const out: Record<string, number> = {};
      if (principal !== undefined) out.principal = principal;
      return out;
    },
  },
  {
    toolId: "savings-goal",
    triggers: ["save", "savings goal", "how long to save"],
    required: ["goal"],
    map: (q) => {
      const goal = firstMoney(q) ?? firstNumber(q);
      const out: Record<string, number> = {};
      if (goal !== undefined) out.goal = goal;
      return out;
    },
  },
  {
    toolId: "meeting-cost",
    triggers: ["meeting cost", "cost of meeting", "meeting"],
    required: [],
    map: (q) => {
      const people = firstNumber(q);
      const out: Record<string, number> = {};
      if (people !== undefined) out.attendees = people;
      return out;
    },
  },
  {
    toolId: "break-even",
    triggers: ["break even", "break-even", "breakeven"],
    required: [],
    map: () => ({}),
  },
  {
    toolId: "freelance-rate",
    triggers: ["freelance rate", "hourly rate", "charge per hour", "day rate"],
    required: [],
    map: (q) => {
      const salary = firstMoney(q);
      const out: Record<string, number> = {};
      if (salary !== undefined) out.targetIncome = salary;
      return out;
    },
  },
  {
    toolId: "bmi",
    triggers: ["bmi", "body mass index"],
    required: [],
    map: (q) => {
      const nums = extractNumbers(q);
      const out: Record<string, number> = {};
      if (nums[0] !== undefined) out.weightKg = nums[0].value;
      if (nums[1] !== undefined) out.heightCm = nums[1].value;
      return out;
    },
  },
  {
    toolId: "unit-converter",
    triggers: ["convert", "to kilometers", "to miles", "to kg", "to pounds", "how many"],
    required: [],
    map: () => ({}),
  },
  {
    toolId: "countdown",
    triggers: ["how long until", "countdown", "days until", "time until"],
    required: [],
    map: () => ({}),
  },
  {
    toolId: "bill-split",
    triggers: ["split bill", "split the bill", "split between", "divide bill"],
    required: [],
    map: (q) => {
      const bill = firstMoney(q) ?? firstNumber(q);
      const out: Record<string, number> = {};
      if (bill !== undefined) out.bill = bill;
      return out;
    },
  },
];

const CONFIDENCE_THRESHOLD = 0.45;

function scoreRule(rule: Rule, query: string): number {
  const norm = normalize(query);
  let hits = 0;
  for (const t of rule.triggers) {
    if (norm.includes(t)) hits += 1;
  }
  if (hits === 0) return 0;
  // Base score from trigger strength, boosted by filled required fields.
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
  // If nothing matched at all, surface a few popular tools as suggestions.
  if (scored.length === 0) {
    return ["loan", "percentage", "tip"].map((toolId) => ({ toolId, score: 0.1 }));
  }
  return scored.sort((a, b) => b.score - a.score).slice(0, 3);
}

/**
 * Parse a natural-language query into a calculator intent. Returns the best
 * tool, extracted parameters, any fields still needed, and alternative
 * candidates when confidence is low.
 */
export function parseIntent(query: string): IntentResult {
  const trimmed = query.trim();
  if (!trimmed) {
    return { toolId: null, confidence: 0, parameters: {}, unresolvedFields: [], candidates: [], query };
  }

  let best: { rule: Rule; score: number } | null = null;
  for (const rule of RULES) {
    const score = scoreRule(rule, query);
    if (score > 0 && (!best || score > best.score)) {
      best = { rule, score };
    }
  }

  if (best && best.score >= CONFIDENCE_THRESHOLD) {
    const parameters = best.rule.map(query);
    const unresolvedFields = best.rule.required.filter((f) => parameters[f] === undefined);
    return {
      toolId: best.rule.toolId,
      confidence: best.score,
      parameters,
      unresolvedFields,
      candidates: [],
      query,
    };
  }

  // Low confidence — offer disambiguation candidates.
  const candidates = keywordCandidates(query).map((c) => ({
    toolId: c.toolId,
    name: CALCULATORS.find((x) => x.id === c.toolId)?.name ?? c.toolId,
    confidence: c.score,
  }));
  const fallbackParams = best ? best.rule.map(query) : {};
  return {
    toolId: best?.rule.toolId ?? candidates[0]?.toolId ?? null,
    confidence: best?.score ?? 0,
    parameters: fallbackParams,
    unresolvedFields: best ? best.rule.required.filter((f) => fallbackParams[f] === undefined) : [],
    candidates,
    query,
  };
}
