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
import { ageInMonthsAt } from "@/lib/utils";

export function MeasurementDialog() {
  const activeId = useAppStore((s) => s.activeChildId);
  const child = useAppStore((s) =>
    s.children.find((c) => c.id === s.activeChildId),
  );
  const addGrowthRecord = useAppStore((s) => s.addGrowthRecord);

  const [open, setOpen] = useState(false);
  const [date, setDate] = useState("2026-06-19");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [headCirc, setHeadCirc] = useState("");
  const [note, setNote] = useState("");

  const ageMonths = child ? ageInMonthsAt(child.dob, date) : 0;

  function submit() {
    if (!weight && !height && !headCirc) {
      toast.error("Isi minimal satu pengukuran");
      return;
    }
    addGrowthRecord(activeId, {
      ageMonths,
      weight: weight ? Number(weight) : 0,
      height: height ? Number(height) : 0,
      headCirc: headCirc ? Number(headCirc) : undefined,
      date,
      note: note.trim() || undefined,
    });
    toast.success("Pengukuran tersimpan", {
      description: `Usia ${ageMonths} bulan diperbarui di grafik.`,
    });
    setOpen(false);
    setWeight("");
    setHeight("");
    setHeadCirc("");
    setNote("");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus /> Tambah Pengukuran
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tambah Pengukuran</DialogTitle>
          <DialogDescription>
            Catat hasil penimbangan {child?.name}. Grafik mengikuti data yang
            kamu isi.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="m-date">Tanggal Pengukuran</Label>
            <Input
              id="m-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
            <p className="text-xs text-navy-muted">
              Setara usia <strong>{ageMonths} bulan</strong>.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="w">Berat (kg)</Label>
              <Input
                id="w"
                type="number"
                step="0.1"
                inputMode="decimal"
                placeholder="8.9"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="h">Tinggi (cm)</Label>
              <Input
                id="h"
                type="number"
                step="0.1"
                inputMode="decimal"
                placeholder="71"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="hc">L. Kepala (cm)</Label>
              <Input
                id="hc"
                type="number"
                step="0.1"
                inputMode="decimal"
                placeholder="44.8"
                value={headCirc}
                onChange={(e) => setHeadCirc(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="m-note">Catatan (opsional)</Label>
            <Textarea
              id="m-note"
              placeholder="mis. Penimbangan di Posyandu Melati, anak sehat & aktif."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
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
