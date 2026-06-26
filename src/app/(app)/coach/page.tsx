"use client";

import { useState } from "react";
import { Loader2, Send, Sparkles, Stethoscope } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/utils";

const SUGGESTED = [
  "Apakah perkembangan anak saya sesuai usianya?",
  "Stimulasi apa yang cocok untuk usia anak saya sekarang?",
  "Bagaimana cara mendorong kemampuan bicara anak?",
  "Apakah berat dan tinggi anak saya sudah ideal?",
];

type Turn = { role: "user" | "coach"; text: string };

export default function CoachPage() {
  const children = useAppStore((s) => s.children);
  const activeId = useAppStore((s) => s.activeChildId);
  const demo = useAppStore((s) => s.demo);
  const child = children.find((c) => c.id === activeId) ?? children[0];

  const [thread, setThread] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function ask(q: string) {
    const question = q.trim();
    if (!question || loading || !child) return;
    if (demo) {
      toast("AI Coach perlu akun", {
        description: "Fitur ini tidak tersedia di mode demo.",
      });
      return;
    }
    setThread((t) => [...t, { role: "user", text: question }]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question, childId: child.id }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        answer?: string;
        error?: string;
      };
      if (res.status === 503) {
        setThread((t) => [
          ...t,
          {
            role: "coach",
            text:
              "AI Coach belum diaktifkan di aplikasi ini. Hubungi admin untuk menyalakannya.",
          },
        ]);
        return;
      }
      if (!res.ok) throw new Error(data.error ?? `Gagal (${res.status})`);
      setThread((t) => [...t, { role: "coach", text: data.answer ?? "" }]);
    } catch (e) {
      toast.error("Gagal bertanya", {
        description: e instanceof Error ? e.message : undefined,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pendamping Emas (AI)"
        description={`Tanya seputar tumbuh kembang ${child?.name ?? "si Kecil"} — dijawab dari data anak Anda.`}
      />

      <Card>
        <CardContent className="space-y-4 p-5">
          {thread.length === 0 ? (
            <div className="rounded-xl bg-gold-50/60 p-5 text-center">
              <Sparkles className="mx-auto h-7 w-7 text-gold-600" />
              <p className="mt-2 font-display font-bold text-navy">
                Halo! Saya Pendamping Emas 👋
              </p>
              <p className="mx-auto mt-1 max-w-md text-sm text-navy-muted">
                Saya bantu menjawab pertanyaan parenting berdasarkan data{" "}
                {child?.name ?? "anak"} (milestone, pertumbuhan, red flag).
                Coba salah satu pertanyaan ini:
              </p>
              <div className="mx-auto mt-4 grid max-w-xl grid-cols-1 gap-2 sm:grid-cols-2">
                {SUGGESTED.map((q) => (
                  <button
                    key={q}
                    onClick={() => ask(q)}
                    disabled={loading}
                    className="rounded-xl border bg-background px-3 py-2 text-left text-sm text-navy transition-colors hover:border-gold-300 hover:bg-gold-50 disabled:opacity-50"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {thread.map((turn, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex",
                    turn.role === "user" ? "justify-end" : "justify-start",
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm",
                      turn.role === "user"
                        ? "bg-navy text-cream"
                        : "border bg-secondary/50 text-navy",
                    )}
                  >
                    {turn.text}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-2 rounded-2xl border bg-secondary/50 px-4 py-2.5 text-sm text-navy-muted">
                    <Loader2 className="h-4 w-4 animate-spin" /> Pendamping Emas
                    sedang berpikir…
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Composer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              ask(input);
            }}
            className="flex items-end gap-2"
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  ask(input);
                }
              }}
              rows={1}
              placeholder={`Tanya tentang ${child?.name ?? "si Kecil"}…`}
              className="min-h-[44px] flex-1 resize-none rounded-xl border bg-background px-3 py-2.5 text-sm text-navy outline-none focus:border-gold-300"
            />
            <Button type="submit" disabled={loading || !input.trim()}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>

          <p className="flex items-start gap-1.5 text-[11px] text-navy-muted">
            <Stethoscope className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Pendamping Emas memberi informasi umum berbasis data anak Anda, bukan
            diagnosis medis. Untuk kekhawatiran kesehatan, konsultasikan ke
            dokter anak, bidan, atau Posyandu.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
