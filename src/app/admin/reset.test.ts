import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

// Server Actions call cookies() and redirect(); outside Next.js they are stubbed.
vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => undefined, set: () => {}, delete: () => {} }) }));
vi.mock("next/navigation", () => ({ redirect: () => {} }));

import { sql } from "@/db";
import { migrate } from "@/db/migrate";
import { verifyLogin, hashPassword } from "@/lib/auth";
import { sentEmails } from "@/lib/email";
import { requestPasswordReset, resetPassword } from "./actions";

const fd = (o: Record<string, string>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(o)) f.set(k, v);
  return f;
};
const linkToken = () => /\/admin\/reset\/([\w-]+)\//.exec(sentEmails.at(-1)!.text)![1];

beforeAll(async () => {
  await sql`DROP TABLE IF EXISTS site_content, password_resets, admin_users, schema_migrations CASCADE`;
  await migrate(sql);
});
beforeEach(async () => {
  sentEmails.length = 0;
  await sql`DELETE FROM admin_users`;
  await sql`INSERT INTO admin_users (email, name, password_hash) VALUES ('Asia@Example.com', 'Asia', ${await hashPassword("old-password-123")})`;
});
afterAll(async () => {
  await sql.end();
});

describe("forgotten password", () => {
  it("emails a link that sets a new password once", async () => {
    const r = await requestPasswordReset(undefined, fd({ email: "asia@example.com" }));
    expect(r?.ok).toBe(true);
    expect(sentEmails).toHaveLength(1);
    expect(sentEmails[0].to).toBe("Asia@Example.com");
    const token = linkToken();

    expect((await resetPassword(undefined, fd({ token, password: "brand-new-pass", confirm: "brand-new-pass" })))?.ok).toBe(true);
    expect(await verifyLogin("asia@example.com", "brand-new-pass")).not.toBeNull();
    expect(await verifyLogin("asia@example.com", "old-password-123")).toBeNull();

    const again = await resetPassword(undefined, fd({ token, password: "another-pass-1", confirm: "another-pass-1" }));
    expect(again?.error).toMatch(/expired or was already used/);
  });

  it("gives the same answer for an unknown email and sends nothing", async () => {
    const known = await requestPasswordReset(undefined, fd({ email: "asia@example.com" }));
    const unknown = await requestPasswordReset(undefined, fd({ email: "nobody@example.com" }));
    expect(unknown).toEqual(known);
    expect(sentEmails).toHaveLength(1);
  });

  it("refuses an expired link, a short password and a mistyped confirmation", async () => {
    await requestPasswordReset(undefined, fd({ email: "asia@example.com" }));
    const token = linkToken();
    expect((await resetPassword(undefined, fd({ token, password: "short", confirm: "short" })))?.error).toMatch(/10 characters/);
    expect((await resetPassword(undefined, fd({ token, password: "long-enough-1", confirm: "long-enough-2" })))?.error).toMatch(/do not match/);
    await sql`UPDATE password_resets SET expires_at = now() - interval '1 minute'`;
    expect((await resetPassword(undefined, fd({ token, password: "long-enough-1", confirm: "long-enough-1" })))?.error).toMatch(/expired/);
  });
});
