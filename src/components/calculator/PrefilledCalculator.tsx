"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import type { CalculatorInputs } from "@/types";
import { CalculatorForm, type CalculatorConfig } from "./CalculatorForm";

const STRING_FIELD_TYPES = new Set([
  "time",
  "date",
  "datetime",
  "text",
  "textarea",
  "select",
]);

/**
 * Reads ?key=value query params (e.g. from intent-search deep links) and
 * pre-fills the calculator form with them. Lives in a client component so the
 * page itself can be statically generated: searchParams never touch the
 * server, and users without deep links get the exact same static shell.
 */
export function PrefilledCalculator({ calculator }: { calculator: CalculatorConfig }) {
  const searchParams = useSearchParams();

  const initialInputs = useMemo<CalculatorInputs>(() => {
    const out: CalculatorInputs = {};
    for (const field of calculator.fields) {
      const raw = searchParams.get(field.key);
      if (raw === null) continue;
      if (STRING_FIELD_TYPES.has(field.type)) {
        out[field.key] = raw;
      } else {
        const n = Number(raw);
        if (Number.isFinite(n)) out[field.key] = n;
      }
    }
    return out;
  }, [calculator, searchParams]);

  return (
    <CalculatorForm key={calculator.slug} calculator={calculator} initialInputs={initialInputs} />
  );
}