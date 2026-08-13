import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/layout/LegalPage";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Terms of Use",
  description: "The terms that govern your use of calkulater.",
  path: "/terms",
});

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Use" updated="August 11, 2026">
      <p>
        By using calkulater, you agree to these terms. If you do not agree, please do not
        use the site.
      </p>

      <h2>The service</h2>
      <p>
        calkulater provides online calculators and related tools for informational purposes.
        Results are estimates and may not reflect your exact situation.
      </p>

      <h2>Not professional advice</h2>
      <p>
        calkulater does not provide financial, legal, tax, medical, or other professional
        advice. Always consult a qualified professional before making decisions based on
        the results. See our <Link href="/disclaimer">Disclaimer</Link>.
      </p>

      <h2>Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Misuse the site or attempt to disrupt its operation</li>
        <li>Submit unlawful, harmful, or abusive content through our forms</li>
        <li>Attempt to access systems or data you are not authorized to access</li>
      </ul>

      <h2>Intellectual property</h2>
      <p>
        The calkulater name, design, and content are owned by the project. You may use the
        tools for their intended purpose; you may not copy or redistribute the site as a
        whole without permission.
      </p>

      <h2>Limitation of liability</h2>
      <p>
        calkulater is provided &ldquo;as is&rdquo; without warranties of any kind. To the fullest extent
        permitted by law, we are not liable for any damages arising from your use of the
        site or reliance on its results.
      </p>

      <h2>Changes</h2>
      <p>
        We may update these terms from time to time. Continued use after changes means you
        accept the updated terms.
      </p>
    </LegalPage>
  );
}
