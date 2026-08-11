import type { Metadata } from "next";

/** Canonical site configuration used across metadata, sitemap and JSON-LD. */
export const SITE = {
  name: "QUANTIVA",
  tagline: "Instant answers to everyday decisions",
  description:
    "QUANTIVA is a premium decision and calculation utility. Instant answers to everyday money, buying, time and productivity questions.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://quantiva.app",
} as const;

interface PageMetaInput {
  title: string;
  description: string;
  /** Path beginning with "/", used for canonical + OG URL. */
  path: string;
  keywords?: string[];
}

/** Build consistent Metadata with canonical, OpenGraph and Twitter cards. */
export function buildMetadata({ title, description, path, keywords }: PageMetaInput): Metadata {
  const url = `${SITE.url}${path}`;
  return {
    title,
    description,
    keywords,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE.name,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

/** JSON-LD for the overall web application. */
export function webAppJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: SITE.name,
    url: SITE.url,
    description: SITE.description,
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Any",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  };
}

/** JSON-LD breadcrumb list. */
export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${SITE.url}${item.path}`,
    })),
  };
}

/** JSON-LD FAQ / HowTo style block for an individual calculator. */
export function calculatorJsonLd(calc: {
  name: string;
  question: string;
  description: string;
  slug: string;
  methodology: string;
}) {
  const url = `${SITE.url}/calculator/${calc.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: calc.name,
    headline: calc.question,
    description: calc.description,
    url,
    about: {
      "@type": "Thing",
      name: calc.name,
      description: calc.methodology,
    },
  };
}
