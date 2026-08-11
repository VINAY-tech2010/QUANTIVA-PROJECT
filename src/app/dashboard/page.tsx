import type { Metadata } from "next";
import { DashboardClient } from "./DashboardClient";
import { BetweenContentAd } from "@/components/ads/placements";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Dashboard",
  description: "Your QUANTIVA history, scenarios and budgets.",
  path: "/dashboard",
});

export default function DashboardPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      <p className="mt-3 text-muted">Your recent calculations, scenarios and budgets.</p>
      <div className="mt-8">
        <DashboardClient />
      </div>
      {/* Single optional ad below the dashboard content — never above navigation. */}
      <div className="mt-10">
        <BetweenContentAd />
      </div>
    </main>
  );
}
