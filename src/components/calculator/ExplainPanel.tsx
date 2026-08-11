"use client";

import { useState } from "react";
import type { CalcResult } from "@/types";
import type { CalculatorConfig } from "./CalculatorForm";
import { playClick } from "@/lib/sound";

interface Props {
  calculator: CalculatorConfig;
  result: CalcResult;
}

/**
 * Collapsible "Explain My Result" panel: result summary, methodology,
 * formula, worked steps, interpretation, and assumptions.
 */
export function ExplainPanel({ calculator, result }: Props) {
  const [open, setOpen] = useState(false);
  const explanation = calculator.explanation;

  if (!result.ok || !explanation) return null;

  const primary = result.metrics.find((m) => m.primary) ?? result.metrics[0];

  return (
    <div className="card overflow-hidden">
      <button
        type="button"
        className="flex w-full items-center justify-between px-5 py-4 text-left"
        aria-expanded={open}
        onClick={() => {
          setOpen((v) => !v);
          playClick();
        }}
      >
        <span className="font-medium text-foreground">Explain my result</span>
        <span
          aria-hidden
          className={`text-muted transition-transform ${open ? "rotate-180" : ""}`}
        >
          ▾
        </span>
      </button>

      {open && (
        <div className="flex flex-col gap-5 border-t border-border px-5 py-5 text-sm">
          {primary && (
            <div>
              <h3 className="font-semibold text-foreground">Result</h3>
              <p className="mt-1 text-muted">
                {primary.label}: <span className="text-foreground">{String(primary.value)}</span>
              </p>
            </div>
          )}

          <div>
            <h3 className="font-semibold text-foreground">Methodology</h3>
            <p className="mt-1 leading-relaxed text-muted">{calculator.methodology}</p>
          </div>

          <div>
            <h3 className="font-semibold text-foreground">Formula</h3>
            <code className="mt-1 block rounded-lg border border-border bg-surface px-3 py-2 font-mono text-xs text-violet-soft">
              {explanation.formula}
            </code>
          </div>

          <div>
            <h3 className="font-semibold text-foreground">Steps</h3>
            <ol className="mt-1 list-decimal space-y-1 pl-5 text-muted">
              {explanation.steps.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ol>
          </div>

          <div>
            <h3 className="font-semibold text-foreground">Interpretation</h3>
            <p className="mt-1 leading-relaxed text-muted">{explanation.interpretation}</p>
          </div>

          <div>
            <h3 className="font-semibold text-foreground">Assumptions</h3>
            <ul className="mt-1 list-disc space-y-1 pl-5 text-muted">
              {explanation.assumptions.map((a, i) => (
                <li key={i}>{a}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
