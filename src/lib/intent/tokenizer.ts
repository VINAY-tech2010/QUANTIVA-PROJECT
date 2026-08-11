/**
 * Lightweight natural-language tokenizer and entity extractor for the
 * QUANTIVA intent engine. No external NLP dependency — deterministic and
 * testable.
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

/** Normalize a query for matching. */
export function normalize(query: string): string {
  return query.toLowerCase().replace(/\s+/g, " ").trim();
}

/** Extract money mentions like "$2000", "2000 dollars", "€50". */
export function extractMoney(query: string): MoneyMention[] {
  const out: MoneyMention[] = [];
  // Symbol-prefixed: $2,000 / €50.5
  const symbolRe = /([$€£₹¥])\s?(\d[\d,]*(?:\.\d+)?)/g;
  let m: RegExpExecArray | null;
  while ((m = symbolRe.exec(query)) !== null) {
    out.push({
      value: parseFloat(m[2].replace(/,/g, "")),
      currency: CURRENCY_SYMBOLS[m[1]],
      raw: m[0],
    });
  }
  // Number + currency word: "2000 dollars"
  const wordRe = /(\d[\d,]*(?:\.\d+)?)\s?(dollars?|usd|euros?|eur|pounds?|gbp|rupees?|inr|yen|jpy)\b/g;
  while ((m = wordRe.exec(query)) !== null) {
    out.push({
      value: parseFloat(m[1].replace(/,/g, "")),
      currency: CURRENCY_WORDS[m[2]],
      raw: m[0],
    });
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

/** Extract percents like "20%", "7.5 percent". */
export function extractPercents(query: string): PercentMention[] {
  const out: PercentMention[] = [];
  const re = /(\d+(?:\.\d+)?)\s?(?:%|percent\b)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(query)) !== null) {
    out.push({ value: parseFloat(m[1]), raw: m[0] });
  }
  return out;
}

/** Extract bare numbers (excluding those already part of money/time/percent). */
export function extractNumbers(query: string): NumberMention[] {
  const consumed = new Set<string>();
  extractMoney(query).forEach((x) => consumed.add(x.raw));
  extractTimes(query).forEach((x) => consumed.add(x.raw));
  extractPercents(query).forEach((x) => consumed.add(x.raw));

  const out: NumberMention[] = [];
  const re = /\d[\d,]*(?:\.\d+)?/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(query)) !== null) {
    const raw = m[0];
    // Skip if this number is a substring of an already-consumed mention.
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
