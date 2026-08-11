import type { CalcResult, CalculatorInputs } from "@/types";
import { roundMoney, toNumber } from "@/lib/utils/math";

/** Tip — tip amount, total bill, and optional split between people. */
export function calculateTip(inputs: CalculatorInputs): CalcResult {
  const bill = toNumber(inputs.billAmount);
  const tipPercent = toNumber(inputs.tipPercent);
  const people = Math.max(1, Math.round(toNumber(inputs.people, 1)));

  if (bill <= 0) {
    return { ok: false, error: "Enter the bill amount.", metrics: [] };
  }
  if (tipPercent < 0) {
    return { ok: false, error: "Tip percentage cannot be negative.", metrics: [] };
  }

  const tipAmount = roundMoney((bill * tipPercent) / 100);
  const total = roundMoney(bill + tipAmount);
  const perPerson = roundMoney(total / people);

  const metrics: CalcResult["metrics"] = [
    { key: "total", label: "Total with tip", kind: "currency", value: total, primary: true },
    { key: "tipAmount", label: "Tip amount", kind: "currency", value: tipAmount },
  ];
  if (people > 1) {
    metrics.push({ key: "perPerson", label: "Per person", kind: "currency", value: perPerson });
  }

  return {
    ok: true,
    metrics,
    narrative:
      people > 1
        ? "A {tipPercent} tip adds {tipAmount}, bringing the total to {total} — about {perPerson} each."
        : "A {tipPercent} tip adds {tipAmount}, bringing the total to {total}.",
    data: { total, tipAmount, perPerson, people, tipPercent },
  };
}
