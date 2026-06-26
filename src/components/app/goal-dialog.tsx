"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
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
import { milestoneDomains } from "@/lib/mock-data";

/** Create a parent goal (with optional sub-goals). Persists via the store. */
export function GoalDialog({ trigger }: { trigger?: React.ReactNode }) {
  const addGoal = useAppStore((s) => s.addGoal);

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [domain, setDomain] = useState<string>(milestoneDomains[0]);
  const [targetDate, setTargetDate] = useState("");
  const [subInput, setSubInput] = useState("");
  const [subGoals, setSubGoals] = useState<string[]>([]);

  function handleOpenChange(o: boolean) {
    if (o) {
      setTitle("");
      setDescription("");
      setDomain(milestoneDomains[0]);
      setTargetDate("");
      setSubInput("");
      setSubGoals([]);
    }
    setOpen(o);
  }

  function addSub() {
    const t = subInput.trim();
    if (!t) return;
    setSubGoals((cur) => [...cur, t]);
    setSubInput("");
  }

  function submit() {
    if (!title.trim()) {
      toast.error("Judul goal wajib diisi");
      return;
    }
    const now = Date.now();
    addGoal({
      id: `g-${now}`,
      title: title.trim(),
      description: description.trim() || undefined,
      domain,
      progress: 0,
      targetDate: targetDate || undefined,
      subGoals: subGoals.map((t, i) => ({
        id: `sg-${now}-${i}`,
        title: t,
        done: false,
      })),
    });
    toast.success("Goal ditambahkan 🎯");
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm">
            <Plus /> Tambah Goal
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tambah Goal Orang Tua</DialogTitle>
          <DialogDescription>
            Target yang ingin Anda capai bersama si Kecil. Pecah jadi langkah
            kecil agar lebih mudah dipantau.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="goal-title">Judul Goal</Label>
            <Input
              id="goal-title"
              placeholder="Mis. Lancar berjalan tanpa bantuan"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="goal-domain">Kategori</Label>
              <select
                id="goal-domain"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                className="h-10 w-full rounded-lg border bg-background px-3 text-sm text-navy outline-none focus:border-gold-300"
              >
                {milestoneDomains.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="goal-date">Target Tanggal (opsional)</Label>
              <Input
                id="goal-date"
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="goal-desc">Deskripsi (opsional)</Label>
            <Textarea
              id="goal-desc"
              rows={2}
              placeholder="Kenapa goal ini penting?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Langkah / Sub-goal (opsional)</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Mis. Latihan berdiri 5 menit/hari"
                value={subInput}
                onChange={(e) => setSubInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addSub();
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={addSub}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {subGoals.length > 0 && (
              <ul className="mt-2 space-y-1.5">
                {subGoals.map((t, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between rounded-lg border bg-secondary/40 px-3 py-1.5 text-sm text-navy"
                  >
                    <span>{t}</span>
                    <button
                      type="button"
                      onClick={() => setSubGoals((cur) => cur.filter((_, idx) => idx !== i))}
                      className="text-muted-foreground hover:text-alert-red"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Batal
          </Button>
          <Button onClick={submit}>Tambah Goal</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
