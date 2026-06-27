import { NextRequest, NextResponse } from "next/server";
import { and, asc, eq, sql } from "drizzle-orm";
import { badRequest, getUser, unauthorized } from "@/lib/api";
import { db } from "@/db";
import {
  children as childrenT,
  coachMessages as coachMessagesT,
  coachUsage as coachUsageT,
  growthRecords as growthT,
  journalEntries as journalT,
  milestones as milestonesT,
} from "@/db/schema/app";
import { buildCoachContext, COACH_SYSTEM_PROMPT } from "@/lib/coach-context";
import { AiNotConfiguredError, aiConfigured, generateAnswer } from "@/lib/ai/provider";
import { getUserPlan } from "@/lib/plan";
import { FREE_COACH_DAILY_LIMIT } from "@/lib/gating";
import type { GrowthRecord, Milestone } from "@/lib/types";

export const runtime = "nodejs";

const NOT_CONFIGURED = {
  error: "AI Coach belum aktif — set GEMINI_API_KEY di environment.",
};

/**
 * Grounded parenting assistant. Builds a factual context from ONE child's own
 * data (server-side) and asks the LLM to answer only from it. Returns 503 when
 * no API key is configured so the UI can degrade gracefully.
 */
export async function POST(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return unauthorized();
  if (!aiConfigured()) return NextResponse.json(NOT_CONFIGURED, { status: 503 });

  const body = (await req.json().catch(() => ({}))) as {
    question?: string;
    childId?: string;
  };
  const question = (body.question ?? "").trim();
  const childId = (body.childId ?? "").trim();
  if (!question) return badRequest("Pertanyaan tidak boleh kosong");
  if (question.length > 1000) return badRequest("Pertanyaan terlalu panjang");
  if (!childId) return badRequest("Anak belum dipilih");

  const [child] = await db
    .select()
    .from(childrenT)
    .where(and(eq(childrenT.id, childId), eq(childrenT.userId, user.id)))
    .limit(1);
  if (!child) return badRequest("Anak tidak valid");

  // Per-user daily rate limit (fail fast before doing any heavy work / LLM call).
  // Free accounts get a small quota; Premium gets the full COACH_DAILY_LIMIT.
  const premium = (await getUserPlan(user.id)) === "premium";
  const today = new Date().toISOString().slice(0, 10);
  const dailyLimit = premium
    ? Number(process.env.COACH_DAILY_LIMIT ?? 20)
    : FREE_COACH_DAILY_LIMIT;
  const [usage] = await db
    .select({ count: coachUsageT.count })
    .from(coachUsageT)
    .where(and(eq(coachUsageT.userId, user.id), eq(coachUsageT.date, today)))
    .limit(1);
  if ((usage?.count ?? 0) >= dailyLimit) {
    return NextResponse.json(
      {
        error: premium
          ? `Batas harian ${dailyLimit} pertanyaan ke Pendamping Emas sudah tercapai. Silakan lanjut lagi besok.`
          : `Akun Free dibatasi ${dailyLimit} pertanyaan/hari ke Pendamping Emas. Upgrade ke Emas untuk kuota lebih besar.`,
        premiumRequired: !premium,
      },
      { status: 429 },
    );
  }

  const [miles, grow, jour] = await Promise.all([
    db.select().from(milestonesT).where(and(eq(milestonesT.userId, user.id), eq(milestonesT.childId, childId))),
    db.select().from(growthT).where(and(eq(growthT.userId, user.id), eq(growthT.childId, childId))),
    db.select().from(journalT).where(and(eq(journalT.userId, user.id), eq(journalT.childId, childId))),
  ]);

  const context = buildCoachContext({
    child: { name: child.name, gender: child.gender as "L" | "P", dob: child.dob },
    milestones: miles as unknown as Milestone[],
    growth: (grow as unknown as GrowthRecord[]).sort((a, b) => a.ageMonths - b.ageMonths),
    journal: jour.map((j) => ({ date: j.date, mood: j.mood, title: j.title, body: j.body })),
  });

  const userMessage = `KONTEKS DATA ANAK:\n${context}\n\nPERTANYAAN ORANG TUA:\n${question}`;

  try {
    const answer = await generateAnswer(COACH_SYSTEM_PROMPT, userMessage);
    // Count only answered questions (failed calls don't consume the quota).
    await db
      .insert(coachUsageT)
      .values({ userId: user.id, date: today, count: 1 })
      .onConflictDoUpdate({
        target: [coachUsageT.userId, coachUsageT.date],
        set: { count: sql`${coachUsageT.count} + 1` },
      });
    // Persist the exchange so the conversation survives reloads.
    await db.insert(coachMessagesT).values([
      { userId: user.id, childId, role: "user", content: question },
      { userId: user.id, childId, role: "coach", content: answer },
    ]);
    const remaining = Math.max(0, dailyLimit - ((usage?.count ?? 0) + 1));
    return NextResponse.json({ answer, remaining });
  } catch (e) {
    if (e instanceof AiNotConfiguredError) {
      return NextResponse.json(NOT_CONFIGURED, { status: 503 });
    }
    // Upstream rate/quota limit → calm "try again later", not a raw error.
    if (e instanceof Error && e.message.includes("429")) {
      return NextResponse.json(
        {
          error:
            "Pendamping Emas sedang sibuk (kuota AI penuh). Coba lagi beberapa saat lagi.",
        },
        { status: 429 },
      );
    }
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Gagal memanggil AI Coach" },
      { status: 502 },
    );
  }
}

/** Past conversation for a child (oldest→newest), so the UI can restore it. */
export async function GET(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return unauthorized();
  const childId = req.nextUrl.searchParams.get("childId")?.trim();
  if (!childId) return NextResponse.json([]);
  const rows = await db
    .select({ role: coachMessagesT.role, content: coachMessagesT.content })
    .from(coachMessagesT)
    .where(and(eq(coachMessagesT.userId, user.id), eq(coachMessagesT.childId, childId)))
    .orderBy(asc(coachMessagesT.createdAt))
    .limit(100);
  // Shape matches the UI's Turn ({ role, text }).
  return NextResponse.json(rows.map((r) => ({ role: r.role, text: r.content })));
}

/** Clear a child's saved conversation. Daily usage quota is intentionally kept. */
export async function DELETE(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return unauthorized();
  const childId = req.nextUrl.searchParams.get("childId")?.trim();
  if (!childId) return badRequest("Anak belum dipilih");
  await db
    .delete(coachMessagesT)
    .where(
      and(
        eq(coachMessagesT.userId, user.id),
        eq(coachMessagesT.childId, childId),
      ),
    );
  return NextResponse.json({ ok: true });
}
