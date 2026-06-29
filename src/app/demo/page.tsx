"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/app-store";
import { LoadingScreen } from "@/components/app/loading-screen";

const DEMO_MESSAGES = [
  "Menyiapkan mode demo…",
  "Mengisi data contoh si Kecil…",
  "Menata milestone & jurnal…",
  "Selamat menjelajah ✨",
];

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

  return <LoadingScreen messages={DEMO_MESSAGES} />;
}
