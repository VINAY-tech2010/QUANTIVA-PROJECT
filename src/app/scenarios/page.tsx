"use client";

import { useState } from "react";
import Link from "next/link";
import type { Scenario } from "@/types";
import { loadScenarios, deleteScenario, renameScenario } from "@/lib/storage/scenarios";
import { getCalculator } from "@/data/calculators";
import { useClientSnapshot } from "@/lib/utils/useClientSnapshot";

const EMPTY: Scenario[] = [];

export default function ScenariosPage() {
  const persisted = useClientSnapshot<Scenario[]>("scenarios", loadScenarios, EMPTY);
  const [override, setOverride] = useState<Scenario[] | null>(null);
  const scenarios = override ?? persisted;
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const refresh = () => setOverride(loadScenarios());

  const startRename = (s: Scenario) => {
    setRenamingId(s.id);
    setRenameValue(s.name);
  };

  const commitRename = () => {
    if (renamingId && renameValue.trim()) {
      renameScenario(renamingId, renameValue.trim());
      refresh();
    }
    setRenamingId(null);
  };

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">
        <span className="text-gradient">Scenarios</span>
      </h1>
      <p className="mt-2 text-muted">Your saved what-if scenarios across all calculators.</p>

      {scenarios.length === 0 ? (
        <div className="card mt-8 flex items-center justify-center p-12 text-center">
          <p className="text-muted">
            No scenarios saved yet. Save a what-if scenario from any calculator that supports it.
          </p>
        </div>
      ) : (
        <ul className="mt-8 grid gap-3 sm:grid-cols-2">
          {scenarios.map((s) => {
            const calc = getCalculator(s.calculatorId);
            return (
              <li key={s.id} className="card flex flex-col gap-3 p-4">
                {renamingId === s.id ? (
                  <div className="flex items-center gap-2">
                    <input
                      className="input flex-1"
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") commitRename();
                        if (e.key === "Escape") setRenamingId(null);
                      }}
                      autoFocus
                      aria-label="Scenario name"
                    />
                    <button type="button" className="btn-primary px-3 py-2 text-sm" onClick={commitRename}>
                      Save
                    </button>
                  </div>
                ) : (
                  <p className="truncate font-medium">{s.name}</p>
                )}
                <div className="flex items-center justify-between">
                  <Link
                    href={`/calculator/${calc?.slug ?? s.calculatorId}`}
                    className="text-sm text-violet-soft hover:underline"
                  >
                    {calc?.name ?? s.calculatorId}
                  </Link>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      className="text-xs text-muted hover:text-foreground"
                      onClick={() => startRename(s)}
                    >
                      Rename
                    </button>
                    <button
                      type="button"
                      className="text-xs text-muted hover:text-rose-400"
                      onClick={() => {
                        deleteScenario(s.id);
                        refresh();
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
