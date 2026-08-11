"use client";

import { useMemo, useState } from "react";
import type {
  CalcResult,
  CalculatorInputs,
  Scenario,
  ScenarioDelta,
} from "@/types";
import type { CalculatorConfig } from "./CalculatorForm";
import { getCalculator } from "@/data/calculators";
import {
  deleteScenario,
  renameScenario,
  saveScenario,
  scenariosForCalculator,
} from "@/lib/storage/scenarios";
import { computeScenarioDelta } from "@/lib/scenarios/delta";
import { useCurrency } from "@/lib/currency/context";
import { formatNumber, formatPercent } from "@/lib/currency/formatter";
import { formatDuration } from "@/lib/utils/math";

interface Props {
  calculator: CalculatorConfig;
  /** Current (baseline) inputs from the form. */
  inputs: CalculatorInputs;
  /** Latest baseline result; null until the user calculates. */
  baseline: CalcResult | null;
  /** Apply a scenario's overrides back into the form. */
  onApply: (overrides: CalculatorInputs) => void;
}

export function ScenarioManager({ calculator, inputs, baseline, onApply }: Props) {
  const { format } = useCurrency();
  const calculate = useMemo(() => getCalculator(calculator.id)?.calculate, [calculator.id]);
  // Hydrate from localStorage lazily; keyed remount per calculator handles switches.
  const [scenarios, setScenarios] = useState<Scenario[]>(() =>
    scenariosForCalculator(calculator.id),
  );
  const [name, setName] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [compareMode, setCompareMode] = useState(false);

  if (!calculator.supportsScenarios) return null;

  function refresh() {
    setScenarios(scenariosForCalculator(calculator.id));
  }

  function saveCurrent() {
    const trimmed = name.trim();
    if (!trimmed) return;
    const scenario: Scenario = {
      id: `${calculator.id}-${Date.now()}`,
      calculatorId: calculator.id,
      name: trimmed,
      overrides: { ...inputs },
      createdAt: Date.now(),
    };
    if (saveScenario(scenario)) {
      setName("");
      refresh();
    }
  }

  function applyPreset(overrides: CalculatorInputs) {
    onApply(overrides);
  }

  function duplicateScenario(s: Scenario) {
    const copy: Scenario = {
      ...s,
      id: `${calculator.id}-${Date.now()}`,
      name: `${s.name} (copy)`,
      overrides: { ...s.overrides },
      createdAt: Date.now(),
    };
    if (saveScenario(copy)) refresh();
  }

  function deltaFor(scenario: Scenario): ScenarioDelta | null {
    if (!baseline || !calculate) return null;
    const scenarioInputs = { ...inputs, ...scenario.overrides };
    const scenarioResult = calculate(scenarioInputs);
    return computeScenarioDelta(scenario.id, scenario.name, baseline, scenarioResult);
  }

  return (
    <section className="card flex flex-col gap-5 p-6" aria-label="Scenarios">
      <div>
        <h2 className="text-lg font-semibold">What-if scenarios</h2>
        <p className="mt-1 text-sm text-muted">
          Save variations of your inputs and compare them against your baseline.
        </p>
      </div>

      {/* Save current inputs as a scenario */}
      <div className="flex gap-2">
        <input
          className="input flex-1"
          placeholder="Scenario name (e.g. Aggressive payoff)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-label="Scenario name"
        />
        <button
          type="button"
          className="btn-ghost"
          onClick={saveCurrent}
          disabled={!name.trim()}
        >
          Save
        </button>
      </div>

      {/* Presets */}
      {calculator.scenarioPresets && calculator.scenarioPresets.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
            Try a preset
          </p>
          <div className="flex flex-wrap gap-2">
            {calculator.scenarioPresets.map((p) => (
              <button
                key={p.name}
                type="button"
                className="chip"
                onClick={() => applyPreset(p.overrides)}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Saved scenarios */}
      {scenarios.length === 0 ? (
        <p className="text-sm text-muted">No saved scenarios yet.</p>
      ) : (
        <>
          {scenarios.length >= 2 && baseline && (
            <div className="flex justify-end">
              <button
                type="button"
                className="btn-ghost px-3 py-1.5 text-xs"
                aria-pressed={compareMode}
                onClick={() => setCompareMode((v) => !v)}
              >
                {compareMode ? "Hide comparison" : "Compare all"}
              </button>
            </div>
          )}

          {compareMode && baseline ? (
            <ComparisonTable
              scenarios={scenarios}
              baseline={baseline}
              inputs={inputs}
              calculate={calculate}
              formatCurrency={format}
            />
          ) : (
        <ul className="flex flex-col gap-3">
          {scenarios.map((s) => {
            const delta = deltaFor(s);
            const open = openId === s.id;
            return (
              <li key={s.id} className="rounded-lg border border-white/10 p-4">
                <div className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    className="flex-1 text-left font-medium hover:text-violet-soft"
                    onClick={() => setOpenId(open ? null : s.id)}
                    aria-expanded={open}
                  >
                    {s.name}
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="text-xs text-violet-soft hover:underline"
                      onClick={() => onApply(s.overrides)}
                    >
                      Apply
                    </button>
                    <RenameButton
                      name={s.name}
                      onRename={(n) => {
                        renameScenario(s.id, n);
                        refresh();
                      }}
                    />
                    <button
                      type="button"
                      className="text-xs text-muted hover:underline"
                      onClick={() => duplicateScenario(s)}
                    >
                      Duplicate
                    </button>
                    <button
                      type="button"
                      className="text-xs text-rose-400 hover:underline"
                      onClick={() => {
                        deleteScenario(s.id);
                        refresh();
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {open && (
                  <div className="mt-3">
                    {!baseline ? (
                      <p className="text-sm text-muted">
                        Calculate your baseline first to compare this scenario.
                      </p>
                    ) : delta ? (
                      <DeltaView delta={delta} formatCurrency={format} />
                    ) : (
                      <p className="text-sm text-muted">
                        This scenario could not be compared.
                      </p>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
          )}
        </>
      )}
    </section>
  );
}

/** Side-by-side comparison of all scenarios against the baseline. */
function ComparisonTable({
  scenarios,
  baseline,
  inputs,
  calculate,
  formatCurrency,
}: {
  scenarios: Scenario[];
  baseline: CalcResult;
  inputs: CalculatorInputs;
  calculate: ((inputs: CalculatorInputs) => CalcResult) | undefined;
  formatCurrency: (v: number) => string;
}) {
  const deltas = useMemo(() => {
    if (!calculate) return [];
    return scenarios
      .map((s) => {
        const scenarioInputs = { ...inputs, ...s.overrides };
        const scenarioResult = calculate(scenarioInputs);
        return computeScenarioDelta(s.id, s.name, baseline, scenarioResult);
      })
      .filter((d): d is ScenarioDelta => d !== null);
  }, [scenarios, baseline, inputs, calculate]);

  if (deltas.length === 0) {
    return <p className="text-sm text-muted">No comparable scenarios.</p>;
  }

  // Collect the union of metric labels across all scenarios.
  const metricKeys: string[] = [];
  for (const d of deltas) {
    for (const m of d.deltas) {
      if (!metricKeys.includes(m.metricKey)) metricKeys.push(m.metricKey);
    }
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full min-w-max text-sm">
        <thead>
          <tr className="border-b border-border bg-surface-2 text-left">
            <th className="px-4 py-2.5 font-medium text-muted">Metric</th>
            <th className="px-4 py-2.5 font-medium text-muted">Baseline</th>
            {deltas.map((d) => (
              <th key={d.scenarioId} className="px-4 py-2.5 font-medium text-foreground">
                {d.scenarioName}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {metricKeys.map((key) => {
            const first = deltas[0]?.deltas.find((m) => m.metricKey === key);
            if (!first) return null;
            return (
              <tr key={key}>
                <td className="px-4 py-2.5 text-muted">{first.label}</td>
                <td className="px-4 py-2.5 text-foreground">
                  {formatMetric(first.baseline, first, formatCurrency)}
                </td>
                {deltas.map((d) => {
                  const m = d.deltas.find((x) => x.metricKey === key);
                  if (!m) return <td key={d.scenarioId} className="px-4 py-2.5" />;
                  return (
                    <td
                      key={d.scenarioId}
                      className={`px-4 py-2.5 font-medium ${
                        m.improved === undefined
                          ? "text-foreground"
                          : m.improved
                            ? "text-emerald-400"
                            : "text-rose-400"
                      }`}
                    >
                      {formatMetric(m.scenario, m, formatCurrency)}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function RenameButton({ name, onRename }: { name: string; onRename: (n: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(name);

  if (!editing) {
    return (
      <button
        type="button"
        className="text-xs text-muted hover:underline"
        onClick={() => {
          setValue(name);
          setEditing(true);
        }}
      >
        Rename
      </button>
    );
  }
  return (
    <span className="flex items-center gap-1">
      <input
        className="input w-28 px-2 py-1 text-xs"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        aria-label="New scenario name"
      />
      <button
        type="button"
        className="text-xs text-violet-soft"
        onClick={() => {
          if (value.trim()) onRename(value.trim());
          setEditing(false);
        }}
      >
        OK
      </button>
    </span>
  );
}

function DeltaView({
  delta,
  formatCurrency,
}: {
  delta: ScenarioDelta;
  formatCurrency: (v: number) => string;
}) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium text-violet-soft">{delta.headline}</p>
      <div className="divide-y divide-white/5">
        {delta.deltas.map((d) => (
          <div key={d.metricKey} className="flex items-center justify-between py-2 text-sm">
            <span className="text-muted">{d.label}</span>
            <span className="flex items-center gap-3">
              <span className="text-muted">{formatMetric(d.baseline, d, formatCurrency)}</span>
              <span aria-hidden>→</span>
              <span
                className={
                  d.improved === undefined
                    ? "font-semibold"
                    : d.improved
                      ? "font-semibold text-emerald-400"
                      : "font-semibold text-rose-400"
                }
              >
                {formatMetric(d.scenario, d, formatCurrency)}
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatMetric(
  value: number | string,
  d: ScenarioDelta["deltas"][number],
  formatCurrency: (v: number) => string,
): string {
  if (typeof value !== "number") return String(value);
  switch (d.kind) {
    case "currency":
      return formatCurrency(value);
    case "percent":
      return formatPercent(value);
    case "duration":
      return formatDuration(value);
    case "number":
      return formatNumber(value);
    default:
      return String(value);
  }
}
