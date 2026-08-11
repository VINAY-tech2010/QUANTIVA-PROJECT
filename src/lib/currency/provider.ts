import type { CurrencyCode, ExchangeRateTable } from "@/types";

/**
 * Exchange-rate provider abstraction. Implementations fetch a rate table for
 * a base currency. The active provider is selected via FX_PROVIDER env var.
 */
export interface ExchangeRateProvider {
  readonly name: string;
  fetchRates(base: CurrencyCode): Promise<ExchangeRateTable>;
}

/** Static development fallback rates (approximate, clearly marked). */
const FALLBACK_RATES: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  INR: 83.2,
  JPY: 149.5,
  AUD: 1.52,
  CAD: 1.36,
  CHF: 0.88,
  CNY: 7.24,
  SGD: 1.34,
  NZD: 1.64,
  SEK: 10.5,
  NOK: 10.7,
  DKK: 6.86,
  ZAR: 18.6,
  BRL: 4.97,
  MXN: 17.1,
  KRW: 1330,
  HKD: 7.82,
  AED: 3.67,
};

/**
 * Development fallback provider. Used when no live provider is configured or
 * the live provider fails. Rates are static approximations relative to USD and
 * are always flagged with isFallback so the UI can disclose they are estimates.
 */
export class FallbackProvider implements ExchangeRateProvider {
  readonly name = "fallback";

  async fetchRates(base: CurrencyCode): Promise<ExchangeRateTable> {
    const baseRate = FALLBACK_RATES[base];
    const timestamp = Date.now();
    if (baseRate === undefined) {
      throw new Error(`Unsupported base currency for fallback: ${base}`);
    }
    // Rebase the USD-relative table onto the requested base.
    const rates: Record<CurrencyCode, number> = {};
    for (const [code, usdRate] of Object.entries(FALLBACK_RATES)) {
      rates[code] = usdRate / baseRate;
    }
    return { base, rates, timestamp, isFallback: true };
  }
}

/**
 * Frankfurter provider (frankfurter.dev) — free ECB reference rates, no key.
 */
export class FrankfurterProvider implements ExchangeRateProvider {
  readonly name = "frankfurter";
  private readonly baseUrl: string;

  constructor(baseUrl = "https://api.frankfurter.dev/v1") {
    this.baseUrl = baseUrl;
  }

  async fetchRates(base: CurrencyCode): Promise<ExchangeRateTable> {
    const res = await fetch(`${this.baseUrl}/latest?base=${encodeURIComponent(base)}`, {
      // Server-side only; never exposed to the client.
      cache: "no-store",
    });
    if (!res.ok) {
      throw new Error(`Frankfurter request failed: ${res.status}`);
    }
    const json = (await res.json()) as { rates?: Record<string, number> };
    if (!json.rates || typeof json.rates !== "object") {
      throw new Error("Frankfurter returned an unexpected payload.");
    }
    // Ensure the base maps to 1 for internal consistency.
    const rates: Record<CurrencyCode, number> = { ...json.rates, [base]: 1 };
    return { base, rates, timestamp: Date.now(), isFallback: false };
  }
}

/** Resolve the configured provider, defaulting to Frankfurter. */
export function getProvider(): ExchangeRateProvider {
  const provider = (process.env.FX_PROVIDER ?? "frankfurter").toLowerCase();
  switch (provider) {
    case "frankfurter":
      return new FrankfurterProvider(process.env.FX_BASE_URL);
    case "fallback":
      return new FallbackProvider();
    default:
      return new FrankfurterProvider(process.env.FX_BASE_URL);
  }
}
