"use client";

import { useTheme } from "@/lib/theme/context";
import { useCurrency } from "@/lib/currency/context";
import { CURRENCIES } from "@/data/currencies";
import { loadPreferences, savePreferences } from "@/lib/storage/preferences";
import { useState } from "react";
import { playClick } from "@/lib/sound";
import { useClientSnapshot } from "@/lib/utils/useClientSnapshot";
import type { ThemeMode } from "@/types";

const THEME_OPTIONS: { value: ThemeMode; label: string; description: string }[] = [
  { value: "dark", label: "Dark", description: "Premium purple matte (default)" },
  { value: "light", label: "Light", description: "Clean bright interface" },
  { value: "system", label: "System", description: "Follow your device setting" },
  { value: "custom", label: "Custom", description: "Dark with your accent color" },
];

export default function SettingsPage() {
  const { mode, setMode, accentHue, setAccentHue } = useTheme();
  const { currency, setCurrency } = useCurrency();
  const persistedSound = useClientSnapshot<boolean>(
    "prefs:sound",
    () => loadPreferences().soundEnabled !== false,
    true,
  );
  const [soundOverride, setSoundOverride] = useState<boolean | null>(null);
  const sound = soundOverride ?? persistedSound;

  const toggleSound = (enabled: boolean) => {
    setSoundOverride(enabled);
    savePreferences({ soundEnabled: enabled });
    if (enabled) playClick();
  };

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">
        <span className="text-gradient">Settings</span>
      </h1>
      <p className="mt-2 text-muted">Personalize appearance, sound, and currency.</p>

      {/* Appearance */}
      <section className="card mt-8 p-6">
        <h2 className="text-lg font-semibold text-foreground">Appearance</h2>
        <p className="mt-1 text-sm text-muted">Choose how calkulater looks.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {THEME_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                setMode(opt.value);
                playClick();
              }}
              aria-pressed={mode === opt.value}
              className={`rounded-xl border p-4 text-left transition-colors ${
                mode === opt.value
                  ? "border-violet/60 bg-violet/10"
                  : "border-border bg-surface hover:border-violet/40"
              }`}
            >
              <div className="font-medium text-foreground">{opt.label}</div>
              <div className="mt-0.5 text-sm text-muted">{opt.description}</div>
            </button>
          ))}
        </div>

        {mode === "custom" && (
          <div className="mt-6">
            <label htmlFor="accent-hue" className="block text-sm font-medium text-foreground">
              Accent color
            </label>
            <div className="mt-2 flex items-center gap-4">
              <input
                id="accent-hue"
                type="range"
                min={0}
                max={360}
                value={accentHue}
                onChange={(e) => setAccentHue(Number(e.target.value))}
                className="h-2 w-full cursor-pointer appearance-none rounded-full"
                style={{
                  background:
                    "linear-gradient(90deg, hsl(0 72% 60%), hsl(60 72% 60%), hsl(120 72% 60%), hsl(180 72% 60%), hsl(240 72% 60%), hsl(300 72% 60%), hsl(360 72% 60%))",
                }}
              />
              <span
                className="h-8 w-8 shrink-0 rounded-full border border-border"
                style={{ background: `hsl(${accentHue} 72% 60%)` }}
                aria-hidden
              />
            </div>
          </div>
        )}
      </section>

      {/* Sound */}
      <section className="card mt-6 p-6">
        <h2 className="text-lg font-semibold text-foreground">Sound</h2>
        <p className="mt-1 text-sm text-muted">Tactile click feedback on interactions.</p>
        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm text-foreground">Sound effects</span>
          <button
            type="button"
            role="switch"
            aria-checked={sound}
            onClick={() => toggleSound(!sound)}
            className={`relative h-7 w-12 rounded-full transition-colors ${
              sound ? "bg-violet" : "bg-surface-2 border border-border"
            }`}
          >
            <span
              className={`absolute top-0.5 h-6 w-6 rounded-full bg-white transition-transform ${
                sound ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>
      </section>

      {/* Currency */}
      <section className="card mt-6 p-6">
        <h2 className="text-lg font-semibold text-foreground">Currency</h2>
        <p className="mt-1 text-sm text-muted">Default currency for money calculations.</p>
        <div className="mt-4">
          <label htmlFor="currency-select" className="sr-only">
            Currency
          </label>
          <select
            id="currency-select"
            value={currency}
            onChange={(e) => setCurrency(e.target.value as typeof currency)}
            className="input max-w-xs"
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code} — {c.name}
              </option>
            ))}
          </select>
        </div>
      </section>
    </main>
  );
}
