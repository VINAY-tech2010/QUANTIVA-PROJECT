"use client";

import { useEffect } from "react";
import Link from "next/link";

/**
 * Root error boundary. Catches unexpected runtime errors inside the app shell
 * (client or server components below the root layout) and shows recoverable
 * UI instead of a blank page.
 */
export default function Error({
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
    <main className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6">
      <p className="text-sm font-medium uppercase tracking-wider text-violet-soft">Error</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
        Something went wrong
      </h1>
      <p className="mx-auto mt-3 max-w-xl text-muted">
        This usually fixes itself. Try the calculation again, or head back to the homepage.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button type="button" className="btn-primary" onClick={retry}>
          Try again
        </button>
        <Link href="/" className="btn-ghost">
          Back to the homepage
        </Link>
      </div>
    </main>
  );
}