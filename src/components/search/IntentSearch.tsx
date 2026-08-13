"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { parseIntent } from "@/lib/intent/parser";
import { matchTool, looksLikeToolRequest } from "@/lib/intent/tool-match";
import { getCalculator } from "@/data/calculators";
import { useLiveCountdown, formatCountdown } from "@/lib/time/useLiveCountdown";
import type { IntentResult } from "@/types";

const SUGGESTIONS = [
  "calculate live countdown to 12/03/2027",
  "500000 loan at 8% for 5 years",
  "what is 18% of 4500",
  "convert 10 miles to kilometers",
];

/** The kinds of result panel the search can show. */
type PanelState =
  | { kind: "idle" }
  | { kind: "calculation"; result: IntentResult }
  | { kind: "suggestion"; result: IntentResult; toolName: string }
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
  const searchParams = useSearchParams();
  // Deep link support for the sitelinks search box (?q=...): prefill the box
  // from the URL on first render, then auto-run the search once on mount.
  const initialQuery = searchParams.get("q") ?? "";
  const [query, setQuery] = useState(initialQuery);
  const [panel, setPanel] = useState<PanelState>({ kind: "idle" });

  useEffect(() => {
    if (initialQuery) runSearch(initialQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function goToCalculator(toolId: string, params: Record<string, number | string>) {
    router.push(calculatorUrl(toolId, params));
  }

  function goToImprovement(requestedName: string) {
    const sp = new URLSearchParams({ category: "tool-request", tool: requestedName });
    router.push(`/improvement?${sp.toString()}`);
  }

  function runSearch(raw?: string) {
    const trimmed = (raw ?? query).trim();
    if (!trimmed) return;

    // 1. Calculation intent (existing natural-language engine).
    const intent = parseIntent(trimmed);

    // Inline-computable intents (arithmetic, unit conversion, countdown,
    // duration-from-now) show a result panel rather than navigating away.
    if (intent.inlineResult || intent.liveCountdownTarget) {
      setPanel({ kind: "calculation", result: intent });
      return;
    }

    // 2. High confidence: open the correct tool automatically, prefilled so
    //    it computes on landing.
    if (
      intent.toolId !== null &&
      intent.tier === "high" &&
      intent.confidence >= 0.45 &&
      intent.autoCalculable
    ) {
      goToCalculator(intent.toolId, intent.parameters);
      return;
    }

    // 3. Tool search — an exact match ("loan", "mortgage", "countdown") always
    //    navigates straight to the tool.
    const tool = matchTool(trimmed);
    if (tool.kind === "exact" && tool.calculator) {
      goToCalculator(tool.calculator.id, {});
      return;
    }

    // 4. Medium confidence: show an interpretation suggestion with a clear
    //    action instead of guessing. Prefilled params travel with it.
    if (intent.toolId !== null && intent.confidence >= 0.45 && intent.tier === "medium") {
      const calc = getCalculator(intent.toolId);
      if (calc) {
        setPanel({ kind: "suggestion", result: intent, toolName: calc.name });
        return;
      }
    }

    // 5. Fuzzy tool match (typos, near names) — navigate directly.
    if (tool.kind === "fuzzy" && tool.calculator) {
      goToCalculator(tool.calculator.id, {});
      return;
    }

    // 6. Missing tool — the user named a tool we don't implement.
    if (looksLikeToolRequest(trimmed)) {
      setPanel({ kind: "missing-tool", requestedName: tool.requestedName });
      return;
    }

    // 7. No identifiable intent — offer a few relevant tools, never the
    //    whole catalog.
    setPanel({
      kind: "no-result",
      candidates: intent.candidates.slice(0, 3).map((c) => ({ toolId: c.toolId, name: c.name })),
    });
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    runSearch();
  }

  return (
    <div className="w-full">
      <form onSubmit={submit} className="search-glass">
        <label htmlFor="intent-search" className="sr-only">
          Ask a question or search for a calculator
        </label>
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </span>
        <input
          id="intent-search"
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (panel.kind !== "idle") setPanel({ kind: "idle" });
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              runSearch();
            }
          }}
          placeholder="What do you need to calculate?"
          className="input py-4 pl-11 pr-32 text-base"
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
        <div className="panel-glass mt-3 p-4" role="status">
          <p className="text-xs font-medium uppercase tracking-wide text-violet-soft">
            Understanding: {panel.result.recognizedLabel ?? "Result"}
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

      {panel.kind === "suggestion" && (
        <div className="panel-glass mt-3 p-4" role="status">
          <p className="text-xs font-medium uppercase tracking-wide text-violet-soft">
            Understanding: {panel.result.recognizedLabel ?? panel.toolName}
          </p>
          <p className="mt-1 text-sm text-muted">
            Looks like you&apos;re trying to calculate{" "}
            {panel.result.recognizedSummary ?? panel.toolName.toLowerCase()}.
          </p>
          {panel.result.missingLabels && panel.result.missingLabels.length > 0 && (
            <p className="mt-1 text-sm text-muted">
              Still needed: {panel.result.missingLabels.join(", ")} — you can fill{" "}
              {panel.result.missingLabels.length === 1 ? "it" : "them"} in on the calculator.
            </p>
          )}
          <button
            type="button"
            className="btn-primary mt-3"
            onClick={() => goToCalculator(panel.result.toolId as string, panel.result.parameters)}
          >
            Open {panel.toolName} →
          </button>
        </div>
      )}

      {panel.kind === "missing-tool" && (
        <div className="panel-glass mt-3 p-4" role="status">
          <p className="text-sm font-semibold text-foreground">Tool not available yet</p>
          <p className="mt-1 text-sm text-muted">
            Sorry, this tool isn&apos;t implemented in calkulater yet. You can request it and it may
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
        <div className="panel-glass mt-3 p-4" role="status">
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
