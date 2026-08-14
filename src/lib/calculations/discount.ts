import type { CalcResult, CalculatorInputs } from "@/types";
import { roundMoney, toNumber } from "@/lib/utils/math";
import { OVERFLOW_ERROR } from "./sanitize";

/** Discount — final price after a percentage off, and the amount saved. */
export function calculateDiscount(inputs: CalculatorInputs): CalcResult {
  const original = toNumber(inputs.originalPrice);
  const percentOff = toNumber(inputs.percentOff);

  if (original <= 0) {
    return { ok: false, error: "Enter the original price.", metrics: [] };
  }
  if (percentOff < 0 || percentOff > 100) {
    return { ok: false, error: "Discount must be between 0 and 100%.", metrics: [] };
  }

  const rawSaved = (original * percentOff) / 100;
  if (!Number.isFinite(rawSaved)) {
    return { ok: false, error: OVERFLOW_ERROR, metrics: [] };
  }
  const saved = roundMoney(rawSaved);
  const finalPrice = roundMoney(original - saved);

  return {
    ok: true,
    metrics: [
      { key: "finalPrice", label: "Final price", kind: "currency", value: finalPrice, primary: true },
      { key: "saved", label: "You save", kind: "currency", value: saved, tone: "positive" },
      { key: "percentOff", label: "Discount", kind: "percent", value: percentOff },
    ],
    narrative:
      "With {percentOff} off, you pay {finalPrice} and save {saved}. Estimated calculation based on the values you entered.",
    data: { finalPrice, saved, percentOff, original },
  };
}
