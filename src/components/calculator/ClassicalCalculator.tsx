"use client";

import { useCallback, useEffect, useState } from "react";
import { evaluateExpression } from "@/lib/calculations/classical-parser";
import { playClick, playConfirm } from "@/lib/sound";

const BUTTONS: { label: string; value: string; kind: "num" | "op" | "action" }[] = [
  { label: "C", value: "clear", kind: "action" },
  { label: "⌫", value: "backspace", kind: "action" },
  { label: "%", value: "%", kind: "op" },
  { label: "÷", value: "/", kind: "op" },
  { label: "7", value: "7", kind: "num" },
  { label: "8", value: "8", kind: "num" },
  { label: "9", value: "9", kind: "num" },
  { label: "×", value: "*", kind: "op" },
  { label: "4", value: "4", kind: "num" },
  { label: "5", value: "5", kind: "num" },
  { label: "6", value: "6", kind: "num" },
  { label: "−", value: "-", kind: "op" },
  { label: "1", value: "1", kind: "num" },
  { label: "2", value: "2", kind: "num" },
  { label: "3", value: "3", kind: "num" },
  { label: "+", value: "+", kind: "op" },
  { label: "±", value: "negate", kind: "action" },
  { label: "0", value: "0", kind: "num" },
  { label: ".", value: ".", kind: "num" },
  { label: "=", value: "equals", kind: "action" },
];

function formatDisplay(expr: string): string {
  return expr.replace(/\*/g, "×").replace(/\//g, "÷").replace(/-/g, "−");
}

export function ClassicalCalculator() {
  const [expression, setExpression] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleInput = useCallback(
    (value: string) => {
      playClick();
      setError(null);
      if (value === "clear") {
        setExpression("");
        setResult(null);
        return;
      }
      if (value === "backspace") {
        setExpression((e) => e.slice(0, -1));
        setResult(null);
        return;
      }
      if (value === "negate") {
        setExpression((e) => {
          if (!e) return "-";
          // Toggle sign of the trailing number.
          const match = e.match(/(-?\d*\.?\d+)$/);
          if (!match) return e;
          const num = match[1];
          const toggled = num.startsWith("-") ? num.slice(1) : `-${num}`;
          return e.slice(0, e.length - num.length) + toggled;
        });
        setResult(null);
        return;
      }
      if (value === "equals") {
        if (!expression) return;
        try {
          const value = evaluateExpression(expression);
          const rounded = Math.round(value * 1e10) / 1e10;
          setResult(String(rounded));
          playConfirm();
        } catch (err) {
          setError(err instanceof Error ? err.message : "Invalid expression");
          setResult(null);
        }
        return;
      }
      // Append digit/operator/percent/decimal.
      setResult(null);
      setExpression((e) => e + value);
    },
    [expression],
  );

  // Keyboard support.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const key = e.key;
      if (key >= "0" && key <= "9") handleInput(key);
      else if (key === "+" || key === "-" || key === "*" || key === "/" || key === "%" || key === ".")
        handleInput(key);
      else if (key === "Enter" || key === "=") {
        e.preventDefault();
        handleInput("equals");
      } else if (key === "Backspace") handleInput("backspace");
      else if (key === "Escape" || key.toLowerCase() === "c") handleInput("clear");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleInput]);

  return (
    <div className="card glow-ring mx-auto w-full max-w-sm p-5">
      {/* Display */}
      <div className="mb-4 rounded-xl border border-border bg-surface px-4 py-5 text-right">
        <div className="min-h-6 truncate text-sm text-muted" aria-live="polite">
          {expression ? formatDisplay(expression) : "0"}
        </div>
        <div className="mt-1 min-h-10 truncate text-3xl font-semibold text-foreground">
          {error ? <span className="text-lg text-rose-400">{error}</span> : result ?? ""}
        </div>
      </div>
      {/* Button grid */}
      <div className="grid grid-cols-4 gap-2">
        {BUTTONS.map((btn) => (
          <button
            key={btn.label}
            type="button"
            onClick={() => handleInput(btn.value)}
            aria-label={btn.label}
            className={
              btn.kind === "action" && btn.value === "equals"
                ? "btn-primary h-14 text-lg"
                : btn.kind === "op"
                  ? "h-14 rounded-xl border border-border bg-surface-2 text-lg font-medium text-violet-soft transition-colors hover:border-violet/50"
                  : btn.kind === "action"
                    ? "h-14 rounded-xl border border-border bg-surface-2 text-lg font-medium text-muted transition-colors hover:border-violet/50 hover:text-foreground"
                    : "h-14 rounded-xl border border-border bg-surface text-lg font-medium text-foreground transition-colors hover:border-violet/40"
            }
          >
            {btn.label}
          </button>
        ))}
      </div>
    </div>
  );
}
