import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { CATEGORIES } from "@/data/categories";
import { listCalculators } from "@/data/calculators";

/**
 * Edge middleware (deprecated convention kept for its Edge runtime — Next 16's
 * `proxy` convention is Node-only, which OpenNext Cloudflare does not
 * support).
 *
 * On the OpenNext worker, URLs that match no route are rendered through the
 * root not-found page, which streams with a 200 status (a soft 404). This
 * middleware checks the pathname before any rendering starts and answers with
 * a true 404 response for paths outside the known route set — the documented
 * way to get correct status codes (see the loading "Status Codes" notes).
 *
 * The valid-path set is derived from the same data that drives the sitemap,
 * so it stays in sync automatically. `_next/*`, file paths (any path
 * containing a ".") and /api/* are passed through untouched; Next and
 * OpenNext handle those themselves.
 */

const STATIC_PATHS = [
  "/",
  "/classical",
  "/countdown-timer",
  "/world-clock",
  "/improvement",
  "/about",
  "/contact",
  "/privacy",
  "/terms",
  "/disclaimer",
  "/cookies",
  "/accessibility",
  "/dashboard",
  "/history",
  "/scenarios",
  "/settings",
  "/opengraph-image",
  "/icon",
];

const VALID_PATHS = new Set<string>([
  ...STATIC_PATHS,
  ...CATEGORIES.map((c) => `/${c.slug}`),
  ...listCalculators().flatMap((c) => [
    `/calculator/${c.slug}`,
    `/calculator/${c.slug}/opengraph-image`,
  ]),
]);

const NOT_FOUND_HTML = `<!doctype html>
<html lang="en" data-theme="dark" style="color-scheme:dark">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Page not found | calkulater</title>
</head>
<body style="margin:0;background:#06060b;color:#f4f4f8;font-family:ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;-webkit-font-smoothing:antialiased">
<main style="max-width:960px;margin:0 auto;padding:5rem 1.5rem;text-align:center">
<p style="text-transform:uppercase;letter-spacing:.2em;font-size:13px;font-weight:600;color:#c4b5fd;margin:0">404</p>
<h1 style="font-size:2rem;font-weight:700;margin:.75rem 0 .5rem">This page doesn&#39;t exist</h1>
<p style="color:#9b9bb0;max-width:480px;margin:0 auto;line-height:1.6">The address may be wrong, or the tool may have moved. Try the homepage, or browse calkulater by category.</p>
<div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-top:24px">
${CATEGORIES.map(
  (c) =>
    `<a href="/${c.slug}" style="padding:6px 14px;border-radius:999px;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.04);color:#f4f4f8;text-decoration:none;font-size:14px">${c.name}</a>`,
).join("\n")}
</div>
<p style="margin-top:32px"><a href="/" style="color:#c4b5fd;font-weight:500;text-decoration:none">Back to the homepage &rarr;</a></p>
</main>
</body>
</html>`;

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Let Next and OpenNext handle assets, files and API routes.
  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/api/") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Normalize trailing slashes (Next would otherwise 308-redirect them).
  const normalized =
    pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;

  if (!VALID_PATHS.has(normalized)) {
    return new NextResponse(NOT_FOUND_HTML, {
      status: 404,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};

export const runtime = "experimental-edge";