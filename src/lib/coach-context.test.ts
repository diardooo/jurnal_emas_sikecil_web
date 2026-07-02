import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { COACH_SYSTEM_PROMPT, buildCoachContext } from "@/lib/coach-context";
import { MILESTONE_DOMAINS } from "@/lib/types";
import type { GrowthRecord, Milestone } from "@/lib/types";

/**
 * AI-grounding tests (JES-104). The coach must answer ONLY from a factual block
 * built server-side from the child's own data. If that block is malformed or
 * omits a red flag, the AI can mislead a parent — so we pin its structure.
 *
 * `buildCoachContext` reads the child's age via `getAge`, which uses the current
 * date, so time is frozen for determinism.
 */
const DOMAIN = MILESTONE_DOMAINS[0];

function ms(o: Partial<Milestone>): Milestone {
  return {
    regressed: false,
    isCritical: false,
    status: "belum",
    ageMaxMonths: 12,
    domain: DOMAIN,
    title: "milestone",
    ...o,
  } as unknown as Milestone;
}
function growth(o: Partial<GrowthRecord>): GrowthRecord {
  return { ageMonths: 30, weight: 13, height: 92, headCirc: 48, ...o } as unknown as GrowthRecord;
}

describe("buildCoachContext", () => {
  beforeAll(() => {
    // Freeze "now" so getAge(dob) is deterministic. dob 2024-01-01 → 30 months.
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-01T00:00:00Z"));
  });
  afterAll(() => vi.useRealTimers());

  const child = { name: "Kyara", gender: "L" as const, dob: "2024-01-01" };

  it("includes the child profile with computed age", () => {
    const ctx = buildCoachContext({ child, milestones: [], growth: [] });
    expect(ctx).toContain("PROFIL ANAK");
    expect(ctx).toContain("Kyara");
    expect(ctx).toContain("Laki-laki");
    expect(ctx).toContain("30 bulan");
  });

  it("labels a female child correctly", () => {
    const ctx = buildCoachContext({
      child: { name: "Aisyah", gender: "P", dob: "2024-01-01" },
      milestones: [],
      growth: [],
    });
    expect(ctx).toContain("Perempuan");
  });

  it("classifies the latest growth measurement against WHO", () => {
    const ctx = buildCoachContext({
      child,
      milestones: [],
      growth: [growth({ ageMonths: 24 }), growth({ ageMonths: 30 })],
    });
    expect(ctx).toContain("PERTUMBUHAN");
    expect(ctx).toMatch(/z=/); // z-score annotation present
    expect(ctx).toContain("Lingkar kepala"); // headCirc branch
  });

  it("says so plainly when there is no measurement", () => {
    const ctx = buildCoachContext({ child, milestones: [], growth: [] });
    expect(ctx).toContain("belum ada data pengukuran");
  });

  it("surfaces red flags (regression + overdue) with calm markers", () => {
    const ctx = buildCoachContext({
      child,
      milestones: [
        ms({ regressed: true, title: "melambai" }),
        ms({ isCritical: true, status: "belum", ageMaxMonths: 18, title: "berjalan" }),
      ],
      growth: [],
    });
    expect(ctx).toContain("PERLU PERHATIAN");
    expect(ctx).toContain("[Regresi]");
    expect(ctx).toContain("[Telat]");
    expect(ctx).toContain("berjalan");
  });

  it("states clearly when there are no red flags", () => {
    const ctx = buildCoachContext({
      child,
      milestones: [ms({ isCritical: true, status: "bisa", ageMaxMonths: 12 })],
      growth: [],
    });
    expect(ctx).toContain("tidak ada red flag");
  });

  it("includes recent journal entries when provided, omits the section otherwise", () => {
    const withJournal = buildCoachContext({
      child,
      milestones: [],
      growth: [],
      journal: [{ date: "2026-06-01", mood: "senang", title: "Main di taman", body: "" }],
    });
    expect(withJournal).toContain("CATATAN JURNAL TERBARU");
    expect(withJournal).toContain("Main di taman");

    const withoutJournal = buildCoachContext({ child, milestones: [], growth: [] });
    expect(withoutJournal).not.toContain("CATATAN JURNAL TERBARU");
  });

  it("renders a journal entry that has no mood and no title (body only)", () => {
    const ctx = buildCoachContext({
      child,
      milestones: [],
      growth: [],
      journal: [{ date: "2026-05-01", mood: null, title: null, body: "Tidur nyenyak" }],
    });
    expect(ctx).toContain("Tidur nyenyak");
  });

  it("falls back to a label without a z-score when growth is beyond WHO 0–5y", () => {
    const ctx = buildCoachContext({
      child,
      milestones: [],
      growth: [growth({ ageMonths: 72, weight: 20, height: 115, headCirc: 50 })],
    });
    expect(ctx).toContain("PERTUMBUHAN");
  });
});

describe("COACH_SYSTEM_PROMPT — safety guardrails", () => {
  it("forbids diagnosis and points to a health worker", () => {
    expect(COACH_SYSTEM_PROMPT).toMatch(/BUKAN dokter/i);
    expect(COACH_SYSTEM_PROMPT).toMatch(/Posyandu|dokter anak|bidan/i);
  });
});
