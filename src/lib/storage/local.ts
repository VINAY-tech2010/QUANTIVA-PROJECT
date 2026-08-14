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

/**
 * Copy a key's raw value to `${key}-legacy` so a future storage-format change
 * never silently destroys a user's data: the new format reads the fresh key,
 * while the legacy copy stays available for manual recovery.
 */
export function backupRaw(key: string): void {
  if (!storageAvailable()) return;
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    if (raw !== null) window.localStorage.setItem(PREFIX + key + "-legacy", raw);
  } catch {
    // best effort only
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
