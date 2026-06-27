import {
  boolean,
  date,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

/**
 * Admin-only tables: promo codes, the Free/Premium feature matrix, platform
 * settings, and the master "reference" content catalogs that power the
 * Tumbuh Kembang modules (milestone / imunisasi / gigi / tidur).
 *
 * These are NOT user-scoped — they are global content managed from the admin
 * dashboard. Per-child instances still live in schema/app.ts.
 */

const id = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());

const createdAt = () => timestamp("created_at").notNull().defaultNow();

export const discountCodes = pgTable("discount_codes", {
  id: id(),
  code: text("code").notNull().unique(),
  type: text("type").notNull().default("percent"), // 'percent' | 'fixed'
  value: integer("value").notNull(),
  description: text("description").notNull().default(""),
  maxUsage: integer("max_usage"), // null = tanpa batas
  usedCount: integer("used_count").notNull().default(0),
  expiresAt: date("expires_at"),
  active: boolean("active").notNull().default(true),
  createdAt: createdAt(),
});

export const rolePermissions = pgTable("role_permissions", {
  id: id(),
  feature: text("feature").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  freeEnabled: boolean("free_enabled").notNull().default(false),
  premiumEnabled: boolean("premium_enabled").notNull().default(true),
});

export const platformSettings = pgTable("platform_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull().default(""),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const refMilestones = pgTable("ref_milestones", {
  id: id(),
  domain: text("domain").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  ageMinMonths: integer("age_min_months").notNull(),
  ageMaxMonths: integer("age_max_months").notNull(),
  isCritical: boolean("is_critical").notNull().default(false),
  reference: text("reference").notNull().default(""),
  createdAt: createdAt(),
});

export const refImmunizations = pgTable("ref_immunizations", {
  id: id(),
  vaccine: text("vaccine").notNull(),
  ageLabel: text("age_label").notNull(),
  ageMonths: integer("age_months").notNull().default(0),
  doses: text("doses").notNull().default(""),
  mandatory: boolean("mandatory").notNull().default(true),
  note: text("note").notNull().default(""),
  createdAt: createdAt(),
});

export const refTeeth = pgTable("ref_teeth", {
  id: id(),
  name: text("name").notNull(),
  position: text("position").notNull().default(""),
  eruptAgeLabel: text("erupt_age_label").notNull(),
  sheddAgeLabel: text("shedd_age_label").notNull().default(""),
  count: integer("count").notNull().default(2),
  createdAt: createdAt(),
});

export const refSleep = pgTable("ref_sleep", {
  id: id(),
  groupName: text("group_name").notNull(),
  ageLabel: text("age_label").notNull(),
  totalLabel: text("total_label").notNull(),
  nightLabel: text("night_label").notNull().default(""),
  napLabel: text("nap_label").notNull().default(""),
  note: text("note").notNull().default(""),
  createdAt: createdAt(),
});

/**
 * Accountability trail for sensitive admin actions (delete user, change
 * role/plan, broadcast, edit feature matrix). Append-only; `actorEmail` is
 * snapshotted so the record survives the actor being renamed/deleted.
 */
export const adminAuditLog = pgTable("admin_audit_log", {
  id: id(),
  actorId: text("actor_id").notNull(),
  actorEmail: text("actor_email").notNull(),
  action: text("action").notNull(), // e.g. "user.delete", "user.update", "broadcast.send"
  targetType: text("target_type"), // "user" | "users" | "broadcast" | "roles"
  targetId: text("target_id"),
  summary: text("summary").notNull(), // human-readable, shown in the dashboard
  meta: jsonb("meta"),
  createdAt: createdAt(),
});
