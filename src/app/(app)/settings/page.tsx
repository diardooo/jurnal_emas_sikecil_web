"use client";

import { useEffect, useRef, useState } from "react";
import {
  Bell,
  CreditCard,
  Crown,
  Check,
  Sparkles,
  User,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAppStore } from "@/store/app-store";
import { useTourStore } from "@/store/tour-store";
import { authClient, useSession } from "@/lib/auth-client";
import { formatRupiah } from "@/lib/utils";

type SessionData = ReturnType<typeof useSession>["data"];

const notifSettings = [
  { id: "imun", label: "Reminder imunisasi", desc: "Berdasarkan usia anak", on: true },
  { id: "posyandu", label: "Reminder posyandu", desc: "Penimbangan bulanan", on: true },
  { id: "task", label: "Deadline task", desc: "Saat task mendekati tenggat", on: true },
  { id: "habit", label: "Pengingat kebiasaan", desc: "Sesuai waktu yang diatur", on: false },
  { id: "milestone", label: "Milestone baru", desc: "Yang relevan dengan usia", on: true },
  { id: "email", label: "Notifikasi email", desc: "Ringkasan mingguan via email", on: false },
];

// Per-device notification preferences. Persisted in localStorage for now; when
// the server-side notification generator (§10.7) lands, move these to the DB so
// the backend can honor them. Lazy-read so there's no SSR mismatch.
const NOTIF_PREFS_KEY = "je:notif-prefs";
function readNotifPrefs(): Record<string, boolean> {
  const base = Object.fromEntries(notifSettings.map((n) => [n.id, n.on]));
  if (typeof window === "undefined") return base;
  try {
    const raw = window.localStorage.getItem(NOTIF_PREFS_KEY);
    return raw ? { ...base, ...(JSON.parse(raw) as Record<string, boolean>) } : base;
  } catch {
    return base;
  }
}

function NotifTab() {
  const [prefs, setPrefs] = useState<Record<string, boolean>>(readNotifPrefs);

  function toggle(id: string, value: boolean) {
    setPrefs((prev) => {
      const next = { ...prev, [id]: value };
      try {
        window.localStorage.setItem(NOTIF_PREFS_KEY, JSON.stringify(next));
      } catch {
        /* storage unavailable — keep in-memory */
      }
      return next;
    });
    const label = notifSettings.find((n) => n.id === id)?.label;
    toast(value ? "Notifikasi diaktifkan" : "Notifikasi dimatikan", {
      description: label,
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Preferensi Notifikasi</CardTitle>
      </CardHeader>
      <CardContent className="divide-y">
        {notifSettings.map((n) => (
          <div
            key={n.id}
            className="flex items-center justify-between py-4 first:pt-0"
          >
            <div>
              <p className="text-sm font-semibold text-navy">{n.label}</p>
              <p className="text-xs text-navy-muted">{n.desc}</p>
            </div>
            <Switch
              checked={prefs[n.id]}
              onCheckedChange={(v) => toggle(n.id, v)}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

const premiumPerks = [
  "Hingga 5 profil anak",
  "Task & habit unlimited",
  "Milestone lengkap 0–6 tahun",
  "Export laporan PDF",
  "Foto di setiap milestone",
];

function AccountTab({ session, onShowGuide }: { session: SessionData; onShowGuide: () => void }) {
  const user = session?.user;
  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState((user as { phone?: string } | undefined)?.phone ?? "");
  const [image, setImage] = useState(user?.image ?? "");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Change-password panel
  const [showPwd, setShowPwd] = useState(false);
  const [curPwd, setCurPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [pwdSaving, setPwdSaving] = useState(false);

  async function saveProfile() {
    setSaving(true);
    // `phone` is a Better Auth additionalField — sent at runtime but not in the
    // client's inferred type, so we assert the payload shape.
    const { error } = await authClient.updateUser(
      { name, phone, image: image || undefined } as { name?: string; image?: string },
    );
    setSaving(false);
    if (error) {
      toast.error("Gagal menyimpan", { description: error.message ?? "Coba lagi." });
      return;
    }
    toast.success("Profil disimpan");
  }

  async function onPickPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? `Gagal (${res.status})`);
      setImage(data.url!);
      await authClient.updateUser({ image: data.url });
      toast.success("Foto diperbarui");
    } catch (err) {
      toast.error("Upload gagal", { description: err instanceof Error ? err.message : undefined });
    } finally {
      setUploading(false);
    }
  }

  async function changePassword() {
    if (newPwd.length < 8) {
      toast.error("Kata sandi baru minimal 8 karakter");
      return;
    }
    setPwdSaving(true);
    const { error } = await authClient.changePassword({
      currentPassword: curPwd,
      newPassword: newPwd,
      revokeOtherSessions: true,
    });
    setPwdSaving(false);
    if (error) {
      toast.error("Gagal mengubah sandi", { description: error.message ?? "Sandi lama mungkin salah." });
      return;
    }
    toast.success("Kata sandi diperbarui");
    setShowPwd(false);
    setCurPwd("");
    setNewPwd("");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profil Akun</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 border-2 border-gold-300">
            <AvatarImage src={image || `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(name || "U")}`} />
            <AvatarFallback>{(name || "U").charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPickPhoto} />
          <Button variant="outline" size="sm" disabled={uploading} onClick={() => fileRef.current?.click()}>
            {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
            {uploading ? "Mengunggah…" : "Ubah Foto"}
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="name">Nama Lengkap</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={user?.email ?? ""} disabled title="Hubungi support untuk mengubah email" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">Nomor Telepon</Label>
            <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0812-xxxx-xxxx" />
          </div>
        </div>

        <Separator />
        <div className="flex flex-wrap gap-3">
          <Button onClick={saveProfile} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />} Simpan Perubahan
          </Button>
          <Button variant="outline" onClick={() => setShowPwd((v) => !v)}>
            Ubah Kata Sandi
          </Button>
        </div>

        {showPwd && (
          <div className="grid grid-cols-1 gap-3 rounded-xl border bg-muted/30 p-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="curpwd">Kata Sandi Saat Ini</Label>
              <Input id="curpwd" type="password" value={curPwd} onChange={(e) => setCurPwd(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="newpwd">Kata Sandi Baru</Label>
              <Input id="newpwd" type="password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} placeholder="Min. 8 karakter" />
            </div>
            <div className="sm:col-span-2">
              <Button size="sm" onClick={changePassword} disabled={pwdSaving}>
                {pwdSaving && <Loader2 className="h-4 w-4 animate-spin" />} Simpan Kata Sandi
              </Button>
            </div>
          </div>
        )}

        <Separator />
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-navy">Panduan dashboard</p>
            <p className="text-xs text-navy-muted">Tampilkan kembali 5 langkah memulai di halaman Dashboard.</p>
          </div>
          <Button variant="outline" size="sm" onClick={onShowGuide}>
            Tampilkan Panduan
          </Button>
        </div>

        <Separator />
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-navy">Tur Aplikasi</p>
            <p className="text-xs text-navy-muted">Ulangi tur fitur langkah-demi-langkah keliling aplikasi.</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => useTourStore.getState().start()}
          >
            Mulai Tur
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

const VALID_TABS = ["account", "notif", "billing"] as const;
type SettingsTab = (typeof VALID_TABS)[number];

export default function SettingsPage() {
  const plan = useAppStore((s) => s.plan);
  const setPlan = useAppStore((s) => s.setPlan);
  const setShowGuide = useAppStore((s) => s.setShowGuide);
  const hydrate = useAppStore((s) => s.hydrate);
  const expiresAt = useAppStore((s) => s.subscriptionExpiresAt);
  const { data: session } = useSession();
  const [checkingOut, setCheckingOut] = useState<"monthly" | "yearly" | null>(null);
  const [activeTab, setActiveTab] = useState<SettingsTab>(() => {
    if (typeof window === "undefined") return "account";
    const t = new URLSearchParams(window.location.search).get("tab") ?? "";
    return (VALID_TABS as readonly string[]).includes(t) ? (t as SettingsTab) : "account";
  });

  // Returning from Midtrans Snap (?paid=1): reconcile against Midtrans in case
  // the webhook was missed/delayed, then re-sync the store so the plan updates.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (!params.has("paid")) return;
    window.history.replaceState({}, "", "/settings");
    void (async () => {
      let upgraded = false;
      try {
        const res = await fetch("/api/payment/status", { method: "POST" });
        const data = (await res.json().catch(() => ({}))) as { plan?: string; status?: string };
        upgraded = data.plan === "premium";
      } catch {
        /* fall back to hydrate + neutral message */
      }
      await hydrate();
      if (upgraded) {
        toast.success("Selamat datang di Premium Emas! 👑", {
          description: "Pembayaran terkonfirmasi — semua fitur premium aktif.",
        });
      } else {
        toast("Pembayaran diproses", {
          description: "Status akan diperbarui begitu pembayaran terkonfirmasi.",
        });
      }
    })();
  }, [hydrate]);

  // Start a Midtrans checkout. Falls back to demo trial when not configured.
  async function startCheckout(billing: "monthly" | "yearly") {
    setCheckingOut(billing);
    try {
      const res = await fetch("/api/payment/snap", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ plan: billing }),
      });
      const data = (await res.json().catch(() => ({}))) as { redirectUrl?: string; error?: string };
      if (res.status === 503) {
        // Midtrans belum aktif → mode demo (trial langsung).
        setPlan("premium");
        toast.success("Selamat datang di Premium Emas! 👑", {
          description: "Mode demo (pembayaran belum aktif) — trial 14 hari dimulai.",
        });
        return;
      }
      if (!res.ok) throw new Error(data.error ?? "Gagal memproses");
      if (data.redirectUrl) window.location.href = data.redirectUrl;
    } catch (e) {
      toast.error("Gagal memulai pembayaran", {
        description: e instanceof Error ? e.message : undefined,
      });
    } finally {
      setCheckingOut(null);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pengaturan"
        description="Kelola akun, notifikasi, dan langganan Anda."
      />

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as SettingsTab)}>
        <TabsList>
          <TabsTrigger value="account">
            <User className="h-4 w-4" /> Akun
          </TabsTrigger>
          <TabsTrigger value="notif">
            <Bell className="h-4 w-4" /> Notifikasi
          </TabsTrigger>
          <TabsTrigger value="billing">
            <CreditCard className="h-4 w-4" /> Langganan
          </TabsTrigger>
        </TabsList>

        {/* ACCOUNT */}
        <TabsContent value="account">
          <AccountTab
            session={session}
            onShowGuide={() => {
              setShowGuide(true);
              toast.success("Panduan ditampilkan kembali di Dashboard");
            }}
          />
        </TabsContent>

        {/* NOTIFICATIONS */}
        <TabsContent value="notif">
          <NotifTab />
        </TabsContent>

        {/* BILLING */}
        <TabsContent value="billing" className="space-y-6">
          <Card className="overflow-hidden">
            <div className="bg-gradient-to-br from-navy to-navy-light p-6 text-cream">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-cream/70">Paket Anda saat ini</p>
                  <p className="mt-1 flex items-center gap-2 font-display text-2xl font-extrabold">
                    {plan === "premium" ? (
                      <>
                        <Crown className="h-6 w-6 text-gold-400" /> Premium Emas
                      </>
                    ) : (
                      "Gratis"
                    )}
                  </p>
                </div>
                <Badge variant="gold">
                  {plan === "premium" ? "Aktif" : "Free"}
                </Badge>
              </div>
              {plan === "premium" && (
                <p className="mt-4 text-sm text-cream/70">
                  {expiresAt
                    ? `Berlaku sampai ${new Intl.DateTimeFormat("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      }).format(new Date(expiresAt))}`
                    : "Premium aktif tanpa batas waktu"}
                </p>
              )}
            </div>
            <CardContent className="p-6">
              {plan === "free" ? (
                <div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-gold-600" />
                    <p className="font-display font-bold text-navy">
                      Upgrade ke Premium Emas
                    </p>
                  </div>
                  <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {premiumPerks.map((p) => (
                      <li
                        key={p}
                        className="flex items-center gap-2 text-sm text-navy-muted"
                      >
                        <Check className="h-4 w-4 text-sage" /> {p}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    <Button
                      onClick={() => startCheckout("monthly")}
                      disabled={checkingOut !== null}
                    >
                      {checkingOut === "monthly"
                        ? "Memproses…"
                        : `Bulanan — ${formatRupiah(49000)}/bln`}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => startCheckout("yearly")}
                      disabled={checkingOut !== null}
                    >
                      {checkingOut === "yearly"
                        ? "Memproses…"
                        : `Tahunan — ${formatRupiah(399000)}/thn`}
                    </Button>
                    <span className="text-sm text-sage">Hemat 2 bulan dengan paket tahunan</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-navy-muted">
                    Terima kasih telah berlangganan! Anda menikmati semua fitur
                    premium
                    {expiresAt
                      ? ` hingga ${new Intl.DateTimeFormat("id-ID", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        }).format(new Date(expiresAt))}`
                      : ""}
                    .
                  </p>
                  <p className="text-xs text-navy-muted">
                    Pembayaran sekali bayar — langganan{" "}
                    <span className="font-semibold">tidak diperpanjang otomatis</span>.
                    Perpanjang kapan saja; masa aktif baru ditambahkan dari tanggal
                    pembayaran.
                  </p>
                  <div className="flex flex-wrap items-center gap-3">
                    <Button
                      onClick={() => startCheckout("monthly")}
                      disabled={checkingOut !== null}
                    >
                      {checkingOut === "monthly" ? "Memproses…" : "Perpanjang 1 Bulan"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => startCheckout("yearly")}
                      disabled={checkingOut !== null}
                    >
                      {checkingOut === "yearly" ? "Memproses…" : "Perpanjang 1 Tahun"}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment methods */}
          <Card>
            <CardHeader>
              <CardTitle>Metode Pembayaran</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-3 text-sm text-navy-muted">
                Didukung oleh Midtrans
              </p>
              <div className="flex flex-wrap gap-2">
                {["QRIS", "GoPay", "OVO", "Transfer Bank", "Kartu Kredit"].map(
                  (m) => (
                    <span
                      key={m}
                      className="rounded-lg border bg-background px-3 py-1.5 text-xs font-semibold text-navy"
                    >
                      {m}
                    </span>
                  ),
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
