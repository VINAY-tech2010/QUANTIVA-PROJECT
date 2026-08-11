import type { StorageEnvelope, ThemeMode, UserPreferences } from "@/types";
import { DEFAULT_CURRENCY, isSupportedCurrency } from "@/data/currencies";
import { readRaw, writeRaw } from "./local";

const KEY = "preferences";
const VERSION = 1;

const THEME_MODES: ThemeMode[] = ["dark", "light", "system", "custom"];

const DEFAULTS: Required<UserPreferences> = {
  currency: DEFAULT_CURRENCY,
  hintsDismissed: false,
  theme: "dark",
  accentHue: 262,
  soundEnabled: true,
};

export function loadPreferences(): UserPreferences {
  const envelope = readRaw<StorageEnvelope<UserPreferences>>(KEY);
  if (!envelope || typeof envelope !== "object") return { ...DEFAULTS };
  if (envelope.version !== VERSION || !envelope.data) return { ...DEFAULTS };
  const data = envelope.data;
  return {
    currency:
      typeof data.currency === "string" && isSupportedCurrency(data.currency)
        ? data.currency
        : DEFAULTS.currency,
    hintsDismissed: Boolean(data.hintsDismissed),
    theme: THEME_MODES.includes(data.theme as ThemeMode) ? (data.theme as ThemeMode) : DEFAULTS.theme,
    accentHue:
      typeof data.accentHue === "number" && Number.isFinite(data.accentHue)
        ? Math.min(360, Math.max(0, data.accentHue))
        : DEFAULTS.accentHue,
    soundEnabled:
      typeof data.soundEnabled === "boolean" ? data.soundEnabled : DEFAULTS.soundEnabled,
  };
}

export function savePreferences(patch: Partial<UserPreferences>): boolean {
  const current = loadPreferences();
  const next: UserPreferences = { ...current, ...patch };
  const envelope: StorageEnvelope<UserPreferences> = { version: VERSION, data: next };
  return writeRaw(KEY, envelope);
}
