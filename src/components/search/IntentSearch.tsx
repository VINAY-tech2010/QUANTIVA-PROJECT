"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { parseIntent } from "@/lib/intent/parser";
import { matchTool, looksLikeToolRequest } from "@/lib/intent/tool-match";
import { getCalculator } from "@/data/calculators";
import { useLiveCountdown, formatCountdown } from "@/lib/time/useLiveCountdown";
import type { IntentResult } from "@/types";

const SUGGESTIONS = [
  "can I afford a $2000 laptop?",
  "how long is 9:30 to 4:45?",
  "monthly payment on a $25000 loan at 6%",
  "what is 25% off $120",
];

/** The kinds of result panel the search can show. */
type PanelState =
  | { kind: "idle" }
  | { kind: "calculation"; result: IntentResult }
  | { kind: "missing-tool"; requestedName: string }
  | { kind: "no-result"; candidates: { toolId: string; name: string }[] };

/** Build the calculator URL with prefilled params. */
function calculatorUrl(toolId: string, params: Record<string, number | string>): string {
  const calc = getCalculator(toolId);
  if (!calc) return "/";
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    sp.set(k, String(v));
  }
  const qs = sp.toString();
  return `/calculator/${calc.slug}${qs ? `?${qs}` : ""}`;
}

/** Live countdown renderer for countdown intents. */
function LiveCountdownValue({ targetIso }: { targetIso: string }) {
  const parts = useLiveCountdown(targetIso);
  if (!parts) return <span className="text-muted">…</span>;
  if (parts.passed) return <span className="text-foreground">Already passed</span>;
  return <span className="text-foreground">{formatCountdown(parts)}</span>;
}

export function IntentSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [panel, setPanel] = useState<PanelState>({ kind: "idle" });

  function goToCalculator(toolId: string, params: Record<string, number | string>) {
    router.push(calculatorUrl(toolId, params));
  }

  function goToImprovement(requestedName: string) {
    const sp = new URLSearchParams({ category: "tool-request", tool: requestedName });
    router.push(`/improvement?${sp.toString()}`);
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;

    // 1. Calculation intent (existing natural-language engine). A confident
    //    calculation always wins over tool search.
    const intent = parseIntent(trimmed);
    const isConfidentCalc =
      intent.toolId !== null &&
      intent.confidence >= 0.45 &&
      (intent.tier === "high" || intent.tier === "medium");

    // Inline-computable intents (arithmetic, unit conversion, countdown,
    // duration-from-now) show a result panel rather than navigating away.
    if (intent.inlineResult || intent.liveCountdownTarget) {
      setPanel({ kind: "calculation", result: intent });
      return;
    }

    if (isConfidentCalc && intent.toolId) {
      // Auto-calculable: route straight to the calculator with prefilled
      // fields so it computes on landing.
      goToCalculator(intent.toolId, intent.parameters);
      return;
    }

    // 2. Tool search — exact / fuzzy match against the registry.
    const tool = matchTool(trimmed);
    if ((tool.kind === "exact" || tool.kind === "fuzzy") && tool.calculator) {
      goToCalculator(tool.calculator.id, {});
      return;
    }

    // 3. Missing tool — the user named a tool we don't implement.
    if (looksLikeToolRequest(trimmed)) {
      setPanel({ kind: "missing-tool", requestedName: tool.requestedName });
      return;
    }

    // 4. No identifiable intent — offer a few relevant tools, never the
    //    whole catalog.
    setPanel({
      kind: "no-result",
      candidates: intent.candidates.slice(0, 3).map((c) => ({ toolId: c.toolId, name: c.name })),
    });
  }

  return (
    <div className="w-full">
      <form onSubmit={submit} className="relative">
        <label htmlFor="intent-search" className="sr-only">
          Ask a question or search for a calculator
        </label>
        <input
          id="intent-search"
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (panel.kind !== "idle") setPanel({ kind: "idle" });
          }}
          placeholder="Ask QUANTIVA… e.g. can I afford a $2000 laptop?"
          className="input py-4 pl-5 pr-32 text-base"
          autoComplete="off"
        />
        <button
          type="submit"
          className="btn-primary absolute right-2 top-1/2 -translate-y-1/2 px-5 py-2"
        >
          Answer
        </button>
      </form>

      {panel.kind === "calculation" && (
        <div className="card mt-3 p-4" role="status">
          <p className="text-xs font-medium uppercase tracking-wide text-violet-soft">
            {panel.result.recognizedLabel ?? "Result"}
          </p>
          {panel.result.recognizedSummary && (
            <p className="mt-0.5 text-sm text-muted">{panel.result.recognizedSummary}</p>
          )}
          <p className="mt-2 text-xl font-semibold text-foreground">
            {panel.result.inlineResult ? (
              panel.result.inlineResult.value
            ) : panel.result.liveCountdownTarget ? (
              <LiveCountdownValue targetIso={panel.result.liveCountdownTarget} />
            ) : null}
          </p>
          {panel.result.toolId && (
            <button
              type="button"
              className="btn-ghost mt-3"
              onClick={() =>
                goToCalculator(panel.result.toolId as string, panel.result.parameters)
              }
            >
              Open calculator →
            </button>
          )}
        </div>
      )}

      {panel.kind === "missing-tool" && (
        <div className="card mt-3 p-4" role="status">
          <p className="text-sm font-semibold text-foreground">Tool not available yet</p>
          <p className="mt-1 text-sm text-muted">
            Sorry, this tool isn&apos;t implemented in QUANTIVA yet. You can request it and it may
            be considered for a future update.
          </p>
          <button
            type="button"
            className="btn-primary mt-4"
            onClick={() => goToImprovement(panel.requestedName)}
          >
            Request this tool
          </button>
        </div>
      )}

      {panel.kind === "no-result" && (
        <div className="card mt-3 p-4" role="status">
          <p className="text-sm font-semibold text-foreground">We couldn&apos;t identify that</p>
          <p className="mt-1 text-sm text-muted">
            Try searching for a calculator by name, or describe what you want to calculate.
          </p>
          {panel.candidates.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {panel.candidates.map((c) => (
                <button
                  key={c.toolId}
                  type="button"
                  className="chip hover:border-violet-500/50 hover:text-foreground"
                  onClick={() => goToCalculator(c.toolId, {})}
                >
                  {c.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setQuery(s)}
            className="chip hover:border-violet-500/50 hover:text-foreground"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
