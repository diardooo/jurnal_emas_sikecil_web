"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, MailCheck } from "lucide-react";
import { toast } from "sonner";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = String(new FormData(e.currentTarget).get("email") || "");
    setLoading(true);
    const { error } = await authClient.requestPasswordReset({
      email,
      redirectTo: "/reset-password",
    });
    setLoading(false);
    if (error) {
      toast.error("Gagal mengirim", { description: error.message ?? "Coba lagi nanti." });
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <AuthShell title="Cek email Anda" subtitle="Tautan atur ulang sandi sudah dikirim.">
        <div className="flex flex-col items-center gap-4 py-4 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-sage-soft">
            <MailCheck className="h-7 w-7 text-sage" />
          </div>
          <p className="text-sm text-navy-muted">
            Jika email terdaftar, Anda akan menerima tautan untuk mengatur ulang kata sandi.
            Periksa juga folder spam.
          </p>
          <Link href="/login" className="text-sm font-semibold text-gold-700 hover:underline">
            Kembali ke halaman masuk
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Lupa kata sandi?" subtitle="Masukkan email Anda, kami kirimkan tautan reset.">
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" placeholder="nama@email.com" required />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? "Mengirim…" : "Kirim Tautan Reset"}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-navy-muted">
        Ingat sandi Anda?{" "}
        <Link href="/login" className="font-semibold text-gold-700 hover:underline">
          Masuk
        </Link>
      </p>
    </AuthShell>
  );
}
