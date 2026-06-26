import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { badRequest, getUser, unauthorized } from "@/lib/api";
import { db } from "@/db";
import {
  children as childrenT,
  growthRecords as growthT,
  journalEntries as journalT,
  milestones as milestonesT,
} from "@/db/schema/app";
import { buildCoachContext, COACH_SYSTEM_PROMPT } from "@/lib/coach-context";
import { AiNotConfiguredError, aiConfigured, generateAnswer } from "@/lib/ai/provider";
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
    return NextResponse.json({ answer });
  } catch (e) {
    if (e instanceof AiNotConfiguredError) {
      return NextResponse.json(NOT_CONFIGURED, { status: 503 });
    }
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Gagal memanggil AI Coach" },
      { status: 502 },
    );
  }
}
