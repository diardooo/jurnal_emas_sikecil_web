"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Loader2, Trash2, TriangleAlert } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

const CONFIRM_WORD = "HAPUS";

/**
 * Permanent account deletion (UU PDP right to erasure). Requires the user to
 * type a confirmation word and, for password accounts, their password. On
 * success every record owned by the user is removed via DB cascade, then we
 * sign out and return home.
 */
export function DeleteAccountDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  // Export-before-delete gate (JES-114): the user must download a copy of their
  // data OR explicitly acknowledge skipping it before deletion is allowed.
  const [downloaded, setDownloaded] = useState(false);
  const [ackSkip, setAckSkip] = useState(false);
  // Password is required for credential accounts. Default to true (safer to ask)
  // until we confirm the user signed in only via a social provider.
  const [hasPassword, setHasPassword] = useState(true);

  // Reset the gate each time the dialog opens so a prior download/ack can't leak.
  useEffect(() => {
    if (!open) {
      setDownloaded(false);
      setAckSkip(false);
      setConfirm("");
      setPassword("");
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    authClient
      .listAccounts()
      .then((res) => {
        const accounts = (res.data ?? []) as Array<{
          providerId?: string;
          provider?: string;
        }>;
        const credential = accounts.some(
          (a) => (a.providerId ?? a.provider) === "credential",
        );
        // No credential provider → social-only account, no password to ask for.
        if (accounts.length > 0) setHasPassword(credential);
      })
      .catch(() => setHasPassword(true));
  }, [open]);

  const exportSettled = downloaded || ackSkip;
  const canDelete =
    exportSettled &&
    confirm.trim().toUpperCase() === CONFIRM_WORD &&
    (!hasPassword || password.length > 0);

  async function handleDelete() {
    if (!canDelete || busy) return;
    setBusy(true);
    const { error } = await authClient.deleteUser(
      hasPassword ? { password } : {},
    );
    setBusy(false);
    if (error) {
      toast.error("Gagal menghapus akun", {
        description: error.message ?? "Periksa kata sandi lalu coba lagi.",
      });
      return;
    }
    toast.success("Akun dihapus. Sampai jumpa 👋");
    setOpen(false);
    router.push("/");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="border-alert-red/40 text-alert-red hover:bg-alert-red-soft hover:text-alert-red">
          <Trash2 className="h-4 w-4" /> Hapus Akun
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-alert-red">
            <TriangleAlert className="h-5 w-5" /> Hapus akun permanen
          </DialogTitle>
          <DialogDescription>
            Tindakan ini <strong>tidak bisa dibatalkan</strong>. Semua data —
            profil anak, jurnal, milestone, pertumbuhan, task, dan rutinitas —
            akan dihapus permanen.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="space-y-2 rounded-xl border border-gold/30 bg-gold-soft/30 p-3">
            <p className="text-sm font-semibold text-navy">
              Unduh kenanganmu dulu 💛
            </p>
            <p className="text-xs text-navy-muted">
              Setelah dihapus, data tidak bisa dikembalikan. Simpan salinan
              lengkap (jurnal, foto-info, milestone, pertumbuhan) sebelum lanjut.
            </p>
            <Button variant="outline" size="sm" asChild>
              <a
                href="/api/me/export"
                download
                onClick={() => setDownloaded(true)}
              >
                <Download className="h-4 w-4" /> Unduh data saya
              </a>
            </Button>
            <label className="flex items-start gap-2 pt-1 text-xs text-navy-muted">
              <Checkbox
                checked={ackSkip}
                onCheckedChange={(v) => setAckSkip(v === true)}
                className="mt-0.5"
              />
              <span>
                Saya sudah punya salinan atau tidak memerlukannya — lewati
                unduhan.
              </span>
            </label>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirm-delete">
              Ketik <span className="font-bold text-alert-red">{CONFIRM_WORD}</span> untuk konfirmasi
            </Label>
            <Input
              id="confirm-delete"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder={CONFIRM_WORD}
              autoComplete="off"
            />
          </div>
          {hasPassword && (
            <div className="space-y-1.5">
              <Label htmlFor="confirm-password">Kata sandi</Label>
              <Input
                id="confirm-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan kata sandi"
                autoComplete="current-password"
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={busy}>
            Batal
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={!canDelete || busy}
          >
            {busy ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Menghapus…
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" /> Hapus akun saya
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
