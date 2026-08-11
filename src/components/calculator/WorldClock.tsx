"use client";

import { useEffect, useState } from "react";

interface ClockZone {
  zone: string;
  label: string;
}

const DEFAULT_ZONES: ClockZone[] = [
  { zone: "UTC", label: "UTC" },
  { zone: "America/New_York", label: "New York" },
  { zone: "Europe/London", label: "London" },
  { zone: "Europe/Paris", label: "Paris" },
  { zone: "Asia/Dubai", label: "Dubai" },
  { zone: "Asia/Kolkata", label: "Mumbai" },
  { zone: "Asia/Tokyo", label: "Tokyo" },
  { zone: "Australia/Sydney", label: "Sydney" },
];

function formatInZone(zone: string, now: Date): { time: string; date: string } {
  const time = new Intl.DateTimeFormat("en-US", {
    timeZone: zone,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(now);
  const date = new Intl.DateTimeFormat("en-US", {
    timeZone: zone,
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(now);
  return { time, date };
}

/**
 * World clock — live current time across several IANA time zones.
 * Updates every second and cleans up its interval on unmount.
 */
export function WorldClock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const update = () => setNow(new Date());
    const seed = window.setTimeout(update, 0);
    const id = window.setInterval(update, 1000);
    return () => {
      window.clearTimeout(seed);
      window.clearInterval(id);
    };
  }, []);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {DEFAULT_ZONES.map(({ zone, label }) => {
        const { time, date } = now ? formatInZone(zone, now) : { time: "--:--:--", date: "" };
        return (
          <div key={zone} className="card p-5">
            <p className="text-sm font-medium text-muted">{label}</p>
            <p className="mt-2 text-2xl font-bold tabular-nums tracking-tight text-foreground">
              {time}
            </p>
            <p className="mt-1 text-xs text-muted">{date}</p>
          </div>
        );
      })}
    </div>
  );
}
