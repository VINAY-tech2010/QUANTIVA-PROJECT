import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Help Us Improve",
  description:
    "Suggest improvements, request features, report bugs or request a new calculator for calkulater. We read every submission.",
  path: "/improvement",
});

export default function ImprovementLayout({ children }: { children: React.ReactNode }) {
  return children;
}