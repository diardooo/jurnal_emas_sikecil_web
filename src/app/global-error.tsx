"use client";

import { useEffect } from "react";

/**
 * Last-resort boundary for errors thrown in the root layout itself. It replaces
 * the whole document, so it ships its own <html>/<body> and uses inline styles
 * (the app stylesheet may not be available here).
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="id">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#FFFDF7",
          fontFamily: "system-ui, sans-serif",
          color: "#1A1A2E",
          padding: "24px",
        }}
      >
        <div style={{ maxWidth: 420, textAlign: "center" }}>
          <p style={{ fontSize: 48, margin: 0 }}>🌧️</p>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginTop: 12 }}>
            Ada yang tidak beres
          </h1>
          <p style={{ fontSize: 14, color: "#5C5A6B", marginTop: 8 }}>
            Maaf, terjadi kesalahan tak terduga. Silakan muat ulang halaman.
          </p>
          <button
            onClick={reset}
            style={{
              marginTop: 20,
              padding: "10px 20px",
              borderRadius: 10,
              border: "none",
              background: "#C9A227",
              color: "#1A1A2E",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Coba Lagi
          </button>
        </div>
      </body>
    </html>
  );
}
