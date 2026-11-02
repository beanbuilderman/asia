/**
 * Adds a dashboard login, or sets a new password for an existing one.
 * There is no "forgotten password" email on this site, so this is how a password is reset.
 *
 *   pnpm admin:password someone@example.com            (prints a generated password)
 *   pnpm admin:password someone@example.com "Name"     (sets the name for a new login)
 *
 * Point DATABASE_URL at the online database to change an online login.
 */
import crypto from "node:crypto";
import bcrypt from "bcryptjs";

(async () => {
  (await import("dotenv")).config({ path: ".env.local" });
  const { sql } = await import("./index");
  const email = (process.argv[2] ?? "").trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error("Usage: pnpm admin:password <email> [name]");
  const password = crypto.randomBytes(9).toString("base64url");
  const hash = await bcrypt.hash(password, 12);
  const [row] = await sql<{ id: number }[]>`
    UPDATE admin_users SET password_hash = ${hash}, password_changed_at = now() WHERE lower(email) = ${email} RETURNING id`;
  if (!row) await sql`INSERT INTO admin_users (email, name, password_hash) VALUES (${email}, ${process.argv[3] ?? ""}, ${hash})`;
  console.log(`${row ? "New password for" : "Created login for"} ${email}: ${password}`);
  await sql.end();
})().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
