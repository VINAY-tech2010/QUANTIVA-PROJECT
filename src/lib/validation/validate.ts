import type { CalculatorField, CalculatorInputs } from "@/types";
import { toNumber } from "@/lib/utils/math";

export interface FieldError {
  field: string;
  message: string;
}

/**
 * Validate raw inputs against a calculator's field definitions.
 * Returns a list of user-facing errors (empty when valid).
 */
export function validateInputs(
  fields: CalculatorField[],
  inputs: CalculatorInputs,
): FieldError[] {
  const errors: FieldError[] = [];

  for (const field of fields) {
    const raw = inputs[field.key];
    const isEmpty =
      raw === undefined || raw === null || (typeof raw === "string" && raw.trim() === "");

    if (isEmpty) {
      if (field.required) {
        errors.push({ field: field.key, message: `${field.label} is required.` });
      }
      continue;
    }

    switch (field.type) {
      case "currency":
      case "number":
      case "percent":
      case "integer": {
        const value = toNumber(raw, Number.NaN);
        if (!Number.isFinite(value)) {
          errors.push({ field: field.key, message: `${field.label} must be a number.` });
          break;
        }
        if (field.type === "integer" && !Number.isInteger(value)) {
          errors.push({ field: field.key, message: `${field.label} must be a whole number.` });
        }
        if (field.min !== undefined && value < field.min) {
          errors.push({
            field: field.key,
            message: `${field.label} must be at least ${field.min}.`,
          });
        }
        if (field.max !== undefined && value > field.max) {
          errors.push({
            field: field.key,
            message: `${field.label} must be at most ${field.max}.`,
          });
        }
        break;
      }
      case "time": {
        if (typeof raw !== "string" || !/^([01]?\d|2[0-3]):[0-5]\d$/.test(raw)) {
          errors.push({
            field: field.key,
            message: `${field.label} must be a valid time (HH:MM).`,
          });
        }
        break;
      }
      case "date": {
        if (typeof raw !== "string" || Number.isNaN(Date.parse(raw))) {
          errors.push({
            field: field.key,
            message: `${field.label} must be a valid date.`,
          });
        }
        break;
      }
      case "datetime": {
        if (typeof raw !== "string" || Number.isNaN(Date.parse(raw))) {
          errors.push({
            field: field.key,
            message: `${field.label} must be a valid date and time.`,
          });
        }
        break;
      }
      case "select": {
        if (
          field.options &&
          !field.options.some((o) => o.value === raw)
        ) {
          errors.push({
            field: field.key,
            message: `${field.label} has an invalid selection.`,
          });
        }
        break;
      }
      case "text":
      case "textarea":
        break;
    }
  }

  return errors;
}

/** Parse a "HH:MM" time string into minutes since midnight. */
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map((part) => Number.parseInt(part, 10));
  return h * 60 + m;
}
