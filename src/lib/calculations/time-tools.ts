import type { CalcResult, CalculatorInputs } from "@/types";
import { toNumber } from "@/lib/utils/math";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function parseDate(value: unknown): Date | null {
  if (typeof value !== "string") return null;
  const time = Date.parse(value);
  if (Number.isNaN(time)) return null;
  return new Date(time);
}

/** Pluralize a unit: "1 day" / "2 days". */
export function plural(value: number, unit: string): string {
  return `${value} ${unit}${value === 1 ? "" : "s"}`;
}

/**
 * Add or subtract a duration from a date.
 */
export function calculateDateAdd(inputs: CalculatorInputs): CalcResult {
  const start = parseDate(inputs.startDate);
  if (!start) return { ok: false, error: "Enter a valid start date.", metrics: [] };

  const years = toNumber(inputs.years, 0);
  const months = toNumber(inputs.months, 0);
  const weeks = toNumber(inputs.weeks, 0);
  const days = toNumber(inputs.days, 0);
  const direction = typeof inputs.direction === "string" ? inputs.direction : "add";
  const sign = direction === "subtract" ? -1 : 1;

  const result = new Date(start.getTime());
  result.setFullYear(result.getFullYear() + sign * years);
  result.setMonth(result.getMonth() + sign * months);
  result.setDate(result.getDate() + sign * (weeks * 7 + days));

  if (Number.isNaN(result.getTime())) {
    return {
      ok: false,
      error: "The resulting date is outside the supported range. Try smaller values.",
      metrics: [],
    };
  }

  const iso = result.toISOString().slice(0, 10);
  const friendly = result.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const parts: string[] = [];
  if (years) parts.push(plural(years, "year"));
  if (months) parts.push(plural(months, "month"));
  if (weeks) parts.push(plural(weeks, "week"));
  if (days) parts.push(plural(days, "day"));
  const what = parts.length > 0 ? parts.join(", ") : "0 days";

  return {
    ok: true,
    metrics: [
      { key: "result", label: "Resulting date", kind: "date", value: iso, primary: true },
      { key: "weekday", label: "Day of week", kind: "text", value: result.toLocaleDateString("en-US", { weekday: "long" }) },
    ],
    narrative: `${direction === "subtract" ? "Subtracting" : "Adding"} ${what} ${direction === "subtract" ? "from" : "to"} ${start.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} gives ${friendly}.`,
    data: { result: iso },
  };
}

/**
 * Day of week for any date.
 */
export function calculateDayOfWeek(inputs: CalculatorInputs): CalcResult {
  const date = parseDate(inputs.date);
  if (!date) return { ok: false, error: "Enter a valid date.", metrics: [] };

  const weekday = date.toLocaleDateString("en-US", { weekday: "long" });
  const iso = date.toISOString().slice(0, 10);
  const dayOfYear = Math.floor(
    (Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) -
      Date.UTC(date.getUTCFullYear(), 0, 0)) / MS_PER_DAY,
  );
  const weekNumber = Math.ceil(dayOfYear / 7);

  return {
    ok: true,
    metrics: [
      { key: "weekday", label: "Day of week", kind: "text", value: weekday, primary: true },
      { key: "dayOfYear", label: "Day of year", kind: "number", value: dayOfYear },
      { key: "weekNumber", label: "Approx. week of year", kind: "number", value: weekNumber },
    ],
    narrative: `${date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} falls on a ${weekday}. It is day ${dayOfYear} of the year.`,
    data: { weekday, dayOfYear, weekNumber, date: iso },
  };
}

/**
 * Working/business days between two dates (excludes Saturdays & Sundays).
 */
export function calculateWorkDays(inputs: CalculatorInputs): CalcResult {
  const start = parseDate(inputs.startDate);
  const end = parseDate(inputs.endDate);
  if (!start || !end) return { ok: false, error: "Enter both a start and an end date.", metrics: [] };

  const from = start <= end ? start : end;
  const to = start <= end ? end : start;

  // Weekday count in O(1) instead of walking every day: whole weeks always
  // contribute 5 working days; only the remainder needs day-by-day checks.
  // (A day-by-day loop over a ~100M-day range would freeze the page.)
  const fromMs = Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate());
  const toMs = Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate());
  const totalDays = Math.round((toMs - fromMs) / MS_PER_DAY) + 1;
  const startDay = new Date(fromMs).getUTCDay();
  const fullWeeks = Math.floor(totalDays / 7);
  let count = fullWeeks * 5;
  const remainder = totalDays % 7;
  for (let i = 0; i < remainder; i++) {
    const day = (startDay + i) % 7;
    if (day !== 0 && day !== 6) count += 1;
  }
  const weekendDays = totalDays - count;

  return {
    ok: true,
    metrics: [
      { key: "workDays", label: "Working days", kind: "number", value: count, primary: true },
      { key: "weekendDays", label: "Weekend days", kind: "number", value: weekendDays },
      { key: "totalDays", label: "Total days (inclusive)", kind: "number", value: totalDays },
    ],
    narrative: `Between ${from.toLocaleDateString("en-US", { month: "short", day: "numeric" })} and ${to.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} there are ${plural(count, "working day")} (excluding ${plural(weekendDays, "weekend day")}).`,
    data: { workDays: count, weekendDays, totalDays },
  };
}

/**
 * Time zone converter: convert a date/time from one IANA zone to another.
 */
export function calculateTimeZone(inputs: CalculatorInputs): CalcResult {
  const dateTime = typeof inputs.dateTime === "string" ? inputs.dateTime : "";
  const fromZone = typeof inputs.fromZone === "string" ? inputs.fromZone : "UTC";
  const toZone = typeof inputs.toZone === "string" ? inputs.toZone : "UTC";

  const parsed = Date.parse(dateTime);
  if (!dateTime || Number.isNaN(parsed)) {
    return { ok: false, error: "Enter a valid date and time.", metrics: [] };
  }

  const instant = new Date(parsed);
  const fmt = (zone: string) =>
    new Intl.DateTimeFormat("en-US", {
      timeZone: zone,
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZoneName: "short",
    }).format(instant);

  let fromText: string;
  let toText: string;
  try {
    fromText = fmt(fromZone);
    toText = fmt(toZone);
  } catch {
    return { ok: false, error: "One of the selected time zones is not supported.", metrics: [] };
  }

  return {
    ok: true,
    metrics: [
      { key: "to", label: `Time in ${toZone}`, kind: "text", value: toText, primary: true },
      { key: "from", label: `Time in ${fromZone}`, kind: "text", value: fromText },
    ],
    narrative: `${fromText} in ${fromZone} is ${toText} in ${toZone}.`,
    data: { from: fromText, to: toText },
  };
}
