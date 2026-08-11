import type { CalcResult, CalculatorInputs } from "@/types";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function parseDate(value: unknown): Date | null {
  if (typeof value !== "string") return null;
  const time = Date.parse(value);
  if (Number.isNaN(time)) return null;
  return new Date(time);
}

/** Date duration — calendar difference between two dates. */
export function calculateDateDuration(inputs: CalculatorInputs): CalcResult {
  const start = parseDate(inputs.startDate);
  const end = parseDate(inputs.endDate);

  if (!start || !end) {
    return { ok: false, error: "Enter both a start and an end date.", metrics: [] };
  }

  const diffMs = end.getTime() - start.getTime();
  const totalDays = Math.round(diffMs / MS_PER_DAY);
  const absDays = Math.abs(totalDays);
  const weeks = Math.floor(absDays / 7);
  const remainingDays = absDays % 7;

  // Calendar breakdown (years/months/days) using UTC to avoid DST drift.
  const from = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));
  const to = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()));
  const sign = to >= from ? 1 : -1;
  const earlier = sign === 1 ? from : to;
  const later = sign === 1 ? to : from;

  let years = later.getUTCFullYear() - earlier.getUTCFullYear();
  let months = later.getUTCMonth() - earlier.getUTCMonth();
  let days = later.getUTCDate() - earlier.getUTCDate();
  if (days < 0) {
    months -= 1;
    const prevMonth = new Date(Date.UTC(later.getUTCFullYear(), later.getUTCMonth(), 0));
    days += prevMonth.getUTCDate();
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  return {
    ok: true,
    metrics: [
      { key: "totalDays", label: "Total days", kind: "number", value: totalDays, primary: true },
      { key: "weeks", label: "Weeks", kind: "number", value: weeks },
      { key: "remainingDays", label: "Extra days", kind: "number", value: remainingDays },
      { key: "calYears", label: "Years", kind: "number", value: years },
      { key: "calMonths", label: "Months", kind: "number", value: months },
      { key: "calDays", label: "Days", kind: "number", value: days },
    ],
    narrative:
      `That is ${absDays} days (${weeks} weeks and ${remainingDays} days), or about ${years} years, ${months} months and ${days} days.`,
    data: { totalDays, weeks, remainingDays, years, months, days },
  };
}
