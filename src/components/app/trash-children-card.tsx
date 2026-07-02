"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, RotateCcw, Trash2, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppStore } from "@/store/app-store";
import { SOFT_DELETE_RETENTION_DAYS } from "@/lib/retention";
import type { Child } from "@/lib/types";

type TrashedChild = Child & { deletedAt: string };

/** Whole days left before a trashed child is auto-purged (min 0). */
function daysLeft(deletedAt: string): number {
  const purgeAt =
    new Date(deletedAt).getTime() + SOFT_DELETE_RETENTION_DAYS * 86_400_000;
  return Math.max(0, Math.ceil((purgeAt - Date.now()) / 86_400_000));
}

/**
 * Trash (JES-114): children the parent deleted are held here for
 * SOFT_DELETE_RETENTION_DAYS days. They can restore a child (bringing back all
 * its journals/milestones/growth) or delete it permanently before the purge.
 */
export function TrashChildrenCard() {
  const [items, setItems] = useState<TrashedChild[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const hydrate = useAppStore((s) => s.hydrate);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/children/trash");
      if (!res.ok) throw new Error();
      setItems((await res.json()) as TrashedChild[]);
    } catch {
      setItems([]);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function restore(c: TrashedChild) {
    setBusyId(c.id);
    try {
      const res = await fetch(`/api/children/${c.id}/restore`, { method: "POST" });
      if (!res.ok) throw new Error();
      setItems((prev) => (prev ?? []).filter((x) => x.id !== c.id));
      toast.success(`${c.name} dipulihkan 💛`);
      await hydrate(); // bring the child (and its data) back into the app
    } catch {
      toast.error("Gagal memulihkan. Coba lagi.");
    } finally {
      setBusyId(null);
    }
  }

  async function purge(c: TrashedChild) {
    if (
      !window.confirm(
        `Hapus permanen data ${c.name}? Semua jurnal, milestone, dan pertumbuhannya ikut terhapus dan tidak bisa dikembalikan.`,
      )
    )
      return;
    setBusyId(c.id);
    try {
      const res = await fetch(`/api/children/${c.id}/permanent`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      setItems((prev) => (prev ?? []).filter((x) => x.id !== c.id));
      toast.success(`Data ${c.name} dihapus permanen.`);
    } catch {
      toast.error("Gagal menghapus. Coba lagi.");
    } finally {
      setBusyId(null);
    }
  }

  // Nothing in Trash → keep Settings uncluttered.
  if (items !== null && items.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-navy">
          <Undo2 className="h-5 w-5 text-gold" /> Sampah
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-navy-muted">
          Profil anak yang kamu hapus disimpan {SOFT_DELETE_RETENTION_DAYS} hari
          sebelum dihapus permanen. Pulihkan kapan saja sebelum itu.
        </p>

        {items === null ? (
          <div className="flex items-center gap-2 py-3 text-sm text-navy-muted">
            <Loader2 className="h-4 w-4 animate-spin" /> Memuat…
          </div>
        ) : (
          <ul className="space-y-2">
            {items.map((c) => {
              const left = daysLeft(c.deletedAt);
              const busy = busyId === c.id;
              return (
                <li
                  key={c.id}
                  className="flex flex-col gap-2 rounded-xl border border-border/60 p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-sm font-semibold text-navy">{c.name}</p>
                    <p className="text-xs text-navy-muted">
                      Dihapus permanen dalam {left} hari
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => restore(c)}
                      disabled={busy}
                    >
                      {busy ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RotateCcw className="h-4 w-4" />
                      )}
                      Pulihkan
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-alert-red/40 text-alert-red hover:bg-alert-red-soft hover:text-alert-red"
                      onClick={() => purge(c)}
                      disabled={busy}
                    >
                      <Trash2 className="h-4 w-4" /> Hapus permanen
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
