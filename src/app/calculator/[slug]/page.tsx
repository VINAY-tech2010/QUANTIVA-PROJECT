import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getCalculator, listCalculators } from "@/data/calculators";
import { getCategory } from "@/data/categories";
import { CalculatorForm, type CalculatorConfig } from "@/components/calculator/CalculatorForm";
import { PrefilledCalculator } from "@/components/calculator/PrefilledCalculator";
import { buildMetadata, breadcrumbJsonLd, calculatorJsonLd, seoTitle } from "@/lib/seo";

export function generateStaticParams() {
  return listCalculators().map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const calc = getCalculator(slug);
  if (!calc) return {};
  return buildMetadata({
    title: seoTitle(calc.name, calc.supporting),
    description: calc.description,
    path: `/calculator/${calc.slug}`,
    ogImagePath: `/calculator/${calc.slug}/opengraph-image`,
  });
}

export default async function CalculatorPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const calc = getCalculator(slug);
  if (!calc) notFound();

  const category = getCategory(calc.category);
  const related = calc.related
    .map((id) => getCalculator(id))
    .filter((c): c is NonNullable<typeof c> => Boolean(c));

  // Strip the non-serializable calculate function before crossing the
  // server/client boundary; the client resolves it from the registry by id.
  const config = Object.fromEntries(
    Object.entries(calc).filter(([k]) => k !== "calculate"),
  ) as CalculatorConfig;

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbJsonLd([
              { name: "Home", path: "/" },
              ...(category ? [{ name: category.name, path: `/${category.slug}` }] : []),
              { name: calc.name, path: `/calculator/${calc.slug}` },
            ]),
          ),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(calculatorJsonLd(calc)) }}
      />
      <nav className="mb-6 text-sm text-muted" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-foreground">Home</Link>
        <span className="mx-2">/</span>
        {category && (
          <>
            <Link href={`/${category.slug}`} className="hover:text-foreground">
              {category.name}
            </Link>
            <span className="mx-2">/</span>
          </>
        )}
        <span className="text-foreground">{calc.name}</span>
      </nav>

      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{calc.question}</h1>
        <p className="mt-3 max-w-2xl text-muted">{calc.supporting}</p>
      </header>

      <div className="flex flex-col gap-8 lg:flex-row">
        <div className="min-w-0 flex-1">
          {/* Suspense keeps the page static while the prefilled form hydrates
              and reads ?key=value deep links; without query params the plain
              form is the fallback, so nothing visually changes. */}
          <Suspense fallback={<CalculatorForm calculator={config} />}>
            <PrefilledCalculator calculator={config} />
          </Suspense>
        </div>
      </div>

      <section className="mt-12 max-w-3xl">
        <h2 className="text-lg font-semibold">How it works</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">{calc.methodology}</p>
        {calc.explanation && (
          <div className="mt-6 flex flex-col gap-6">
            <div>
              <h3 className="font-medium">Formula</h3>
              <p className="mt-1 rounded-lg border border-border bg-surface px-3 py-2 font-mono text-xs text-violet-soft">
                {calc.explanation.formula}
              </p>
            </div>
            {calc.explanation.steps.length > 0 && (
              <div>
                <h3 className="font-medium">Steps</h3>
                <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-muted">
                  {calc.explanation.steps.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ol>
              </div>
            )}
            {calc.explanation.interpretation && (
              <div>
                <h3 className="font-medium">What the result means</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted">
                  {calc.explanation.interpretation}
                </p>
              </div>
            )}
            {calc.explanation.assumptions.length > 0 && (
              <div>
                <h3 className="font-medium">Assumptions</h3>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted">
                  {calc.explanation.assumptions.map((a, i) => (
                    <li key={i}>{a}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </section>

      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="text-lg font-semibold">Related tools</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((r) => (
              <Link key={r.id} href={`/calculator/${r.slug}`} className="card card-hover p-5">
                <p className="font-medium">{r.name}</p>
                <p className="mt-1 text-sm text-muted">{r.question}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
