import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/layout/LegalPage";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Cookie Policy",
  description: "How calkulater uses cookies and similar technologies.",
  path: "/cookies",
});

export default function CookiesPage() {
  return (
    <LegalPage title="Cookie Policy" updated="August 11, 2026">
      <p>
        This policy explains how calkulater uses cookies and similar technologies. It should
        be read together with our <Link href="/privacy">Privacy Policy</Link>.
      </p>

      <h2>What we use</h2>
      <p>
        calkulater itself primarily uses your browser&rsquo;s <strong>local storage</strong> (not
        cookies) to remember your preferences, history, saved calculations, and scenarios.
        This data stays on your device.
      </p>

      <h2>Advertising cookies</h2>
      <p>
        When advertising is enabled, third-party ad networks such as HilltopAds may set or
        read cookies and use similar technologies to serve ads, limit how often you see an
        ad, measure effectiveness, and — where permitted — personalize ads based on your
        visits to this and other sites.
      </p>

      <h2>Your choices</h2>
      <ul>
        <li>
          You can clear local storage and cookies at any time through your browser settings.
        </li>
        <li>
          You can manage personalized advertising through your ad provider&rsquo;s ads settings
          and industry opt-out tools.
        </li>
        <li>
          Most browsers let you block or delete cookies; doing so may affect how some
          features behave.
        </li>
      </ul>

      <h2>Changes</h2>
      <p>
        We may update this policy as our use of cookies and similar technologies evolves.
        The &ldquo;last updated&rdquo; date above reflects the latest revision.
      </p>
    </LegalPage>
  );
}
