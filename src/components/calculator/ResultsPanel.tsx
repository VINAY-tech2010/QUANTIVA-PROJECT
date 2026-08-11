"use client";

import type { CalcResult } from "@/types";
import { MetricValue } from "./MetricValue";
import { useNarrative } from "./useNarrative";

const toneClass: Record<string, string> = {
  positive: "text-emerald-400",
  negative: "text-rose-400",
  warning: "text-amber-400",
  neutral: "text-foreground",
};

export function ResultsPanel({ result }: { result: CalcResult | null }) {
  const narrative = useNarrative(result);

  if (!result) {
    return (
      <div className="card flex h-full min-h-40 items-center justify-center p-8 text-center">
        <p className="text-sm text-muted">
          Enter values and calculate to see your answer.
        </p>
      </div>
    );
  }

  if (!result.ok) {
    return (
      <div className="card border-rose-500/30 p-6" role="alert">
        <p className="text-sm font-medium text-rose-400">
          {result.error ?? "Unable to compute a result with these inputs."}
        </p>
      </div>
    );
  }

  const primary = result.metrics.filter((m) => m.primary);
  const rest = result.metrics.filter((m) => !m.primary);

  return (
    <div className="flex flex-col gap-6">
      {primary.length > 0 && (
        <div className="card p-6">
          {primary.map((m) => (
            <div key={m.key}>
              <p className="text-sm text-muted">{m.label}</p>
              <p className={`mt-1 break-words text-3xl font-bold tracking-tight sm:text-4xl ${toneClass[m.tone ?? "neutral"]}`}>
                <MetricValue metric={m} />
              </p>
            </div>
          ))}
        </div>
      )}

      {rest.length > 0 && (
        <div className="card divide-y divide-white/5">
          {rest.map((m) => (
            <div key={m.key} className="flex items-center justify-between gap-4 px-6 py-3.5">
              <span className="shrink-0 text-sm text-muted">{m.label}</span>
              <span className={`min-w-0 break-words text-right text-sm font-semibold ${toneClass[m.tone ?? "neutral"]}`}>
                <MetricValue metric={m} />
              </span>
            </div>
          ))}
        </div>
      )}

      {narrative && (
        <div className="card border-violet-500/20 bg-violet-500/5 p-5">
          <p className="text-sm leading-relaxed text-foreground/90">{narrative}</p>
        </div>
      )}

      {result.schedule && result.schedule.length > 0 && (
        <ScheduleTable rows={result.schedule} />
      )}
    </div>
  );
}

function ScheduleTable({ rows }: { rows: NonNullable<CalcResult["schedule"]> }) {
  const columns = Object.keys(rows[0]?.values ?? {});
  return (
    <div className="card overflow-x-auto p-2">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-muted">
            <th className="px-4 py-2 font-medium">{rows[0]?.label ? "Period" : ""}</th>
            {columns.map((c) => (
              <th key={c} className="px-4 py-2 font-medium capitalize">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-t border-white/5">
              <td className="px-4 py-2 text-muted">{row.label}</td>
              {columns.map((c) => (
                <td key={c} className="px-4 py-2">
                  {String(row.values[c] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
