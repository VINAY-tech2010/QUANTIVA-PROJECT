import type { Metadata } from "next";

/** Canonical site configuration used across metadata, sitemap and JSON-LD. */
export const SITE = {
  name: "calkulater",
  tagline: "Instant answers to everyday decisions",
  description:
    "calkulater is a premium decision and calculation utility. Instant answers to everyday money, buying, time and productivity questions.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://calkulater.app",
} as const;

interface PageMetaInput {
  title: string;
  description: string;
  /** Path beginning with "/", used for canonical + OG URL. */
  path: string;
  /**
   * Optional path (beginning with "/") to a page-specific Open Graph image.
   * Defaults to the site-wide "/opengraph-image".
   */
  ogImagePath?: string;
}

/**
 * Build consistent Metadata with canonical, OpenGraph and Twitter cards.
 * Never emits a `keywords` meta tag — page terminology should come from real
 * content, not metadata lists.
 */
export function buildMetadata({ title, description, path, ogImagePath }: PageMetaInput): Metadata {
  const url = `${SITE.url}${path}`;
  const ogImage = `${SITE.url}${ogImagePath ?? "/opengraph-image"}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE.name,
      type: "website",
      images: [{ url: ogImage, width: 1200, height: 630, alt: `${SITE.name} — ${title}` }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

/**
 * Derive a unique, descriptive <title> for a calculator page from its name
 * and one-line supporting text, e.g.
 * "Loan Calculator – Monthly Payment, Total Repayment and Total Interest".
 * Kept under a length cap so search results show the full title.
 */
export function seoTitle(name: string, supporting: string): string {
  const LIMIT = 71;
  const suffix = supporting.replace(/\.$/, "").trim();
  if (!suffix) return name;
  const joined = `${name} – ${suffix.charAt(0).toUpperCase()}${suffix.slice(1)}`;
  if (joined.length <= LIMIT) return joined;
  // Reserve 4 chars for " – " + "…", then cut on a word boundary: keep the
  // last word when it ends exactly at the budget (e.g. "…total interest").
  const budget = LIMIT - name.length - 4;
  const isBoundary = budget >= suffix.length || /\s/.test(suffix.charAt(budget));
  const cut = isBoundary ? budget : suffix.lastIndexOf(" ", budget);
  return `${name} – ${suffix.slice(0, cut).trimEnd()}…`;
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

/**
 * JSON-LD WebSite + potentialAction SearchAction. Enables the Google
 * "sitelinks search box" so users can search calkulater directly from the
 * search results page.
 */
export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE.name,
    alternateName: `${SITE.name} Calculators`,
    url: SITE.url,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE.url}/?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/** JSON-LD Organization block for brand/entity recognition. */
export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE.name,
    url: SITE.url,
    logo: `${SITE.url}/icon.svg`,
    description: SITE.description,
  };
}

/** JSON-LD FAQPage block — eligible for FAQ rich results. */
export function faqJsonLd(faqs: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
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
