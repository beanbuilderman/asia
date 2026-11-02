/**
 * Creates the first dashboard login if there is none. Safe to re-run.
 *
 *   pnpm db:seed
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import type postgres from "postgres";
import bcrypt from "bcryptjs";

/** Returns the generated password, or null if a login already exists. */
export async function seedAdmin(sql: postgres.Sql, email: string, name = "Asia"): Promise<string | null> {
  const [{ n }] = await sql<{ n: number }[]>`SELECT count(*)::int AS n FROM admin_users`;
  if (n > 0 || !email) return null;
  const password = crypto.randomBytes(9).toString("base64url");
  await sql`INSERT INTO admin_users (email, name, password_hash) VALUES (${email}, ${name}, ${await bcrypt.hash(password, 12)})`;
  return password;
}

if (typeof require !== "undefined" && require.main === module) {
  (async () => {
    (await import("dotenv")).config({ path: ".env.local" });
    const { sql } = await import("./index");
    const email = process.env.SEED_ADMIN_EMAIL ?? "";
    const pw = await seedAdmin(sql, email);
    if (pw) {
      const file = path.resolve(process.env.HOME ?? ".", "Projects/asia/.admin_password");
      fs.writeFileSync(file, `${email}\n${pw}\n`, { mode: 0o600 });
      console.log(`Created login for ${email}. Password saved to ${file}`);
    } else console.log("A login already exists (or SEED_ADMIN_EMAIL is empty).");
    await sql.end();
  })().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
