"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

function ResetForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const invalid = !token || params.get("error") === "INVALID_TOKEN";

  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const pw = String(form.get("password") || "");
    const confirm = String(form.get("confirm") || "");
    if (pw.length < 8) {
      toast.error("Kata sandi minimal 8 karakter");
      return;
    }
    if (pw !== confirm) {
      toast.error("Konfirmasi sandi tidak cocok");
      return;
    }
    setLoading(true);
    const { error } = await authClient.resetPassword({ newPassword: pw, token });
    setLoading(false);
    if (error) {
      toast.error("Gagal mengatur ulang", { description: error.message ?? "Tautan mungkin kedaluwarsa." });
      return;
    }
    toast.success("Kata sandi diperbarui", { description: "Silakan masuk dengan sandi baru." });
    router.push("/login");
  }

  if (invalid) {
    return (
      <AuthShell title="Tautan tidak valid" subtitle="Tautan reset kedaluwarsa atau sudah dipakai.">
        <div className="py-2 text-center">
          <Link href="/forgot-password" className="text-sm font-semibold text-gold-700 hover:underline">
            Minta tautan baru
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Atur ulang kata sandi" subtitle="Buat kata sandi baru untuk akun Anda.">
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="password">Kata Sandi Baru</Label>
          <div className="relative">
            <Input id="password" name="password" type={show ? "text" : "password"} placeholder="Min. 8 karakter" required />
            <button type="button" onClick={() => setShow((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-label="Tampilkan sandi">
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="confirm">Konfirmasi Kata Sandi</Label>
          <Input id="confirm" name="confirm" type={show ? "text" : "password"} placeholder="Ulangi sandi baru" required />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? "Menyimpan…" : "Simpan Kata Sandi"}
        </Button>
      </form>
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<AuthShell title="Memuat…" subtitle=""><div /></AuthShell>}>
      <ResetForm />
    </Suspense>
  );
}
