import { ImageResponse } from "next/og";
import { getCalculator } from "@/data/calculators";
import { SITE } from "@/lib/seo";

export const runtime = "nodejs";
export const alt = "QUANTIVA calculator";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function CalculatorOpengraphImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const calc = getCalculator(slug);
  const name = calc?.name ?? "Calculator";
  const question = calc?.question ?? SITE.tagline;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 80,
          background:
            "radial-gradient(60rem 40rem at 80% -10%, rgba(139,92,246,0.35), transparent 60%), radial-gradient(50rem 36rem at -10% 20%, rgba(109,40,217,0.3), transparent 55%), #0b0b12",
          color: "#f4f4f8",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            fontSize: 28,
            letterSpacing: 6,
            color: "#c4b5fd",
            textTransform: "uppercase",
          }}
        >
          {SITE.name}
        </div>
        <div
          style={{
            marginTop: 24,
            fontSize: 68,
            fontWeight: 800,
            lineHeight: 1.08,
            maxWidth: 900,
            background: "linear-gradient(90deg,#ddd6fe,#a78bfa 55%,#7c3aed)",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          {name}
        </div>
        <div style={{ marginTop: 24, fontSize: 30, color: "#a1a1b5", maxWidth: 860 }}>
          {question}
        </div>
      </div>
    ),
    size,
  );
}
