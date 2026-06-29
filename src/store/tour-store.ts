import { create } from "zustand";
import { tourSteps } from "@/lib/tour-steps";

/**
 * Product walkthrough state. Whether the user has finished/skipped the tour is a
 * per-device preference in localStorage (not server state) so it survives
 * reloads but can differ per browser. The tour auto-starts once on first login
 * and can be replayed from Settings.
 */
const SEEN_KEY = "je:tour-seen-v1";

export const hasSeenTour = () => {
  if (typeof window === "undefined") return true; // never auto-start during SSR
  return window.localStorage.getItem(SEEN_KEY) === "1";
};

const markSeen = () => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SEEN_KEY, "1");
};

type TourState = {
  active: boolean;
  stepIndex: number;
  /** Begin (or replay) the tour from the first step. */
  start: () => void;
  next: () => void;
  back: () => void;
  /** Finish or skip — closes the overlay and records that it has been seen. */
  stop: () => void;
};

export const useTourStore = create<TourState>((set, get) => ({
  active: false,
  stepIndex: 0,
  start: () => {
    markSeen(); // mark immediately so a mid-tour reload doesn't reloop
    set({ active: true, stepIndex: 0 });
  },
  next: () => {
    const last = tourSteps.length - 1;
    if (get().stepIndex >= last) {
      set({ active: false, stepIndex: 0 });
      return;
    }
    set((s) => ({ stepIndex: s.stepIndex + 1 }));
  },
  back: () => set((s) => ({ stepIndex: Math.max(0, s.stepIndex - 1) })),
  stop: () => {
    markSeen();
    set({ active: false, stepIndex: 0 });
  },
}));
