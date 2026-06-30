"use client";

import { useState } from "react";
import { CalendarClock, ChevronRight, Flame, Plus, Sun } from "lucide-react";
import { toast } from "sonner";
import { TaskDialog } from "@/components/app/task-dialog";
import { HabitDialog } from "@/components/app/habit-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { cn } from "@/lib/utils";
import type { TodoCategory } from "@/lib/types";

type Mode = "chooser" | "task" | "todo" | "habit" | null;

const todoCategories: TodoCategory[] = [
  "Rutinitas Pagi",
  "Siang",
  "Malam",
  "Jadwal Anak",
];

/**
 * One door to add anything in "Catatan si Kecil". Asks a single question —
 * what kind of thing? — then opens the right form and jumps to the matching
 * tab so a parent never has to guess where it belongs.
 */
export function QuickAdd({
  onSwitchTab,
}: {
  onSwitchTab?: (tab: "rutinitas" | "pr") => void;
}) {
  const [mode, setMode] = useState<Mode>(null);

  function choose(kind: "task" | "todo" | "habit") {
    if (kind === "task") onSwitchTab?.("pr");
    else onSwitchTab?.("rutinitas");
    setMode(kind);
  }

  return (
    <>
      <Button onClick={() => setMode("chooser")}>
        <Plus /> Tambah
      </Button>

      {/* Step 1 — pick what to add */}
      <Dialog
        open={mode === "chooser"}
        onOpenChange={(o) => {
          if (!o) setMode(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mau catat apa untuk si Kecil?</DialogTitle>
            <DialogDescription>
              Pilih jenisnya — nanti otomatis masuk ke tempat yang pas.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <ChoiceRow
              icon={CalendarClock}
              color="bg-gold-100 text-gold-700"
              title="Tugas sekali beres"
              desc="Ada tenggatnya, sekali selesai. Mis. kontrol dokter, urus akta."
              onClick={() => choose("task")}
            />
            <ChoiceRow
              icon={Sun}
              color="bg-soft-orange-soft text-soft-orange"
              title="Rutinitas harian"
              desc="Ceklis yang segar lagi tiap pagi. Mis. mandi, minum vitamin."
              onClick={() => choose("todo")}
            />
            <ChoiceRow
              icon={Flame}
              color="bg-sage-soft text-sage"
              title="Kebiasaan"
              desc="Dilatih konsisten & dihitung streak-nya. Mis. baca buku 15 menit."
              onClick={() => choose("habit")}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Step 2 — the right form, driven externally */}
      <TaskDialog
        open={mode === "task"}
        onOpenChange={(o) => {
          if (!o) setMode(null);
        }}
      />
      <HabitDialog
        open={mode === "habit"}
        onOpenChange={(o) => {
          if (!o) setMode(null);
        }}
      />
      <TodoDialog
        open={mode === "todo"}
        onOpenChange={(o) => {
          if (!o) setMode(null);
        }}
      />
    </>
  );
}

function ChoiceRow({
  icon: Icon,
  color,
  title,
  desc,
  onClick,
}: {
  icon: typeof Sun;
  color: string;
  title: string;
  desc: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors hover:border-gold-300 hover:bg-gold-50"
    >
      <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl", color)}>
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-navy">{title}</p>
        <p className="mt-0.5 text-xs text-navy-muted">{desc}</p>
      </div>
      <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
    </button>
  );
}

/** Minimal form for a daily-checklist item (resets each morning). */
function TodoDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const add = useAppStore((s) => s.addTodo);
  const activeId = useAppStore((s) => s.activeChildId);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<TodoCategory>("Rutinitas Pagi");

  function reset() {
    setTitle("");
    setCategory("Rutinitas Pagi");
  }

  function submit() {
    if (!title.trim()) {
      toast.error("Tulis dulu rutinitasnya ya");
      return;
    }
    add({
      id: `d-${Date.now()}`,
      title: title.trim(),
      category,
      done: false,
      childId: activeId,
    });
    toast.success("Rutinitas ditambahkan", { description: title.trim() });
    onOpenChange(false);
    reset();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) reset();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tambah Rutinitas Harian</DialogTitle>
          <DialogDescription>
            Ceklis yang otomatis segar lagi tiap pagi — mis. mandi, minum
            vitamin, jadwal makan.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="d-title">Rutinitas</Label>
            <Input
              id="d-title"
              autoFocus
              placeholder="Contoh: Minum vitamin pagi"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submit();
              }}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Waktu</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as TodoCategory)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {todoCategories.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button onClick={submit}>Simpan</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
