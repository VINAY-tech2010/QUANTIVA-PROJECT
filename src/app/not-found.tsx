import Link from "next/link";
import type { Metadata } from "next";
import { CATEGORIES } from "@/data/categories";
import { IntentSearch } from "@/components/search/IntentSearch";
import { SITE } from "@/lib/seo";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false },
};

export default function NotFound() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="text-center">
        <p className="text-sm font-medium uppercase tracking-wider text-violet-soft">404</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          This page doesn&apos;t exist
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-muted">
          The address may be wrong, or the tool may have moved. Search QUANTIVA for the
          calculator you need instead.
        </p>
      </div>

      <div className="mx-auto mt-8 w-full max-w-2xl">
        <Suspense fallback={<div className="search-glass h-14" aria-hidden="true" />}>
          <IntentSearch />
        </Suspense>
      </div>

      <div className="mx-auto mt-12 max-w-3xl">
        <h2 className="text-center text-lg font-semibold">Browse {SITE.name} by category</h2>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {CATEGORIES.map((cat) => (
            <Link key={cat.slug} href={`/${cat.slug}`} className="chip hover:border-violet-500/50 hover:text-foreground">
              {cat.name}
            </Link>
          ))}
        </div>
        <p className="mt-8 text-center text-sm">
          <Link href="/" className="font-medium text-violet-soft hover:text-violet">
            Back to the homepage →
          </Link>
        </p>
      </div>
    </main>
  );
}
