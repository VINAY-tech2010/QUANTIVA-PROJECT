"use client";

import { loadPreferences } from "@/lib/storage/preferences";

let ctx: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AC =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  if (!ctx) {
    try {
      ctx = new AC();
    } catch {
      return null;
    }
  }
  if (ctx.state === "suspended") {
    void ctx.resume().catch(() => undefined);
  }
  return ctx;
}

function soundEnabled(): boolean {
  return loadPreferences().soundEnabled !== false;
}

/**
 * Play a short tactile click. Respects the user's sound preference and
 * browser autoplay policies (context resumes on first user gesture).
 */
export function playClick(): void {
  if (!soundEnabled()) return;
  const audio = getContext();
  if (!audio) return;
  try {
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, audio.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440, audio.currentTime + 0.06);
    gain.gain.setValueAtTime(0.0001, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.08, audio.currentTime + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + 0.08);
    osc.connect(gain);
    gain.connect(audio.destination);
    osc.start(audio.currentTime);
    osc.stop(audio.currentTime + 0.09);
  } catch {
    // Ignore audio errors.
  }
}

/** Play a soft confirmation tone (for successful actions). */
export function playConfirm(): void {
  if (!soundEnabled()) return;
  const audio = getContext();
  if (!audio) return;
  try {
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(660, audio.currentTime);
    osc.frequency.setValueAtTime(880, audio.currentTime + 0.07);
    gain.gain.setValueAtTime(0.0001, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.06, audio.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + 0.16);
    osc.connect(gain);
    gain.connect(audio.destination);
    osc.start(audio.currentTime);
    osc.stop(audio.currentTime + 0.17);
  } catch {
    // Ignore audio errors.
  }
}
