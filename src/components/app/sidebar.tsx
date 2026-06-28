"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Sparkles } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { ChildSwitcher } from "@/components/app/child-switcher";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { navItems } from "@/lib/nav";
import { useAppStore } from "@/store/app-store";
import { signOut, useSession } from "@/lib/auth-client";
import { cn, initials } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const plan = useAppStore((s) => s.plan);
  const demo = useAppStore((s) => s.demo);
  const { data: session } = useSession();
  const name = demo ? "Tamu Demo" : (session?.user?.name ?? "Pengguna");
  const email = demo ? "Mode demo" : (session?.user?.email ?? "");
  const image = demo ? undefined : (session?.user?.image ?? undefined);

  async function handleExit() {
    if (demo) {
      document.cookie = "demo=1; path=/; max-age=0"; // clear demo
      router.push("/");
      return;
    }
    await signOut();
    router.push("/login");
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-cream/10 bg-navy lg:flex">
      <div className="flex h-16 items-center border-b border-cream/10 px-5">
        <Logo href="/dashboard" className="[&_.text-navy]:text-cream" />
      </div>

      <div className="p-4">
        <ChildSwitcher dark />
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 no-scrollbar">
        {navItems.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
                active
                  ? "bg-gold-500 text-navy shadow-sm"
                  : "text-cream/70 hover:bg-cream/10 hover:text-cream",
              )}
            >
              <item.icon className="h-[18px] w-[18px]" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {plan === "free" && (
        <div className="m-3 rounded-2xl bg-gradient-to-br from-gold-500 to-gold-600 p-4 text-navy">
          <Sparkles className="h-5 w-5" />
          <p className="mt-2 font-display text-sm font-bold">Upgrade ke Emas</p>
          <p className="mt-0.5 text-xs text-navy/80">
            Buka semua fitur premium & anak tanpa batas.
          </p>
          <Button
            size="sm"
            variant="navy"
            className="mt-3 w-full"
            onClick={() => router.push("/settings?tab=billing")}
          >
            Upgrade ke Emas Sekarang
          </Button>
        </div>
      )}

      <div className="border-t border-cream/10 p-3">
        <div className="flex items-center gap-3 rounded-xl px-2 py-2">
          <Avatar className="h-9 w-9">
            <AvatarImage src={image} alt={name} />
            <AvatarFallback className="bg-cream/10 text-sm font-bold text-cream">
              {initials(name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-cream">{name}</p>
            <p className="truncate text-xs text-cream/50">{email}</p>
          </div>
          {plan === "premium" && <Badge variant="gold">Emas</Badge>}
        </div>
        <button
          onClick={handleExit}
          className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-cream/60 transition-colors hover:bg-cream/10 hover:text-cream"
        >
          <LogOut className="h-[18px] w-[18px]" /> {demo ? "Keluar Demo" : "Keluar"}
        </button>
      </div>
    </aside>
  );
}
