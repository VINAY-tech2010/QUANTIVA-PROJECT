import type { MetadataRoute } from "next";
import { SITE } from "@/lib/seo";
import { listCalculators } from "@/data/calculators";
import { CATEGORIES } from "@/data/categories";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE.url, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE.url}/dashboard`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE.url}/classical`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE.url}/countdown-timer`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE.url}/world-clock`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE.url}/improvement`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${SITE.url}/settings`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE.url}/history`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE.url}/scenarios`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];

  const categoryRoutes: MetadataRoute.Sitemap = CATEGORIES.map((c) => ({
    url: `${SITE.url}/${c.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const calculatorRoutes: MetadataRoute.Sitemap = listCalculators().map((c) => ({
    url: `${SITE.url}/calculator/${c.slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [...staticRoutes, ...categoryRoutes, ...calculatorRoutes];
}
