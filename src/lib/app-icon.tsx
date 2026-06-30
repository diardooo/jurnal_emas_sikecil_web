import { ImageResponse } from "next/og";

/** A gold "JE" tile — used for the favicon, Apple touch icon, and PWA icons. */
export function renderAppIcon(size: number) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#C9A227",
          color: "#1B2A4A",
          fontSize: Math.round(size * 0.46),
          fontWeight: 800,
          fontFamily: "sans-serif",
          letterSpacing: -2,
        }}
      >
        JE
      </div>
    ),
    { width: size, height: size },
  );
}
