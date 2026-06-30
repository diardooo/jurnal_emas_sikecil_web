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
import { Textarea } from "@/components/ui/textarea";
import { useAppStore } from "@/store/app-store";
import type { Priority, Task } from "@/lib/types";

const ADD_NEW = "__add_new__";

/**
 * Add or edit a task. Pass a `task` to edit it (prefilled, saves via updateTask);
 * omit it to create a new one. A custom `trigger` lets callers render their own
 * button (e.g. a pencil icon on a list row). Pass `open`/`onOpenChange` to drive
 * it from outside (e.g. the unified "Tambah" chooser) — in that mode no built-in
 * trigger is rendered.
 */
export function TaskDialog({
  task,
  trigger,
  open: openProp,
  onOpenChange,
}: {
  task?: Task;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const isEdit = !!task;
  const isControlled = openProp !== undefined;
  const addTask = useAppStore((s) => s.addTask);
  const updateTask = useAppStore((s) => s.updateTask);
  const activeId = useAppStore((s) => s.activeChildId);
  const categories = useAppStore((s) => s.taskCategories);
  const addCategory = useAppStore((s) => s.addTaskCategory);

  const [openState, setOpenState] = useState(false);
  const open = isControlled ? openProp : openState;
  const setOpen = (o: boolean) => {
    if (!isControlled) setOpenState(o);
    onOpenChange?.(o);
  };
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [priority, setPriority] = useState<Priority>(task?.priority ?? "sedang");
  const [category, setCategory] = useState<string>(
    task?.category ?? categories[0] ?? "Lain-lain",
  );
  const [customMode, setCustomMode] = useState(false);
  const [customCategory, setCustomCategory] = useState("");
  const [dueDate, setDueDate] = useState(task?.dueDate ?? "");

  function reset() {
    setTitle(task?.title ?? "");
    setDescription(task?.description ?? "");
    setPriority(task?.priority ?? "sedang");
    setCategory(task?.category ?? categories[0] ?? "Lain-lain");
    setCustomMode(false);
    setCustomCategory("");
    setDueDate(task?.dueDate ?? "");
  }

  function submit() {
    if (!title.trim()) {
      toast.error("Judul task wajib diisi");
      return;
    }
    let finalCategory = category;
    if (customMode) {
      if (!customCategory.trim()) {
        toast.error("Nama kategori baru wajib diisi");
        return;
      }
      finalCategory = customCategory.trim();
      addCategory(finalCategory);
    }

    if (isEdit) {
      updateTask(task!.id, {
        title,
        description,
        priority,
        category: finalCategory,
        dueDate: dueDate || undefined,
      });
      toast.success("Perubahan disimpan", { description: title });
    } else {
      addTask({
        id: `t-${Date.now()}`,
        title,
        description,
        priority,
        category: finalCategory,
        dueDate: dueDate || undefined,
        status: "todo",
        childId: activeId,
      });
      toast.success("Task ditambahkan", { description: title });
    }
    setOpen(false);
    if (!isEdit) reset();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      {!isControlled && (
        <DialogTrigger asChild>
          {trigger ?? (
            <Button>
              <Plus /> Tambah Task
            </Button>
          )}
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Task" : "Tambah Task Baru"}</DialogTitle>
          <DialogDescription>
            Untuk hal yang dikerjakan sekali & punya tenggat — mis. jadwal dokter,
            urus dokumen, beli kebutuhan si Kecil.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="t-title">Judul</Label>
            <Input
              id="t-title"
              placeholder="Contoh: Jadwalkan kontrol ke dokter anak"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="t-desc">Deskripsi</Label>
            <Textarea
              id="t-desc"
              placeholder="Detail tambahan (opsional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Prioritas</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tinggi">Tinggi</SelectItem>
                  <SelectItem value="sedang">Sedang</SelectItem>
                  <SelectItem value="rendah">Rendah</SelectItem>
                </SelectContent>
              </Select>
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
          </div>
          {customMode && (
            <div className="space-y-1.5">
              <Label htmlFor="t-cat">Nama kategori baru</Label>
              <Input
                id="t-cat"
                autoFocus
                placeholder="Contoh: Persiapan Sekolah"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
              />
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="t-due">Tenggat</Label>
            <Input
              id="t-due"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Batal
          </Button>
          <Button onClick={submit}>
            {isEdit ? "Simpan Perubahan" : "Simpan Task"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
