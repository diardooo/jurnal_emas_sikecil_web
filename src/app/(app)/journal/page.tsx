"use client";

import { useMemo, useState } from "react";
import { BookHeart, Image as ImageIcon, Pencil, Search, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app/page-header";
import { JournalDialog } from "@/components/app/journal-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAppStore } from "@/store/app-store";
import { MOODS, MOOD_META } from "@/lib/journal";
import { cn, formatDateID } from "@/lib/utils";
import type { JournalEntry, JournalMood } from "@/lib/types";

export default function JournalPage() {
  const children = useAppStore((s) => s.children);
  const activeId = useAppStore((s) => s.activeChildId);
  const journalMap = useAppStore((s) => s.journal);
  const child = children.find((c) => c.id === activeId) ?? children[0];
  const entries = journalMap[activeId] ?? [];

  const [query, setQuery] = useState("");
  const [mood, setMood] = useState<JournalMood | "all">("all");
  const [tag, setTag] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entries.filter((e) => {
      if (mood !== "all" && e.mood !== mood) return false;
      if (tag && !e.tags.includes(tag)) return false;
      if (!q) return true;
      return (
        e.body.toLowerCase().includes(q) ||
        (e.title?.toLowerCase().includes(q) ?? false) ||
        e.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [entries, query, mood, tag]);

  // group filtered entries by date (entries are already sorted newest-first)
  const groups = useMemo(() => {
    const map = new Map<string, JournalEntry[]>();
    for (const e of filtered) {
      const list = map.get(e.date);
      if (list) list.push(e);
      else map.set(e.date, [e]);
    }
    return [...map.entries()];
  }, [filtered]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Jurnal Emas"
        description={`Kisah & momen berharga ${child?.name ?? "si Kecil"} dari hari ke hari.`}
        action={<JournalDialog />}
      />

      {entries.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          {/* Filters */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari catatan…"
                className="pl-9"
              />
            </div>
            <div className="-mx-1 flex flex-wrap gap-2 px-1">
              <FilterChip active={mood === "all"} onClick={() => setMood("all")}>
                Semua
              </FilterChip>
              {MOODS.map((m) => (
                <FilterChip
                  key={m}
                  active={mood === m}
                  onClick={() => setMood(mood === m ? "all" : m)}
                >
                  {MOOD_META[m].emoji} {MOOD_META[m].label}
                </FilterChip>
              ))}
              {tag && (
                <button
                  onClick={() => setTag(null)}
                  className="flex items-center gap-1 rounded-full border border-gold-400 bg-gold-500 px-3 py-1.5 text-xs font-semibold text-navy"
                >
                  #{tag} <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>

          {/* Timeline */}
          {groups.length === 0 ? (
            <Card>
              <CardContent className="p-10 text-center text-sm text-muted-foreground">
                Tidak ada catatan yang cocok dengan filter.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {groups.map(([date, items]) => (
                <div key={date} className="space-y-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-navy-muted">
                    {formatDateID(date)}
                  </p>
                  {items.map((e) => (
                    <EntryCard
                      key={e.id}
                      entry={e}
                      childId={activeId}
                      onTagClick={setTag}
                    />
                  ))}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
        active
          ? "border-gold-400 bg-gold-500 text-navy"
          : "border-border bg-background text-navy-muted hover:border-gold-200",
      )}
    >
      {children}
    </button>
  );
}

function EntryCard({
  entry: e,
  childId,
  onTagClick,
}: {
  entry: JournalEntry;
  childId: string;
  onTagClick: (t: string) => void;
}) {
  const deleteEntry = useAppStore((s) => s.deleteJournalEntry);
  const mood = e.mood ? MOOD_META[e.mood] : null;

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start gap-3">
          <div className="relative shrink-0">
            <span
              className={cn(
                "grid h-10 w-10 place-items-center rounded-xl text-lg",
                mood?.cls ?? "bg-gold-100 text-gold-700",
              )}
            >
              {mood ? mood.emoji : <BookHeart className="h-5 w-5" />}
            </span>
            {e.media.length > 0 && (
              <span
                className="absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-full bg-gold-500 text-navy ring-2 ring-background"
                title={`${e.media.length} foto`}
              >
                <ImageIcon className="h-3 w-3" />
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            {e.title && (
              <p className="font-display font-bold text-navy">{e.title}</p>
            )}
            {e.body && (
              <p className="mt-0.5 whitespace-pre-wrap text-sm text-navy-muted">
                {e.body}
              </p>
            )}
            {e.media.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {e.media.map((url, i) => (
                  <a
                    key={url}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition-transform hover:scale-[1.03]"
                  >
                    <Avatar className="h-24 w-24 rounded-xl border">
                      <AvatarImage
                        src={url}
                        alt={`Foto ${i + 1}`}
                        className="object-cover"
                      />
                      <AvatarFallback className="rounded-xl">
                        <ImageIcon className="h-5 w-5 text-muted-foreground" />
                      </AvatarFallback>
                    </Avatar>
                  </a>
                ))}
              </div>
            )}
            {e.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {e.tags.map((t) => (
                  <button
                    key={t}
                    onClick={() => onTagClick(t)}
                    className="rounded-full bg-secondary/70 px-2.5 py-0.5 text-[11px] font-semibold text-navy-muted transition-colors hover:bg-secondary"
                  >
                    #{t}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <JournalDialog
              entry={e}
              trigger={
                <button
                  className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-navy"
                  aria-label="Edit catatan"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              }
            />
            <button
              onClick={() => {
                deleteEntry(childId, e.id);
                toast.success("Catatan dihapus");
              }}
              className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-alert-red-soft hover:text-alert-red"
              aria-label="Hapus catatan"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState() {
  return (
    <Card className="bg-gradient-to-br from-gold-50 to-background">
      <CardContent className="flex flex-col items-center gap-4 p-12 text-center">
        <span className="grid h-16 w-16 place-items-center rounded-2xl bg-gold-100 text-gold-700">
          <BookHeart className="h-8 w-8" />
        </span>
        <div>
          <p className="font-display text-lg font-extrabold text-navy">
            Mulai Jurnal Emas si Kecil
          </p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-navy-muted">
            Catat momen pertama, suasana hati, dan hal-hal kecil yang berharga.
            Suatu hari nanti, ini akan jadi buku kenangan paling berharga.
          </p>
        </div>
        <JournalDialog />
      </CardContent>
    </Card>
  );
}
