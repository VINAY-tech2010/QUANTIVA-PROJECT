import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CATEGORIES, getCategory, isCategorySlug } from "@/data/categories";
import { calculatorsByCategory } from "@/data/calculators";
import { buildMetadata, breadcrumbJsonLd } from "@/lib/seo";

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ category: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  if (!isCategorySlug(category)) return {};
  const cat = getCategory(category);
  return buildMetadata({
    title: cat.name,
    description: cat.description,
    path: `/${cat.slug}`,
  });
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  if (!isCategorySlug(category)) notFound();
  const cat = getCategory(category);
  const tools = calculatorsByCategory(category);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbJsonLd([
              { name: "Home", path: "/" },
              { name: cat.name, path: `/${cat.slug}` },
            ]),
          ),
        }}
      />
      <nav className="mb-6 text-sm text-muted" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-foreground">Home</Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{cat.name}</span>
      </nav>

      <header className="mb-10">
        <p className="text-sm font-medium uppercase tracking-wider text-violet-soft">
          {cat.name}
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{cat.tagline}</h1>
        <p className="mt-3 max-w-2xl text-muted">{cat.description}</p>
      </header>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool) => (
          <Link
            key={tool.id}
            href={`/calculator/${tool.slug}`}
            className="card card-hover flex flex-col p-6"
          >
            <h2 className="text-lg font-semibold">{tool.question}</h2>
            <p className="mt-2 flex-1 text-sm text-muted">{tool.supporting}</p>
            <span className="mt-4 text-sm font-medium text-violet-soft">
              Open {tool.name} →
            </span>
          </Link>
        ))}
      </div>
    </main>
  );
}
