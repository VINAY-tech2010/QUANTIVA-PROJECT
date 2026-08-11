import type { Scenario, StorageEnvelope } from "@/types";
import { readRaw, writeRaw, removeRaw } from "./local";

const KEY = "scenarios";
const VERSION = 1;

function loadEnvelope(): StorageEnvelope<Scenario[]> {
  const envelope = readRaw<StorageEnvelope<Scenario[]>>(KEY);
  if (!envelope || envelope.version !== VERSION || !Array.isArray(envelope.data)) {
    return { version: VERSION, data: [] };
  }
  return envelope;
}

function persist(scenarios: Scenario[]): boolean {
  return writeRaw(KEY, { version: VERSION, data: scenarios } satisfies StorageEnvelope<Scenario[]>);
}

/** All saved scenarios, newest first. */
export function loadScenarios(): Scenario[] {
  return [...loadEnvelope().data].sort((a, b) => b.createdAt - a.createdAt);
}

/** Scenarios belonging to one calculator. */
export function scenariosForCalculator(calculatorId: string): Scenario[] {
  return loadScenarios().filter((s) => s.calculatorId === calculatorId);
}

/** Create or update a scenario (matched by id). */
export function saveScenario(scenario: Scenario): boolean {
  const current = loadEnvelope().data;
  const idx = current.findIndex((s) => s.id === scenario.id);
  const next =
    idx >= 0
      ? current.map((s) => (s.id === scenario.id ? scenario : s))
      : [...current, scenario];
  return persist(next);
}

/** Delete a scenario by id. */
export function deleteScenario(id: string): boolean {
  return persist(loadEnvelope().data.filter((s) => s.id !== id));
}

/** Rename a scenario. Returns false if not found. */
export function renameScenario(id: string, name: string): boolean {
  const current = loadEnvelope().data;
  const target = current.find((s) => s.id === id);
  if (!target) return false;
  return persist(current.map((s) => (s.id === id ? { ...s, name } : s)));
}

/** Clear all scenarios. */
export function clearScenarios(): boolean {
  return removeRaw(KEY);
}
