import type { CalcResult, CalculatorInputs } from "@/types";
import { roundTo, toNumber } from "@/lib/utils/math";

/**
 * Body Mass Index: BMI = weight(kg) / height(m)².
 * Reference estimate only — not medical advice.
 */
export function calculateBmi(inputs: CalculatorInputs): CalcResult {
  const weightKg = toNumber(inputs.weightKg);
  const heightCm = toNumber(inputs.heightCm);

  if (weightKg <= 0) return { ok: false, error: "Weight must be greater than zero.", metrics: [] };
  if (heightCm <= 0) return { ok: false, error: "Height must be greater than zero.", metrics: [] };

  const heightM = heightCm / 100;
  const bmi = roundTo(weightKg / (heightM * heightM), 1);

  let category: string;
  let tone: "neutral" | "positive" | "negative" | "warning";
  if (bmi < 18.5) { category = "Underweight"; tone = "warning"; }
  else if (bmi < 25) { category = "Healthy weight"; tone = "positive"; }
  else if (bmi < 30) { category = "Overweight"; tone = "warning"; }
  else { category = "Obese"; tone = "negative"; }

  // Healthy weight range for this height (BMI 18.5–24.9).
  const minHealthy = roundTo(18.5 * heightM * heightM, 1);
  const maxHealthy = roundTo(24.9 * heightM * heightM, 1);

  return {
    ok: true,
    metrics: [
      { key: "bmi", label: "Your BMI", kind: "number", value: bmi, primary: true, tone },
      { key: "category", label: "Category", kind: "text", value: category },
      { key: "healthyRange", label: "Healthy weight range", kind: "text", value: `${minHealthy}–${maxHealthy} kg` },
    ],
    narrative: `A weight of ${weightKg} kg and height of ${heightCm} cm gives a BMI of ${bmi}, which is in the "${category}" range. For your height, a healthy weight is roughly ${minHealthy}–${maxHealthy} kg. BMI is a screening estimate, not a diagnosis.`,
    data: { bmi, minHealthy, maxHealthy },
  };
}

/**
 * Daily calorie needs (TDEE) via Mifflin-St Jeor, plus macros.
 */
export function calculateCalories(inputs: CalculatorInputs): CalcResult {
  const weightKg = toNumber(inputs.weightKg);
  const heightCm = toNumber(inputs.heightCm);
  const age = toNumber(inputs.age);
  const sex = typeof inputs.sex === "string" ? inputs.sex : "male";
  const activity = typeof inputs.activity === "string" ? inputs.activity : "moderate";

  if (weightKg <= 0 || heightCm <= 0 || age <= 0) {
    return { ok: false, error: "Weight, height and age must all be greater than zero.", metrics: [] };
  }

  // Mifflin-St Jeor BMR.
  const bmr = sex === "female"
    ? 10 * weightKg + 6.25 * heightCm - 5 * age - 161
    : 10 * weightKg + 6.25 * heightCm - 5 * age + 5;

  const activityFactor =
    activity === "sedentary" ? 1.2
    : activity === "light" ? 1.375
    : activity === "moderate" ? 1.55
    : activity === "active" ? 1.725
    : 1.9; // very active

  const tdee = Math.round(bmr * activityFactor);
  const maintain = tdee;
  const lose = Math.round(tdee - 500);
  const gain = Math.round(tdee + 300);

  return {
    ok: true,
    metrics: [
      { key: "maintain", label: "Maintain weight", kind: "number", value: maintain, primary: true },
      { key: "lose", label: "Lose ~0.5 kg/week", kind: "number", value: lose },
      { key: "gain", label: "Gain ~0.25 kg/week", kind: "number", value: gain },
      { key: "bmr", label: "Basal metabolic rate", kind: "number", value: Math.round(bmr) },
    ],
    narrative: `To maintain your current weight you need about ${maintain.toLocaleString("en-US")} kcal/day. To lose weight steadily aim for ~${lose.toLocaleString("en-US")} kcal/day; to gain, ~${gain.toLocaleString("en-US")} kcal/day. These are estimates based on the Mifflin-St Jeor equation.`,
    data: { maintain, lose, gain, bmr: Math.round(bmr) },
  };
}

/**
 * Body fat estimate (US Navy method, simplified using BMI-based estimate).
 * Uses the Deurenberg formula: BF% = 1.20·BMI + 0.23·age − 10.8·sex − 5.4
 * where sex = 1 for male, 0 for female.
 */
export function calculateBodyFat(inputs: CalculatorInputs): CalcResult {
  const weightKg = toNumber(inputs.weightKg);
  const heightCm = toNumber(inputs.heightCm);
  const age = toNumber(inputs.age);
  const sex = typeof inputs.sex === "string" ? inputs.sex : "male";

  if (weightKg <= 0 || heightCm <= 0 || age <= 0) {
    return { ok: false, error: "Weight, height and age must all be greater than zero.", metrics: [] };
  }

  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);
  const sexFactor = sex === "female" ? 0 : 1;
  const bf = roundTo(1.2 * bmi + 0.23 * age - 10.8 * sexFactor - 5.4, 1);

  return {
    ok: true,
    metrics: [
      { key: "bodyFat", label: "Estimated body fat", kind: "percent", value: bf, primary: true },
      { key: "bmi", label: "BMI", kind: "number", value: roundTo(bmi, 1) },
    ],
    narrative: `Your estimated body fat is about ${bf}%. This is a rough estimate derived from your BMI and age — for an accurate measurement use calipers, DEXA, or a professional assessment.`,
    data: { bodyFat: bf, bmi: roundTo(bmi, 1) },
  };
}

/**
 * Running/walking pace: time per unit distance, plus speed.
 */
export function calculatePace(inputs: CalculatorInputs): CalcResult {
  const distance = toNumber(inputs.distance);
  const unit = typeof inputs.unit === "string" ? inputs.unit : "km";
  const hours = toNumber(inputs.hours, 0);
  const minutes = toNumber(inputs.minutes, 0);
  const seconds = toNumber(inputs.seconds, 0);

  if (distance <= 0) return { ok: false, error: "Distance must be greater than zero.", metrics: [] };
  const totalMinutes = hours * 60 + minutes + seconds / 60;
  if (totalMinutes <= 0) return { ok: false, error: "Enter a total time greater than zero.", metrics: [] };

  const pacePerUnit = totalMinutes / distance; // minutes per km or mile
  // Round the total pace to whole seconds, then carry overflow into minutes
  // so a pace like 1:59.6 never displays as "2:60".
  const totalPaceSeconds = Math.round(pacePerUnit * 60);
  const paceMin = Math.floor(totalPaceSeconds / 60);
  const paceSec = totalPaceSeconds % 60;
  const speed = roundTo(distance / (totalMinutes / 60), 2); // units per hour

  const label = unit === "mi" ? "mile" : "km";
  return {
    ok: true,
    metrics: [
      { key: "pace", label: `Pace (per ${label})`, kind: "text", value: `${paceMin}:${String(paceSec).padStart(2, "0")} /${label}`, primary: true },
      { key: "speed", label: "Speed", kind: "text", value: `${speed} ${label}/hr` },
      { key: "totalTime", label: "Total time", kind: "text", value: `${hours > 0 ? `${hours}h ` : ""}${minutes}m ${Math.round(seconds)}s` },
    ],
    narrative: `Covering ${distance} ${label} in ${totalMinutes.toFixed(1)} minutes is a pace of ${paceMin}:${String(paceSec).padStart(2, "0")} per ${label} — an average speed of ${speed} ${label} per hour.`,
    data: { pacePerUnit: roundTo(pacePerUnit, 3), speed },
  };
}
