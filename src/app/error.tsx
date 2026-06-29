"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

/**
 * Route-level error boundary. Catches render/runtime errors in the page subtree
 * and offers a recovery action instead of a blank screen. When Sentry is wired,
 * this is the place to report `error`.
 */
export default function Error({
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
    <div className="grid min-h-screen place-items-center bg-cream/40 px-4">
      <div className="flex max-w-md flex-col items-center text-center">
        <p className="text-5xl">🌧️</p>
        <h1 className="mt-4 font-display text-2xl font-extrabold text-navy">
          Ada yang tidak beres
        </h1>
        <p className="mt-2 text-sm text-navy-muted">
          Maaf, terjadi kesalahan tak terduga. Coba muat ulang halaman ini — data
          kamu aman.
        </p>
        <div className="mt-6 flex gap-3">
          <Button onClick={reset}>Coba Lagi</Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard">Ke Dashboard</Link>
          </Button>
        </div>
        {error.digest && (
          <p className="mt-4 text-[11px] text-muted-foreground">
            Kode: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
