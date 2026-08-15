import type { MetadataRoute } from "next";
import { SITE } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Personal, device-local pages are not search destinations. The
        // matching pages also emit `robots: { index: false }` metadata; the
        // disallow here keeps crawlers from spending budget on them at all.
        disallow: ["/dashboard", "/history", "/scenarios", "/settings"],
      },
    ],
    sitemap: `${SITE.url}/sitemap.xml`,
  };
}