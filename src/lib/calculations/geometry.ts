import type { CalcResult, CalculatorInputs } from "@/types";
import { roundTo, toNumber } from "@/lib/utils/math";

/** Geometry: area & perimeter/circumference for common shapes. */
export function calculateGeometry(inputs: CalculatorInputs): CalcResult {
  const shape = typeof inputs.shape === "string" ? inputs.shape : "square";

  if (shape === "square") {
    const side = toNumber(inputs.a);
    if (side <= 0) return { ok: false, error: "Side length must be greater than zero.", metrics: [] };
    const area = roundTo(side * side, 4);
    const perimeter = roundTo(4 * side, 4);
    return {
      ok: true,
      metrics: [
        { key: "area", label: "Area", kind: "number", value: area, primary: true },
        { key: "perimeter", label: "Perimeter", kind: "number", value: perimeter },
      ],
      narrative: `A square with side ${side} has an area of ${area} square units and a perimeter of ${perimeter} units.`,
      data: { area, perimeter },
    };
  }

  if (shape === "rectangle") {
    const a = toNumber(inputs.a);
    const b = toNumber(inputs.b);
    if (a <= 0 || b <= 0) return { ok: false, error: "Length and width must be greater than zero.", metrics: [] };
    const area = roundTo(a * b, 4);
    const perimeter = roundTo(2 * (a + b), 4);
    return {
      ok: true,
      metrics: [
        { key: "area", label: "Area", kind: "number", value: area, primary: true },
        { key: "perimeter", label: "Perimeter", kind: "number", value: perimeter },
      ],
      narrative: `A rectangle of ${a} × ${b} has an area of ${area} square units and a perimeter of ${perimeter} units.`,
      data: { area, perimeter },
    };
  }

  if (shape === "circle") {
    const r = toNumber(inputs.a);
    if (r <= 0) return { ok: false, error: "Radius must be greater than zero.", metrics: [] };
    const area = roundTo(Math.PI * r * r, 4);
    const circumference = roundTo(2 * Math.PI * r, 4);
    return {
      ok: true,
      metrics: [
        { key: "area", label: "Area", kind: "number", value: area, primary: true },
        { key: "circumference", label: "Circumference", kind: "number", value: circumference },
      ],
      narrative: `A circle with radius ${r} has an area of ${area} square units and a circumference of ${circumference} units.`,
      data: { area, circumference },
    };
  }

  // triangle: base & height for area, three sides for perimeter
  const base = toNumber(inputs.a);
  const height = toNumber(inputs.b);
  if (base <= 0 || height <= 0) return { ok: false, error: "Base and height must be greater than zero.", metrics: [] };
  const area = roundTo((base * height) / 2, 4);
  return {
    ok: true,
    metrics: [{ key: "area", label: "Area", kind: "number", value: area, primary: true }],
    narrative: `A triangle with base ${base} and height ${height} has an area of ${area} square units.`,
    data: { area },
  };
}

/** Trigonometry: sin/cos/tan of an angle in degrees or radians. */
export function calculateTrig(inputs: CalculatorInputs): CalcResult {
  const angle = toNumber(inputs.angle);
  const unit = typeof inputs.unit === "string" ? inputs.unit : "deg";

  const radians = unit === "deg" ? (angle * Math.PI) / 180 : angle;
  const sin = roundTo(Math.sin(radians), 6);
  const cos = roundTo(Math.cos(radians), 6);
  const tanRaw = Math.tan(radians);
  const tan = Math.abs(cos) < 1e-10 ? "undefined" : roundTo(tanRaw, 6);

  const metrics = [
    { key: "sin", label: `sin(${angle}°)`, kind: "number" as const, value: sin, primary: true },
    { key: "cos", label: `cos(${angle}°)`, kind: "number" as const, value: cos },
  ];
  if (typeof tan === "number") {
    metrics.push({ key: "tan", label: `tan(${angle}°)`, kind: "number" as const, value: tan });
  }

  return {
    ok: true,
    metrics,
    narrative: `For an angle of ${angle}${unit === "deg" ? "°" : " rad"}: sin = ${sin}, cos = ${cos}${typeof tan === "number" ? `, tan = ${tan}` : ", tan is undefined (cos = 0)"}.`,
    data: { sin, cos, tan },
  };
}

/** Pythagorean theorem: solve for the missing side of a right triangle. */
export function calculatePythagorean(inputs: CalculatorInputs): CalcResult {
  const solve = typeof inputs.solve === "string" ? inputs.solve : "c";
  const a = toNumber(inputs.a);
  const b = toNumber(inputs.b);

  if (solve === "c") {
    if (a <= 0 || b <= 0) return { ok: false, error: "Both legs must be greater than zero.", metrics: [] };
    const c = roundTo(Math.sqrt(a * a + b * b), 6);
    return {
      ok: true,
      metrics: [{ key: "c", label: "Hypotenuse (c)", kind: "number", value: c, primary: true }],
      narrative: `With legs a = ${a} and b = ${b}, the hypotenuse c = √(${a}² + ${b}²) = ${c}.`,
      data: { c },
    };
  }

  // solve for a leg: a = sqrt(c^2 - b^2)
  const c = toNumber(inputs.c);
  const leg = toNumber(inputs.b);
  if (c <= 0 || leg <= 0) return { ok: false, error: "Sides must be greater than zero.", metrics: [] };
  if (leg >= c) return { ok: false, error: "The hypotenuse must be the longest side.", metrics: [] };
  const missing = roundTo(Math.sqrt(c * c - leg * leg), 6);
  return {
    ok: true,
    metrics: [{ key: "a", label: "Missing leg (a)", kind: "number", value: missing, primary: true }],
    narrative: `With hypotenuse c = ${c} and leg b = ${leg}, the missing leg a = √(${c}² − ${leg}²) = ${missing}.`,
    data: { a: missing },
  };
}
