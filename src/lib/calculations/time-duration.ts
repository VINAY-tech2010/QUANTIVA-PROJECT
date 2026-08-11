import type { CalcResult, CalculatorInputs } from "@/types";
import {
  formatDuration,
  minutesToDecimalHours,
} from "@/lib/utils/math";
import { timeToMinutes } from "@/lib/validation/validate";

const MINUTES_PER_DAY = 24 * 60;

/**
 * Time duration between two clock times. Supports same-day ranges and ranges
 * that cross midnight (end earlier than start is treated as the next day).
 */
export function calculateTimeDuration(inputs: CalculatorInputs): CalcResult {
  const start = typeof inputs.startTime === "string" ? inputs.startTime : "";
  const end = typeof inputs.endTime === "string" ? inputs.endTime : "";

  const timePattern = /^([01]?\d|2[0-3]):[0-5]\d$/;
  if (!timePattern.test(start) || !timePattern.test(end)) {
    return { ok: false, error: "Enter both a start and an end time (HH:MM).", metrics: [] };
  }

  const startMinutes = timeToMinutes(start);
  let endMinutes = timeToMinutes(end);

  // Crossing midnight: treat an earlier-or-equal end as the following day.
  if (endMinutes <= startMinutes) {
    endMinutes += MINUTES_PER_DAY;
  }

  const totalMinutes = endMinutes - startMinutes;
  const decimalHours = minutesToDecimalHours(totalMinutes);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return {
    ok: true,
    metrics: [
      { key: "duration", label: "Duration", kind: "duration", value: totalMinutes, primary: true },
      { key: "hours", label: "Hours", kind: "number", value: hours },
      { key: "minutes", label: "Minutes", kind: "number", value: minutes },
      { key: "totalMinutes", label: "Total minutes", kind: "number", value: totalMinutes },
      { key: "decimalHours", label: "Decimal hours", kind: "number", value: decimalHours },
    ],
    narrative: `From ${start} to ${end} is ${formatDuration(totalMinutes)} (${decimalHours} hours).`,
    data: { totalMinutes, decimalHours, hours, minutes },
  };
}
