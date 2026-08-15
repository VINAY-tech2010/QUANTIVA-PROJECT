import Link from "next/link";
import type { Metadata } from "next";
import { Suspense } from "react";
import { CATEGORIES } from "@/data/categories";
import { calculatorsByCategory } from "@/data/calculators";
import { IntentSearch } from "@/components/search/IntentSearch";
import { SITE, buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: `${SITE.name} — ${SITE.tagline}`,
  description: SITE.description,
  path: "/",
});

export default function Home() {
  return (
    <main className="mx-auto max-w-6xl px-4 sm:px-6">
      {/* Hero */}
      <section className="flex flex-col items-center py-20 text-center sm:py-28">
        <span className="chip mb-6">Premium decision utility</span>
        <h1 className="max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-6xl">
          Instant answers to <span className="text-gradient">everyday decisions</span>
        </h1>
        <p className="mt-5 max-w-xl text-lg text-muted">
          65 precise calculators for money, buying, time, health, science and more.
          Ask in plain language — get a clear, structured answer.
        </p>
        <div className="mt-10 w-full max-w-2xl">
          {/* Suspense keeps the page statically prerendered while the search
              box hydrates and reads the optional ?q= deep-link (used by the
              sitelinks search box JSON-LD). */}
          <Suspense fallback={<div className="search-glass h-14" aria-hidden="true" />}>
            <IntentSearch />
          </Suspense>
        </div>
      </section>

      {/* Categories */}
      {CATEGORIES.map((cat, i) => {
        const tools = calculatorsByCategory(cat.slug);
        return (
          <div key={cat.slug}>
            <section className="py-10">
              <div className="mb-6 flex items-end justify-between">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">{cat.name}</h2>
                  <p className="mt-1 text-sm text-muted">{cat.tagline}</p>
                </div>
                <Link
                  href={`/${cat.slug}`}
                  className="text-sm font-medium text-violet-soft hover:text-violet"
                >
                  View all →
                </Link>
              </div>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {tools.map((tool) => (
                  <Link
                    key={tool.id}
                    href={`/calculator/${tool.slug}`}
                    className="card card-hover flex flex-col p-6"
                  >
                    <h3 className="font-semibold">{tool.question}</h3>
                    <p className="mt-2 flex-1 text-sm text-muted">{tool.supporting}</p>
                    <span className="mt-4 text-sm font-medium text-violet-soft">
                      {tool.name} →
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          </div>
        );
      })}
    </main>
  );
}
