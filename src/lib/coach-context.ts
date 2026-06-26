import { getAge } from "./utils";
import { classifyWho } from "./who";
import { evaluateRedFlags } from "./red-flags";
import { MILESTONE_DOMAINS } from "./types";
import type { GrowthRecord, Milestone } from "./types";

/**
 * Guardrails for the AI coach. Grounded (answer only from the provided child
 * context), evidence-based, calm, never diagnostic, always points serious
 * concerns to a health worker, replies in Indonesian.
 */
export const COACH_SYSTEM_PROMPT = `Kamu adalah "Pendamping Emas", asisten parenting di aplikasi Jurnal Emas Si Kecil untuk orang tua Indonesia dengan anak usia 0–6 tahun.

ATURAN WAJIB:
1. Jawab HANYA berdasarkan DATA ANAK pada konteks yang diberikan. Jangan mengarang fakta tentang anak yang tidak ada di konteks. Bila data tidak cukup, katakan dengan jujur dan sarankan mencatatnya di aplikasi.
2. Berbasis bukti: pedoman WHO, IDAI/KPSP, dan CDC. Nada hangat, tenang, dan mendukung — jangan menakut-nakuti orang tua.
3. Kamu BUKAN dokter. JANGAN memberi diagnosis medis atau resep obat. Untuk kekhawatiran perkembangan atau kesehatan, sarankan konsultasi ke dokter anak, bidan, atau Posyandu.
4. Bila ada "red flag" pada konteks, sampaikan dengan lembut dan arahkan ke tenaga kesehatan — tanpa membuat panik.
5. Jawab dalam Bahasa Indonesia yang sederhana dan ringkas (beberapa paragraf pendek atau poin singkat). Akhiri dengan satu langkah kecil yang bisa dilakukan orang tua bila relevan.`;

export interface CoachContextInput {
  child: { name: string; gender: "L" | "P"; dob: string };
  milestones: Milestone[];
  growth: GrowthRecord[];
  journal?: { date: string; mood?: string | null; title?: string | null; body: string }[];
}

/**
 * Build a compact, factual context block about ONE child from the app's own
 * data — the grounding the AI coach must answer from (and only from). Pure and
 * deterministic so it's unit-testable; no LLM/network here.
 */
export function buildCoachContext(input: CoachContextInput): string {
  const { child, milestones, growth, journal } = input;
  const age = getAge(child.dob);
  const sex = child.gender;
  const lines: string[] = [];

  lines.push("PROFIL ANAK");
  lines.push(`- Nama: ${child.name}`);
  lines.push(`- Jenis kelamin: ${sex === "L" ? "Laki-laki" : "Perempuan"}`);
  lines.push(`- Usia: ${age.months} bulan (${age.label})`);

  // Growth — latest measurement classified vs the WHO standard.
  const latest = growth[growth.length - 1];
  if (latest) {
    lines.push("");
    lines.push("PERTUMBUHAN (pengukuran terbaru vs standar WHO)");
    const w = classifyWho("weight", latest.ageMonths, latest.weight, sex);
    lines.push(`- Berat ${latest.weight} kg → ${describeWho(w)}`);
    const h = classifyWho("height", latest.ageMonths, latest.height, sex);
    lines.push(`- Tinggi ${latest.height} cm → ${describeWho(h)}`);
    if (latest.headCirc != null) {
      const hc = classifyWho("headCirc", latest.ageMonths, latest.headCirc, sex);
      lines.push(`- Lingkar kepala ${latest.headCirc} cm → ${describeWho(hc)}`);
    }
  } else {
    lines.push("");
    lines.push("PERTUMBUHAN: belum ada data pengukuran.");
  }

  // Milestones — completion per development domain.
  lines.push("");
  lines.push("MILESTONE (tercapai/total per domain perkembangan)");
  for (const domain of MILESTONE_DOMAINS) {
    const items = milestones.filter((m) => m.domain === domain);
    if (items.length === 0) continue;
    const done = items.filter((m) => m.status === "bisa").length;
    lines.push(`- ${domain}: ${done}/${items.length}`);
  }

  // Red flags — the screening signals already computed by the app.
  const flags = evaluateRedFlags(age.months, milestones);
  lines.push("");
  if (flags.length === 0) {
    lines.push("PERLU PERHATIAN: tidak ada red flag perkembangan saat ini.");
  } else {
    lines.push("PERLU PERHATIAN (red flag perkembangan)");
    for (const f of flags) {
      lines.push(
        f.reason === "regression"
          ? `- [Regresi] ${f.milestone.title} (${f.milestone.domain}) — keterampilan tampak hilang`
          : `- [Telat] ${f.milestone.title} (${f.milestone.domain}) — milestone kritis lewat ${f.monthsPastWindow ?? 0} bulan dari rentang`,
      );
    }
  }

  // A little recent-journal color (optional).
  if (journal && journal.length > 0) {
    const recent = [...journal]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 3);
    lines.push("");
    lines.push("CATATAN JURNAL TERBARU");
    for (const j of recent) {
      const mood = j.mood ? ` (${j.mood})` : "";
      const text = (j.title || j.body || "").slice(0, 120);
      lines.push(`- ${j.date}${mood}: ${text}`);
    }
  }

  return lines.join("\n");
}

function describeWho(w: { label: string; z?: number; percentile?: number }): string {
  if (w.z == null) return w.label;
  return `${w.label} (z=${w.z.toFixed(1)}, persentil ${Math.round(w.percentile ?? 0)})`;
}
