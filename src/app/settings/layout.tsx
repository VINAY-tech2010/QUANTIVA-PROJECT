import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings",
  description: "Personalize calkulater appearance, sound and currency preferences.",
  robots: { index: false },
};

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return children;
}