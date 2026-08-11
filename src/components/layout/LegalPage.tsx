import type { ReactNode } from "react";

interface Props {
  title: string;
  updated?: string;
  children: ReactNode;
}

/**
 * Shared shell for informational/legal pages. Provides consistent typography
 * and spacing so each legal page only supplies its content.
 */
export function LegalPage({ title, updated, children }: Props) {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">
        <span className="text-gradient">{title}</span>
      </h1>
      {updated && <p className="mt-2 text-sm text-muted">Last updated: {updated}</p>}
      <div className="legal-body mt-6 flex flex-col gap-5 text-sm leading-relaxed text-muted">
        {children}
      </div>
    </main>
  );
}
