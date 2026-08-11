"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { parseIntent } from "@/lib/intent/parser";
import { getCalculator } from "@/data/calculators";

const SUGGESTIONS = [
  "can I afford a $2000 laptop?",
  "how long is 9:30 to 4:45?",
  "monthly payment on a $25000 loan at 6%",
  "what is 25% off $120",
];

export function IntentSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [candidates, setCandidates] = useState<{ toolId: string; name: string }[]>([]);

  function submit(e: FormEvent) {
    e.preventDefault();
    const result = parseIntent(query);
    if (result.toolId && result.confidence >= 0.45) {
      const calc = getCalculator(result.toolId);
      if (calc) {
        const params = new URLSearchParams();
        for (const [k, v] of Object.entries(result.parameters)) {
          params.set(k, String(v));
        }
        const qs = params.toString();
        router.push(`/calculator/${calc.slug}${qs ? `?${qs}` : ""}`);
        return;
      }
    }
    // Low confidence — show disambiguation.
    setCandidates(result.candidates.map((c) => ({ toolId: c.toolId, name: c.name })));
  }

  return (
    <div className="w-full">
      <form onSubmit={submit} className="relative">
        <label htmlFor="intent-search" className="sr-only">
          Ask a question
        </label>
        <input
          id="intent-search"
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (candidates.length) setCandidates([]);
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

      {candidates.length > 0 && (
        <div className="card mt-3 p-4">
          <p className="text-sm text-muted">Did you mean:</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {candidates.map((c) => (
              <button
                key={c.toolId}
                type="button"
                className="chip hover:border-violet-500/50 hover:text-foreground"
                onClick={() => router.push(`/calculator/${c.toolId}`)}
              >
                {c.name}
              </button>
            ))}
          </div>
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
