import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/layout/LegalPage";

export const metadata: Metadata = {
  title: "Accessibility",
  description: "QUANTIVA's commitment to accessibility.",
};

export default function AccessibilityPage() {
  return (
    <LegalPage title="Accessibility" updated="August 11, 2026">
      <p>
        QUANTIVA is built to be usable by as many people as possible, including people who
        use keyboards, screen readers, or other assistive technologies.
      </p>

      <h2>What we do</h2>
      <ul>
        <li>Semantic HTML with labelled controls and landmarks</li>
        <li>Keyboard-navigable menus, dialogs, and forms</li>
        <li>Visible focus states and sufficient color contrast</li>
        <li>Responsive layouts that work across screen sizes and orientations</li>
        <li>Respect for reduced-motion preferences</li>
      </ul>

      <h2>Feedback</h2>
      <p>
        Accessibility is an ongoing effort. If you encounter a barrier — for example,
        something that is hard to reach by keyboard or read with a screen reader — please
        let us know through the <Link href="/improvement">feedback form</Link> so we can
        fix it.
      </p>
    </LegalPage>
  );
}
