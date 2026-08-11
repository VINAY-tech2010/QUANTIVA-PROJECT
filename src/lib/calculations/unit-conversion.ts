import type { CalcResult, CalculatorInputs } from "@/types";
import { convert, formatConverted, getDimension, TEMPERATURE_UNITS, type Dimension } from "@/lib/units";

export function calculateUnitConversion(
  dimension: Dimension,
  inputs: CalculatorInputs,
): CalcResult {
  const value = Number(inputs.value);
  const from = String(inputs.from);
  const to = String(inputs.to);

  if (!Number.isFinite(value)) {
    return { ok: false, error: "Enter a valid number to convert.", metrics: [] };
  }

  const dim = getDimension(dimension);
  const units = dimension === "temperature" ? TEMPERATURE_UNITS : dim.units;
  const fromUnit = units.find((u) => u.key === from);
  const toUnit = units.find((u) => u.key === to);
  if (!fromUnit || !toUnit) {
    return { ok: false, error: "Select valid units to convert between.", metrics: [] };
  }

  const result = convert(dimension, value, from, to);
  const formatted = formatConverted(result);

  return {
    ok: true,
    metrics: [
      {
        key: "result",
        label: `${value} ${fromUnit.symbol} =`,
        kind: "text",
        value: `${formatted} ${toUnit.symbol}`,
        primary: true,
      },
      {
        key: "reverse",
        label: `1 ${toUnit.symbol} in ${fromUnit.symbol}`,
        kind: "text",
        value: `${formatConverted(convert(dimension, 1, to, from))} ${fromUnit.symbol}`,
      },
    ],
    narrative: `${value} ${fromUnit.label} (${fromUnit.symbol}) is equal to ${formatted} ${toUnit.label} (${toUnit.symbol}).`,
  };
}
