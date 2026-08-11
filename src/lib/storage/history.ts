import type { HistoryEntry, StorageEnvelope } from "@/types";
import { readRaw, writeRaw, removeRaw } from "./local";

const KEY = "history";
const VERSION = 1;
const MAX_ENTRIES = 100;

function loadEnvelope(): StorageEnvelope<HistoryEntry[]> {
  const envelope = readRaw<StorageEnvelope<HistoryEntry[]>>(KEY);
  if (!envelope || envelope.version !== VERSION || !Array.isArray(envelope.data)) {
    return { version: VERSION, data: [] };
  }
  return envelope;
}

/** Load all history entries, newest first. Corrupted data yields []. */
export function loadHistory(): HistoryEntry[] {
  return loadEnvelope().data;
}

/** Prepend an entry, dedupe by id, cap the list, and persist. */
export function addHistoryEntry(entry: HistoryEntry): boolean {
  const current = loadEnvelope().data;
  const next = [entry, ...current.filter((e) => e.id !== entry.id)].slice(0, MAX_ENTRIES);
  return writeRaw(KEY, { version: VERSION, data: next } satisfies StorageEnvelope<HistoryEntry[]>);
}

/** Remove a single entry by id. */
export function removeHistoryEntry(id: string): boolean {
  const next = loadEnvelope().data.filter((e) => e.id !== id);
  return writeRaw(KEY, { version: VERSION, data: next } satisfies StorageEnvelope<HistoryEntry[]>);
}

/** Clear all history. */
export function clearHistory(): boolean {
  return removeRaw(KEY);
}

/** Entries for a single calculator, newest first. */
export function historyForCalculator(calculatorId: string): HistoryEntry[] {
  return loadHistory().filter((e) => e.calculatorId === calculatorId);
}
