"use client";

import { useState } from "react";
import { useLiveCountdown, formatCountdown } from "@/lib/time/useLiveCountdown";

/**
 * Live countdown timer.
 *
 * Computes `targetTime - Date.now()` on every tick (never a naive decrement),
 * recalculates when the tab regains focus, and always cleans up its interval.
 * Passed targets show "This date was X ago" (never a negative count).
 */
export function LiveCountdown() {
  const [target, setTarget] = useState<string>("");
  const [active, setActive] = useState<string | null>(null);
  const parts = useLiveCountdown(active);

  const start = () => {
    if (target && !Number.isNaN(Date.parse(target))) {
      setActive(new Date(target).toISOString());
    }
  };

  const reset = () => setActive(null);

  return (
    <div className="flex flex-col gap-6">
      <div className="card p-6">
        <label htmlFor="lc-target" className="mb-2 block text-sm font-medium text-foreground">
          Target date &amp; time
        </label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            id="lc-target"
            type="datetime-local"
            className="input flex-1"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
          />
          <div className="flex gap-2">
            <button type="button" className="btn-primary" onClick={start}>
              Start
            </button>
            {active && (
              <button type="button" className="btn-ghost" onClick={reset}>
                Reset
              </button>
            )}
          </div>
        </div>
        <p className="mt-2 text-xs text-muted">
          The countdown updates every second and stays accurate even if you switch tabs.
        </p>
      </div>

      {active && parts && (
        <div className="card p-8 text-center">
          {parts.passed ? (
            <>
              <p className="text-sm text-muted">This date was</p>
              <p className="mt-2 text-3xl font-bold tracking-tight text-foreground">
                {formatCountdown(parts)} ago
              </p>
            </>
          ) : (
            <>
              <p className="text-sm text-muted">Time remaining</p>
              <p className="mt-2 break-words text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {formatCountdown(parts)}
              </p>
              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Unit value={parts.days} label="days" />
                <Unit value={parts.hours} label="hours" />
                <Unit value={parts.minutes} label="minutes" />
                <Unit value={parts.seconds} label="seconds" />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function Unit({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 px-2 py-3">
      <p className="text-xl font-bold tabular-nums text-foreground sm:text-2xl">{String(value).padStart(2, "0")}</p>
      <p className="mt-1 text-xs text-muted">{label}</p>
    </div>
  );
}
