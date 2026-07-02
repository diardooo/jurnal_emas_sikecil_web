import { PGlite } from "@electric-sql/pglite";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import * as schema from "@/db/schema";

/**
 * In-memory Postgres for integration tests (JES-105).
 *
 * pglite is a real Postgres compiled to WASM, and Drizzle abstracts the driver,
 * so the app's actual query logic (the `resource()` factory, `applyOrderOutcome`,
 * `getAdmin`) runs unchanged against it. Tests mock ONLY `@/db` to point at this
 * instance; the schema table definitions stay real, so the SQL — and its
 * per-user WHERE scoping — is exercised for real.
 */
const client = new PGlite();
export const testDb = drizzle(client, { schema });
export { schema };

let migrated = false;

/** Apply the real drizzle migrations once (idempotent across the test file). */
export async function initTestDb(): Promise<void> {
  if (migrated) return;
  await migrate(testDb, { migrationsFolder: "drizzle" });
  migrated = true;
}

/**
 * Wipe all data between tests. Truncating `user` cascades to every user-owned
 * table (all FK `user.id` with onDelete cascade), giving a clean slate cheaply.
 */
export async function truncateAll(): Promise<void> {
  await testDb.execute(sql`TRUNCATE TABLE "user" RESTART IDENTITY CASCADE`);
}
