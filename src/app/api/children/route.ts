import { NextRequest, NextResponse } from "next/server";
import { and, asc, count, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { children, immunizations, milestones, teeth } from "@/db/schema/app";
import { refImmunizations, refMilestones, refTeeth } from "@/db/schema/admin";
import { badRequest, getUser, resource, unauthorized } from "@/lib/api";
import { childReferenceRows } from "@/lib/child-templates";
import { getUserPlan, premiumRequired } from "@/lib/plan";
import { FREE_CHILD_LIMIT } from "@/lib/gating";

const base = resource(children);
export const GET = base.GET;

/**
 * Build a child's starter reference data from the admin-managed `ref_*` catalogs.
 * Falls back to the static templates if a catalog is empty (e.g. fresh DB).
 */
async function referenceRowsFromDb(userId: string, childId: string) {
  const [ms, ims, ts] = await Promise.all([
    db.select().from(refMilestones).orderBy(asc(refMilestones.ageMinMonths)),
    db.select().from(refImmunizations).orderBy(asc(refImmunizations.ageMonths)),
    db.select().from(refTeeth).orderBy(asc(refTeeth.createdAt)),
  ]);

  if (ms.length === 0 && ims.length === 0 && ts.length === 0) {
    return childReferenceRows(userId, childId); // fallback: static templates
  }

  return {
    milestones: ms.map((m) => ({
      userId, childId,
      title: m.title, description: m.description, domain: m.domain,
      ageMinMonths: m.ageMinMonths, ageMaxMonths: m.ageMaxMonths,
      isCritical: m.isCritical, status: "belum" as const,
    })),
    immunizations: ims.map((im) => ({
      userId, childId,
      vaccine: im.vaccine, ageLabel: im.ageLabel, ageMonths: im.ageMonths,
      status: "akan-datang" as const,
    })),
    teeth: ts.map((t) => ({
      userId, childId,
      name: t.name, typicalAgeLabel: t.eruptAgeLabel, erupted: false,
    })),
  };
}

/** Create a child AND seed its standard milestone / immunization / teeth lists. */
export async function POST(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return unauthorized();

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  if (!body.name || !body.dob || !body.gender) {
    return badRequest("Nama, tanggal lahir, dan jenis kelamin wajib diisi");
  }

  // Free accounts are limited to FREE_CHILD_LIMIT children.
  if ((await getUserPlan(user.id)) !== "premium") {
    const [{ n }] = await db
      .select({ n: count() })
      .from(children)
      .where(and(eq(children.userId, user.id), isNull(children.deletedAt)));
    if (Number(n) >= FREE_CHILD_LIMIT) {
      return premiumRequired(
        `Akun Free dibatasi ${FREE_CHILD_LIMIT} anak. Upgrade ke Emas untuk menambah anak lain.`,
      );
    }
  }

  const [child] = await db
    .insert(children)
    .values({
      userId: user.id,
      name: String(body.name),
      dob: String(body.dob),
      gender: String(body.gender),
      photoUrl: (body.photoUrl as string) ?? null,
      birthWeight: (body.birthWeight as number) ?? null,
      birthHeight: (body.birthHeight as number) ?? null,
      color: (body.color as string) ?? "#C9A227",
    })
    .returning();

  const ref = await referenceRowsFromDb(user.id, child.id);
  await Promise.all([
    ref.milestones.length ? db.insert(milestones).values(ref.milestones) : Promise.resolve(),
    ref.immunizations.length ? db.insert(immunizations).values(ref.immunizations) : Promise.resolve(),
    ref.teeth.length ? db.insert(teeth).values(ref.teeth) : Promise.resolve(),
  ]);

  return NextResponse.json(child, { status: 201 });
}
