"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAppStore } from "@/store/app-store";
import { MOODS, MOOD_META, SUGGESTED_TAGS } from "@/lib/journal";
import { cn } from "@/lib/utils";
import type { JournalEntry, JournalMood } from "@/lib/types";

const todayStr = () => new Date().toISOString().slice(0, 10);

/**
 * Add or edit a journal entry. Pass `entry` to edit (renders a custom trigger);
 * omit it to create (renders the default "Tulis Catatan" button).
 */
export function JournalDialog({
  entry,
  trigger,
}: {
  entry?: JournalEntry;
  trigger?: React.ReactNode;
}) {
  const activeId = useAppStore((s) => s.activeChildId);
  const addEntry = useAppStore((s) => s.addJournalEntry);
  const updateEntry = useAppStore((s) => s.updateJournalEntry);
  const isEdit = !!entry;

  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(entry?.date ?? todayStr());
  const [mood, setMood] = useState<JournalMood | undefined>(entry?.mood);
  const [title, setTitle] = useState(entry?.title ?? "");
  const [body, setBody] = useState(entry?.body ?? "");
  const [tags, setTags] = useState<string[]>(entry?.tags ?? []);

  function handleOpenChange(o: boolean) {
    if (o) {
      // reset form to the entry's values (or blank) each time it opens
      setDate(entry?.date ?? todayStr());
      setMood(entry?.mood);
      setTitle(entry?.title ?? "");
      setBody(entry?.body ?? "");
      setTags(entry?.tags ?? []);
    }
    setOpen(o);
  }

  function toggleTag(t: string) {
    setTags((cur) =>
      cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t],
    );
  }

  function submit() {
    if (!body.trim() && !title.trim()) {
      toast.error("Tulis catatan dulu ya");
      return;
    }
    const fields = {
      date,
      mood,
      title: title.trim() || undefined,
      body: body.trim(),
      tags,
    };
    if (isEdit) {
      updateEntry(activeId, entry!.id, fields);
      toast.success("Catatan diperbarui");
    } else {
      addEntry(activeId, {
        id: `jr-${Date.now()}`,
        childId: activeId,
        media: [],
        ...fields,
      });
      toast.success("Catatan tersimpan 🌱");
    }
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm">
            <Plus /> Tulis Catatan
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Catatan" : "Tulis Catatan"}</DialogTitle>
          <DialogDescription>
            Abadikan momen, suasana hati, dan hal kecil yang berharga hari ini.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="jr-date">Tanggal</Label>
            <Input
              id="jr-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Suasana hati</Label>
            <div className="flex flex-wrap gap-2">
              {MOODS.map((m) => {
                const meta = MOOD_META[m];
                const active = mood === m;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMood(active ? undefined : m)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all",
                      active
                        ? meta.cls + " border-transparent ring-2 ring-current/30"
                        : "border-border bg-background text-navy-muted hover:border-gold-200",
                    )}
                  >
                    <span>{meta.emoji}</span> {meta.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="jr-title">Judul (opsional)</Label>
            <Input
              id="jr-title"
              placeholder="Mis. Langkah pertama!"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="jr-body">Catatan</Label>
            <Textarea
              id="jr-body"
              rows={4}
              placeholder="Ceritakan momennya…"
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Tag</Label>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_TAGS.map((t) => {
                const active = tags.includes(t);
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => toggleTag(t)}
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
                      active
                        ? "border-gold-400 bg-gold-500 text-navy"
                        : "border-border bg-background text-navy-muted hover:border-gold-200",
                    )}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Batal
          </Button>
          <Button onClick={submit}>{isEdit ? "Simpan" : "Tambah"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
