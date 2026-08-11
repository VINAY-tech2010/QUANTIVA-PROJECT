import type { CalcResult, CalculatorInputs } from "@/types";

function parseDate(value: unknown): Date | null {
  if (typeof value !== "string") return null;
  const time = Date.parse(value);
  if (Number.isNaN(time)) return null;
  return new Date(time);
}

/** Age — exact age from a date of birth as of a reference date (default today). */
export function calculateAge(inputs: CalculatorInputs): CalcResult {
  const dob = parseDate(inputs.birthDate);
  if (!dob) {
    return { ok: false, error: "Enter a valid date of birth.", metrics: [] };
  }

  const asOf = parseDate(inputs.asOfDate) ?? new Date();
  if (dob > asOf) {
    return { ok: false, error: "Date of birth must be in the past.", metrics: [] };
  }

  let years = asOf.getFullYear() - dob.getFullYear();
  let months = asOf.getMonth() - dob.getMonth();
  let days = asOf.getDate() - dob.getDate();
  if (days < 0) {
    months -= 1;
    const prevMonth = new Date(asOf.getFullYear(), asOf.getMonth(), 0);
    days += prevMonth.getDate();
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  const totalDays = Math.floor((asOf.getTime() - dob.getTime()) / (24 * 60 * 60 * 1000));
  const totalWeeks = Math.floor(totalDays / 7);
  const totalMonths = years * 12 + months;

  return {
    ok: true,
    metrics: [
      { key: "age", label: "Age", kind: "text", value: `${years} years, ${months} months, ${days} days`, primary: true },
      { key: "years", label: "Years", kind: "number", value: years },
      { key: "totalMonths", label: "Total months", kind: "number", value: totalMonths },
      { key: "totalWeeks", label: "Total weeks", kind: "number", value: totalWeeks },
      { key: "totalDays", label: "Total days", kind: "number", value: totalDays },
    ],
    narrative: `You are ${years} years, ${months} months and ${days} days old — ${totalDays} days in total.`,
    data: { years, months, days, totalMonths, totalWeeks, totalDays },
  };
}
