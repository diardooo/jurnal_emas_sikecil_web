import { ImageResponse } from "next/og";

/** Dimensions shared by the Open Graph and Twitter card routes. */
export const ogSize = { width: 1200, height: 630 };

/**
 * Branded social-share card rendered at request time (no static asset needed).
 * Reused by app/opengraph-image.tsx and app/twitter-image.tsx.
 */
export function renderOgCard() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background:
            "linear-gradient(135deg, #1A1A2E 0%, #232347 55%, #1A1A2E 100%)",
          fontFamily: "sans-serif",
        }}
      >
        {/* Logo mark: gold tile + star */}
        <div style={{ display: "flex", alignItems: "center", gap: "28px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "112px",
              height: "112px",
              borderRadius: "28px",
              background: "linear-gradient(135deg, #E0B84C 0%, #C9A227 100%)",
            }}
          >
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2.5l2.6 5.5 6 .8-4.4 4.2 1.1 6L12 16.9 6.7 19l1.1-6L3.4 8.8l6-.8L12 2.5z"
                fill="#1A1A2E"
              />
            </svg>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span
              style={{
                fontSize: "30px",
                fontWeight: 800,
                color: "#F5F1E6",
                lineHeight: 1,
              }}
            >
              Jurnal Emas
            </span>
            <span
              style={{
                fontSize: "20px",
                fontWeight: 700,
                letterSpacing: "6px",
                color: "#C9A227",
                marginTop: "8px",
              }}
            >
              SI KECIL
            </span>
          </div>
        </div>

        {/* Headline */}
        <div
          style={{
            display: "flex",
            fontSize: "68px",
            fontWeight: 800,
            color: "#F5F1E6",
            lineHeight: 1.1,
            marginTop: "64px",
            maxWidth: "920px",
          }}
        >
          Pendamping Tumbuh Kembang Anak 0–6 Tahun
        </div>

        {/* Subline */}
        <div
          style={{
            display: "flex",
            fontSize: "30px",
            color: "#B8B5C8",
            marginTop: "28px",
            maxWidth: "880px",
          }}
        >
          Milestone, jurnal, habit, & goal si Kecil dalam satu aplikasi.
        </div>
      </div>
    ),
    { ...ogSize },
  );
}
