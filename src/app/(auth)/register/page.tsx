"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AuthShell } from "@/components/auth/auth-shell";
import { GoogleButton } from "@/components/auth/google-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { signUp } from "@/lib/auth-client";

export default function RegisterPage() {
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const hasLength = password.length >= 8;
  const hasLetterNum = /[a-zA-Z]/.test(password) && /[0-9]/.test(password);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!hasLength || !hasLetterNum) {
      toast.error("Kata sandi belum memenuhi syarat");
      return;
    }
    setLoading(true);
    const { error } = await signUp.email({ name, email, password, phone: phone || undefined });
    setLoading(false);
    if (error) {
      toast.error("Gagal membuat akun", {
        description: error.message ?? "Email mungkin sudah terdaftar.",
      });
      return;
    }
    toast.success("Akun berhasil dibuat", {
      description: "Yuk, siapkan profil si Kecil.",
    });
    router.push("/onboarding");
  }

  return (
    <AuthShell
      title="Buat akun gratis"
      subtitle="Mulai pantau tumbuh kembang si Kecil hari ini."
    >
      <GoogleButton label="Daftar dengan Google" />

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">atau dengan email</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">Nama Lengkap</Label>
          <Input
            id="name"
            placeholder="Nama Anda"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="nama@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">
            Nomor HP <span className="text-muted-foreground font-normal">(opsional)</span>
          </Label>
          <Input
            id="phone"
            type="tel"
            placeholder="08xxxxxxxxxx"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Kata Sandi</Label>
          <div className="relative">
            <Input
              id="password"
              type={show ? "text" : "password"}
              placeholder="Minimal 8 karakter"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
          <div className="flex gap-4 pt-1">
            <Requirement ok={hasLength} label="Min. 8 karakter" />
            <Requirement ok={hasLetterNum} label="Huruf & angka" />
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? "Membuat akun…" : "Daftar Sekarang"}
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          Dengan mendaftar, Anda menyetujui{" "}
          <Link href="#" className="underline">Syarat & Ketentuan</Link> serta{" "}
          <Link href="#" className="underline">Kebijakan Privasi</Link>.
        </p>
      </form>

      <p className="mt-6 text-center text-sm text-navy-muted">
        Sudah punya akun?{" "}
        <Link href="/login" className="font-semibold text-gold-700 hover:underline">
          Masuk
        </Link>
      </p>
    </AuthShell>
  );
}

function Requirement({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={cn(
        "flex items-center gap-1 text-xs",
        ok ? "text-sage" : "text-muted-foreground",
      )}
    >
      <span
        className={cn(
          "grid h-4 w-4 place-items-center rounded-full",
          ok ? "bg-sage text-white" : "bg-muted",
        )}
      >
        <Check className="h-2.5 w-2.5" />
      </span>
      {label}
    </span>
  );
}
