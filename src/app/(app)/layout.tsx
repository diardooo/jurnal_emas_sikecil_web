import { Sidebar } from "@/components/app/sidebar";
import { Topbar } from "@/components/app/topbar";
import { MobileNav } from "@/components/app/mobile-nav";
import type { Metadata } from "next";
import { StoreHydrator } from "@/components/app/store-hydrator";
import { DemoBanner } from "@/components/app/demo-banner";
import { ProductTour } from "@/components/app/product-tour";

// Authenticated pages hold private child data — keep them out of search engines.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <StoreHydrator>
      <DemoBanner />
      <div className="min-h-screen bg-secondary/30">
        <Sidebar />
        <div className="lg:pl-64">
          <Topbar />
          <main className="mx-auto max-w-7xl px-4 pb-24 pt-6 lg:px-8 lg:pb-10">
            {children}
          </main>
        </div>
        <MobileNav />
      </div>
      <ProductTour />
    </StoreHydrator>
  );
}
