import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/layout/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How QUANTIVA handles your data.",
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="August 11, 2026">
      <p>
        This Privacy Policy explains what information QUANTIVA collects, how it is used,
        and the choices you have. The short version: most of QUANTIVA runs in your
        browser, and we collect as little as possible.
      </p>

      <h2>Information stored on your device</h2>
      <p>
        QUANTIVA stores the following in your browser&rsquo;s local storage, on your device
        only. This data is not transmitted to our servers:
      </p>
      <ul>
        <li>Calculation history and saved calculations</li>
        <li>Saved what-if scenarios and budgets</li>
        <li>Preferences such as theme, accent color, sound, and currency</li>
      </ul>
      <p>You can clear this data at any time from your browser settings or the app.</p>

      <h2>Information you send us</h2>
      <p>
        If you submit the feedback or contact form, we receive the contents of that
        submission (category, message, and optionally your name, email, and subject) so we
        can read and respond to it. We use this only to operate and improve QUANTIVA. We
        do not sell your information or add you to marketing lists without your explicit
        consent.
      </p>

      <h2>Advertising</h2>
      <p>
        QUANTIVA may display advertising provided by third-party networks such as Google
        AdSense. When ads are enabled, these networks may use cookies or similar
        technologies to serve and measure ads, including personalized ads where permitted.
        You can control personalized advertising through your ad provider&rsquo;s settings and
        your browser. See our <Link href="/cookies">Cookie Policy</Link> for more.
      </p>

      <h2>Data security</h2>
      <p>
        Because most data stays on your device, the main risk to that data is local to
        your browser. Feedback submissions are transmitted to our email provider solely to
        deliver your message to the team.
      </p>

      <h2>Changes to this policy</h2>
      <p>
        We may update this policy from time to time. The &ldquo;last updated&rdquo; date above reflects
        the most recent revision.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about privacy? Reach us via the <Link href="/contact">contact page</Link>.
      </p>
    </LegalPage>
  );
}
