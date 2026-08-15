import type { Metadata } from "next";
import { DashboardClient } from "./DashboardClient";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  ...buildMetadata({
    title: "Dashboard",
    description: "Your calkulater history, scenarios and budgets.",
    path: "/dashboard",
  }),
  // Personal page backed by local device storage — not a search destination.
  robots: { index: false },
};

export default function DashboardPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      <p className="mt-3 text-muted">Your recent calculations, scenarios and budgets.</p>
      <div className="mt-8">
        <DashboardClient />
      </div>
    </main>
  );
}
