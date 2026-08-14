import type { CalcResult, CalculatorInputs } from "@/types";
import { roundTo, toNumber } from "@/lib/utils/math";

/** Greatest common divisor via Euclidean algorithm. */
function gcd(a: number, b: number): number {
  let x = Math.abs(Math.round(a));
  let y = Math.abs(Math.round(b));
  while (y !== 0) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x;
}

/** Least common multiple. */
function lcm(a: number, b: number): number {
  const g = gcd(a, b);
  if (g === 0) return 0;
  return Math.abs(Math.round(a) * Math.round(b)) / g;
}

/** GCD & LCM of two whole numbers. */
export function calculateGcdLcm(inputs: CalculatorInputs): CalcResult {
  const a = toNumber(inputs.a);
  const b = toNumber(inputs.b);

  if (!Number.isInteger(a) || !Number.isInteger(b)) {
    return { ok: false, error: "Enter two whole numbers.", metrics: [] };
  }
  if (a === 0 && b === 0) {
    return { ok: false, error: "At least one number must be non-zero.", metrics: [] };
  }

  const g = gcd(a, b);
  const l = lcm(a, b);

  return {
    ok: true,
    metrics: [
      { key: "gcd", label: `GCD of ${a} and ${b}`, kind: "number", value: g, primary: true },
      { key: "lcm", label: `LCM of ${a} and ${b}`, kind: "number", value: l },
    ],
    narrative: `The greatest common divisor of ${a} and ${b} is ${g}, and the least common multiple is ${l}.`,
    data: { gcd: g, lcm: l },
  };
}

/** Prime factorization of a whole number. */
export function calculatePrimeFactors(inputs: CalculatorInputs): CalcResult {
  const n = toNumber(inputs.n);

  if (!Number.isInteger(n) || n < 2) {
    return { ok: false, error: "Enter a whole number greater than 1.", metrics: [] };
  }
  if (n > 1e12) {
    return { ok: false, error: "Enter a number below 1 trillion for fast factorization.", metrics: [] };
  }

  const factors: number[] = [];
  let remaining = n;
  for (let p = 2; p * p <= remaining; p += p === 2 ? 1 : 2) {
    while (remaining % p === 0) {
      factors.push(p);
      remaining /= p;
    }
  }
  if (remaining > 1) factors.push(remaining);

  const isPrime = factors.length === 1 && factors[0] === n;
  const expression = factors.join(" × ");

  return {
    ok: true,
    metrics: [
      {
        key: "factors",
        label: `Prime factors of ${n}`,
        kind: "text",
        value: isPrime ? `${n} (prime)` : expression,
        primary: true,
      },
      {
        key: "count",
        label: "Number of prime factors",
        kind: "number",
        value: factors.length,
      },
    ],
    narrative: isPrime
      ? `${n} is a prime number — its only factors are 1 and itself.`
      : `${n} = ${expression}. It has ${factors.length} prime factors.`,
    data: { factors: expression, factorCount: factors.length, isPrime: isPrime ? 1 : 0 },
  };
}

/** Quadratic equation solver: ax² + bx + c = 0. */
export function calculateQuadratic(inputs: CalculatorInputs): CalcResult {
  const a = toNumber(inputs.a);
  const b = toNumber(inputs.b);
  const c = toNumber(inputs.c);

  if (a === 0) {
    return { ok: false, error: "Coefficient 'a' cannot be zero for a quadratic equation.", metrics: [] };
  }

  const discriminant = b * b - 4 * a * c;
  const d = roundTo(discriminant, 6);

  if (discriminant > 0) {
    const r1 = roundTo((-b + Math.sqrt(discriminant)) / (2 * a), 6);
    const r2 = roundTo((-b - Math.sqrt(discriminant)) / (2 * a), 6);
    return {
      ok: true,
      metrics: [
        { key: "root1", label: "Root 1 (x₁)", kind: "number", value: r1, primary: true },
        { key: "root2", label: "Root 2 (x₂)", kind: "number", value: r2, primary: true },
        { key: "discriminant", label: "Discriminant (b² − 4ac)", kind: "number", value: d },
      ],
      narrative: `Two real solutions: x = ${r1} and x = ${r2}. The discriminant is ${d} (positive, so two distinct real roots).`,
      data: { root1: r1, root2: r2, discriminant: d, nature: "two-real" },
    };
  }

  if (discriminant === 0) {
    const r = roundTo(-b / (2 * a), 6);
    return {
      ok: true,
      metrics: [
        { key: "root", label: "Repeated root (x)", kind: "number", value: r, primary: true },
        { key: "discriminant", label: "Discriminant (b² − 4ac)", kind: "number", value: d },
      ],
      narrative: `One repeated real solution: x = ${r}. The discriminant is 0, so both roots are equal.`,
      data: { root: r, discriminant: d, nature: "repeated" },
    };
  }

  // Complex roots
  const real = roundTo(-b / (2 * a), 6);
  const imag = roundTo(Math.sqrt(-discriminant) / (2 * Math.abs(a)), 6);
  return {
    ok: true,
    metrics: [
      { key: "root1", label: "Root 1 (x₁)", kind: "text", value: `${real} + ${imag}i`, primary: true },
      { key: "root2", label: "Root 2 (x₂)", kind: "text", value: `${real} − ${imag}i`, primary: true },
      { key: "discriminant", label: "Discriminant (b² − 4ac)", kind: "number", value: d },
    ],
    narrative: `No real solutions — the discriminant is ${d} (negative). The two complex roots are ${real} ± ${imag}i.`,
    data: { real, imag, discriminant: d, nature: "complex" },
  };
}

/** Exponent / power calculator: base^exponent. */
export function calculatePower(inputs: CalculatorInputs): CalcResult {
  const base = toNumber(inputs.base);
  const exponent = toNumber(inputs.exponent);

  if (base === 0 && exponent < 0) {
    return { ok: false, error: "Zero cannot be raised to a negative power.", metrics: [] };
  }

  const result = Math.pow(base, exponent);
  if (!Number.isFinite(result)) {
    return { ok: false, error: "The result is too large to represent.", metrics: [] };
  }

  const rounded = roundTo(result, 8);
  return {
    ok: true,
    metrics: [
      { key: "result", label: `${base}^${exponent}`, kind: "number", value: rounded, primary: true },
    ],
    narrative: `${base} raised to the power of ${exponent} is ${rounded}.`,
    data: { result: rounded },
  };
}

/** Logarithm calculator with selectable base. */
export function calculateLogarithm(inputs: CalculatorInputs): CalcResult {
  const value = toNumber(inputs.value);
  const base = toNumber(inputs.base, 10);

  if (value <= 0) {
    return { ok: false, error: "The value must be greater than zero.", metrics: [] };
  }
  if (base <= 0 || base === 1) {
    return { ok: false, error: "The base must be positive and not equal to 1.", metrics: [] };
  }

  const result = roundTo(Math.log(value) / Math.log(base), 8);
  return {
    ok: true,
    metrics: [
      { key: "result", label: `log base ${base} of ${value}`, kind: "number", value: result, primary: true },
    ],
    narrative: `The logarithm base ${base} of ${value} is ${result}. This means ${base}^${result} ≈ ${value}.`,
    data: { result },
  };
}

/** Factorial calculator (n!). */
export function calculateFactorial(inputs: CalculatorInputs): CalcResult {
  const n = toNumber(inputs.n);

  if (!Number.isInteger(n) || n < 0) {
    return { ok: false, error: "Enter a non-negative whole number.", metrics: [] };
  }
  if (n > 170) {
    return { ok: false, error: "Factorials above 170! overflow — enter 170 or less.", metrics: [] };
  }

  let result = 1;
  for (let i = 2; i <= n; i++) result *= i;

  return {
    ok: true,
    metrics: [
      { key: "result", label: `${n}!`, kind: "number", value: result, primary: true },
    ],
    narrative: `${n}! (${n} factorial) is ${result.toLocaleString("en-US")}.`,
    data: { result },
  };
}

/** Combination & permutation (nCr / nPr). */
export function calculateCombinatorics(inputs: CalculatorInputs): CalcResult {
  const n = toNumber(inputs.n);
  const r = toNumber(inputs.r);

  if (!Number.isInteger(n) || !Number.isInteger(r) || n < 0 || r < 0) {
    return { ok: false, error: "Enter non-negative whole numbers for n and r.", metrics: [] };
  }
  if (r > n) {
    return { ok: false, error: "r cannot be greater than n.", metrics: [] };
  }
  if (n > 1000) {
    return { ok: false, error: "Enter n of 1000 or less.", metrics: [] };
  }

  // nCr = n! / (r! (n-r)!) computed multiplicatively to avoid overflow.
  let ncr = 1;
  for (let i = 0; i < r; i++) {
    ncr = (ncr * (n - i)) / (i + 1);
  }
  ncr = Math.round(ncr);

  // nPr = n! / (n-r)!
  let npr = 1;
  for (let i = 0; i < r; i++) {
    npr *= n - i;
    if (!Number.isFinite(npr)) {
      return {
        ok: false,
        error: "The number of permutations is too large to calculate precisely.",
        metrics: [],
      };
    }
  }

  return {
    ok: true,
    metrics: [
      { key: "ncr", label: `C(${n}, ${r}) combinations`, kind: "number", value: ncr, primary: true },
      { key: "npr", label: `P(${n}, ${r}) permutations`, kind: "number", value: npr },
    ],
    narrative: `There are ${ncr.toLocaleString("en-US")} ways to choose ${r} items from ${n} (order doesn't matter), and ${npr.toLocaleString("en-US")} ordered arrangements (permutations).`,
    data: { ncr, npr },
  };
}
