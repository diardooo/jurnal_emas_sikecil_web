import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString =
  process.env.DATABASE_URL ?? "postgres://localhost:5432/jurnal_emas";

// Reuse the client across HMR reloads in dev — and across warm invocations of a
// serverless instance in prod — to avoid opening a new pool on every request.
const globalForDb = globalThis as unknown as {
  client?: ReturnType<typeof postgres>;
};

/**
 * Pool sizing for serverless (Vercel): each warm function instance keeps its own
 * pool, and there can be many instances at once, so a high `max` per instance
 * multiplies into far more Postgres connections than the server allows. Keep
 * `max` small and put a transaction pooler (Neon/Supabase "pooled" connection
 * string, pgBouncer transaction mode) in front of Postgres.
 *
 * `prepare: false` is REQUIRED for pgBouncer transaction mode (prepared
 * statements aren't supported there). `idle_timeout` returns idle connections to
 * the pooler quickly; `connect_timeout` fails fast instead of hanging a request.
 * All tunable via env without a redeploy of code.
 */
const isProd = process.env.NODE_ENV === "production";
const client =
  globalForDb.client ??
  postgres(connectionString, {
    max: Number(process.env.DB_POOL_MAX ?? (isProd ? 1 : 10)),
    idle_timeout: Number(process.env.DB_IDLE_TIMEOUT ?? 20), // seconds
    connect_timeout: Number(process.env.DB_CONNECT_TIMEOUT ?? 10), // seconds
    prepare: false,
  });

// Cache the client on the global in every environment so warm serverless
// instances reuse the same small pool instead of leaking new ones.
globalForDb.client = client;

export const db = drizzle(client, { schema });
export { schema };
