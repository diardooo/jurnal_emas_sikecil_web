"use client";

import { useEffect, useState } from "react";
import { Share, X } from "lucide-react";
import { LogoMark } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

const DISMISS_KEY = "je:install-dismissed";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/**
 * Gentle "add to home screen" nudge. On Android/Chromium it uses the native
 * beforeinstallprompt; on iOS Safari (which has no such event) it shows the
 * manual Share → "Tambah ke Layar Utama" hint. Hidden once installed or
 * dismissed. Installing matters here because phone reminders are more reliable
 * from an installed PWA (and required on iOS).
 */
export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [iosHint, setIosHint] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as { standalone?: boolean }).standalone === true;
    if (standalone) return;
    try {
      if (localStorage.getItem(DISMISS_KEY)) return;
    } catch {
      /* storage blocked — still allow the prompt */
    }

    const onBIP = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", onBIP);

    const ua = window.navigator.userAgent;
    const isIOS = /iphone|ipad|ipod/i.test(ua);
    const inApp = /fbav|instagram|line|fban/i.test(ua);
    const isSafari = /safari/i.test(ua) && !/crios|fxios|edgios/i.test(ua);
    if (isIOS && isSafari && !inApp) {
      setIosHint(true);
      setVisible(true);
    }

    return () => window.removeEventListener("beforeinstallprompt", onBIP);
  }, []);

  function dismiss() {
    setVisible(false);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
  }

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice.catch(() => undefined);
    setDeferred(null);
    dismiss();
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-3 bottom-20 z-40 lg:inset-x-auto lg:bottom-4 lg:right-4 lg:max-w-sm">
      <div className="flex items-start gap-3 rounded-2xl border border-gold-200 bg-card p-4 shadow-xl shadow-navy/10">
        <LogoMark className="h-11 w-11" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-navy">Pasang di layar utama</p>
          {iosHint ? (
            <p className="mt-0.5 text-xs text-navy-muted">
              Tekan tombol Bagikan{" "}
              <Share className="inline h-3.5 w-3.5 align-text-bottom" /> di Safari,
              lalu pilih <strong>“Tambah ke Layar Utama”</strong>.
            </p>
          ) : (
            <p className="mt-0.5 text-xs text-navy-muted">
              Akses cepat seperti aplikasi & pengingat lebih andal.
            </p>
          )}
          {!iosHint && (
            <div className="mt-2.5 flex gap-2">
              <Button size="sm" onClick={install}>
                Pasang
              </Button>
              <Button size="sm" variant="ghost" onClick={dismiss}>
                Nanti saja
              </Button>
            </div>
          )}
        </div>
        <button
          onClick={dismiss}
          aria-label="Tutup"
          className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-navy"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
