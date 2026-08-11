"use client";

import { useState } from "react";
import type { CalcResult, CalculatorInputs } from "@/types";
import type { CalculatorConfig } from "./CalculatorForm";
import { saveCalculation } from "@/lib/storage/saved";
import { useCurrency } from "@/lib/currency/context";
import { playConfirm } from "@/lib/sound";

interface Props {
  calculator: CalculatorConfig;
  inputs: CalculatorInputs;
  result: CalcResult;
}

/**
 * Actions shown after a successful calculation: save it locally and copy a
 * shareable URL that reproduces the exact inputs.
 */
export function ResultActions({ calculator, inputs, result }: Props) {
  const { currency } = useCurrency();
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!result.ok) return null;

  function onSave() {
    const primary = result.metrics.find((m) => m.primary) ?? result.metrics[0] ?? null;
    saveCalculation({
      id: `${calculator.id}-${Date.now()}`,
      calculatorId: calculator.id,
      calculatorName: calculator.name,
      category: calculator.category,
      name: `${calculator.name} — ${new Date().toLocaleDateString()}`,
      inputs,
      summary: primary
        ? { label: primary.label, value: primary.value, kind: primary.kind }
        : null,
      currency: calculator.usesCurrency ? currency : undefined,
      createdAt: Date.now(),
    });
    setSaved(true);
    playConfirm();
    setTimeout(() => setSaved(false), 2000);
  }

  async function onShare() {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(inputs)) {
      if (v !== undefined && v !== null && v !== "") params.set(k, String(v));
    }
    const url = `${window.location.origin}/calculator/${calculator.slug}?${params.toString()}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      playConfirm();
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: prompt the URL.
      window.prompt("Copy this link:", url);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button type="button" className="btn-ghost text-sm" onClick={onSave}>
        {saved ? "✓ Saved" : "Save calculation"}
      </button>
      <button type="button" className="btn-ghost text-sm" onClick={onShare}>
        {copied ? "✓ Link copied" : "Share link"}
      </button>
    </div>
  );
}
