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
import { useAppStore } from "@/store/app-store";

export function SleepDialog() {
  const activeId = useAppStore((s) => s.activeChildId);
  const addSleepLog = useAppStore((s) => s.addSleepLog);

  const [open, setOpen] = useState(false);
  const [date, setDate] = useState("2026-06-19");
  const [night, setNight] = useState("");
  const [nap, setNap] = useState("");

  function submit() {
    if (!night && !nap) {
      toast.error("Isi durasi tidur malam atau siang");
      return;
    }
    addSleepLog(activeId, {
      id: `sl-${Date.now()}`,
      date,
      nightHours: night ? Number(night) : 0,
      napHours: nap ? Number(nap) : 0,
      childId: activeId,
    });
    toast.success("Catatan tidur tersimpan");
    setOpen(false);
    setNight("");
    setNap("");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus /> Catat Tidur
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Catat Pola Tidur</DialogTitle>
          <DialogDescription>
            Pantau apakah total tidur si Kecil sudah sesuai rekomendasi usianya.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="sl-date">Tanggal</Label>
            <Input
              id="sl-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="sl-night">Tidur malam (jam)</Label>
              <Input
                id="sl-night"
                type="number"
                step="0.5"
                inputMode="decimal"
                placeholder="10"
                value={night}
                onChange={(e) => setNight(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sl-nap">Tidur siang (jam)</Label>
              <Input
                id="sl-nap"
                type="number"
                step="0.5"
                inputMode="decimal"
                placeholder="3"
                value={nap}
                onChange={(e) => setNap(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-secondary/60 px-4 py-3">
            <span className="text-sm font-medium text-navy-muted">
              Total tidur
            </span>
            <span className="font-display text-lg font-extrabold text-gold-700">
              {(Number(night || 0) + Number(nap || 0)).toFixed(1)} jam
            </span>
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
