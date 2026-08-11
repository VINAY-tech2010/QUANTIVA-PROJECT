/**
 * Lightweight natural-language tokenizer and entity extractor for the
 * QUANTIVA intent engine. No external NLP dependency — deterministic and
 * testable.
 *
 * Extended to understand: Indian number formats (lakh/crore), millions,
 * negative numbers, units, dates, durations and arithmetic word-operators.
 */

export interface MoneyMention {
  value: number;
  currency?: string;
  raw: string;
}

export interface TimeMention {
  /** "HH:MM" 24-hour */
  time: string;
  raw: string;
}

export interface PercentMention {
  value: number;
  raw: string;
}

export interface NumberMention {
  value: number;
  raw: string;
}

export interface UnitMention {
  /** The canonical unit key within its dimension (e.g. "km", "mi", "kg"). */
  unit: string;
  /** The dimension this unit belongs to (e.g. "length", "mass"). */
  dimension: string;
  /** The numeric value attached to the unit, if any. */
  value?: number;
  raw: string;
}

export interface DateMention {
  /** ISO date "YYYY-MM-DD". */
  iso: string;
  /** True when the year was not explicitly stated (resolved to next occurrence). */
  yearAssumed: boolean;
  raw: string;
}

export interface DurationMention {
  /** Total duration in minutes. */
  minutes: number;
  raw: string;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  $: "USD",
  "€": "EUR",
  "£": "GBP",
  "₹": "INR",
  "¥": "JPY",
};

const CURRENCY_WORDS: Record<string, string> = {
  dollar: "USD",
  dollars: "USD",
  usd: "USD",
  euro: "EUR",
  euros: "EUR",
  eur: "EUR",
  pound: "GBP",
  pounds: "GBP",
  gbp: "GBP",
  rupee: "INR",
  rupees: "INR",
  inr: "INR",
  yen: "JPY",
  jpy: "JPY",
};

/** Indian / large-number magnitude words → multiplier. */
const MAGNITUDE_WORDS: Record<string, number> = {
  lakh: 100_000,
  lakhs: 100_000,
  lac: 100_000,
  crore: 10_000_000,
  crores: 10_000_000,
  million: 1_000_000,
  millions: 1_000_000,
  billion: 1_000_000_000,
  billions: 1_000_000_000,
  thousand: 1_000,
};

/** Unit alias → [dimension, canonical unit key]. */
const UNIT_ALIASES: Record<string, [string, string]> = {
  // length
  mm: ["length", "mm"],
  millimeter: ["length", "mm"],
  millimeters: ["length", "mm"],
  millimetre: ["length", "mm"],
  millimetres: ["length", "mm"],
  cm: ["length", "cm"],
  centimeter: ["length", "cm"],
  centimeters: ["length", "cm"],
  centimetre: ["length", "cm"],
  centimetres: ["length", "cm"],
  meter: ["length", "m"],
  meters: ["length", "m"],
  metre: ["length", "m"],
  metres: ["length", "m"],
  km: ["length", "km"],
  kilometer: ["length", "km"],
  kilometers: ["length", "km"],
  kilometre: ["length", "km"],
  kilometres: ["length", "km"],
  inch: ["length", "in"],
  inches: ["length", "in"],
  ft: ["length", "ft"],
  foot: ["length", "ft"],
  feet: ["length", "ft"],
  yd: ["length", "yd"],
  yard: ["length", "yd"],
  yards: ["length", "yd"],
  mile: ["length", "mi"],
  miles: ["length", "mi"],
  // mass
  mg: ["mass", "mg"],
  gram: ["mass", "g"],
  grams: ["mass", "g"],
  kg: ["mass", "kg"],
  kilo: ["mass", "kg"],
  kilos: ["mass", "kg"],
  kilogram: ["mass", "kg"],
  kilograms: ["mass", "kg"],
  lb: ["mass", "lb"],
  lbs: ["mass", "lb"],
  oz: ["mass", "oz"],
  ounce: ["mass", "oz"],
  ounces: ["mass", "oz"],
  // temperature
  celsius: ["temperature", "c"],
  fahrenheit: ["temperature", "f"],
  kelvin: ["temperature", "k"],
  // volume
  ml: ["volume", "ml"],
  liter: ["volume", "l"],
  liters: ["volume", "l"],
  litre: ["volume", "l"],
  litres: ["volume", "l"],
  gal: ["volume", "gal"],
  gallon: ["volume", "gal"],
  gallons: ["volume", "gal"],
  cup: ["volume", "cup"],
  cups: ["volume", "cup"],
  // speed
  mph: ["speed", "mph"],
  kmh: ["speed", "kmh"],
  kph: ["speed", "kmh"],
  // data
  kb: ["data", "kb"],
  mb: ["data", "mb"],
  gb: ["data", "gb"],
  tb: ["data", "tb"],
};

const MONTHS: Record<string, number> = {
  january: 0, jan: 0,
  february: 1, feb: 1,
  march: 2, mar: 2,
  april: 3, apr: 3,
  may: 4,
  june: 5, jun: 5,
  july: 6, jul: 6,
  august: 7, aug: 7,
  september: 8, sep: 8, sept: 8,
  october: 9, oct: 9,
  november: 10, nov: 10,
  december: 11, dec: 11,
};

/** Normalize a query for matching. */
export function normalize(query: string): string {
  return query.toLowerCase().replace(/\s+/g, " ").trim();
}

/**
 * Expand Indian / large-number magnitude words in a numeric string.
 * "50 lakh" → 5000000, "1.5 million" → 1500000, "2 crore" → 20000000.
 */
export function expandMagnitude(numText: string, magnitudeWord?: string): number | undefined {
  const base = parseFloat(numText.replace(/,/g, ""));
  if (!Number.isFinite(base)) return undefined;
  if (!magnitudeWord) return base;
  const mult = MAGNITUDE_WORDS[magnitudeWord.toLowerCase()];
  return mult === undefined ? base : base * mult;
}

/** Extract money mentions like "$2000", "2000 dollars", "€50", "5 lakh rupees". */
export function extractMoney(query: string): MoneyMention[] {
  const out: MoneyMention[] = [];
  // Symbol-prefixed: $2,000 / €50.5 (optionally with magnitude word)
  const symbolRe = /([$€£₹¥])\s?(\d[\d,]*(?:\.\d+)?)\s?(lakh|lakhs|lac|crore|crores|million|millions|billion|billions|thousand)?\b/gi;
  let m: RegExpExecArray | null;
  while ((m = symbolRe.exec(query)) !== null) {
    const value = expandMagnitude(m[2], m[3]);
    if (value === undefined) continue;
    out.push({ value, currency: CURRENCY_SYMBOLS[m[1]], raw: m[0] });
  }
  // Number + optional magnitude + currency word: "2000 dollars", "5 lakh rupees"
  const wordRe = /(\d[\d,]*(?:\.\d+)?)\s?(lakh|lakhs|lac|crore|crores|million|millions|billion|billions|thousand)?\s?(dollars?|usd|euros?|eur|pounds?|gbp|rupees?|inr|yen|jpy)\b/gi;
  while ((m = wordRe.exec(query)) !== null) {
    const value = expandMagnitude(m[1], m[2]);
    if (value === undefined) continue;
    out.push({ value, currency: CURRENCY_WORDS[m[3].toLowerCase()], raw: m[0] });
  }
  return out;
}

/** Extract times like "9:30", "4:45", "9am", "4:45pm". Returns 24h "HH:MM". */
export function extractTimes(query: string): TimeMention[] {
  const out: TimeMention[] = [];
  const re = /\b(\d{1,2})(?::(\d{2}))?\s?(am|pm)?\b/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(query)) !== null) {
    const hasColon = m[2] !== undefined;
    const hasMeridiem = m[3] !== undefined;
    // Only treat as a time if it has a colon or an explicit am/pm.
    if (!hasColon && !hasMeridiem) continue;
    let hour = parseInt(m[1], 10);
    const minute = hasColon ? parseInt(m[2], 10) : 0;
    if (minute > 59) continue;
    if (hasMeridiem) {
      if (hour < 1 || hour > 12) continue;
      if (m[3] === "pm" && hour !== 12) hour += 12;
      if (m[3] === "am" && hour === 12) hour = 0;
    } else if (hour > 23) {
      continue;
    }
    out.push({
      time: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
      raw: m[0],
    });
  }
  return out;
}

/** Extract percents like "20%", "7.5 percent", "-5%". */
export function extractPercents(query: string): PercentMention[] {
  const out: PercentMention[] = [];
  const re = /(-?\d+(?:\.\d+)?)\s?(?:%|percent\b|pct\b)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(query)) !== null) {
    out.push({ value: parseFloat(m[1]), raw: m[0] });
  }
  return out;
}

/** Extract unit mentions like "10 km", "miles", "15 kg". */
export function extractUnits(query: string): UnitMention[] {
  const out: UnitMention[] = [];
  const norm = normalize(query);
  const capturedSpans: [number, number][] = [];
  // value + unit
  const valueUnitRe = /(-?\d[\d,]*(?:\.\d+)?)\s?([a-z]+)\b/g;
  let m: RegExpExecArray | null;
  while ((m = valueUnitRe.exec(norm)) !== null) {
    const alias = UNIT_ALIASES[m[2]];
    if (!alias) continue;
    out.push({
      unit: alias[1],
      dimension: alias[0],
      value: parseFloat(m[1].replace(/,/g, "")),
      raw: m[0],
    });
    capturedSpans.push([m.index, m.index + m[0].length]);
  }
  // bare unit words (no value) — only when not already captured
  for (const [word, alias] of Object.entries(UNIT_ALIASES)) {
    const re = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "g");
    while ((m = re.exec(norm)) !== null) {
      const start = m.index;
      const end = start + m[0].length;
      const inside = capturedSpans.some(([s, e]) => start >= s && end <= e);
      if (!inside) {
        out.push({ unit: alias[1], dimension: alias[0], raw: m[0] });
        capturedSpans.push([start, end]);
      }
    }
  }
  return out;
}

/** Extract explicit dates like "25 December 2026", "10 October", "2027-03-15". */
export function extractDates(query: string): DateMention[] {
  const out: DateMention[] = [];
  const norm = normalize(query);
  const now = new Date();

  // ISO: 2027-03-15
  const isoRe = /\b(\d{4})-(\d{2})-(\d{2})\b/g;
  let m: RegExpExecArray | null;
  while ((m = isoRe.exec(norm)) !== null) {
    out.push({ iso: m[0], yearAssumed: false, raw: m[0] });
  }

  const monthNames = Object.keys(MONTHS).join("|");
  // "25 December 2026" / "25 December"
  const dmyRe = new RegExp(`\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+(${monthNames})(?:\\s+(\\d{4}))?\\b`, "g");
  while ((m = dmyRe.exec(norm)) !== null) {
    const day = parseInt(m[1], 10);
    const month = MONTHS[m[2]];
    const year = m[3] ? parseInt(m[3], 10) : undefined;
    out.push({ iso: buildIso(year, month, day, now), yearAssumed: year === undefined, raw: m[0] });
  }
  // "December 25 2026" / "December 25"
  const mdyRe = new RegExp(`\\b(${monthNames})\\s+(\\d{1,2})(?:st|nd|rd|th)?(?:\\s*,?\\s*(\\d{4}))?\\b`, "g");
  while ((m = mdyRe.exec(norm)) !== null) {
    const month = MONTHS[m[1]];
    const day = parseInt(m[2], 10);
    const year = m[3] ? parseInt(m[3], 10) : undefined;
    const dup = out.some((d) => d.raw === m![0]);
    if (!dup) out.push({ iso: buildIso(year, month, day, now), yearAssumed: year === undefined, raw: m[0] });
  }

  // Numeric: 15/03/2027 or 03/15/2027
  const numRe = /\b(\d{1,2})[/.](\d{1,2})[/.](\d{4})\b/g;
  while ((m = numRe.exec(norm)) !== null) {
    const a = parseInt(m[1], 10);
    const b = parseInt(m[2], 10);
    const year = parseInt(m[3], 10);
    let day: number, month: number;
    if (a > 12) {
      day = a; month = b - 1;
    } else if (b > 12) {
      day = b; month = a - 1;
    } else {
      day = a; month = b - 1; // ambiguous → DD/MM
    }
    if (month >= 0 && month <= 11 && day >= 1 && day <= 31) {
      out.push({ iso: buildIso(year, month, day, now), yearAssumed: false, raw: m[0] });
    }
  }

  return out;
}

function buildIso(year: number | undefined, month: number, day: number, now: Date): string {
  let y = year ?? now.getFullYear();
  const candidate = new Date(Date.UTC(y, month, day));
  if (candidate.getUTCMonth() !== month) {
    day = new Date(Date.UTC(y, month + 1, 0)).getUTCDate();
  }
  if (year === undefined) {
    const thisYear = Date.UTC(now.getFullYear(), month, day);
    const todayUtc = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    if (thisYear < todayUtc) {
      y = now.getFullYear() + 1;
    }
  }
  return `${y}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** Extract durations like "3 hours 45 minutes", "2.5 hours", "3 days". Returns total minutes. */
export function extractDurations(query: string): DurationMention[] {
  const out: DurationMention[] = [];
  const norm = normalize(query);
  const unitMinutes: Record<string, number> = {
    minute: 1, minutes: 1, min: 1, mins: 1,
    hour: 60, hours: 60, hr: 60, hrs: 60,
    day: 1440, days: 1440,
    week: 10080, weeks: 10080,
  };
  const re = /(\d+(?:\.\d+)?)\s?(minutes?|mins?|hours?|hrs?|days?|weeks?)\b/g;
  let m: RegExpExecArray | null;
  let total = 0;
  let matched = false;
  const raws: string[] = [];
  while ((m = re.exec(norm)) !== null) {
    const val = parseFloat(m[1]);
    const mult = unitMinutes[m[2]];
    if (mult === undefined) continue;
    total += val * mult;
    matched = true;
    raws.push(m[0]);
  }
  if (matched) {
    out.push({ minutes: total, raw: raws.join(" ") });
  }
  return out;
}

/** Word operators → symbol, for arithmetic phrase conversion. */
const WORD_OPERATORS: [RegExp, string][] = [
  [/\bdivided\s+by\b/g, "/"],
  [/\bmultiply\s+by\b/g, "*"],
  [/\bmultiplied\s+by\b/g, "*"],
  [/\btimes\b/g, "*"],
  [/\bplus\b/g, "+"],
  [/\bminus\b/g, "-"],
  [/\badd\b/g, "+"],
  [/\bsubtract\b/g, "-"],
  [/\bover\b/g, "/"],
];

/**
 * Convert a natural-language arithmetic phrase into an evaluable expression.
 * "5000 plus 2500" → "5000+2500"; "1000 divided by 25" → "1000/25".
 * Returns null when the query does not look like arithmetic.
 */
export function toArithmeticExpression(query: string): string | null {
  let expr = normalize(query);
  expr = expr.replace(/^(what is|what's|calculate|compute|evaluate|solve|find|how much is)\s+/, "");
  expr = expr.replace(/[?=]+\s*$/, "");
  for (const [re, sym] of WORD_OPERATORS) {
    expr = expr.replace(re, ` ${sym} `);
  }
  const hasOp = /[+\-*/%]/.test(expr);
  const numCount = (expr.match(/\d+(?:\.\d+)?/g) ?? []).length;
  if (!hasOp || numCount < 2) return null;
  expr = expr.replace(/[a-z]+/g, " ");
  expr = expr.replace(/\s+/g, " ").trim();
  if (!/^[\d+\-*/%().\s]+$/.test(expr)) return null;
  return expr;
}

/** Extract bare numbers (excluding those already part of money/time/percent). */
export function extractNumbers(query: string): NumberMention[] {
  const consumed = new Set<string>();
  extractMoney(query).forEach((x) => consumed.add(x.raw));
  extractTimes(query).forEach((x) => consumed.add(x.raw));
  extractPercents(query).forEach((x) => consumed.add(x.raw));

  const out: NumberMention[] = [];
  const re = /-?\d[\d,]*(?:\.\d+)?/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(query)) !== null) {
    const raw = m[0];
    let skip = false;
    for (const c of consumed) {
      if (c.includes(raw)) {
        skip = true;
        break;
      }
    }
    if (!skip) out.push({ value: parseFloat(raw.replace(/,/g, "")), raw });
  }
  return out;
}
