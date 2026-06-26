import {
  boolean,
  date,
  doublePrecision,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { user } from "./auth";

const id = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());

const userId = () =>
  text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" });

const createdAt = () => timestamp("created_at").notNull().defaultNow();

export const children = pgTable("children", {
  id: id(),
  userId: userId(),
  name: text("name").notNull(),
  dob: date("dob").notNull(),
  gender: text("gender").notNull(), // 'L' | 'P'
  photoUrl: text("photo_url"),
  birthWeight: doublePrecision("birth_weight"),
  birthHeight: doublePrecision("birth_height"),
  color: text("color").notNull().default("#C9A227"),
  createdAt: createdAt(),
});

export const tasks = pgTable("tasks", {
  id: id(),
  userId: userId(),
  childId: text("child_id").references(() => children.id, {
    onDelete: "cascade",
  }),
  title: text("title").notNull(),
  description: text("description"),
  priority: text("priority").notNull().default("sedang"),
  category: text("category").notNull().default("Lain-lain"),
  dueDate: date("due_date"),
  status: text("status").notNull().default("todo"),
  isRecurring: boolean("is_recurring").notNull().default(false),
  createdAt: createdAt(),
});

export const todos = pgTable("todos", {
  id: id(),
  userId: userId(),
  childId: text("child_id").references(() => children.id, {
    onDelete: "cascade",
  }),
  title: text("title").notNull(),
  category: text("category").notNull(),
  done: boolean("done").notNull().default(false),
  createdAt: createdAt(),
});

export const habits = pgTable("habits", {
  id: id(),
  userId: userId(),
  childId: text("child_id").references(() => children.id, {
    onDelete: "cascade",
  }),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  targetPerWeek: integer("target_per_week").notNull().default(7),
  streak: integer("streak").notNull().default(0),
  reminderTime: text("reminder_time"),
  history: jsonb("history").$type<boolean[]>().notNull().default([]),
  createdAt: createdAt(),
});

export const milestones = pgTable("milestones", {
  id: id(),
  userId: userId(),
  childId: text("child_id").references(() => children.id, {
    onDelete: "cascade",
  }),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  domain: text("domain").notNull(),
  ageMinMonths: integer("age_min_months").notNull(),
  ageMaxMonths: integer("age_max_months").notNull(),
  isCritical: boolean("is_critical").notNull().default(false),
  status: text("status").notNull().default("belum"),
  /** True when a previously-acquired skill is lost again (developmental regression). */
  regressed: boolean("regressed").notNull().default(false),
  achievedAt: timestamp("achieved_at"),
  note: text("note"),
  hasPhoto: boolean("has_photo").notNull().default(false),
  photoUrl: text("photo_url"),
  createdAt: createdAt(),
});

export const goals = pgTable("goals", {
  id: id(),
  userId: userId(),
  childId: text("child_id").references(() => children.id, {
    onDelete: "cascade",
  }),
  title: text("title").notNull(),
  description: text("description"),
  domain: text("domain").notNull().default(""),
  progress: integer("progress").notNull().default(0),
  targetDate: date("target_date"),
  subGoals: jsonb("sub_goals")
    .$type<{ id: string; title: string; done: boolean }[]>()
    .notNull()
    .default([]),
  createdAt: createdAt(),
});

export const growthRecords = pgTable("growth_records", {
  id: id(),
  userId: userId(),
  childId: text("child_id")
    .notNull()
    .references(() => children.id, { onDelete: "cascade" }),
  ageMonths: integer("age_months").notNull(),
  weight: doublePrecision("weight"),
  height: doublePrecision("height"),
  headCirc: doublePrecision("head_circ"),
  date: date("date"),
  note: text("note"),
  createdAt: createdAt(),
});

export const immunizations = pgTable("immunizations", {
  id: id(),
  userId: userId(),
  childId: text("child_id")
    .notNull()
    .references(() => children.id, { onDelete: "cascade" }),
  vaccine: text("vaccine").notNull(),
  ageLabel: text("age_label").notNull(),
  ageMonths: integer("age_months").notNull().default(0),
  status: text("status").notNull().default("akan-datang"),
  date: date("date"),
  createdAt: createdAt(),
});

export const teeth = pgTable("teeth", {
  id: id(),
  userId: userId(),
  childId: text("child_id")
    .notNull()
    .references(() => children.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  typicalAgeLabel: text("typical_age_label").notNull(),
  erupted: boolean("erupted").notNull().default(false),
  date: date("date"),
  createdAt: createdAt(),
});

export const sleepLogs = pgTable("sleep_logs", {
  id: id(),
  userId: userId(),
  childId: text("child_id")
    .notNull()
    .references(() => children.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  nightHours: doublePrecision("night_hours").notNull().default(0),
  napHours: doublePrecision("nap_hours").notNull().default(0),
  createdAt: createdAt(),
});

export const journalEntries = pgTable("journal_entries", {
  id: id(),
  userId: userId(),
  childId: text("child_id")
    .notNull()
    .references(() => children.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  mood: text("mood"), // 'senang' | 'biasa' | 'rewel' | 'sakit' | 'bangga' | null
  title: text("title"),
  body: text("body").notNull().default(""),
  tags: jsonb("tags").$type<string[]>().notNull().default([]),
  media: jsonb("media").$type<string[]>().notNull().default([]),
  createdAt: createdAt(),
});

/**
 * User-defined task/habit categories (additive — defaults still ship in code).
 * Only *custom* categories are persisted here; on hydrate they merge with the
 * built-in defaults. User-scoped, not child-scoped.
 */
export const categories = pgTable("categories", {
  id: id(),
  userId: userId(),
  kind: text("kind").notNull(), // 'task' | 'habit'
  name: text("name").notNull(),
  createdAt: createdAt(),
});

export const notifications = pgTable("notifications", {
  id: id(),
  userId: userId(),
  type: text("type").notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  date: date("date").notNull(),
  read: boolean("read").notNull().default(false),
  createdAt: createdAt(),
});

export const subscriptions = pgTable("subscriptions", {
  id: id(),
  userId: userId(),
  plan: text("plan").notNull().default("free"),
  status: text("status").notNull().default("active"),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at"),
  paymentId: text("payment_id"),
  createdAt: createdAt(),
});
