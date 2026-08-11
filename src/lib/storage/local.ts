/**
 * Safe localStorage access. Handles unavailable storage (SSR, private mode)
 * and corrupted JSON without throwing.
 */

const PREFIX = "quantiva:";

export function storageAvailable(): boolean {
  try {
    if (typeof window === "undefined" || !window.localStorage) return false;
    const key = `${PREFIX}__probe__`;
    window.localStorage.setItem(key, "1");
    window.localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

export function readRaw<T>(key: string): T | null {
  if (!storageAvailable()) return null;
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    if (raw === null) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function writeRaw<T>(key: string, value: T): boolean {
  if (!storageAvailable()) return false;
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function removeRaw(key: string): boolean {
  if (!storageAvailable()) return false;
  try {
    window.localStorage.removeItem(PREFIX + key);
    return true;
  } catch {
    return false;
  }
}

/** Remove every QUANTIVA key. Returns the number removed. */
export function clearAll(): number {
  if (!storageAvailable()) return 0;
  try {
    const keys: string[] = [];
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const k = window.localStorage.key(i);
      if (k && k.startsWith(PREFIX)) keys.push(k);
    }
    keys.forEach((k) => window.localStorage.removeItem(k));
    return keys.length;
  } catch {
    return 0;
  }
}
