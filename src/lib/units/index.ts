/**
 * Centralized unit conversion engine.
 *
 * Factor-based: each unit maps to a base unit via a multiplicative factor.
 * Temperature is special-cased because it requires affine (offset) conversions.
 */

export type Dimension =
  | "length"
  | "mass"
  | "temperature"
  | "area"
  | "volume"
  | "time"
  | "speed"
  | "energy"
  | "power"
  | "pressure"
  | "data";

export interface UnitDef {
  /** Unique key within the dimension. */
  key: string;
  /** Human label, e.g. "Kilometer". */
  label: string;
  /** Short symbol, e.g. "km". */
  symbol: string;
  /** Multiply a value in this unit by `factor` to get the base unit. */
  factor: number;
}

export interface DimensionDef {
  key: Dimension;
  label: string;
  baseUnit: string;
  units: UnitDef[];
}

const L = (key: string, label: string, symbol: string, factor: number): UnitDef => ({
  key,
  label,
  symbol,
  factor,
});

export const DIMENSIONS: DimensionDef[] = [
  {
    key: "length",
    label: "Length",
    baseUnit: "m",
    units: [
      L("mm", "Millimeter", "mm", 0.001),
      L("cm", "Centimeter", "cm", 0.01),
      L("m", "Meter", "m", 1),
      L("km", "Kilometer", "km", 1000),
      L("in", "Inch", "in", 0.0254),
      L("ft", "Foot", "ft", 0.3048),
      L("yd", "Yard", "yd", 0.9144),
      L("mi", "Mile", "mi", 1609.344),
    ],
  },
  {
    key: "mass",
    label: "Mass / Weight",
    baseUnit: "kg",
    units: [
      L("mg", "Milligram", "mg", 0.000001),
      L("g", "Gram", "g", 0.001),
      L("kg", "Kilogram", "kg", 1),
      L("t", "Metric Tonne", "t", 1000),
      L("oz", "Ounce", "oz", 0.028349523125),
      L("lb", "Pound", "lb", 0.45359237),
      L("st", "Stone", "st", 6.35029318),
    ],
  },
  {
    key: "area",
    label: "Area",
    baseUnit: "m²",
    units: [
      L("cm2", "Square Centimeter", "cm²", 0.0001),
      L("m2", "Square Meter", "m²", 1),
      L("km2", "Square Kilometer", "km²", 1_000_000),
      L("ha", "Hectare", "ha", 10_000),
      L("ft2", "Square Foot", "ft²", 0.09290304),
      L("yd2", "Square Yard", "yd²", 0.83612736),
      L("ac", "Acre", "ac", 4046.8564224),
      L("mi2", "Square Mile", "mi²", 2_589_988.110336),
    ],
  },
  {
    key: "volume",
    label: "Volume",
    baseUnit: "L",
    units: [
      L("ml", "Milliliter", "mL", 0.001),
      L("l", "Liter", "L", 1),
      L("m3", "Cubic Meter", "m³", 1000),
      L("tsp", "Teaspoon (US)", "tsp", 0.00492892159375),
      L("tbsp", "Tablespoon (US)", "tbsp", 0.01478676478125),
      L("floz", "Fluid Ounce (US)", "fl oz", 0.0295735295625),
      L("cup", "Cup (US)", "cup", 0.2365882365),
      L("pt", "Pint (US)", "pt", 0.473176473),
      L("qt", "Quart (US)", "qt", 0.946352946),
      L("gal", "Gallon (US)", "gal", 3.785411784),
    ],
  },
  {
    key: "time",
    label: "Time",
    baseUnit: "s",
    units: [
      L("ms", "Millisecond", "ms", 0.001),
      L("s", "Second", "s", 1),
      L("min", "Minute", "min", 60),
      L("hr", "Hour", "hr", 3600),
      L("day", "Day", "day", 86400),
      L("wk", "Week", "wk", 604800),
      L("mo", "Month (avg)", "mo", 2_629_746),
      L("yr", "Year", "yr", 31_556_952),
    ],
  },
  {
    key: "speed",
    label: "Speed",
    baseUnit: "m/s",
    units: [
      L("ms", "Meter/second", "m/s", 1),
      L("kmh", "Kilometer/hour", "km/h", 1 / 3.6),
      L("mph", "Mile/hour", "mph", 0.44704),
      L("fts", "Foot/second", "ft/s", 0.3048),
      L("kn", "Knot", "kn", 0.514444),
    ],
  },
  {
    key: "energy",
    label: "Energy",
    baseUnit: "J",
    units: [
      L("j", "Joule", "J", 1),
      L("kj", "Kilojoule", "kJ", 1000),
      L("cal", "Calorie", "cal", 4.184),
      L("kcal", "Kilocalorie", "kcal", 4184),
      L("wh", "Watt-hour", "Wh", 3600),
      L("kwh", "Kilowatt-hour", "kWh", 3_600_000),
      L("btu", "BTU", "BTU", 1055.05585262),
    ],
  },
  {
    key: "power",
    label: "Power",
    baseUnit: "W",
    units: [
      L("w", "Watt", "W", 1),
      L("kw", "Kilowatt", "kW", 1000),
      L("mw", "Megawatt", "MW", 1_000_000),
      L("hp", "Horsepower", "hp", 745.69987158227022),
    ],
  },
  {
    key: "pressure",
    label: "Pressure",
    baseUnit: "Pa",
    units: [
      L("pa", "Pascal", "Pa", 1),
      L("kpa", "Kilopascal", "kPa", 1000),
      L("bar", "Bar", "bar", 100_000),
      L("atm", "Atmosphere", "atm", 101_325),
      L("psi", "PSI", "psi", 6894.757293168),
      L("mmhg", "mmHg", "mmHg", 133.322387415),
    ],
  },
  {
    key: "data",
    label: "Digital Storage",
    baseUnit: "B",
    units: [
      L("bit", "Bit", "bit", 0.125),
      L("b", "Byte", "B", 1),
      L("kb", "Kilobyte", "KB", 1024),
      L("mb", "Megabyte", "MB", 1024 ** 2),
      L("gb", "Gigabyte", "GB", 1024 ** 3),
      L("tb", "Terabyte", "TB", 1024 ** 4),
      L("pb", "Petabyte", "PB", 1024 ** 5),
    ],
  },
];

export function getDimension(key: Dimension): DimensionDef {
  const d = DIMENSIONS.find((x) => x.key === key);
  if (!d) throw new Error(`Unknown dimension: ${key}`);
  return d;
}

export function getUnit(dimension: Dimension, unitKey: string): UnitDef {
  const d = getDimension(dimension);
  const u = d.units.find((x) => x.key === unitKey);
  if (!u) throw new Error(`Unknown unit "${unitKey}" for dimension "${dimension}"`);
  return u;
}

/** Convert temperature between C, F, K. */
export function convertTemperature(value: number, from: string, to: string): number {
  // Normalize to Celsius first.
  let c: number;
  if (from === "c") c = value;
  else if (from === "f") c = (value - 32) * (5 / 9);
  else if (from === "k") c = value - 273.15;
  else throw new Error(`Unknown temperature unit: ${from}`);

  if (to === "c") return c;
  if (to === "f") return c * (9 / 5) + 32;
  if (to === "k") return c + 273.15;
  throw new Error(`Unknown temperature unit: ${to}`);
}

export const TEMPERATURE_UNITS: UnitDef[] = [
  L("c", "Celsius", "°C", 1),
  L("f", "Fahrenheit", "°F", 1),
  L("k", "Kelvin", "K", 1),
];

/**
 * Convert a value between two units of the same dimension.
 * Temperature is handled via affine conversion; everything else is factor-based.
 */
export function convert(
  dimension: Dimension,
  value: number,
  from: string,
  to: string,
): number {
  if (dimension === "temperature") {
    return convertTemperature(value, from, to);
  }
  const fromUnit = getUnit(dimension, from);
  const toUnit = getUnit(dimension, to);
  const base = value * fromUnit.factor;
  return base / toUnit.factor;
}

/** Format a converted number to a sensible precision. */
export function formatConverted(value: number): string {
  if (!Number.isFinite(value)) return "—";
  const abs = Math.abs(value);
  if (abs !== 0 && (abs >= 1e15 || abs < 1e-9)) {
    return value.toExponential(6);
  }
  // Up to 6 significant decimals, trim trailing zeros.
  const rounded = Math.abs(value) >= 1
    ? Number(value.toPrecision(10))
    : Number(value.toPrecision(8));
  return String(rounded);
}
