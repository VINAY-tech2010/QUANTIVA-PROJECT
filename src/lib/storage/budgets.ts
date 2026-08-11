import type { Budget, StorageEnvelope } from "@/types";
import { readRaw, writeRaw, removeRaw } from "./local";

const KEY = "budgets";
const VERSION = 1;

function loadEnvelope(): StorageEnvelope<Budget[]> {
  const envelope = readRaw<StorageEnvelope<Budget[]>>(KEY);
  if (!envelope || envelope.version !== VERSION || !Array.isArray(envelope.data)) {
    return { version: VERSION, data: [] };
  }
  return envelope;
}

/** All budgets. */
export function loadBudgets(): Budget[] {
  return loadEnvelope().data;
}

/** Budget for a single calculator, if set. */
export function budgetForCalculator(calculatorId: string): Budget | null {
  return loadEnvelope().data.find((b) => b.calculatorId === calculatorId) ?? null;
}

/** Set (upsert) a budget for a calculator. */
export function saveBudget(budget: Budget): boolean {
  const current = loadEnvelope().data;
  const idx = current.findIndex((b) => b.calculatorId === budget.calculatorId);
  const next =
    idx >= 0
      ? current.map((b) => (b.calculatorId === budget.calculatorId ? budget : b))
      : [...current, budget];
  return writeRaw(KEY, { version: VERSION, data: next } satisfies StorageEnvelope<Budget[]>);
}

/** Remove a calculator's budget. */
export function removeBudget(calculatorId: string): boolean {
  const next = loadEnvelope().data.filter((b) => b.calculatorId !== calculatorId);
  return writeRaw(KEY, { version: VERSION, data: next } satisfies StorageEnvelope<Budget[]>);
}

/** Clear all budgets. */
export function clearBudgets(): boolean {
  return removeRaw(KEY);
}
