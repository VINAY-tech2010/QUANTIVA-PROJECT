"use client";

import { useState } from "react";
import Link from "next/link";
import type { HistoryEntry } from "@/types";
import { loadHistory, removeHistoryEntry, clearHistory } from "@/lib/storage/history";
import { getCalculator } from "@/data/calculators";
import { useCurrency } from "@/lib/currency/context";
import { formatNumber, formatPercent } from "@/lib/currency/formatter";
import { formatDuration } from "@/lib/utils/math";
import { useClientSnapshot } from "@/lib/utils/useClientSnapshot";

const EMPTY: HistoryEntry[] = [];

export default function HistoryPage() {
  const { format } = useCurrency();
  // Hydration-safe read of persisted history; `override` reflects mutations.
  const persisted = useClientSnapshot<HistoryEntry[]>("history", loadHistory, EMPTY);
  const [override, setOverride] = useState<HistoryEntry[] | null>(null);
  const history = override ?? persisted;

  const refresh = () => setOverride(loadHistory());

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            <span className="text-gradient">History</span>
          </h1>
          <p className="mt-2 text-muted">Your recent calculations, stored locally.</p>
        </div>
        {history.length > 0 && (
          <button
            type="button"
            className="btn-ghost text-sm"
            onClick={() => {
              clearHistory();
              refresh();
            }}
          >
            Clear all
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="card mt-8 flex items-center justify-center p-12 text-center">
          <p className="text-muted">No calculations yet. Try a calculator to see your history here.</p>
        </div>
      ) : (
        <ul className="card mt-8 divide-y divide-white/5">
          {history.map((e) => (
            <li key={e.id} className="flex items-center justify-between gap-4 px-5 py-3.5">
              <div className="min-w-0">
                <Link
                  href={`/calculator/${getCalculator(e.calculatorId)?.slug ?? e.calculatorId}`}
                  className="font-medium hover:text-violet-soft"
                >
                  {e.calculatorName}
                </Link>
                <p className="truncate text-sm text-muted">
                  {e.summary ? `${e.summary.label}: ${formatSummary(e.summary, format)}` : "Result recorded"}
                  {" · "}
                  {new Date(e.createdAt).toLocaleString()}
                </p>
              </div>
              <button
                type="button"
                className="shrink-0 text-xs text-muted hover:text-rose-400"
                onClick={() => {
                  removeHistoryEntry(e.id);
                  refresh();
                }}
                aria-label={`Remove ${e.calculatorName} entry`}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
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
