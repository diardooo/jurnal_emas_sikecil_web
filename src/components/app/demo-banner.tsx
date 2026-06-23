"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAppStore } from "@/store/app-store";

const TOAST_ID = "demo-mode";

/** While in demo mode, keep a persistent (but unobtrusive) bottom toast saying
 *  the data is only sample data and isn't saved. Re-asserted on each route. */
export function DemoBanner() {
  const demo = useAppStore((s) => s.demo);
  const pathname = usePathname();
  const router = useRouter();

  // Show / re-assert the notice (same id = updates, no duplicate, no flicker).
  useEffect(() => {
    if (!demo) {
      toast.dismiss(TOAST_ID);
      return;
    }
    toast("👀 Mode Demo — data contoh", {
      id: TOAST_ID,
      duration: Infinity,
      description:
        "Semua yang tampil & kamu ubah di sini hanya contoh, tidak tersimpan.",
      action: {
        label: "Daftar Gratis",
        onClick: () => {
          document.cookie = "demo=1; path=/; max-age=0"; // clear demo
          router.push("/register");
        },
      },
    });
  }, [demo, pathname, router]);

  // Clear the notice when leaving the app shell.
  useEffect(() => {
    return () => {
      toast.dismiss(TOAST_ID);
    };
  }, []);

  return null;
}
