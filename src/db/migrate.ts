import fs from "node:fs";
import path from "node:path";
import type postgres from "postgres";

const MIGRATIONS_DIR = path.resolve(process.cwd(), "migrations");

/** Applies every migrations/*.sql file not yet recorded, in filename order. */
export async function migrate(sql: postgres.Sql, dir = MIGRATIONS_DIR): Promise<string[]> {
  await sql`CREATE TABLE IF NOT EXISTS schema_migrations (
    name text PRIMARY KEY,
    applied_at timestamptz NOT NULL DEFAULT now()
  )`;
  const applied = new Set(
    (await sql<{ name: string }[]>`SELECT name FROM schema_migrations`).map((r) => r.name),
  );
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
  const ran: string[] = [];
  for (const file of files) {
    if (applied.has(file)) continue;
    const body = fs.readFileSync(path.join(dir, file), "utf8");
    await sql.begin(async (tx) => {
      await tx.unsafe(body);
      await tx`INSERT INTO schema_migrations (name) VALUES (${file})`;
    });
    ran.push(file);
  }
  return ran;
}

// CLI: pnpm db:migrate
if (typeof require !== "undefined" && require.main === module) {
  (async () => {
    await import("dotenv").then((d) => d.config({ path: ".env.local" }));
    const { sql } = await import("./index");
    const ran = await migrate(sql);
    console.log(ran.length ? `Applied: ${ran.join(", ")}` : "Database is up to date.");
    await sql.end();
  })().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
