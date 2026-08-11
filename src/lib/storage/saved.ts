import type { SavedCalculation, StorageEnvelope } from "@/types";
import { readRaw, writeRaw, removeRaw } from "./local";

const KEY = "saved";
const VERSION = 1;
const MAX_ENTRIES = 200;

function loadEnvelope(): StorageEnvelope<SavedCalculation[]> {
  const envelope = readRaw<StorageEnvelope<SavedCalculation[]>>(KEY);
  if (!envelope || envelope.version !== VERSION || !Array.isArray(envelope.data)) {
    return { version: VERSION, data: [] };
  }
  return envelope;
}

function persist(items: SavedCalculation[]): boolean {
  return writeRaw(KEY, { version: VERSION, data: items } satisfies StorageEnvelope<SavedCalculation[]>);
}

/** All saved calculations, newest first. */
export function loadSaved(): SavedCalculation[] {
  return [...loadEnvelope().data].sort((a, b) => b.createdAt - a.createdAt);
}

/** Saved calculations for one calculator. */
export function savedForCalculator(calculatorId: string): SavedCalculation[] {
  return loadSaved().filter((s) => s.calculatorId === calculatorId);
}

/** Create or update a saved calculation (matched by id). Caps the list. */
export function saveCalculation(item: SavedCalculation): boolean {
  const current = loadEnvelope().data;
  const idx = current.findIndex((s) => s.id === item.id);
  const next =
    idx >= 0
      ? current.map((s) => (s.id === item.id ? item : s))
      : [item, ...current].slice(0, MAX_ENTRIES);
  return persist(next);
}

/** Rename a saved calculation. Returns false if not found. */
export function renameSaved(id: string, name: string): boolean {
  const current = loadEnvelope().data;
  if (!current.some((s) => s.id === id)) return false;
  return persist(current.map((s) => (s.id === id ? { ...s, name } : s)));
}

/** Delete a saved calculation by id. */
export function deleteSaved(id: string): boolean {
  return persist(loadEnvelope().data.filter((s) => s.id !== id));
}

/** Clear all saved calculations. */
export function clearSaved(): boolean {
  return removeRaw(KEY);
}
