"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAppStore } from "@/store/app-store";
import { LoadingScreen } from "@/components/app/loading-screen";

export function isDemo() {
  if (typeof document === "undefined") return false;
  return document.cookie.split("; ").some((c) => c === "demo=1");
}

export function StoreHydrator({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const hydrate = useAppStore((s) => s.hydrate);
  const hydrateDemo = useAppStore((s) => s.hydrateDemo);
  const hydrated = useAppStore((s) => s.hydrated);
  const childCount = useAppStore((s) => s.children.length);
  const started = useRef(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    if (isDemo()) {
      hydrateDemo();
    } else {
      hydrate().catch(() => setFailed(true));
    }
  }, [hydrate, hydrateDemo]);

  // No children yet → send the user through onboarding first.
  useEffect(() => {
    if (hydrated && childCount === 0 && pathname !== "/onboarding") {
      router.replace("/onboarding");
    }
  }, [hydrated, childCount, pathname, router]);

  if (failed) {
    return (
      <FullScreen>
        <p className="text-sm text-navy-muted">
          Gagal memuat data.{" "}
          <button
            onClick={() => location.reload()}
            className="font-semibold text-gold-700 underline"
          >
            Muat ulang
          </button>
        </p>
      </FullScreen>
    );
  }

  if (!hydrated || childCount === 0) {
    return <LoadingScreen />;
  }

  return <>{children}</>;
}

function FullScreen({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen place-items-center bg-secondary/30">
      <div className="flex flex-col items-center">{children}</div>
    </div>
  );
}
