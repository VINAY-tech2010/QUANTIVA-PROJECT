"use client";

import { useEffect } from "react";
import Link from "next/link";

/**
 * Global error boundary — last resort. Replaces the entire document when the
 * root layout itself fails, so it must render its own <html>/<body> and inline
 * styles (global stylesheets are not applied here).
 */
export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0b0a10", color: "#f2f0f7", fontFamily: "system-ui, sans-serif" }}>
        <div style={{ textAlign: "center", padding: "2rem", maxWidth: "36rem" }}>
          <p style={{ fontSize: "0.75rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#a78bfa", margin: 0 }}>
            Error
          </p>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, margin: "0.75rem 0 0" }}>
            Something went wrong
          </h1>
          <p style={{ color: "#9a94ab", marginTop: "0.75rem", lineHeight: 1.6 }}>
            Please try again, or visit the homepage if the problem persists.
          </p>
          <div style={{ marginTop: "1.5rem", display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={retry}
              style={{
                padding: "0.6rem 1.25rem",
                borderRadius: "0.5rem",
                border: "none",
                cursor: "pointer",
                background: "#7c6cf0",
                color: "#fff",
                fontWeight: 600,
              }}
            >
              Try again
            </button>
            <Link
              href="/"
              style={{
                padding: "0.6rem 1.25rem",
                borderRadius: "0.5rem",
                border: "1px solid #3c3648",
                color: "#f2f0f7",
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              Back to the homepage
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}