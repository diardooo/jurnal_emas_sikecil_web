"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { useAppStore } from "@/store/app-store";

/** Enter read-only demo mode: load sample data, set a cookie so the app shell
 *  is reachable without an account, then go to the dashboard. */
export default function DemoEntry() {
  const router = useRouter();
  const hydrateDemo = useAppStore((s) => s.hydrateDemo);

  useEffect(() => {
    document.cookie = "demo=1; path=/; max-age=86400; samesite=lax";
    hydrateDemo();
    router.replace("/dashboard");
  }, [hydrateDemo, router]);

  return (
    <div className="grid min-h-screen place-items-center bg-secondary/30">
      <div className="flex flex-col items-center">
        <Logo />
        <div className="mt-6 flex items-center gap-2 text-sm text-navy-muted">
          <Loader2 className="h-4 w-4 animate-spin" /> Menyiapkan mode demo…
        </div>
      </div>
    </div>
  );
}
