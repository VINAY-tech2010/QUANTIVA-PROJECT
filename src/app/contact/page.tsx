import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/layout/LegalPage";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Contact",
  description: "How to get in touch with the QUANTIVA team.",
  path: "/contact",
});

export default function ContactPage() {
  return (
    <LegalPage title="Contact us">
      <p>
        The fastest way to reach us is through the QUANTIVA feedback form. It handles
        questions, feature requests, bug reports, complaints, and general messages, and
        routes them straight to the team.
      </p>
      <p>
        <Link href="/improvement">Open the contact &amp; feedback form →</Link>
      </p>
      <h2>What to include</h2>
      <ul>
        <li>A short subject so we can route your message quickly.</li>
        <li>For bug reports: the page you were on and what you expected to happen.</li>
        <li>Your email address if you&rsquo;d like a reply (optional).</li>
      </ul>
      <h2>Response time</h2>
      <p>
        We read every message. If you leave an email address and your message needs a
        reply, we&rsquo;ll get back to you as soon as we can.
      </p>
    </LegalPage>
  );
}
