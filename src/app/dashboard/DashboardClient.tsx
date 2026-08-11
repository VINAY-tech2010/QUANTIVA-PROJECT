"use client";

import { useState } from "react";
import Link from "next/link";
import type { Budget, HistoryEntry, SavedCalculation, Scenario } from "@/types";
import { loadHistory, removeHistoryEntry, clearHistory } from "@/lib/storage/history";
import { loadScenarios, deleteScenario } from "@/lib/storage/scenarios";
import { loadBudgets, removeBudget } from "@/lib/storage/budgets";
import { loadSaved, deleteSaved } from "@/lib/storage/saved";
import { getCalculator } from "@/data/calculators";
import { useCurrency } from "@/lib/currency/context";
import { formatNumber, formatPercent } from "@/lib/currency/formatter";
import { formatDuration } from "@/lib/utils/math";
import { useClientSnapshot } from "@/lib/utils/useClientSnapshot";

const EMPTY_HISTORY: HistoryEntry[] = [];
const EMPTY_SCENARIOS: Scenario[] = [];
const EMPTY_BUDGETS: Budget[] = [];
const EMPTY_SAVED: SavedCalculation[] = [];

export function DashboardClient() {
  const { format } = useCurrency();
  // Hydration-safe reads of persisted data; `override` reflects mutations.
  const persistedHistory = useClientSnapshot<HistoryEntry[]>("history", loadHistory, EMPTY_HISTORY);
  const persistedScenarios = useClientSnapshot<Scenario[]>("scenarios", loadScenarios, EMPTY_SCENARIOS);
  const persistedBudgets = useClientSnapshot<Budget[]>("budgets", loadBudgets, EMPTY_BUDGETS);
  const persistedSaved = useClientSnapshot<SavedCalculation[]>("saved", loadSaved, EMPTY_SAVED);
  const [historyOverride, setHistory] = useState<HistoryEntry[] | null>(null);
  const [scenariosOverride, setScenarios] = useState<Scenario[] | null>(null);
  const [budgetsOverride, setBudgets] = useState<Budget[] | null>(null);
  const [savedOverride, setSaved] = useState<SavedCalculation[] | null>(null);
  const history = historyOverride ?? persistedHistory;
  const scenarios = scenariosOverride ?? persistedScenarios;
  const budgets = budgetsOverride ?? persistedBudgets;
  const saved = savedOverride ?? persistedSaved;

  function refreshHistory() {
    setHistory(loadHistory());
  }

  return (
    <div className="flex flex-col gap-10">
      {/* Summary stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard label="Calculations" value={history.length} />
        <StatCard label="Saved" value={saved.length} />
        <StatCard label="Scenarios" value={scenarios.length} />
        <StatCard label="Budgets" value={budgets.length} />
      </div>

      {/* Saved calculations */}
      <section aria-label="Saved calculations">
        <h2 className="mb-3 text-xl font-semibold">Saved calculations</h2>
        {saved.length === 0 ? (
          <EmptyState text="No saved calculations. Use “Save calculation” on any result." />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {saved.map((s) => {
              const calc = getCalculator(s.calculatorId);
              return (
                <li key={s.id} className="card flex flex-col gap-2 p-4">
                  <p className="truncate font-medium">{s.name}</p>
                  <p className="truncate text-sm text-muted">
                    {s.summary ? `${s.summary.label}: ${formatSummary(s.summary, format)}` : calc?.name}
                  </p>
                  <div className="flex items-center justify-between">
                    <Link
                      href={`/calculator/${calc?.slug ?? s.calculatorId}?${new URLSearchParams(
                        Object.fromEntries(
                          Object.entries(s.inputs).map(([k, v]) => [k, String(v)]),
                        ),
                      ).toString()}`}
                      className="text-sm text-violet-soft hover:underline"
                    >
                      Open
                    </Link>
                    <button
                      type="button"
                      className="text-xs text-muted hover:text-rose-400"
                      onClick={() => {
                        deleteSaved(s.id);
                        setSaved(loadSaved());
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Recent history */}
      <section aria-label="Recent calculations">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Recent calculations</h2>
          {history.length > 0 && (
            <button
              type="button"
              className="text-xs text-muted hover:text-rose-400"
              onClick={() => {
                clearHistory();
                refreshHistory();
              }}
            >
              Clear all
            </button>
          )}
        </div>
        {history.length === 0 ? (
          <EmptyState text="No calculations yet. Try a calculator to see your history here." />
        ) : (
          <ul className="card divide-y divide-white/5">
            {history.slice(0, 20).map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-4 px-5 py-3.5">
                <div className="min-w-0">
                  <Link
                    href={`/calculator/${getCalculator(e.calculatorId)?.slug ?? e.calculatorId}`}
                    className="font-medium hover:text-violet-soft"
                  >
                    {e.calculatorName}
                  </Link>
                  <p className="truncate text-sm text-muted">
                    {e.summary
                      ? `${e.summary.label}: ${formatSummary(e.summary, format)}`
                      : "Result recorded"}
                    {" · "}
                    {new Date(e.createdAt).toLocaleString()}
                  </p>
                </div>
                <button
                  type="button"
                  className="shrink-0 text-xs text-muted hover:text-rose-400"
                  onClick={() => {
                    removeHistoryEntry(e.id);
                    refreshHistory();
                  }}
                  aria-label={`Remove ${e.calculatorName} entry`}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Scenarios */}
      <section aria-label="Saved scenarios">
        <h2 className="mb-3 text-xl font-semibold">Saved scenarios</h2>
        {scenarios.length === 0 ? (
          <EmptyState text="No scenarios saved yet. Save a what-if scenario from any calculator." />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {scenarios.map((s) => {
              const calc = getCalculator(s.calculatorId);
              return (
                <li key={s.id} className="card flex items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{s.name}</p>
                    <Link
                      href={`/calculator/${calc?.slug ?? s.calculatorId}`}
                      className="text-sm text-violet-soft hover:underline"
                    >
                      {calc?.name ?? s.calculatorId}
                    </Link>
                  </div>
                  <button
                    type="button"
                    className="shrink-0 text-xs text-muted hover:text-rose-400"
                    onClick={() => {
                      deleteScenario(s.id);
                      setScenarios(loadScenarios());
                    }}
                  >
                    Delete
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Budgets */}
      <section aria-label="Budgets">
        <h2 className="mb-3 text-xl font-semibold">Budgets</h2>
        {budgets.length === 0 ? (
          <EmptyState text="No budgets set. Set a budget from a calculator that supports it." />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {budgets.map((b) => {
              const calc = getCalculator(b.calculatorId);
              return (
                <li key={b.calculatorId} className="card flex items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <p className="font-medium">{format(b.amount)}</p>
                    <p className="truncate text-sm text-muted">
                      {b.label}
                      {b.period ? ` · ${b.period}` : ""} · {calc?.name ?? b.calculatorId}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="shrink-0 text-xs text-muted hover:text-rose-400"
                    onClick={() => {
                      removeBudget(b.calculatorId);
                      setBudgets(loadBudgets());
                    }}
                  >
                    Remove
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="card p-5">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 text-3xl font-bold tracking-tight">{value}</p>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="card flex items-center justify-center p-8 text-center">
      <p className="text-sm text-muted">{text}</p>
    </div>
  );
}

function formatSummary(
  summary: NonNullable<HistoryEntry["summary"]>,
  formatCurrency: (v: number) => string,
): string {
  const v = summary.value;
  if (typeof v !== "number") return String(v);
  switch (summary.kind) {
    case "currency":
      return formatCurrency(v);
    case "percent":
      return formatPercent(v);
    case "duration":
      return formatDuration(v);
    case "number":
      return formatNumber(v);
    default:
      return String(v);
  }
}
