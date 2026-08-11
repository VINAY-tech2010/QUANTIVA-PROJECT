"use client";

import { useCurrency } from "@/lib/currency/context";
import { listCurrencies } from "@/data/currencies";
import type { CurrencyCode } from "@/types";

/**
 * Global currency selector. Switching updates every currency-dependent
 * component reactively — no page refresh.
 */
export function CurrencySelector({ className = "" }: { className?: string }) {
  const { currency, setCurrency, isFallback } = useCurrency();
  const currencies = listCurrencies();

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <label htmlFor="currency-select" className="sr-only">
        Currency
      </label>
      <select
        id="currency-select"
        value={currency}
        onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
        className="rounded-md border border-white/10 bg-zinc-900 px-2.5 py-1.5 text-sm text-zinc-100 outline-none transition-colors hover:border-violet-500/50 focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
        aria-label="Select currency"
      >
        {currencies.map((c) => (
          <option key={c.code} value={c.code}>
            {c.symbol} {c.code}
          </option>
        ))}
      </select>
      {isFallback && (
        <span
          className="text-xs text-amber-400"
          title="Live exchange rates unavailable — showing approximate rates."
        >
          approx.
        </span>
      )}
    </div>
  );
}
