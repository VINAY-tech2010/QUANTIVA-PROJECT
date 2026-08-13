import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/layout/LegalPage";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "About QUANTIVA",
  description: "What QUANTIVA is and why it exists.",
  path: "/about",
});

export default function AboutPage() {
  return (
    <LegalPage title="About QUANTIVA">
      <p>
        QUANTIVA gives you instant answers to everyday decisions. It brings together a
        collection of fast, focused calculators for money, buying, time, health, science,
        and more — so you can get a clear number without digging through spreadsheets or
        dense articles.
      </p>
      <h2>What we believe</h2>
      <ul>
        <li>The calculator is the product. Everything else is secondary.</li>
        <li>Answers should be instant, clear, and honest about being estimates.</li>
        <li>Your data stays on your device whenever possible.</li>
      </ul>
      <h2>Your data</h2>
      <p>
        Most QUANTIVA tools run entirely in your browser. History, saved calculations,
        scenarios, and preferences are stored locally on your device — not on our servers.
        See our <Link href="/privacy">Privacy Policy</Link> for details.
      </p>
      <h2>Contact</h2>
      <p>
        Have a suggestion, found a bug, or want to request a feature? Visit the{" "}
        <Link href="/improvement">feedback page</Link> or our{" "}
        <Link href="/contact">contact page</Link>.
      </p>
    </LegalPage>
  );
}
