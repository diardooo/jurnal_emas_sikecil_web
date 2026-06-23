"use client";

import {
  Bell,
  CalendarHeart,
  CheckCheck,
  Repeat,
  Syringe,
  Target,
  ClipboardList,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store/app-store";
import { cn, formatDateID } from "@/lib/utils";
import type { AppNotification } from "@/lib/types";

const iconFor: Record<AppNotification["type"], typeof Bell> = {
  imunisasi: Syringe,
  posyandu: CalendarHeart,
  task: ClipboardList,
  habit: Repeat,
  milestone: Target,
};

export function Notifications() {
  const notifications = useAppStore((s) => s.notifications);
  const markRead = useAppStore((s) => s.markNotificationRead);
  const markAll = useAppStore((s) => s.markAllRead);
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="relative grid h-10 w-10 place-items-center rounded-full border bg-card transition-colors hover:bg-muted">
          <Bell className="h-[18px] w-[18px] text-navy" />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 grid h-5 w-5 place-items-center rounded-full bg-alert-red text-[10px] font-bold text-white">
              {unread}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[22rem] p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <p className="font-display text-sm font-bold text-navy">Notifikasi</p>
          {unread > 0 && (
            <button
              onClick={markAll}
              className="flex items-center gap-1 text-xs font-semibold text-gold-700 hover:underline"
            >
              <CheckCheck className="h-3.5 w-3.5" /> Tandai semua dibaca
            </button>
          )}
        </div>
        <div className="max-h-96 overflow-y-auto">
          {notifications.map((n) => {
            const Icon = iconFor[n.type];
            return (
              <button
                key={n.id}
                onClick={() => markRead(n.id)}
                className={cn(
                  "flex w-full items-start gap-3 border-b px-4 py-3 text-left transition-colors hover:bg-muted/60",
                  !n.read && "bg-gold-50/60",
                )}
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gold-100 text-gold-700">
                  <Icon className="h-[18px] w-[18px]" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-navy">{n.title}</p>
                  <p className="text-xs text-navy-muted">{n.body}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {formatDateID(n.date)}
                  </p>
                </div>
                {!n.read && (
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-gold-500" />
                )}
              </button>
            );
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
