"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Responsive photo grid for journal entries with a full-screen swipeable
 * lightbox. Tap a thumbnail to open; swipe / arrow keys / thumbnail strip to
 * navigate; Esc or backdrop to close.
 */
export function PhotoGallery({ media }: { media: string[] }) {
  const [index, setIndex] = useState<number | null>(null);
  const isOpen = index !== null;
  const count = media.length;

  const close = useCallback(() => setIndex(null), []);
  const go = useCallback(
    (dir: number) =>
      setIndex((cur) => (cur === null ? cur : (cur + dir + count) % count)),
    [count],
  );

  // Keyboard nav + lock body scroll while the lightbox is open.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") go(-1);
      else if (e.key === "ArrowRight") go(1);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [isOpen, close, go]);

  // Touch swipe.
  const touchX = useRef<number | null>(null);
  function onTouchStart(e: React.TouchEvent) {
    touchX.current = e.touches[0].clientX;
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
    touchX.current = null;
  }

  if (count === 0) return null;

  const MAX = 6;
  const visible = media.slice(0, MAX);
  const extra = count - visible.length;
  const gridCols =
    count === 1
      ? "max-w-[260px] grid-cols-1"
      : count === 2
        ? "max-w-sm grid-cols-2"
        : "max-w-md grid-cols-3";

  return (
    <>
      <div className={cn("mt-3 grid gap-1.5", gridCols)}>
        {visible.map((url, i) => {
          const last = i === visible.length - 1 && extra > 0;
          return (
            <button
              key={url}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Lihat foto ${i + 1} dari ${count}`}
              className={cn(
                "group relative overflow-hidden rounded-xl border bg-muted",
                count === 1 ? "aspect-[4/3]" : "aspect-square",
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={`Foto ${i + 1}`}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              {last && (
                <span className="absolute inset-0 grid place-items-center bg-black/55 font-display text-xl font-bold text-white">
                  +{extra}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {isOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[90] flex flex-col bg-black/90 backdrop-blur-sm animate-fade-in"
            onClick={close}
          >
            {/* Top bar */}
            <div className="flex items-center justify-between p-4 text-white">
              <span className="rounded-full bg-white/10 px-3 py-1 text-sm font-semibold">
                {index + 1} / {count}
              </span>
              <button
                type="button"
                onClick={close}
                aria-label="Tutup"
                className="grid h-10 w-10 place-items-center rounded-full bg-white/10 transition-colors hover:bg-white/20"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Stage */}
            <div
              className="relative flex flex-1 items-center justify-center overflow-hidden px-2"
              onTouchStart={onTouchStart}
              onTouchEnd={onTouchEnd}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={media[index]}
                alt={`Foto ${index + 1}`}
                onClick={(e) => e.stopPropagation()}
                className="max-h-full max-w-full select-none rounded-lg object-contain"
              />

              {count > 1 && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      go(-1);
                    }}
                    aria-label="Sebelumnya"
                    className="absolute left-3 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/25"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      go(1);
                    }}
                    aria-label="Berikutnya"
                    className="absolute right-3 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/25"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnail strip */}
            {count > 1 && (
              <div
                className="no-scrollbar flex justify-start gap-2 overflow-x-auto p-4 sm:justify-center"
                onClick={(e) => e.stopPropagation()}
              >
                {media.map((url, i) => (
                  <button
                    key={url}
                    type="button"
                    onClick={() => setIndex(i)}
                    aria-label={`Foto ${i + 1}`}
                    className={cn(
                      "h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2 transition-all",
                      i === index
                        ? "border-gold-400 opacity-100"
                        : "border-transparent opacity-50 hover:opacity-80",
                    )}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>,
          document.body,
        )}
    </>
  );
}
