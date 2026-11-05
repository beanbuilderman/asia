/** Resets asia_e2e before the e2e build: empty site (original wording), one test login. */
import postgres from "postgres";
import bcrypt from "bcryptjs";
import { migrate } from "../src/db/migrate";
import { ADMIN } from "./admin";

(async () => {
  const url = process.env.DATABASE_URL!;
  if (!String(url).includes("asia_e2e")) throw new Error("Refusing to reset a non-e2e database");
  const sql = postgres(url, { onnotice: () => {}, transform: postgres.camel });
  await sql.unsafe("DROP SCHEMA public CASCADE; CREATE SCHEMA public;");
  await migrate(sql);
  await sql`INSERT INTO admin_users (email, name, password_hash) VALUES (${ADMIN.email}, 'E2E', ${await bcrypt.hash(ADMIN.password, 4)})`;
  await sql.end();
  console.log("e2e database reset");
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
