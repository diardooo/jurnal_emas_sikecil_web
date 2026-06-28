import { create } from "zustand";

/** Small UI-only store. Shares the mobile navigation drawer state so both the
 *  Topbar hamburger and the bottom-nav "Lainnya" button open the same menu. */
type UiState = {
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
};

export const useUiStore = create<UiState>((set) => ({
  mobileMenuOpen: false,
  setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),
}));
