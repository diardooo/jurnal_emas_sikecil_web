import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString =
  process.env.DATABASE_URL ?? "postgres://localhost:5432/jurnal_emas";

// Reuse the client across HMR reloads in dev to avoid exhausting connections.
const globalForDb = globalThis as unknown as {
  client?: ReturnType<typeof postgres>;
};

const client =
  globalForDb.client ?? postgres(connectionString, { max: 10, prepare: false });

if (process.env.NODE_ENV !== "production") globalForDb.client = client;

export const db = drizzle(client, { schema });
export { schema };
