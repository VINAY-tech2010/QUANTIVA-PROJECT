import type { CalcResult, CalculatorInputs } from "@/types";
import { allFinite, roundMoney, toNumber } from "@/lib/utils/math";
import { getCurrency } from "@/data/currencies";
import { OVERFLOW_ERROR } from "./sanitize";

/**
 * Manual currency converter.
 *
 * The exchange rate is entered by the user (a manually-provided reference
 * rate), NOT fetched live. The result is amount × rate when converting
 * base → quote at "rate units of quote per 1 unit of base".
 */
export function calculateCurrencyConvert(inputs: CalculatorInputs): CalcResult {
  const amount = toNumber(inputs.amount);
  const from = typeof inputs.from === "string" ? inputs.from : "USD";
  const to = typeof inputs.to === "string" ? inputs.to : "INR";
  const rate = toNumber(inputs.rate);

  if (amount < 0) return { ok: false, error: "Amount cannot be negative.", metrics: [] };
  if (rate <= 0) {
    return { ok: false, error: "Enter an exchange rate greater than zero (units of the target currency per 1 unit of the source).", metrics: [] };
  }

  const fromCur = getCurrency(from);
  const toCur = getCurrency(to);
  const fromSymbol = fromCur?.symbol ?? from;
  const toSymbol = toCur?.symbol ?? to;

  const rawConverted = amount * rate;
  const rawInverse = 1 / rate;
  if (!allFinite(rawConverted, rawInverse)) {
    return { ok: false, error: OVERFLOW_ERROR, metrics: [] };
  }
  const converted = roundMoney(rawConverted);
  const inverse = roundMoney(rawInverse);

  return {
    ok: true,
    metrics: [
      {
        key: "converted",
        label: `${fromSymbol}${amount.toLocaleString("en-US")} ${from} =`,
        kind: "text",
        value: `${toSymbol}${converted.toLocaleString("en-US")} ${to}`,
        primary: true,
      },
      {
        key: "rate",
        label: "Rate used (manual)",
        kind: "text",
        value: `1 ${from} = ${rate} ${to}`,
      },
      {
        key: "inverse",
        label: "Inverse rate",
        kind: "text",
        value: `1 ${to} = ${inverse} ${from}`,
      },
    ],
    narrative: `Using your manually-entered reference rate of 1 ${from} = ${rate} ${to}, ${fromSymbol}${amount.toLocaleString("en-US")} ${from} converts to ${toSymbol}${converted.toLocaleString("en-US")} ${to}. This is a reference calculation, not a live market rate.`,
    data: { converted, rate, amount },
  };
}
