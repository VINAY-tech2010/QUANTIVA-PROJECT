import type { Metadata } from "next";
import { ClassicalCalculator } from "@/components/calculator/ClassicalCalculator";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Classical Calculator",
  description:
    "A fast, touch-friendly classical calculator with keyboard support. Add, subtract, multiply, divide, and percentages — no sign-in required.",
  path: "/classical",
});

export default function ClassicalPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          <span className="text-gradient">Classical Calculator</span>
        </h1>
        <p className="mt-2 text-muted">
          Quick arithmetic with keyboard and touch support. Press Enter to calculate.
        </p>
      </header>
      <ClassicalCalculator />
    </main>
  );
}
