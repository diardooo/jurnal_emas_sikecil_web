"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Notifications } from "@/components/app/notifications";
import { ChildSwitcher } from "@/components/app/child-switcher";
import { navItems } from "@/lib/nav";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import Link from "next/link";
import { cn } from "@/lib/utils";

const titles: Record<string, string> = Object.fromEntries(
  navItems.map((n) => [n.href, n.label]),
);

export function Topbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  // Safety net: always close the mobile menu when the route changes.
  useEffect(() => setMenuOpen(false), [pathname]);
  const title = titles[pathname] ?? "Dashboard";
  const today = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-md lg:px-8">
      {/* Mobile menu */}
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetTrigger asChild>
          <button className="grid h-10 w-10 place-items-center rounded-full border bg-card lg:hidden">
            <Menu className="h-5 w-5 text-navy" />
          </button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 bg-navy p-0 text-cream">
          <SheetTitle className="sr-only">Menu navigasi</SheetTitle>
          <div className="flex h-16 items-center border-b border-cream/10 px-5">
            <Logo href="/dashboard" className="[&_.text-navy]:text-cream" />
          </div>
          <div className="p-4">
            <ChildSwitcher dark />
          </div>
          <nav className="space-y-1 px-3">
            {navItems.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
                    active
                      ? "bg-gold-500 text-navy"
                      : "text-cream/70 hover:bg-cream/10",
                  )}
                >
                  <item.icon className="h-[18px] w-[18px]" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </SheetContent>
      </Sheet>

      <div className="flex-1">
        <h1 className="font-display text-lg font-extrabold tracking-tight text-navy">
          {title}
        </h1>
        <p className="hidden text-xs text-navy-muted sm:block">{today}</p>
      </div>

      <div className="lg:hidden">
        <Logo showText={false} href="/dashboard" />
      </div>
      <Notifications />
    </header>
  );
}
