import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

/** App icon — a bold "Q" monogram on the brand gradient. */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg,#a78bfa,#7c3aed 60%,#5b21b6)",
          color: "#ffffff",
          fontSize: 320,
          fontWeight: 800,
          borderRadius: 96,
        }}
      >
        Q
      </div>
    ),
    size,
  );
}
