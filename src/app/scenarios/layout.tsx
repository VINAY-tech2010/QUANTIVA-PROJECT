import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Scenarios",
  description: "Your saved what-if scenarios across all calkulater calculators.",
  robots: { index: false },
};

export default function ScenariosLayout({ children }: { children: React.ReactNode }) {
  return children;
}