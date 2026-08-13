import type { Metadata } from "next";
import { LegalPage } from "@/components/layout/LegalPage";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Disclaimer",
  description: "Important limitations on calkulater results.",
  path: "/disclaimer",
});

export default function DisclaimerPage() {
  return (
    <LegalPage title="Disclaimer" updated="August 11, 2026">
      <p>
        calkulater provides calculators and tools for general informational and educational
        purposes only. Please read this carefully before relying on any result.
      </p>

      <h2>Estimates, not advice</h2>
      <p>
        All results are estimates. They are not financial, investment, legal, tax, medical,
        or any other form of professional advice, and they do not account for your full
        personal circumstances.
      </p>

      <h2>No guarantee of accuracy</h2>
      <p>
        While we work hard to make our calculations correct, we do not warrant that results
        are accurate, complete, or current. Real-world figures (interest rates, prices,
        tax rules, health metrics, and so on) vary and change over time.
      </p>

      <h2>Your responsibility</h2>
      <p>
        Any decision you make based on calkulater results is your own. For significant
        financial, legal, health, or other decisions, consult a qualified professional who
        can consider your specific situation.
      </p>

      <h2>External services</h2>
      <p>
        Some features rely on third-party data (for example, currency exchange rates).
        We are not responsible for the accuracy or availability of that data.
      </p>
    </LegalPage>
  );
}
