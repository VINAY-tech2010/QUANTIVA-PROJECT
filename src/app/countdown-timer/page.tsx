import type { Metadata } from "next";
import { LiveCountdown } from "@/components/calculator/LiveCountdown";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Live Countdown Timer",
  description:
    "A live countdown to any date and time. Updates every second, stays accurate when you switch tabs, and shows how long ago past dates were.",
  path: "/countdown-timer",
  keywords: ["countdown", "timer", "live countdown", "days until", "time remaining"],
});

export default function CountdownTimerPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          <span className="text-gradient">Live Countdown Timer</span>
        </h1>
        <p className="mt-2 text-muted">
          Pick a date and time to start a live, second-by-second countdown.
        </p>
      </header>
      <LiveCountdown />
    </main>
  );
}
