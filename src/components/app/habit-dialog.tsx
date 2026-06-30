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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppStore } from "@/store/app-store";

const ADD_NEW = "__add_new__";

/**
 * Add a new habit. Pass `open`/`onOpenChange` to drive it from outside (e.g. the
 * unified "Tambah" chooser) — in that mode no built-in trigger is rendered.
 */
export function HabitDialog({
  open: openProp,
  onOpenChange,
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
} = {}) {
  const isControlled = openProp !== undefined;
  const addHabit = useAppStore((s) => s.addHabit);
  const activeId = useAppStore((s) => s.activeChildId);
  const categories = useAppStore((s) => s.habitCategories);
  const addCategory = useAppStore((s) => s.addHabitCategory);

  const [openState, setOpenState] = useState(false);
  const open = isControlled ? openProp : openState;
  const setOpen = (o: boolean) => {
    if (!isControlled) setOpenState(o);
    onOpenChange?.(o);
  };
  const [name, setName] = useState("");
  const [category, setCategory] = useState<string>(
    categories[1] ?? categories[0] ?? "Stimulasi Harian",
  );
  const [customMode, setCustomMode] = useState(false);
  const [customCategory, setCustomCategory] = useState("");
  const [target, setTarget] = useState("7");
  const [reminder, setReminder] = useState("");

  function submit() {
    if (!name.trim()) {
      toast.error("Tulis dulu nama kebiasaannya ya");
      return;
    }
    let finalCategory = category;
    if (customMode) {
      if (!customCategory.trim()) {
        toast.error("Isi nama kategori barunya dulu");
        return;
      }
      finalCategory = customCategory.trim();
      addCategory(finalCategory);
    }
    addHabit({
      id: `h-${Date.now()}`,
      name,
      category: finalCategory,
      targetPerWeek: Number(target),
      streak: 0,
      reminderTime: reminder || undefined,
      history: Array(84).fill(false),
      childId: activeId,
    });
    toast.success("Kebiasaan baru siap dimulai! 💪", { description: name });
    setOpen(false);
    setName("");
    setReminder("");
    setCustomMode(false);
    setCustomCategory("");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isControlled && (
        <DialogTrigger asChild>
          <Button>
            <Plus /> Tambah Kebiasaan
          </Button>
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mulai Kebiasaan Baru</DialogTitle>
          <DialogDescription>
            Hal kecil yang diulang tiap hari — misalnya bacakan buku atau tummy
            time.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="h-name">Nama Kebiasaan</Label>
            <Input
              id="h-name"
              placeholder="Contoh: Bacakan buku 15 menit"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Kategori</Label>
            <Select
              value={customMode ? ADD_NEW : category}
              onValueChange={(v) => {
                if (v === ADD_NEW) {
                  setCustomMode(true);
                } else {
                  setCustomMode(false);
                  setCategory(v);
                }
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
                <SelectItem value={ADD_NEW}>+ Kategori baru…</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {customMode && (
            <div className="space-y-1.5">
              <Label htmlFor="h-cat">Nama kategori baru</Label>
              <Input
                id="h-cat"
                autoFocus
                placeholder="Contoh: Aktivitas Outdoor"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
              />
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="h-target">Target / minggu</Label>
              <Input
                id="h-target"
                type="number"
                min={1}
                max={7}
                value={target}
                onChange={(e) => setTarget(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="h-rem">Pengingat</Label>
              <Input
                id="h-rem"
                type="time"
                value={reminder}
                onChange={(e) => setReminder(e.target.value)}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Batal
          </Button>
          <Button onClick={submit}>Simpan</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
