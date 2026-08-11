import type { CalcResult, CalculatorInputs } from "@/types";
import { roundTo, toNumber } from "@/lib/utils/math";

/**
 * Ohm's law: V = I × R. Solve for the missing quantity.
 */
export function calculateOhmsLaw(inputs: CalculatorInputs): CalcResult {
  const solve = typeof inputs.solve === "string" ? inputs.solve : "v";
  const a = toNumber(inputs.a); // first known
  const b = toNumber(inputs.b); // second known

  if (a <= 0 || b <= 0) {
    return { ok: false, error: "Enter the two known values (both greater than zero).", metrics: [] };
  }

  if (solve === "v") {
    // a = current (A), b = resistance (Ω)
    const v = roundTo(a * b, 4);
    return {
      ok: true,
      metrics: [{ key: "v", label: "Voltage", kind: "text", value: `${v} V`, primary: true }],
      narrative: `With a current of ${a} A through a resistance of ${b} Ω, the voltage is ${v} volts (V = I × R).`,
      data: { v },
    };
  }
  if (solve === "i") {
    // a = voltage (V), b = resistance (Ω)
    const i = roundTo(a / b, 4);
    return {
      ok: true,
      metrics: [{ key: "i", label: "Current", kind: "text", value: `${i} A`, primary: true }],
      narrative: `With ${a} V across a resistance of ${b} Ω, the current is ${i} amps (I = V ÷ R).`,
      data: { i },
    };
  }
  // solve === "r": a = voltage (V), b = current (A)
  const r = roundTo(a / b, 4);
  return {
    ok: true,
    metrics: [{ key: "r", label: "Resistance", kind: "text", value: `${r} Ω`, primary: true }],
    narrative: `With ${a} V and a current of ${b} A, the resistance is ${r} ohms (R = V ÷ I).`,
    data: { r },
  };
}

/**
 * Kinetic energy: KE = ½ m v².
 */
export function calculateKineticEnergy(inputs: CalculatorInputs): CalcResult {
  const mass = toNumber(inputs.mass);
  const velocity = toNumber(inputs.velocity);

  if (mass <= 0) return { ok: false, error: "Mass must be greater than zero.", metrics: [] };
  if (velocity < 0) return { ok: false, error: "Velocity cannot be negative.", metrics: [] };

  const ke = roundTo(0.5 * mass * velocity * velocity, 4);

  return {
    ok: true,
    metrics: [
      { key: "ke", label: "Kinetic energy", kind: "text", value: `${ke} J`, primary: true },
      { key: "mass", label: "Mass", kind: "text", value: `${mass} kg` },
      { key: "velocity", label: "Velocity", kind: "text", value: `${velocity} m/s` },
    ],
    narrative: `An object of ${mass} kg moving at ${velocity} m/s has a kinetic energy of ${ke} joules (KE = ½ × m × v²).`,
    data: { ke },
  };
}

/**
 * Speed / distance / time: solve for the missing quantity.
 */
export function calculateSpeedDistanceTime(inputs: CalculatorInputs): CalcResult {
  const solve = typeof inputs.solve === "string" ? inputs.solve : "speed";
  const a = toNumber(inputs.a);
  const b = toNumber(inputs.b);

  if (a <= 0 || b <= 0) {
    return { ok: false, error: "Enter the two known values (both greater than zero).", metrics: [] };
  }

  if (solve === "speed") {
    // a = distance, b = time
    const speed = roundTo(a / b, 4);
    return {
      ok: true,
      metrics: [{ key: "speed", label: "Speed", kind: "number", value: speed, primary: true }],
      narrative: `Travelling ${a} units in ${b} units of time gives a speed of ${speed} (speed = distance ÷ time).`,
      data: { speed },
    };
  }
  if (solve === "distance") {
    // a = speed, b = time
    const distance = roundTo(a * b, 4);
    return {
      ok: true,
      metrics: [{ key: "distance", label: "Distance", kind: "number", value: distance, primary: true }],
      narrative: `At a speed of ${a} for ${b} units of time, you cover ${distance} units of distance (distance = speed × time).`,
      data: { distance },
    };
  }
  // solve === "time": a = distance, b = speed
  const time = roundTo(a / b, 4);
  return {
    ok: true,
    metrics: [{ key: "time", label: "Time", kind: "number", value: time, primary: true }],
    narrative: `To cover ${a} units at a speed of ${b}, it takes ${time} units of time (time = distance ÷ speed).`,
    data: { time },
  };
}

/**
 * Density: ρ = m / V. Solve for the missing quantity.
 */
export function calculateDensity(inputs: CalculatorInputs): CalcResult {
  const solve = typeof inputs.solve === "string" ? inputs.solve : "density";
  const a = toNumber(inputs.a);
  const b = toNumber(inputs.b);

  if (a <= 0 || b <= 0) {
    return { ok: false, error: "Enter the two known values (both greater than zero).", metrics: [] };
  }

  if (solve === "density") {
    const density = roundTo(a / b, 4); // a = mass, b = volume
    return {
      ok: true,
      metrics: [{ key: "density", label: "Density", kind: "number", value: density, primary: true }],
      narrative: `A mass of ${a} in a volume of ${b} gives a density of ${density} (density = mass ÷ volume).`,
      data: { density },
    };
  }
  if (solve === "mass") {
    const mass = roundTo(a * b, 4); // a = density, b = volume
    return {
      ok: true,
      metrics: [{ key: "mass", label: "Mass", kind: "number", value: mass, primary: true }],
      narrative: `At a density of ${a} and volume of ${b}, the mass is ${mass} (mass = density × volume).`,
      data: { mass },
    };
  }
  const volume = roundTo(a / b, 4); // a = mass, b = density
  return {
    ok: true,
    metrics: [{ key: "volume", label: "Volume", kind: "number", value: volume, primary: true }],
    narrative: `A mass of ${a} at a density of ${b} occupies a volume of ${volume} (volume = mass ÷ density).`,
    data: { volume },
  };
}
