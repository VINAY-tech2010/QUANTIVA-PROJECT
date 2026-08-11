"use client";

import { useMemo, useState, type FormEvent } from "react";
import type { CalcResult, CalculatorDefinition, CalculatorInputs } from "@/types";
import { validateInputs } from "@/lib/validation/validate";
import { useCurrency } from "@/lib/currency/context";
import { addHistoryEntry } from "@/lib/storage/history";
import { getCalculator } from "@/data/calculators";
import { ResultsPanel } from "./ResultsPanel";
import { ScenarioManager } from "./ScenarioManager";
import { ResultActions } from "./ResultActions";
import { ExplainPanel } from "./ExplainPanel";

/** Serializable calculator config safe to pass from server to client. */
export type CalculatorConfig = Omit<CalculatorDefinition, "calculate">;

interface Props {
  calculator: CalculatorConfig;
  /** Pre-filled inputs (e.g. from intent search or a scenario). */
  initialInputs?: CalculatorInputs;
}

function buildDefaults(calc: CalculatorConfig): CalculatorInputs {
  const out: CalculatorInputs = {};
  for (const f of calc.fields) {
    if (f.defaultValue !== undefined) out[f.key] = f.defaultValue;
  }
  return out;
}

export function CalculatorForm({ calculator, initialInputs }: Props) {
  const { currency, symbol } = useCurrency();
  // Resolve the pure calculate function client-side from the registry by id.
  // Functions cannot cross the server/client boundary, so we look it up here.
  const calculate = useMemo(() => getCalculator(calculator.id)?.calculate, [calculator.id]);
  const [inputs, setInputs] = useState<CalculatorInputs>(() => ({
    ...buildDefaults(calculator),
    ...initialInputs,
  }));
  const [result, setResult] = useState<CalcResult | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const primaryMetricKey = useMemo(
    () => calculator.fields[0]?.key ?? "",
    [calculator],
  );

  function setValue(key: string, value: number | string) {
    setInputs((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  /** Apply scenario overrides on top of the current inputs. */
  function applyOverrides(overrides: CalculatorInputs) {
    setInputs((prev) => ({ ...prev, ...overrides }));
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const fieldErrors = validateInputs(calculator.fields, inputs);
    if (fieldErrors.length > 0) {
      const map: Record<string, string> = {};
      for (const fe of fieldErrors) map[fe.field] = fe.message;
      setErrors(map);
      setResult(null);
      return;
    }
    setErrors({});
    if (!calculate) {
      setResult({ ok: false, error: "Calculator unavailable.", metrics: [] });
      return;
    }
    const res = calculate(inputs);
    setResult(res);

    if (res.ok) {
      const primary = res.metrics.find((m) => m.primary) ?? res.metrics[0] ?? null;
      addHistoryEntry({
        id: `${calculator.id}-${Date.now()}`,
        calculatorId: calculator.id,
        calculatorName: calculator.name,
        category: calculator.category,
        inputs,
        summary: primary
          ? { label: primary.label, value: primary.value, kind: primary.kind }
          : null,
        currency: calculator.usesCurrency ? currency : undefined,
        createdAt: Date.now(),
      });
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <form onSubmit={onSubmit} className="card flex flex-col gap-5 p-6" noValidate>
        {calculator.fields.map((field) => (
          <div key={field.key}>
            <label htmlFor={`f-${field.key}`} className="mb-1.5 block text-sm font-medium">
              {field.label}
              {field.required && <span className="ml-1 text-violet-soft">*</span>}
            </label>
            {field.quickPresets && field.quickPresets.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-1.5" role="group" aria-label={`${field.label} presets`}>
                {field.quickPresets.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    className="chip transition-colors hover:border-violet/50 hover:text-foreground"
                    onClick={() => setValue(field.key, p.value)}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            )}
            <div className="relative">
              {field.type === "select" ? (
                <select
                  id={`f-${field.key}`}
                  className="input"
                  value={String(inputs[field.key] ?? field.defaultValue ?? "")}
                  onChange={(e) => setValue(field.key, e.target.value)}
                >
                  {field.options?.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              ) : field.type === "textarea" ? (
                <textarea
                  id={`f-${field.key}`}
                  className="input min-h-24 resize-y"
                  placeholder={field.help}
                  value={String(inputs[field.key] ?? "")}
                  onChange={(e) => setValue(field.key, e.target.value)}
                  aria-invalid={Boolean(errors[field.key])}
                  aria-describedby={errors[field.key] ? `err-${field.key}` : undefined}
                />
              ) : (
                <input
                  id={`f-${field.key}`}
                  className="input"
                  type={
                    field.type === "time"
                      ? "time"
                      : field.type === "date"
                        ? "date"
                        : field.type === "datetime"
                          ? "datetime-local"
                          : field.type === "text"
                            ? "text"
                            : "number"
                  }
                  inputMode={
                    field.type === "currency" || field.type === "number" || field.type === "percent"
                      ? "decimal"
                      : undefined
                  }
                  min={field.min}
                  max={field.max}
                  step={field.step ?? (field.type === "integer" ? 1 : "any")}
                  placeholder={field.help}
                  value={String(inputs[field.key] ?? "")}
                  onChange={(e) => {
                    const raw = e.target.value;
                    if (
                      field.type === "time" ||
                      field.type === "date" ||
                      field.type === "datetime" ||
                      field.type === "text"
                    ) {
                      setValue(field.key, raw);
                    } else {
                      setValue(field.key, raw === "" ? "" : Number(raw));
                    }
                  }}
                  aria-invalid={Boolean(errors[field.key])}
                  aria-describedby={errors[field.key] ? `err-${field.key}` : undefined}
                />
              )}
              {field.type === "currency" && (
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted">
                  {symbol}
                </span>
              )}
              {field.unit && field.type !== "currency" && (
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted">
                  {field.unit}
                </span>
              )}
            </div>
            {errors[field.key] && (
              <p id={`err-${field.key}`} className="mt-1 text-xs text-rose-400">
                {errors[field.key]}
              </p>
            )}
            {field.help && !errors[field.key] && (
              <p className="mt-1 text-xs text-muted">{field.help}</p>
            )}
          </div>
        ))}

        <button type="submit" className="btn-primary mt-2">
          Calculate
        </button>
        <p className="sr-only">Primary input {primaryMetricKey}</p>
      </form>

      <div className="flex flex-col gap-6">
        <ResultsPanel result={result} />
        {result?.ok && (
          <ResultActions calculator={calculator} inputs={inputs} result={result} />
        )}
        {result?.ok && <ExplainPanel calculator={calculator} result={result} />}
        {calculator.supportsScenarios && (
          <ScenarioManager
            calculator={calculator}
            inputs={inputs}
            baseline={result}
            onApply={applyOverrides}
          />
        )}
      </div>
    </div>
  );
}
