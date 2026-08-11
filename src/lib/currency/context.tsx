"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import type { CurrencyCode, ExchangeRateTable } from "@/types";
import { DEFAULT_CURRENCY, getCurrency, isSupportedCurrency } from "@/data/currencies";
import { formatCurrency as formatCurrencyFn } from "@/lib/currency/formatter";
import { loadPreferences, savePreferences } from "@/lib/storage/preferences";

interface CurrencyContextValue {
  /** Active currency code. */
  currency: CurrencyCode;
  /** Change the active currency; persists and re-fetches rates. */
  setCurrency: (code: CurrencyCode) => void;
  /** Format a value in the active currency. */
  format: (value: number) => string;
  /** Convert a value from one currency into the active currency. */
  convertToActive: (value: number, from: CurrencyCode) => number;
  /** Current rate table for the active currency (null while loading). */
  rates: ExchangeRateTable | null;
  /** True while the rate table is being fetched. */
  loading: boolean;
  /** True when the active rates are static development fallbacks. */
  isFallback: boolean;
  /** Currency symbol for the active currency. */
  symbol: string;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

/** Read the persisted currency from localStorage (client snapshot). */
function getPersistedCurrency(): CurrencyCode {
  const prefs = loadPreferences();
  return prefs.currency && isSupportedCurrency(prefs.currency)
    ? prefs.currency
    : DEFAULT_CURRENCY;
}

/** Server snapshot: always the default so SSR HTML matches first client render. */
function getServerCurrency(): CurrencyCode {
  return DEFAULT_CURRENCY;
}

/** localStorage is not reactive; subscribe is a no-op (preference changes go through setCurrency). */
function subscribeToCurrency(): () => void {
  return () => {};
}

export function CurrencyProvider({ children }: { children: ReactNode }) {
  // useSyncExternalStore reads the persisted currency on the client while
  // returning DEFAULT_CURRENCY on the server, so the first client render
  // matches the server HTML (avoids React hydration error #418) and React
  // re-renders with the persisted value immediately after hydration — without
  // a synchronous setState inside an effect.
  const persisted = useSyncExternalStore(
    subscribeToCurrency,
    getPersistedCurrency,
    getServerCurrency,
  );
  const [override, setOverride] = useState<CurrencyCode | null>(null);
  const currency = override ?? persisted;
  const [rates, setRates] = useState<ExchangeRateTable | null>(null);
  const [ratesFor, setRatesFor] = useState<CurrencyCode | null>(null);
  const requestId = useRef(0);

  // Fetch the rate table whenever the active currency changes.
  useEffect(() => {
    const id = ++requestId.current;
    let cancelled = false;

    fetch(`/api/fx?base=${encodeURIComponent(currency)}`, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`fx ${res.status}`))))
      .then((table: ExchangeRateTable) => {
        if (!cancelled && requestId.current === id) {
          setRates(table);
          setRatesFor(currency);
        }
      })
      .catch(() => {
        if (!cancelled && requestId.current === id) {
          // Keep prior rates if any; mark as fallback so UI can disclose.
          setRates((prev) =>
            prev
              ? { ...prev, isFallback: true }
              : { base: currency, rates: { [currency]: 1 }, timestamp: Date.now(), isFallback: true },
          );
          setRatesFor(currency);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [currency]);

  // Loading is true until we have a rate table for the active currency.
  const loading = ratesFor !== currency;

  const setCurrency = useCallback((code: CurrencyCode) => {
    if (!isSupportedCurrency(code)) return;
    setOverride(code);
    savePreferences({ currency: code });
  }, []);

  const format = useCallback(
    (value: number) => formatCurrencyFn(value, currency),
    [currency],
  );

  const convertToActive = useCallback(
    (value: number, from: CurrencyCode): number => {
      if (from === currency) return value;
      if (!rates) return value;
      // rates are relative to the active currency (base). To convert `from`
      // into the active currency: value_in_active = value / rate[from].
      const fromRate = rates.rates[from];
      if (fromRate === undefined || fromRate === 0) return value;
      return value / fromRate;
    },
    [currency, rates],
  );

  const value = useMemo<CurrencyContextValue>(
    () => ({
      currency,
      setCurrency,
      format,
      convertToActive,
      rates,
      loading,
      isFallback: rates?.isFallback ?? false,
      symbol: getCurrency(currency).symbol,
    }),
    [currency, setCurrency, format, convertToActive, rates, loading],
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency(): CurrencyContextValue {
  const ctx = useContext(CurrencyContext);
  if (!ctx) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return ctx;
}
