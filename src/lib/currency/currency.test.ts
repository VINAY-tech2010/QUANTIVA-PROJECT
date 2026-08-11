import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { formatCurrency, formatNumber, formatPercent } from "./formatter";
import { CurrencyService } from "./service";
import { FallbackProvider, FrankfurterProvider } from "./provider";
import type { ExchangeRateTable } from "@/types";

describe("formatCurrency", () => {
  it("formats USD with symbol and grouping", () => {
    expect(formatCurrency(1234.5, "USD")).toContain("$");
    expect(formatCurrency(1234.5, "USD")).toContain("1,234.50");
  });

  it("formats INR with its locale", () => {
    const out = formatCurrency(100000, "INR");
    expect(out).toContain("₹");
  });

  it("respects explicit decimal places", () => {
    const out = formatCurrency(5, "USD", { maximumFractionDigits: 0, minimumFractionDigits: 0 });
    expect(out).toContain("5");
    expect(out).not.toContain("5.00");
  });

  it("falls back gracefully for unknown currency", () => {
    const out = formatCurrency(10, "XXX" as never);
    expect(out).toContain("10.00");
  });
});

describe("formatNumber / formatPercent", () => {
  it("formats numbers with grouping", () => {
    expect(formatNumber(1234567)).toContain("1,234,567");
  });

  it("formats percents", () => {
    expect(formatPercent(12.34)).toContain("12.3");
  });
});

describe("FallbackProvider", () => {
  it("rebases static rates to a non-USD base", async () => {
    const provider = new FallbackProvider();
    const table = await provider.fetchRates("EUR");
    expect(table.base).toBe("EUR");
    expect(table.rates.EUR).toBe(1);
    expect(table.isFallback).toBe(true);
    // USD rate relative to EUR should be the reciprocal of EUR-per-USD.
    expect(table.rates.USD).toBeCloseTo(1 / 0.92, 5);
  });
});

describe("CurrencyService", () => {
  let service: CurrencyService;

  beforeEach(() => {
    service = new CurrencyService();
    service.clearCache();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("converts between currencies using the base table", async () => {
    // Force fallback provider by making fetch fail.
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    const usd = await service.convert(100, "USD", "EUR");
    expect(usd).toBeCloseTo(92, 0);
  });

  it("returns the same amount when from === to", async () => {
    expect(await service.convert(42, "USD", "USD")).toBe(42);
  });

  it("serves stale cache when the live provider fails after a success", async () => {
    const live: ExchangeRateTable = {
      base: "USD",
      rates: { USD: 1, EUR: 0.9 },
      timestamp: Date.now(),
      isFallback: false,
    };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ rates: { EUR: 0.9 } }) } as Response)
      .mockRejectedValueOnce(new Error("network down"));
    vi.stubGlobal("fetch", fetchMock);

    // First call populates cache from "live".
    const first = await service.getRates("USD");
    expect(first.rates.EUR).toBe(0.9);

    // Expire the cache entry by reaching into the service.
    // @ts-expect-error access private cache for test
    const entry = service.cache.get("USD") as { expiresAt: number };
    entry.expiresAt = Date.now() - 1;

    const second = await service.getRates("USD");
    expect(second.isFallback).toBe(true);
    expect(second.rates.EUR).toBe(0.9);
    expect(live.base).toBe("USD");
  });

  it("throws on a missing target rate", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    await expect(service.convert(10, "USD", "ZZZ" as never)).rejects.toThrow(
      /Missing exchange rate/,
    );
  });
});

describe("FrankfurterProvider", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("parses a live response and ensures base rate is 1", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ rates: { EUR: 0.9, INR: 83 } }),
      } as Response),
    );
    const provider = new FrankfurterProvider();
    const table = await provider.fetchRates("USD");
    expect(table.rates.USD).toBe(1);
    expect(table.rates.EUR).toBe(0.9);
    expect(table.isFallback).toBe(false);
  });

  it("throws when the response is not ok", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500 } as Response));
    const provider = new FrankfurterProvider();
    await expect(provider.fetchRates("USD")).rejects.toThrow();
  });
});
