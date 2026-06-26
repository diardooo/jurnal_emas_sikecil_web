"use client";

import { useRef, useState } from "react";
import { Loader2, Pencil, RefreshCw, Upload } from "lucide-react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAppStore } from "@/store/app-store";
import { initials } from "@/lib/utils";
import type { Child, Gender } from "@/lib/types";

export function EditChildDialog({ child }: { child: Child }) {
  const updateChild = useAppStore((s) => s.updateChild);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(child.name);
  const [dob, setDob] = useState(child.dob);
  const [gender, setGender] = useState<Gender>(child.gender);
  const [weight, setWeight] = useState(child.birthWeight?.toString() ?? "");
  const [height, setHeight] = useState(child.birthHeight?.toString() ?? "");
  const [photoUrl, setPhotoUrl] = useState(child.photoUrl ?? "");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function randomizeAvatar() {
    setPhotoUrl(
      `https://api.dicebear.com/9.x/fun-emoji/svg?seed=${encodeURIComponent(
        name + Math.random().toString(36).slice(2, 6),
      )}`,
    );
  }

  // Upload to Cloudinary via /api/upload; the returned URL persists on Save.
  async function onPickPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = (await res.json().catch(() => ({}))) as {
        url?: string;
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? `Gagal (${res.status})`);
      setPhotoUrl(data.url!);
      toast.success("Foto diunggah");
    } catch (err) {
      toast.error("Upload gagal", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setUploading(false);
    }
  }

  function submit() {
    if (!name.trim()) {
      toast.error("Nama anak wajib diisi");
      return;
    }
    updateChild(child.id, {
      name: name.trim(),
      dob,
      gender,
      birthWeight: weight ? Number(weight) : undefined,
      birthHeight: height ? Number(height) : undefined,
      photoUrl: photoUrl || undefined,
    });
    toast.success("Data anak diperbarui", { description: name });
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Pencil className="h-4 w-4" /> Edit Data
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Data Anak</DialogTitle>
          <DialogDescription>
            Perbarui informasi {child.name}.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 border-2 border-gold-300">
            <AvatarImage src={photoUrl} alt={name} />
            <AvatarFallback>{initials(name || "?")}</AvatarFallback>
          </Avatar>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={onPickPhoto}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {uploading ? "Mengunggah…" : "Unggah Foto"}
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={randomizeAvatar}>
              <RefreshCw className="h-4 w-4" /> Acak Avatar
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="ec-name">Nama Anak</Label>
            <Input
              id="ec-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ec-photo">URL Foto (opsional)</Label>
            <Input
              id="ec-photo"
              placeholder="https://…"
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="ec-dob">Tanggal Lahir</Label>
              <Input
                id="ec-dob"
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Jenis Kelamin</Label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { v: "L" as Gender, label: "👦" },
                  { v: "P" as Gender, label: "👧" },
                ].map((g) => (
                  <button
                    key={g.v}
                    type="button"
                    onClick={() => setGender(g.v)}
                    className={
                      "rounded-xl border-2 py-2 text-lg transition-colors " +
                      (gender === g.v
                        ? "border-gold-500 bg-gold-50"
                        : "border-border hover:border-gold-200")
                    }
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="ec-w">Berat Lahir (kg)</Label>
              <Input
                id="ec-w"
                type="number"
                step="0.1"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ec-h">Tinggi Lahir (cm)</Label>
              <Input
                id="ec-h"
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Batal
          </Button>
          <Button onClick={submit}>Simpan Perubahan</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
