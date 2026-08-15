import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Calculation History",
  description: "Your recent calkulater calculations, stored locally on this device.",
  robots: { index: false },
};

export default function HistoryLayout({ children }: { children: React.ReactNode }) {
  return children;
}