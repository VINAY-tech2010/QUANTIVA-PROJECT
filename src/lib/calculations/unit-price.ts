import type { CalcResult, CalculatorInputs } from "@/types";
import { roundTo, toNumber } from "@/lib/utils/math";
import { OVERFLOW_ERROR } from "./sanitize";

/** Unit price — cost per unit to compare package sizes. */
export function calculateUnitPrice(inputs: CalculatorInputs): CalcResult {
  const price = toNumber(inputs.price);
  const quantity = toNumber(inputs.quantity);

  if (price <= 0) {
    return { ok: false, error: "Enter the price.", metrics: [] };
  }
  if (quantity <= 0) {
    return { ok: false, error: "Enter the quantity or size.", metrics: [] };
  }

  const rawUnitPrice = price / quantity;
  if (!Number.isFinite(rawUnitPrice)) {
    return { ok: false, error: OVERFLOW_ERROR, metrics: [] };
  }
  const unitPrice = roundTo(rawUnitPrice, 4);

  return {
    ok: true,
    metrics: [
      { key: "unitPrice", label: "Price per unit", kind: "currency", value: unitPrice, primary: true },
      { key: "price", label: "Total price", kind: "currency", value: price },
      { key: "quantity", label: "Quantity", kind: "number", value: quantity },
    ],
    narrative:
      "This works out to {unitPrice} per unit. Use it to compare against other package sizes.",
    data: { unitPrice, price, quantity },
  };
}
