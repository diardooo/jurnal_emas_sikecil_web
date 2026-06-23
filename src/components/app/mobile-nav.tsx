"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { mobileNavItems } from "@/lib/nav";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const pathname = usePathname();
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
              className={cn(
                "flex min-w-0 flex-col items-center gap-1 px-0.5 py-2 text-[11px] font-semibold transition-colors",
                active ? "text-gold-700" : "text-navy-muted",
              )}
            >
              <span
                className={cn(
                  "grid h-9 w-9 place-items-center rounded-full transition-colors",
                  active && "bg-gold-100",
                )}
              >
                <item.icon className="h-[18px] w-[18px]" />
              </span>
              <span className="w-full truncate text-center leading-none">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
