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
import type { ImmunizationStatus } from "@/lib/types";

export function ImmunizationDialog() {
  const activeId = useAppStore((s) => s.activeChildId);
  const addImmunization = useAppStore((s) => s.addImmunization);

  const [open, setOpen] = useState(false);
  const [vaccine, setVaccine] = useState("");
  const [ageMonths, setAgeMonths] = useState("");
  const [date, setDate] = useState("");
  const [status, setStatus] = useState<ImmunizationStatus>("dijadwalkan");

  function submit() {
    if (!vaccine.trim()) {
      toast.error("Nama vaksin wajib diisi");
      return;
    }
    const m = ageMonths ? Number(ageMonths) : 0;
    addImmunization(activeId, {
      id: `im-${Date.now()}`,
      vaccine: vaccine.trim(),
      ageLabel: m >= 12 ? `${Math.round(m / 12)} tahun` : `${m} bulan`,
      ageMonths: m,
      status,
      date: date || undefined,
    });
    toast.success("Imunisasi ditambahkan", { description: vaccine });
    setOpen(false);
    setVaccine("");
    setAgeMonths("");
    setDate("");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus /> Tambah Imunisasi
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tambah Imunisasi</DialogTitle>
          <DialogDescription>
            Catat vaksin tambahan atau jadwal khusus dari dokter.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="im-vaccine">Nama Vaksin</Label>
            <Input
              id="im-vaccine"
              placeholder="Contoh: PCV booster"
              value={vaccine}
              onChange={(e) => setVaccine(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="im-age">Usia (bulan)</Label>
              <Input
                id="im-age"
                type="number"
                inputMode="numeric"
                placeholder="12"
                value={ageMonths}
                onChange={(e) => setAgeMonths(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as ImmunizationStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="selesai">Selesai</SelectItem>
                  <SelectItem value="dijadwalkan">Dijadwalkan</SelectItem>
                  <SelectItem value="akan-datang">Akan datang</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="im-date">Tanggal (jika ada)</Label>
            <Input
              id="im-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
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
