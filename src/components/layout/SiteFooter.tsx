import Link from "next/link";
import { CATEGORIES } from "@/data/categories";

const COMPANY_LINKS = [
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/improvement", label: "Feedback" },
];

const LEGAL_LINKS = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Use" },
  { href: "/disclaimer", label: "Disclaimer" },
  { href: "/cookies", label: "Cookie Policy" },
  { href: "/accessibility", label: "Accessibility" },
];

const FAQ_ITEMS = [
  {
    question: "How do I use QUANTIVA?",
    answer:
      "Type a question or calculator request in the search box, then choose an answer or follow the best matching tool.",
  },
  {
    question: "Can I use this for finance, health, or time planning?",
    answer:
      "Yes. QUANTIVA covers everyday money, health, time, productivity, and decision tools with easy-to-read results.",
  },
  {
    question: "Is the site free to use?",
    answer: "Yes, QUANTIVA is free to use and designed to help you make smarter decisions quickly.",
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-white/5 py-10">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-lg font-bold text-gradient">QUANTIVA</p>
          <p className="mt-2 text-sm text-muted">
            Instant answers to everyday decisions.
          </p>
        </div>

        <nav aria-label="Tools">
          <p className="text-sm font-semibold text-foreground">Tools</p>
          <ul className="mt-2 flex flex-col gap-1.5">
            {CATEGORIES.slice(0, 6).map((c) => (
              <li key={c.slug}>
                <Link href={`/${c.slug}`} className="text-sm text-muted hover:text-foreground">
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Company">
          <p className="text-sm font-semibold text-foreground">Company</p>
          <ul className="mt-2 flex flex-col gap-1.5">
            {COMPANY_LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-sm text-muted hover:text-foreground">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          <ul className="mt-3 flex flex-col gap-1.5">
            {LEGAL_LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-sm text-muted hover:text-foreground">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div aria-label="FAQ">
          <p className="text-sm font-semibold text-foreground">FAQ</p>
          <div className="mt-2 space-y-4 text-sm text-muted">
            {FAQ_ITEMS.map((item) => (
              <div key={item.question}>
                <p className="font-medium text-foreground">{item.question}</p>
                <p className="mt-1 leading-relaxed">{item.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto mt-8 max-w-6xl px-4 sm:px-6">
        <p className="text-xs text-muted">
          © {new Date().getFullYear()} QUANTIVA. Results are estimates for informational
          purposes only — not financial advice.
        </p>
      </div>
    </footer>
  );
}
