import type { CurrencyCode, ExchangeRateTable } from "@/types";
import { FallbackProvider, getProvider } from "./provider";

interface CacheEntry {
  table: ExchangeRateTable;
  expiresAt: number;
}

const DEFAULT_TTL_SECONDS = 60 * 60; // 1 hour

function ttlMs(): number {
  const raw = Number.parseInt(process.env.FX_CACHE_TTL_SECONDS ?? "", 10);
  const seconds = Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_TTL_SECONDS;
  return seconds * 1000;
}

/**
 * Exchange-rate service with an in-memory cache and graceful fallback.
 * Server-side only.
 */
export class CurrencyService {
  private cache = new Map<CurrencyCode, CacheEntry>();

  async getRates(base: CurrencyCode): Promise<ExchangeRateTable> {
    const cached = this.cache.get(base);
    const now = Date.now();
    if (cached && cached.expiresAt > now) {
      return cached.table;
    }

    const provider = getProvider();
    try {
      const table = await provider.fetchRates(base);
      this.cache.set(base, { table, expiresAt: now + ttlMs() });
      return table;
    } catch {
      // Live provider failed. Serve a stale cache entry if we have one,
      // otherwise fall back to static development rates.
      if (cached) {
        return { ...cached.table, isFallback: true };
      }
      const fallback = await new FallbackProvider().fetchRates(base);
      this.cache.set(base, { table: fallback, expiresAt: now + ttlMs() });
      return fallback;
    }
  }

  /** Convert an amount between two currencies using the base's rate table. */
  async convert(amount: number, from: CurrencyCode, to: CurrencyCode): Promise<number> {
    if (from === to) return amount;
    const table = await this.getRates(from);
    const rate = table.rates[to];
    if (rate === undefined) {
      throw new Error(`Missing exchange rate for ${from} -> ${to}`);
    }
    return amount * rate;
  }

  /** Clear the cache (used by tests). */
  clearCache(): void {
    this.cache.clear();
  }
}

export const currencyService = new CurrencyService();
