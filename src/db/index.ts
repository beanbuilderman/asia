import postgres from "postgres";

// DATABASE_URL locally; POSTGRES_URL is what Vercel / Neon inject.
const connectionString = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

// Reuse one client across hot reloads in dev.
const globalForDb = globalThis as unknown as { asiaSql?: postgres.Sql };

export const sql: postgres.Sql =
  globalForDb.asiaSql ??
  postgres(connectionString, {
    max: Number(process.env.DB_POOL_MAX ?? 5),
    // Neon's pooled endpoint (PgBouncer, transaction mode) does not keep prepared statements.
    prepare: !connectionString.includes("-pooler"),
    idle_timeout: 20,
    onnotice: () => {},
    // Columns come back camelCase (starts_at -> startsAt).
    transform: { ...postgres.camel, undefined: null },
  });

if (process.env.NODE_ENV !== "production") globalForDb.asiaSql = sql;

export type Tx = postgres.TransactionSql | postgres.Sql;
