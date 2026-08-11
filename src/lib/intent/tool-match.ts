/**
 * Smart tool discovery for QUANTIVA search.
 *
 * Distinguishes three kinds of query:
 *   1. A natural-language calculation (handled by the intent parser).
 *   2. A search for an existing calculator/tool (this module).
 *   3. A request for a tool QUANTIVA does not implement (this module).
 *
 * This module is additive: it does NOT replace the intent parser. It only
 * runs when the parser did not already produce a confident calculation
 * intent, so existing calculation routing is preserved.
 */

import { CALCULATORS } from "@/data/calculators";
import type { CalculatorDefinition } from "@/types";
import { normalize } from "./tokenizer";

export type ToolMatchKind = "exact" | "fuzzy" | "none";

export interface ToolMatch {
  kind: ToolMatchKind;
  /** The matched calculator, when kind is "exact" or "fuzzy". */
  calculator?: CalculatorDefinition;
  /** 0..1 confidence in the match. */
  confidence: number;
  /** The cleaned tool name the user appeared to ask for (for missing-tool prefill). */
  requestedName: string;
}

/** Words that, when present, indicate the user is naming a tool rather than
 *  describing a calculation. Stripped before matching. */
const TOOL_FILLER = /\b(calculator|calc|tool|converter|convertor|estimator|finder|solver|compute|calculate|calculation|please|the|a|an|for|me|my)\b/g;

/** Common abbreviations / alternative names → canonical tool id. */
const TOOL_ALIASES: Record<string, string> = {
  emi: "loan",
  "emi calculator": "loan",
  amortization: "loan",
  "car loan": "loan",
  "home loan": "mortgage",
  "house loan": "mortgage",
  percent: "percentage",
  pct: "percentage",
  "%": "percentage",
  age: "age",
  "age calculation": "age",
  "how old": "age",
  bmi: "bmi",
  "body mass": "bmi",
  tip: "tip",
  gratuity: "tip",
  discount: "discount",
  "sale price": "discount",
  "split bill": "bill-split",
  split: "bill-split",
  countdown: "countdown",
  "time zone": "time-zone",
  timezone: "time-zone",
  "world clock": "time-zone",
  "unit converter": "unit-converter",
  "currency converter": "currency-converter",
  forex: "currency-converter",
  "compound interest": "compound-growth",
  "compound growth": "compound-growth",
  "savings goal": "savings-goal",
  "break even": "break-even",
  breakeven: "break-even",
  "freelance rate": "freelance-rate",
  "hourly rate": "freelance-rate",
  "meeting cost": "meeting-cost",
  "fuel cost": "fuel-cost",
  mileage: "fuel-cost",
  petrol: "fuel-cost",
  "date difference": "date-duration",
  "days between": "date-duration",
  "time duration": "time-duration",
  "sales tax": "sales-tax",
  vat: "sales-tax",
  "simple interest": "simple-interest",
  roi: "roi",
  inflation: "inflation",
  salary: "salary",
  commission: "commission",
  margin: "margin",
  overtime: "overtime",
  cac: "cac",
  ltv: "ltv",
  gcd: "gcd-lcm",
  lcm: "gcd-lcm",
  hcf: "gcd-lcm",
  "prime factors": "prime-factors",
  quadratic: "quadratic",
  power: "power",
  exponent: "power",
  logarithm: "logarithm",
  log: "logarithm",
  factorial: "factorial",
  combination: "combinatorics",
  permutation: "combinatorics",
  geometry: "geometry",
  area: "geometry",
  perimeter: "geometry",
  trigonometry: "trig",
  pythagorean: "pythagorean",
  statistics: "statistics",
  "standard deviation": "std-dev",
  "std dev": "std-dev",
  average: "average",
  mean: "average",
  temperature: "temperature-converter",
  "data storage": "data-converter",
  calories: "calories",
  tdee: "calories",
  "body fat": "body-fat",
  pace: "pace",
  running: "pace",
  "add days": "date-add",
  "day of week": "day-of-week",
  "working days": "work-days",
  "business days": "work-days",
  electricity: "electricity-cost",
  paint: "paint",
  binary: "base-converter",
  hex: "base-converter",
  "base converter": "base-converter",
  "download time": "download-time",
  "aspect ratio": "aspect-ratio",
  "ohms law": "ohms-law",
  "kinetic energy": "kinetic-energy",
  "speed distance time": "speed-distance-time",
  density: "density",
  "rent affordability": "rent-affordability",
  "unit price": "unit-price",
  "emergency fund": "emergency-fund",
  "debt payoff": "debt-payoff",
};

/** Strip filler words and collapse whitespace to get the core tool phrase. */
function corePhrase(query: string): string {
  return normalize(query)
    .replace(TOOL_FILLER, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Levenshtein distance between two short strings (for typo tolerance). */
function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  const alen = a.length;
  const blen = b.length;
  if (alen === 0) return blen;
  if (blen === 0) return alen;
  const prev: number[] = new Array(blen + 1);
  const curr: number[] = new Array(blen + 1);
  for (let j = 0; j <= blen; j++) prev[j] = j;
  for (let i = 1; i <= alen; i++) {
    curr[0] = i;
    for (let j = 1; j <= blen; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    for (let j = 0; j <= blen; j++) prev[j] = curr[j];
  }
  return prev[blen];
}

/** True when `b` is within one edit of `a` (typo tolerance for short words). */
function nearMatch(a: string, b: string): boolean {
  if (a === b) return true;
  const dist = levenshtein(a, b);
  // Allow 1 edit for short words, 2 for longer phrases.
  const tolerance = Math.max(a.length, b.length) <= 5 ? 1 : 2;
  return dist <= tolerance;
}

/** Singular/plural-insensitive token equality. */
function tokenEquals(a: string, b: string): boolean {
  if (a === b) return true;
  if (a + "s" === b || b + "s" === a) return true;
  if (a.endsWith("es") && a.slice(0, -2) === b) return true;
  if (b.endsWith("es") && b.slice(0, -2) === a) return true;
  return false;
}

interface ScoredCalc {
  calc: CalculatorDefinition;
  score: number;
}

function scoreCalculator(calc: CalculatorDefinition, phrase: string, rawNorm: string): number {
  if (!phrase) return 0;
  const name = normalize(calc.name);
  const nameCore = name.replace(TOOL_FILLER, " ").replace(/\s+/g, " ").trim();

  // Exact name match (ignoring filler) — strongest signal.
  if (phrase === nameCore || phrase === name) return 1;

  // Alias match.
  const aliasId = TOOL_ALIASES[phrase];
  if (aliasId === calc.id) return 0.95;

  // Keyword exact match.
  for (const kw of calc.keywords) {
    const k = normalize(kw);
    if (phrase === k) return 0.9;
  }

  // Substring: the phrase is contained in the name or vice versa. Require the
  // shorter name to be a whole word inside the phrase so "age" doesn't match
  // inside "morgage".
  if (nameCore) {
    const nameRe = new RegExp(`\\b${nameCore.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`);
    if (nameCore.includes(phrase) || (phrase.length > nameCore.length && nameRe.test(phrase))) {
      return 0.8;
    }
  }
  // Keyword containment with word boundaries so short keywords (e.g. "age",
  // "profit") don't match inside unrelated longer words ("morgage",
  // "profitability").
  const phraseWordRe = new RegExp(`\\b${phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`);
  for (const kw of calc.keywords) {
    const k = normalize(kw);
    if (k.length <= 2) continue;
    const kwRe = new RegExp(`\\b${k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`);
    if (kwRe.test(phrase) || (phrase.length > 2 && phraseWordRe.test(k))) return 0.7;
  }

  // Token overlap (handles word reorder + singular/plural).
  const phraseTokens = phrase.split(" ").filter(Boolean);
  const nameTokens = nameCore.split(" ").filter(Boolean);
  if (phraseTokens.length > 0 && nameTokens.length > 0) {
    let overlap = 0;
    for (const pt of phraseTokens) {
      if (nameTokens.some((nt) => tokenEquals(pt, nt))) overlap += 1;
    }
    const ratio = overlap / Math.max(phraseTokens.length, nameTokens.length);
    if (ratio >= 0.99) return 0.75;
    if (ratio >= 0.5) return Math.max(0.55, ratio * 0.7);
  }

  // Fuzzy / typo tolerance against name and keywords.
  if (nearMatch(phrase, nameCore)) return 0.65;
  for (const kw of calc.keywords) {
    if (nearMatch(phrase, normalize(kw))) return 0.6;
  }

  // Single-token fuzzy against individual name tokens.
  if (phraseTokens.length === 1) {
    const pt = phraseTokens[0];
    if (pt.length > 3 && nameTokens.some((nt) => nearMatch(pt, nt))) return 0.55;
  }

  void rawNorm;
  return 0;
}

const EXACT_THRESHOLD = 0.85;
const FUZZY_THRESHOLD = 0.5;

/**
 * Decide whether a query is a search for an existing tool, and if so which.
 *
 * Returns kind "exact" for high-confidence matches (navigate directly),
 * "fuzzy" for probable matches (navigate directly but lower confidence), and
 * "none" when no existing tool matches (caller decides missing-tool vs
 * no-result). `requestedName` is always populated with the cleaned tool
 * phrase so the missing-tool flow can prefill the request form.
 */
export function matchTool(query: string): ToolMatch {
  const rawNorm = normalize(query);
  const phrase = corePhrase(query);
  const requestedName = phrase || rawNorm;

  if (!phrase) {
    return { kind: "none", confidence: 0, requestedName: rawNorm };
  }

  let best: ScoredCalc | null = null;
  for (const calc of CALCULATORS) {
    const score = scoreCalculator(calc, phrase, rawNorm);
    if (score > 0 && (!best || score > best.score)) {
      best = { calc, score };
    }
  }

  if (!best) {
    return { kind: "none", confidence: 0, requestedName };
  }
  if (best.score >= EXACT_THRESHOLD) {
    return { kind: "exact", calculator: best.calc, confidence: best.score, requestedName };
  }
  if (best.score >= FUZZY_THRESHOLD) {
    return { kind: "fuzzy", calculator: best.calc, confidence: best.score, requestedName };
  }
  return { kind: "none", confidence: best.score, requestedName };
}

/**
 * True when the query looks like a request for a specific named tool that we
 * do not implement, as opposed to a vague/unidentifiable query. Heuristic:
 * the query contains a "tool-ish" noun (calculator/converter/etc.) or a
 * capitalized multi-word name, and is not a pure calculation.
 */
export function looksLikeToolRequest(query: string): boolean {
  const norm = normalize(query);
  // Explicit tool nouns strongly imply a tool request.
  if (/\b(calculator|converter|convertor|estimator|solver|generator|tracker|planner)\b/.test(norm)) {
    return true;
  }
  // "X tool" phrasing.
  if (/\btool\b/.test(norm)) return true;
  return false;
}
