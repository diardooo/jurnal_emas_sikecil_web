import { create } from "zustand";
import { tourSteps } from "@/lib/tour-steps";

/**
 * Product walkthrough state. Whether the user has finished/skipped the tour is a
 * per-device preference in localStorage (not server state) so it survives
 * reloads but can differ per browser. The key is scoped by user id so a second
 * account signing in on the same browser still gets its own first-login tour
 * (the flag is never cleared on logout). The tour auto-starts once on first
 * login and can be replayed from Settings.
 */
const seenKey = (userId: string) => `je:tour-seen-v1:${userId}`;

export const hasSeenTour = (userId: string) => {
  if (typeof window === "undefined" || !userId) return true; // no auto-start on SSR / before hydrate
  return window.localStorage.getItem(seenKey(userId)) === "1";
};

const markSeen = (userId: string) => {
  if (typeof window === "undefined" || !userId) return;
  window.localStorage.setItem(seenKey(userId), "1");
};

type TourState = {
  active: boolean;
  stepIndex: number;
  /** User whose tour is running; used to persist "seen" against the account. */
  userId: string;
  /** Begin (or replay) the tour from the first step for the given user. */
  start: (userId: string) => void;
  next: () => void;
  back: () => void;
  /** Finish or skip — closes the overlay and records that it has been seen. */
  stop: () => void;
};

export const useTourStore = create<TourState>((set, get) => ({
  active: false,
  stepIndex: 0,
  userId: "",
  start: (userId) => {
    markSeen(userId); // mark immediately so a mid-tour reload doesn't reloop
    set({ active: true, stepIndex: 0, userId });
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
    markSeen(get().userId);
    set({ active: false, stepIndex: 0 });
  },
}));
