import "dotenv/config";
import { eq } from "drizzle-orm";
import { db } from "../src/db";
import { auth } from "../src/lib/auth";
import {
  children as childrenT,
  goals as goalsT,
  growthRecords,
  habits as habitsT,
  immunizations as immunizationsT,
  milestones as milestonesT,
  notifications as notificationsT,
  sleepLogs as sleepLogsT,
  subscriptions,
  tasks as tasksT,
  teeth as teethT,
  todos as todosT,
} from "../src/db/schema/app";
import { user as userT } from "../src/db/schema/auth";
import {
  mockChildren,
  mockGoals,
  mockGrowth,
  mockHabits,
  mockImmunizations,
  mockMilestones,
  mockNotifications,
  mockSleepLogs,
  mockTasks,
  mockTeeth,
  mockTodos,
} from "../src/lib/mock-data";

const DEMO = {
  name: "Rara",
  email: "rara@email.com",
  password: "password123",
};

async function ensureUser(): Promise<string> {
  try {
    const res = await auth.api.signUpEmail({
      body: { name: DEMO.name, email: DEMO.email, password: DEMO.password },
    });
    return res.user.id;
  } catch {
    const [u] = await db
      .select({ id: userT.id })
      .from(userT)
      .where(eq(userT.email, DEMO.email))
      .limit(1);
    if (!u) throw new Error("Gagal membuat / menemukan user demo");
    return u.id;
  }
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("✗ DATABASE_URL belum diisi di .env — seed dibatalkan.");
    process.exit(1);
  }

  console.log("→ Menyiapkan user demo…");
  const userId = await ensureUser();

  console.log("→ Membersihkan data lama milik user…");
  for (const t of [
    notificationsT,
    sleepLogsT,
    teethT,
    immunizationsT,
    growthRecords,
    goalsT,
    milestonesT,
    habitsT,
    todosT,
    tasksT,
    subscriptions,
    childrenT,
  ]) {
    await db.delete(t).where(eq(t.userId, userId));
  }

  console.log("→ Menambahkan anak…");
  const idMap: Record<string, string> = {};
  for (const c of mockChildren) {
    const [row] = await db
      .insert(childrenT)
      .values({
        userId,
        name: c.name,
        dob: c.dob,
        gender: c.gender,
        photoUrl: c.photoUrl,
        birthWeight: c.birthWeight,
        birthHeight: c.birthHeight,
        color: c.color,
      })
      .returning({ id: childrenT.id });
    idMap[c.id] = row.id;
  }
  const childOf = (cid?: string) => (cid ? (idMap[cid] ?? null) : null);

  console.log("→ Subscription premium…");
  await db.insert(subscriptions).values({
    userId,
    plan: "premium",
    status: "active",
    expiresAt: new Date(Date.now() + 30 * 864e5),
  });

  console.log("→ Tasks, todos, habits…");
  await db.insert(tasksT).values(
    mockTasks.map((t) => ({
      userId,
      childId: childOf(t.childId),
      title: t.title,
      description: t.description,
      priority: t.priority,
      category: t.category,
      dueDate: t.dueDate ?? null,
      status: t.status,
      isRecurring: !!t.isRecurring,
    })),
  );
  await db.insert(todosT).values(
    mockTodos.map((t) => ({
      userId,
      childId: childOf(t.childId),
      title: t.title,
      category: t.category,
      done: t.done,
    })),
  );
  await db.insert(habitsT).values(
    mockHabits.map((h) => ({
      userId,
      childId: childOf(h.childId),
      name: h.name,
      description: h.description,
      category: h.category,
      targetPerWeek: h.targetPerWeek,
      streak: h.streak,
      reminderTime: h.reminderTime,
      history: h.history,
    })),
  );

  console.log("→ Milestones & goals…");
  await db.insert(milestonesT).values(
    mockMilestones.map((m) => ({
      userId,
      childId: idMap[mockChildren[0].id],
      title: m.title,
      description: m.description,
      domain: m.domain,
      ageMinMonths: m.ageMinMonths,
      ageMaxMonths: m.ageMaxMonths,
      isCritical: m.isCritical,
      status: m.status,
      achievedAt: m.achievedAt ? new Date(m.achievedAt) : null,
      note: m.note,
      hasPhoto: !!m.hasPhoto,
    })),
  );
  await db.insert(goalsT).values(
    mockGoals.map((g) => ({
      userId,
      title: g.title,
      description: g.description,
      domain: g.domain,
      progress: g.progress,
      targetDate: g.targetDate ?? null,
      subGoals: g.subGoals,
    })),
  );

  console.log("→ Tumbuh kembang (growth, imunisasi, gigi, tidur)…");
  for (const [cid, recs] of Object.entries(mockGrowth)) {
    if (!idMap[cid]) continue;
    await db.insert(growthRecords).values(
      recs.map((r) => ({
        userId,
        childId: idMap[cid],
        ageMonths: r.ageMonths,
        weight: r.weight,
        height: r.height,
        headCirc: r.headCirc,
        date: r.date ?? null,
        note: r.note,
      })),
    );
  }
  for (const [cid, list] of Object.entries(mockImmunizations)) {
    if (!idMap[cid]) continue;
    await db.insert(immunizationsT).values(
      list.map((im) => ({
        userId,
        childId: idMap[cid],
        vaccine: im.vaccine,
        ageLabel: im.ageLabel,
        ageMonths: im.ageMonths,
        status: im.status,
        date: im.date ?? null,
      })),
    );
  }
  for (const [cid, list] of Object.entries(mockTeeth)) {
    if (!idMap[cid]) continue;
    await db.insert(teethT).values(
      list.map((t) => ({
        userId,
        childId: idMap[cid],
        name: t.name,
        typicalAgeLabel: t.typicalAgeLabel,
        erupted: t.erupted,
        date: t.date ?? null,
      })),
    );
  }
  for (const [cid, list] of Object.entries(mockSleepLogs)) {
    if (!idMap[cid]) continue;
    await db.insert(sleepLogsT).values(
      list.map((l) => ({
        userId,
        childId: idMap[cid],
        date: l.date,
        nightHours: l.nightHours,
        napHours: l.napHours,
      })),
    );
  }

  console.log("→ Notifikasi…");
  await db.insert(notificationsT).values(
    mockNotifications.map((n) => ({
      userId,
      type: n.type,
      title: n.title,
      body: n.body,
      date: n.date,
      read: n.read,
    })),
  );

  console.log("\n✓ Seed selesai!");
  console.log(`  Login: ${DEMO.email} / ${DEMO.password}`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
