"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AuthShell } from "@/components/auth/auth-shell";
import { GoogleButton } from "@/components/auth/google-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { signIn } from "@/lib/auth-client";

export default function LoginPage() {
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") || "");
    const password = String(form.get("password") || "");
    const redirectTo =
      new URLSearchParams(window.location.search).get("redirect") ||
      "/dashboard";
    setLoading(true);
    const { error } = await signIn.email({ email, password });
    setLoading(false);
    if (error) {
      toast.error("Gagal masuk", {
        description: error.message ?? "Email atau kata sandi salah.",
      });
      return;
    }
    toast.success("Berhasil masuk", { description: "Selamat datang kembali!" });
    router.push(redirectTo);
  }

  return (
    <AuthShell
      title="Masuk ke akun Anda"
      subtitle="Lanjutkan memantau tumbuh kembang si Kecil."
    >
      <GoogleButton label="Masuk dengan Google" />

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">atau dengan email</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" placeholder="nama@email.com" required />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Kata Sandi</Label>
            <Link href="/forgot-password" className="text-xs font-semibold text-gold-700 hover:underline">
              Lupa sandi?
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={show ? "text" : "password"}
              placeholder="••••••••"
              required
            />
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              aria-label="Tampilkan sandi"
            >
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm text-navy-muted">
          <Checkbox defaultChecked /> Ingat saya selama 30 hari
        </label>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? "Memproses…" : "Masuk"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-navy-muted">
        Belum punya akun?{" "}
        <Link href="/register" className="font-semibold text-gold-700 hover:underline">
          Daftar gratis
        </Link>
      </p>
    </AuthShell>
  );
}
