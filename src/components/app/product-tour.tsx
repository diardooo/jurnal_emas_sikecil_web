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
const MARGIN = 12; // gap between spotlight and tooltip
const basePath = (href?: string) => (href ?? "").split("?")[0];
const clamp = (v: number, lo: number, hi: number) =>
  Math.min(Math.max(v, lo), Math.max(lo, hi));

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
 * user through tourSteps, navigating between pages, switching tabs (so the user
 * sees what's inside), and spotlighting anchors tagged with `data-tour`.
 * Resilient: if an anchor never mounts it degrades to a centered card.
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
  const [cardH, setCardH] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);
  const autoStarted = useRef(false);

  useEffect(() => setMounted(true), []);

  const step = tourSteps[stepIndex];
  const isLast = stepIndex === tourSteps.length - 1;
  const selector = step?.selector;
  const href = step?.href;
  const tab = step?.tab;

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

  // Navigate to the step's page if we aren't already there. Use replace so the
  // tour's hops don't pollute browser history (Back returns to pre-tour view).
  useEffect(() => {
    if (!active || !href) return;
    if (basePath(pathname) !== basePath(href)) router.replace(href);
  }, [active, href, pathname, router]);

  // After (re)navigation: open the step's tab (so its content shows), scroll the
  // anchor into view, then measure. Polls until the anchor mounts; gives up after
  // ~2.5s and falls back to a centered card so the tour can't stall.
  useEffect(() => {
    if (!active) return;
    setRect(null);
    if (!selector) return;
    if (href && basePath(pathname) !== basePath(href)) return;

    let raf = 0;
    let tries = 0;
    const tick = () => {
      const el = document.querySelector<HTMLElement>(
        `[data-tour="${selector}"]`,
      );
      if (el) {
        // Reveal the requested tab's content inside the spotlight first.
        if (tab) {
          document
            .querySelector<HTMLElement>(`[data-tour-tab="${tab}"]`)
            ?.click();
        }
        el.scrollIntoView({ block: "center", behavior: "auto" });
        // Measure on the next frame so layout settles after the tab switch.
        raf = requestAnimationFrame(() => setRect(measureSelector(selector)));
        return;
      }
      if (tries++ > 150) return; // ~2.5s at 60fps → centered fallback
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, stepIndex, selector, href, tab, pathname]);

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

  // Track the tooltip card's height so it can be kept inside the viewport even
  // when the spotlighted region is taller than the screen.
  useEffect(() => {
    const h = cardRef.current?.offsetHeight ?? 0;
    setCardH((prev) => (h && h !== prev ? h : prev));
  });

  if (!mounted || !active || !step) return null;

  const dim = "rgba(15, 16, 40, 0.62)";
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const cardW = Math.min(vw * 0.92, 360);

  // Tooltip placement: centered when no anchor; otherwise prefer below the rect,
  // then above, then pinned to the bottom — always clamped into the viewport.
  let cardStyle: React.CSSProperties;
  if (rect) {
    const left = clamp(rect.left, 16, vw - cardW - 16);
    const below = rect.top + rect.height + PAD + MARGIN;
    const above = rect.top - PAD - MARGIN - cardH;
    let top: number;
    if (below + cardH <= vh - 16) top = below;
    else if (above >= 16) top = above;
    else top = vh - cardH - 16;
    cardStyle = { position: "fixed", left, top: clamp(top, 16, vh - cardH - 16) };
  } else {
    cardStyle = {
      position: "fixed",
      left: "50%",
      top: "50%",
      transform: "translate(-50%, -50%)",
    };
  }

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
        <div style={{ position: "fixed", inset: 0, background: dim }} />
      )}

      {/* Tooltip card */}
      <div
        ref={cardRef}
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
