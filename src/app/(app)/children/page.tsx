"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Cake,
  FileText,
  LineChart,
  Plus,
  Ruler,
  Scale,
} from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { EditChildDialog } from "@/components/app/edit-child-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { useAppStore } from "@/store/app-store";
import { formatDateID, getAge, initials, cn } from "@/lib/utils";
import { FREE_CHILD_LIMIT } from "@/lib/gating";

export default function ChildrenPage() {
  const router = useRouter();
  const children = useAppStore((s) => s.children);
  const activeId = useAppStore((s) => s.activeChildId);
  const setActive = useAppStore((s) => s.setActiveChild);
  const growthMap = useAppStore((s) => s.growth);
  const plan = useAppStore((s) => s.plan);

  const atFreeLimit = plan !== "premium" && children.length >= FREE_CHILD_LIMIT;
  function onAddChild() {
    if (atFreeLimit) {
      toast("Tambah anak khusus Premium", {
        description: `Akun Free dibatasi ${FREE_CHILD_LIMIT} anak. Upgrade ke Emas untuk menambah anak lain.`,
        action: { label: "Upgrade", onClick: () => router.push("/settings") },
      });
      return;
    }
    router.push("/onboarding");
  }

  const active = children.find((c) => c.id === activeId) ?? children[0];
  const age = getAge(active.dob);
  const growth = growthMap[active.id] ?? [];
  const latest = growth[growth.length - 1];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profil Anak"
        description="Kelola data dasar si Kecil dan beralih antar anak."
        action={
          <Button onClick={onAddChild}>
            <Plus /> Tambah Anak
          </Button>
        }
      />

      {/* child selector cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {children.map((c) => {
          const a = getAge(c.dob);
          const isActive = c.id === activeId;
          return (
            <button
              key={c.id}
              onClick={() => setActive(c.id)}
              className={cn(
                "flex items-center gap-4 rounded-2xl border bg-card p-4 text-left transition-all hover:shadow-md",
                isActive && "border-gold-400 ring-2 ring-gold-200",
              )}
            >
              <Avatar className="h-14 w-14 border-2 border-gold-300">
                <AvatarImage src={c.photoUrl} alt={c.name} />
                <AvatarFallback>{initials(c.name)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="font-display font-bold text-navy">{c.name}</p>
                <p className="text-xs text-navy-muted">{a.label}</p>
              </div>
              {isActive && <Badge variant="success">Aktif</Badge>}
            </button>
          );
        })}
      </div>

      {/* active child detail */}
      <Card>
        <CardContent className="flex flex-col gap-6 p-6 lg:flex-row lg:items-center">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20 border-4 border-gold-200">
              <AvatarImage src={active.photoUrl} alt={active.name} />
              <AvatarFallback className="text-xl">
                {initials(active.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-display text-xl font-extrabold text-navy">
                {active.name}
              </h3>
              <span
                className={cn(
                  "mt-1 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold",
                  active.gender === "L"
                    ? "bg-blue-50 text-blue-600"
                    : "bg-pink-50 text-pink-600",
                )}
              >
                <span aria-hidden>{active.gender === "L" ? "👦" : "👧"}</span>
                {active.gender === "L" ? "Laki-laki" : "Perempuan"}
              </span>
              <div className="mt-3">
                <EditChildDialog child={active} />
              </div>
            </div>
          </div>
          <div className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-4">
            <InfoStat icon={Cake} label="Usia" value={age.label} />
            <InfoStat
              icon={Cake}
              label="Tanggal Lahir"
              value={formatDateID(active.dob)}
            />
            <InfoStat
              icon={Scale}
              label="Berat Lahir"
              value={active.birthWeight ? `${active.birthWeight} kg` : "—"}
            />
            <InfoStat
              icon={Ruler}
              label="Tinggi Lahir"
              value={active.birthHeight ? `${active.birthHeight} cm` : "—"}
            />
          </div>
        </CardContent>
      </Card>

      {/* quick links — detail dipindah ke Tumbuh Kembang & Laporan */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <LinkCard
          href="/growth"
          icon={LineChart}
          title="Tumbuh Kembang"
          desc={`Catat & lihat grafik pertumbuhan ${active.name}${
            latest ? ` — kini ${latest.weight} kg, ${latest.height} cm` : ""
          }.`}
        />
        <LinkCard
          href="/reports"
          icon={FileText}
          title="Laporan Perkembangan"
          desc="Ringkasan milestone per kategori & grafik, siap dibawa ke dokter."
        />
      </div>
    </div>
  );
}

function InfoStat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Cake;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border bg-background p-3">
      <Icon className="h-4 w-4 text-gold-600" />
      <p className="mt-1.5 text-sm font-bold text-navy">{value}</p>
      <p className="text-[11px] text-navy-muted">{label}</p>
    </div>
  );
}

function LinkCard({
  href,
  icon: Icon,
  title,
  desc,
}: {
  href: string;
  icon: typeof Cake;
  title: string;
  desc: string;
}) {
  return (
    <Link href={href}>
      <Card className="h-full transition-all hover:-translate-y-0.5 hover:shadow-md">
        <CardContent className="flex items-start gap-3 p-5">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gold-100 text-gold-700">
            <Icon className="h-5 w-5" />
          </span>
          <div className="flex-1">
            <p className="flex items-center gap-1 font-display font-bold text-navy">
              {title} <ArrowRight className="h-4 w-4 text-gold-600" />
            </p>
            <p className="mt-0.5 text-sm text-navy-muted">{desc}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
