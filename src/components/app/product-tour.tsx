"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Crown, X } from "lucide-react";
import { useAppStore } from "@/store/app-store";
import { hasSeenTour, useTourStore } from "@/store/tour-store";
import { tourSteps } from "@/lib/tour-steps";
import { cn } from "@/lib/utils";

type Rect = { top: number; left: number; width: number; height: number };

const PAD = 8; // spotlight padding around the target
const basePath = (href?: string) => (href ?? "").split("?")[0];

/** Read the live rect of a `data-tour` anchor, or null if absent/zero-size. */
function measureSelector(selector?: string): Rect | null {
  if (!selector) return null;
  const el = document.querySelector<HTMLElement>(`[data-tour="${selector}"]`);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (r.width === 0 && r.height === 0) return null;
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}

/**
 * First-login walkthrough overlay. Mounted once in the app layout; drives the
 * user through tourSteps, navigating between pages and spotlighting anchors
 * tagged with `data-tour`. Resilient: if an anchor never mounts it degrades to a
 * centered card instead of blocking.
 */
export function ProductTour() {
  const router = useRouter();
  const pathname = usePathname();

  const hydrated = useAppStore((s) => s.hydrated);
  const demo = useAppStore((s) => s.demo);
  const childCount = useAppStore((s) => s.children.length);

  const active = useTourStore((s) => s.active);
  const stepIndex = useTourStore((s) => s.stepIndex);
  const start = useTourStore((s) => s.start);
  const next = useTourStore((s) => s.next);
  const back = useTourStore((s) => s.back);
  const stop = useTourStore((s) => s.stop);

  const [mounted, setMounted] = useState(false);
  const [rect, setRect] = useState<Rect | null>(null);
  const autoStarted = useRef(false);

  useEffect(() => setMounted(true), []);

  const step = tourSteps[stepIndex];
  const isLast = stepIndex === tourSteps.length - 1;

  // Auto-start once on first login, only after data is ready and on the
  // dashboard so the journey begins from a known place. Never in demo mode.
  useEffect(() => {
    if (autoStarted.current) return;
    if (!hydrated || demo || childCount === 0) return;
    if (hasSeenTour()) return;
    if (!pathname.startsWith("/dashboard")) return;
    autoStarted.current = true;
    start();
  }, [hydrated, demo, childCount, pathname, start]);

  // Lock body scroll while the tour is open.
  useEffect(() => {
    if (!active) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [active]);

  // Navigate to the step's page if we aren't already there. Use replace so the
  // tour's hops don't pollute browser history (Back returns to pre-tour view).
  useEffect(() => {
    if (!active || !step?.href) return;
    if (basePath(pathname) !== basePath(step.href)) {
      router.replace(step.href);
    }
  }, [active, step?.href, pathname, router]);

  const selector = step?.selector;
  const href = step?.href;

  // After (re)navigation, poll for the anchor until it mounts; give up after
  // ~2.5s and fall back to a centered card so the tour can't stall.
  useEffect(() => {
    if (!active) return;
    setRect(null);
    if (!selector) return;
    // Only poll once we're on the right page (or the step has no page).
    if (href && basePath(pathname) !== basePath(href)) return;

    let raf = 0;
    let tries = 0;
    const tick = () => {
      const el = document.querySelector<HTMLElement>(
        `[data-tour="${selector}"]`,
      );
      if (el) {
        el.scrollIntoView({ block: "center", behavior: "auto" });
        // measure on the next frame so layout settles after scroll
        raf = requestAnimationFrame(() => setRect(measureSelector(selector)));
        return;
      }
      if (tries++ > 150) return; // ~2.5s at 60fps → centered fallback
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, stepIndex, selector, href, pathname]);

  // Keep the spotlight aligned on resize/scroll.
  useEffect(() => {
    if (!active) return;
    const onChange = () => setRect(measureSelector(selector));
    window.addEventListener("resize", onChange);
    window.addEventListener("scroll", onChange, true);
    return () => {
      window.removeEventListener("resize", onChange);
      window.removeEventListener("scroll", onChange, true);
    };
  }, [active, selector]);

  if (!mounted || !active || !step) return null;

  const dim = "rgba(15, 16, 40, 0.62)";

  // Tooltip placement: centered when no anchor, else above/below the rect.
  const placeAbove = rect ? rect.top > window.innerHeight / 2 : false;
  const cardStyle: React.CSSProperties = rect
    ? {
        position: "fixed",
        left: Math.min(
          Math.max(rect.left, 16),
          Math.max(16, window.innerWidth - 376),
        ),
        ...(placeAbove
          ? { top: Math.max(16, rect.top - PAD - 12), transform: "translateY(-100%)" }
          : { top: rect.top + rect.height + PAD + 12 }),
      }
    : {
        position: "fixed",
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%)",
      };

  return createPortal(
    <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true">
      {/* Click-blocker + dimmer. When anchored, four panels leave a clear hole. */}
      {rect ? (
        <>
          <div style={panel(dim, { top: 0, left: 0, right: 0, height: Math.max(0, rect.top - PAD) })} />
          <div style={panel(dim, { top: rect.top + rect.height + PAD, left: 0, right: 0, bottom: 0 })} />
          <div style={panel(dim, { top: Math.max(0, rect.top - PAD), left: 0, width: Math.max(0, rect.left - PAD), height: rect.height + PAD * 2 })} />
          <div style={panel(dim, { top: Math.max(0, rect.top - PAD), left: rect.left + rect.width + PAD, right: 0, height: rect.height + PAD * 2 })} />
          {/* Highlight ring around the hole */}
          <div
            style={{
              position: "fixed",
              top: rect.top - PAD,
              left: rect.left - PAD,
              width: rect.width + PAD * 2,
              height: rect.height + PAD * 2,
              borderRadius: 16,
              boxShadow: "0 0 0 2px rgba(201,162,39,0.9)",
              pointerEvents: "none",
            }}
          />
        </>
      ) : (
        <div
          style={{ position: "fixed", inset: 0, background: dim }}
          onClick={(e) => e.stopPropagation()}
        />
      )}

      {/* Tooltip card */}
      <div
        style={cardStyle}
        className="w-[min(92vw,360px)] rounded-2xl border border-gold-200 bg-background p-5 shadow-2xl"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wide text-gold-700">
            Langkah {stepIndex + 1} dari {tourSteps.length}
          </span>
          <button
            onClick={stop}
            aria-label="Tutup tur"
            className="grid h-7 w-7 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-navy"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {step.premium && (
          <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-gold-100 px-2 py-0.5 text-[10px] font-bold text-gold-700">
            <Crown className="h-3 w-3" /> Fitur Emas
          </span>
        )}

        <p className="mt-2 font-display text-lg font-extrabold text-navy">
          {step.title}
        </p>
        <p className="mt-1.5 text-sm leading-relaxed text-navy-muted">
          {step.body}
        </p>

        {/* Progress dots */}
        <div className="mt-4 flex flex-wrap gap-1.5">
          {tourSteps.map((_, i) => (
            <span
              key={i}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === stepIndex ? "w-5 bg-gold-500" : "w-1.5 bg-muted",
              )}
            />
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between gap-2">
          <button
            onClick={stop}
            className="text-xs font-semibold text-muted-foreground underline-offset-2 hover:underline"
          >
            Lewati tur
          </button>
          <div className="flex items-center gap-2">
            {stepIndex > 0 && (
              <button
                onClick={back}
                className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-xs font-semibold text-navy transition-colors hover:bg-muted"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Kembali
              </button>
            )}
            <button
              onClick={next}
              className="inline-flex items-center gap-1 rounded-lg bg-gold-500 px-3.5 py-2 text-xs font-bold text-navy transition-colors hover:bg-gold-600"
            >
              {isLast ? (
                <>
                  Selesai <Check className="h-3.5 w-3.5" />
                </>
              ) : (
                <>
                  Lanjut <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/** Fixed dim panel that also blocks clicks to the page underneath. */
function panel(
  background: string,
  box: React.CSSProperties,
): React.CSSProperties {
  return { position: "fixed", background, pointerEvents: "auto", ...box };
}
