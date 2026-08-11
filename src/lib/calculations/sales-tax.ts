import type { CalcResult, CalculatorInputs } from "@/types";
import { roundMoney, toNumber } from "@/lib/utils/math";

/** Sales tax — tax amount and total price. */
export function calculateSalesTax(inputs: CalculatorInputs): CalcResult {
  const price = toNumber(inputs.price);
  const taxRate = toNumber(inputs.taxRate);

  if (price <= 0) {
    return { ok: false, error: "Enter the price before tax.", metrics: [] };
  }
  if (taxRate < 0) {
    return { ok: false, error: "Tax rate cannot be negative.", metrics: [] };
  }

  const taxAmount = roundMoney((price * taxRate) / 100);
  const total = roundMoney(price + taxAmount);

  return {
    ok: true,
    metrics: [
      { key: "total", label: "Total with tax", kind: "currency", value: total, primary: true },
      { key: "taxAmount", label: "Tax amount", kind: "currency", value: taxAmount },
      { key: "price", label: "Price before tax", kind: "currency", value: price },
    ],
    narrative:
      "At {taxRate} tax, the tax is {taxAmount} and the total is {total}. Estimated calculation based on the values you entered.",
    data: { total, taxAmount, price, taxRate },
  };
}
