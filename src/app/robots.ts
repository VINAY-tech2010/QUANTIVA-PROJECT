import type { MetadataRoute } from "next";
import { SITE } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Personal/utility areas backed by local device storage — not useful
        // search destinations. Indexable public tools all remain crawlable.
        disallow: ["/api/", "/dashboard", "/history", "/scenarios", "/settings"],
      },
    ],
    sitemap: `${SITE.url}/sitemap.xml`,
  };
}
