"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { mobileNavItems } from "@/lib/nav";
import { useUiStore } from "@/store/ui-store";
import { cn } from "@/lib/utils";

const itemClass =
  "flex min-w-0 flex-col items-center gap-1 px-0.5 py-2 text-[11px] font-semibold transition-colors";
const iconWrap = "grid h-9 w-9 place-items-center rounded-full transition-colors";

export function MobileNav() {
  const pathname = usePathname();
  const setMobileMenuOpen = useUiStore((s) => s.setMobileMenuOpen);

  // "Lainnya" is active whenever we're on a page that isn't one of the primaries.
  const onPrimary = mobileNavItems.some(
    (i) => pathname === i.href || pathname.startsWith(i.href + "/"),
  );

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom,0px)] backdrop-blur-md lg:hidden">
      <div className="grid grid-cols-5">
        {mobileNavItems.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(itemClass, active ? "text-gold-700" : "text-navy-muted")}
            >
              <span className={cn(iconWrap, active && "bg-gold-100")}>
                <item.icon className="h-[18px] w-[18px]" />
              </span>
              <span className="w-full truncate text-center leading-none">
                {item.label}
              </span>
            </Link>
          );
        })}

        {/* Lainnya → opens the full navigation drawer (same as the hamburger) */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(true)}
          aria-label="Buka menu lainnya"
          className={cn(itemClass, !onPrimary ? "text-gold-700" : "text-navy-muted")}
        >
          <span className={cn(iconWrap, !onPrimary && "bg-gold-100")}>
            <Menu className="h-[18px] w-[18px]" />
          </span>
          <span className="w-full truncate text-center leading-none">Lainnya</span>
        </button>
      </div>
    </nav>
  );
}
