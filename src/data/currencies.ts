import type { Currency, CurrencyCode } from "@/types";

/**
 * Supported currencies. The active exchange-rate provider (Frankfurter / ECB)
 * supports this set. Each entry carries formatting metadata so the UI can
 * render amounts correctly without hardcoding symbols anywhere else.
 */
export const CURRENCIES: readonly Currency[] = [
  { code: "USD", name: "US Dollar", symbol: "$", decimals: 2, locale: "en-US" },
  { code: "EUR", name: "Euro", symbol: "€", decimals: 2, locale: "de-DE" },
  { code: "GBP", name: "British Pound", symbol: "£", decimals: 2, locale: "en-GB" },
  { code: "INR", name: "Indian Rupee", symbol: "₹", decimals: 2, locale: "en-IN" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥", decimals: 0, locale: "ja-JP" },
  { code: "AUD", name: "Australian Dollar", symbol: "A$", decimals: 2, locale: "en-AU" },
  { code: "CAD", name: "Canadian Dollar", symbol: "C$", decimals: 2, locale: "en-CA" },
  { code: "CHF", name: "Swiss Franc", symbol: "CHF ", decimals: 2, locale: "de-CH" },
  { code: "CNY", name: "Chinese Yuan", symbol: "¥", decimals: 2, locale: "zh-CN" },
  { code: "SGD", name: "Singapore Dollar", symbol: "S$", decimals: 2, locale: "en-SG" },
  { code: "NZD", name: "New Zealand Dollar", symbol: "NZ$", decimals: 2, locale: "en-NZ" },
  { code: "SEK", name: "Swedish Krona", symbol: "kr ", decimals: 2, locale: "sv-SE" },
  { code: "NOK", name: "Norwegian Krone", symbol: "kr ", decimals: 2, locale: "nb-NO" },
  { code: "DKK", name: "Danish Krone", symbol: "kr ", decimals: 2, locale: "da-DK" },
  { code: "ZAR", name: "South African Rand", symbol: "R ", decimals: 2, locale: "en-ZA" },
  { code: "BRL", name: "Brazilian Real", symbol: "R$", decimals: 2, locale: "pt-BR" },
  { code: "MXN", name: "Mexican Peso", symbol: "MX$", decimals: 2, locale: "es-MX" },
  { code: "KRW", name: "South Korean Won", symbol: "₩", decimals: 0, locale: "ko-KR" },
  { code: "HKD", name: "Hong Kong Dollar", symbol: "HK$", decimals: 2, locale: "zh-HK" },
  { code: "AED", name: "UAE Dirham", symbol: "د.إ ", decimals: 2, locale: "ar-AE" },
] as const;

export const DEFAULT_CURRENCY: CurrencyCode = "USD";

const CURRENCY_MAP = new Map<CurrencyCode, Currency>(
  CURRENCIES.map((c) => [c.code, c]),
);

export function getCurrency(code: CurrencyCode): Currency {
  const currency = CURRENCY_MAP.get(code);
  if (!currency) {
    // Fall back to USD metadata rather than throwing so the UI never breaks
    // on an unexpected code; callers can detect the mismatch if needed.
    return CURRENCY_MAP.get(DEFAULT_CURRENCY) as Currency;
  }
  return currency;
}

export function isSupportedCurrency(code: string): code is CurrencyCode {
  return CURRENCY_MAP.has(code);
}

export function listCurrencies(): readonly Currency[] {
  return CURRENCIES;
}
