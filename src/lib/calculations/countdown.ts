import type { CalcResult, CalculatorInputs } from "@/types";

function parseDate(value: unknown): Date | null {
  if (typeof value !== "string") return null;
  const time = Date.parse(value);
  if (Number.isNaN(time)) return null;
  return new Date(time);
}

/** Countdown — time remaining until a future date. */
export function calculateCountdown(inputs: CalculatorInputs): CalcResult {
  const target = parseDate(inputs.targetDate);
  if (!target) {
    return { ok: false, error: "Enter a valid target date.", metrics: [] };
  }

  const now = new Date();
  const diffMs = target.getTime() - now.getTime();
  const totalDays = Math.ceil(diffMs / (24 * 60 * 60 * 1000));

  if (totalDays < 0) {
    const ago = Math.abs(totalDays);
    return {
      ok: true,
      metrics: [
        { key: "daysAgo", label: "Days ago", kind: "number", value: ago, primary: true },
        { key: "status", label: "Status", kind: "text", value: "This date has already passed." },
      ],
      narrative: `This date was ${ago} day${ago === 1 ? "" : "s"} ago.`,
      data: { daysAgo: ago, passed: 1 },
    };
  }

  const weeks = Math.floor(totalDays / 7);
  const days = totalDays % 7;
  const months = Math.floor(totalDays / 30.44);

  return {
    ok: true,
    metrics: [
      { key: "daysRemaining", label: "Days remaining", kind: "number", value: totalDays, primary: true },
      { key: "weeks", label: "Weeks", kind: "number", value: weeks },
      { key: "extraDays", label: "Extra days", kind: "number", value: days },
      { key: "approxMonths", label: "Approx. months", kind: "number", value: months },
    ],
    narrative: `There are ${totalDays} days to go — about ${weeks} weeks and ${days} days.`,
    data: { daysRemaining: totalDays, weeks, days, months, passed: 0 },
  };
}
