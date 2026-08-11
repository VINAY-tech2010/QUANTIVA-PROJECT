import type { CalcResult, CalculatorInputs } from "@/types";
import { roundMoney, roundTo, toNumber } from "@/lib/utils/math";

/**
 * Split a bill (with optional tip) among a number of people.
 */
export function calculateBillSplit(inputs: CalculatorInputs): CalcResult {
  const bill = toNumber(inputs.bill);
  const tipPercent = toNumber(inputs.tipPercent, 0);
  const people = toNumber(inputs.people, 1);

  if (bill <= 0) return { ok: false, error: "Bill amount must be greater than zero.", metrics: [] };
  if (!Number.isInteger(people) || people < 1) {
    return { ok: false, error: "Enter at least one person.", metrics: [] };
  }

  const tip = roundMoney((bill * tipPercent) / 100);
  const total = roundMoney(bill + tip);
  const perPerson = roundMoney(total / people);

  return {
    ok: true,
    metrics: [
      { key: "perPerson", label: `Each of ${people} pays`, kind: "currency", value: perPerson, primary: true },
      { key: "total", label: "Total (incl. tip)", kind: "currency", value: total },
      { key: "tip", label: `Tip (${tipPercent}%)`, kind: "currency", value: tip },
    ],
    narrative: `A bill of {bill} with a ${tipPercent}% tip comes to {total}. Split ${people} way${people === 1 ? "" : "s"}, each person pays {perPerson}.`,
    data: { perPerson, total, tip },
  };
}

/**
 * Fuel cost for a trip.
 */
export function calculateFuelCost(inputs: CalculatorInputs): CalcResult {
  const distance = toNumber(inputs.distance);
  const efficiency = toNumber(inputs.efficiency); // km per litre or mpg
  const price = toNumber(inputs.price); // price per litre or gallon

  if (distance <= 0) return { ok: false, error: "Distance must be greater than zero.", metrics: [] };
  if (efficiency <= 0) return { ok: false, error: "Fuel efficiency must be greater than zero.", metrics: [] };
  if (price < 0) return { ok: false, error: "Fuel price cannot be negative.", metrics: [] };

  const fuelNeeded = distance / efficiency;
  const cost = roundMoney(fuelNeeded * price);

  return {
    ok: true,
    metrics: [
      { key: "cost", label: "Total fuel cost", kind: "currency", value: cost, primary: true },
      { key: "fuel", label: "Fuel needed", kind: "text", value: `${roundTo(fuelNeeded, 2)} units` },
    ],
    narrative: `A ${distance}-unit trip at ${efficiency} units of distance per unit of fuel needs ${roundTo(fuelNeeded, 2)} units of fuel, costing {cost} at {price} per unit.`,
    data: { cost, fuelNeeded: roundTo(fuelNeeded, 2) },
  };
}

/**
 * Electricity cost: power (W) × hours × days × rate.
 */
export function calculateElectricityCost(inputs: CalculatorInputs): CalcResult {
  const watts = toNumber(inputs.watts);
  const hoursPerDay = toNumber(inputs.hoursPerDay);
  const days = toNumber(inputs.days, 30);
  const ratePerKwh = toNumber(inputs.rate);

  if (watts <= 0) return { ok: false, error: "Power must be greater than zero.", metrics: [] };
  if (hoursPerDay < 0 || hoursPerDay > 24) return { ok: false, error: "Hours per day must be between 0 and 24.", metrics: [] };
  if (days <= 0) return { ok: false, error: "Days must be greater than zero.", metrics: [] };

  const kwh = (watts / 1000) * hoursPerDay * days;
  const cost = roundMoney(kwh * ratePerKwh);

  return {
    ok: true,
    metrics: [
      { key: "cost", label: `Cost over ${days} days`, kind: "currency", value: cost, primary: true },
      { key: "kwh", label: "Energy used", kind: "text", value: `${roundTo(kwh, 2)} kWh` },
    ],
    narrative: `A ${watts} W device running ${hoursPerDay} hour${hoursPerDay === 1 ? "" : "s"} a day for ${days} day${days === 1 ? "" : "s"} uses ${roundTo(kwh, 2)} kWh, costing {cost} at {rate} per kWh.`,
    data: { cost, kwh: roundTo(kwh, 2) },
  };
}

/**
 * Paint needed for a room: walls area ÷ coverage per litre/gallon.
 */
export function calculatePaint(inputs: CalculatorInputs): CalcResult {
  const length = toNumber(inputs.length);
  const width = toNumber(inputs.width);
  const height = toNumber(inputs.height, 2.5);
  const coats = toNumber(inputs.coats, 2);
  const coverage = toNumber(inputs.coverage, 10); // m² per litre

  if (length <= 0 || width <= 0 || height <= 0) {
    return { ok: false, error: "Length, width and height must all be greater than zero.", metrics: [] };
  }
  if (coats < 1) return { ok: false, error: "Enter at least one coat.", metrics: [] };
  if (coverage <= 0) return { ok: false, error: "Coverage must be greater than zero.", metrics: [] };

  // Four walls (ceiling excluded).
  const wallArea = 2 * height * (length + width);
  const totalArea = wallArea * coats;
  const litres = totalArea / coverage;

  return {
    ok: true,
    metrics: [
      { key: "litres", label: "Paint needed", kind: "text", value: `${roundTo(litres, 2)} L`, primary: true },
      { key: "wallArea", label: "Wall area", kind: "text", value: `${roundTo(wallArea, 2)} m²` },
      { key: "coats", label: "Coats", kind: "number", value: coats },
    ],
    narrative: `The four walls of a ${length} m × ${width} m × ${height} m room cover ${roundTo(wallArea, 2)} m². With ${coats} coat${coats === 1 ? "" : "s"} at ${coverage} m²/L coverage, you need about ${roundTo(litres, 2)} litres of paint.`,
    data: { litres: roundTo(litres, 2), wallArea: roundTo(wallArea, 2) },
  };
}
