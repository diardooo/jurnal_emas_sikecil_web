"use client";

import { ChevronsUpDown, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAppStore } from "@/store/app-store";
import { getAge, initials } from "@/lib/utils";

export function ChildSwitcher({ dark = false }: { dark?: boolean }) {
  const router = useRouter();
  const children = useAppStore((s) => s.children);
  const activeId = useAppStore((s) => s.activeChildId);
  const setActive = useAppStore((s) => s.setActiveChild);
  const active = children.find((c) => c.id === activeId) ?? children[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={
            dark
              ? "flex w-full items-center gap-3 rounded-xl border border-cream/10 bg-cream/5 p-2.5 text-left transition-colors hover:bg-cream/10"
              : "flex w-full items-center gap-3 rounded-xl border bg-card p-2.5 text-left transition-colors hover:bg-muted"
          }
        >
          <Avatar className="h-9 w-9 border-2 border-gold-300">
            <AvatarImage src={active.photoUrl} alt={active.name} />
            <AvatarFallback>{initials(active.name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p
              className={`truncate text-sm font-bold ${dark ? "text-cream" : "text-navy"}`}
            >
              {active.name}
            </p>
            <p className={dark ? "text-xs text-cream/60" : "text-xs text-navy-muted"}>
              {getAge(active.dob).label}
            </p>
          </div>
          <ChevronsUpDown
            className={`h-4 w-4 ${dark ? "text-cream/60" : "text-muted-foreground"}`}
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-60">
        <DropdownMenuLabel>Pilih anak aktif</DropdownMenuLabel>
        {children.map((c) => (
          <DropdownMenuItem key={c.id} onClick={() => setActive(c.id)}>
            <Avatar className="h-7 w-7">
              <AvatarImage src={c.photoUrl} alt={c.name} />
              <AvatarFallback>{initials(c.name)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="text-sm font-semibold">{c.name}</p>
              <p className="text-xs text-muted-foreground">
                {getAge(c.dob).label}
              </p>
            </div>
            {c.id === activeId && (
              <span className="h-2 w-2 rounded-full bg-sage" />
            )}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/onboarding")}>
          <Plus className="h-4 w-4" /> Tambah anak
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
