import type { Metadata } from "next";
import { WorldClock } from "@/components/calculator/WorldClock";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "World Clock",
  description:
    "Live current time across major world time zones. Updates every second.",
  path: "/world-clock",
});

export default function WorldClockPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          <span className="text-gradient">World Clock</span>
        </h1>
        <p className="mt-2 text-muted">
          The current time in major cities around the world, updating live.
        </p>
      </header>
      <WorldClock />
    </main>
  );
}
