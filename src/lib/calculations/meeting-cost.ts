import type { CalcResult, CalculatorInputs } from "@/types";
import { roundMoney, toNumber } from "@/lib/utils/math";

/** Meeting cost — the fully-loaded cost of a meeting across attendees. */
export function calculateMeetingCost(inputs: CalculatorInputs): CalcResult {
  const attendees = Math.round(toNumber(inputs.attendees));
  const avgHourly = toNumber(inputs.avgHourlyRate);
  const durationMinutes = toNumber(inputs.durationMinutes);

  if (attendees <= 0) {
    return { ok: false, error: "Enter the number of attendees.", metrics: [] };
  }
  if (avgHourly <= 0) {
    return { ok: false, error: "Enter the average hourly rate.", metrics: [] };
  }
  if (durationMinutes <= 0) {
    return { ok: false, error: "Enter the meeting length in minutes.", metrics: [] };
  }

  const hours = durationMinutes / 60;
  const cost = roundMoney(attendees * avgHourly * hours);
  const perMinute = roundMoney(cost / durationMinutes);
  // Annualized if this meeting recurs weekly.
  const weeklyAnnualized = roundMoney(cost * 52);

  return {
    ok: true,
    metrics: [
      { key: "cost", label: "Meeting cost", kind: "currency", value: cost, primary: true },
      { key: "perMinute", label: "Cost per minute", kind: "currency", value: perMinute },
      { key: "weeklyAnnualized", label: "If weekly, per year", kind: "currency", value: weeklyAnnualized },
    ],
    narrative:
      "This meeting costs about {cost} in combined time. If it runs weekly, that is {weeklyAnnualized} per year. Estimated calculation based on the values you entered.",
    data: { cost, perMinute, weeklyAnnualized, attendees, durationMinutes },
  };
}
