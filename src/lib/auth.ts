import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyJwt } from "./session-token";
import { SignJWT } from "jose";
import bcrypt from "bcryptjs";
import { sql } from "@/db";

import { SESSION_COOKIE } from "./auth-cookie";
export { SESSION_COOKIE };
const SESSION_DAYS = 30;

function secret(): Uint8Array {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 32) throw new Error("AUTH_SECRET must be set (at least 32 characters)");
  return new TextEncoder().encode(s);
}

export type Session = { userId: number; email: string };

export async function createSessionToken(s: Session): Promise<string> {
  return new SignJWT({ userId: s.userId, email: s.email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(secret());
}

export async function verifySessionToken(token: string): Promise<Session | null> {
  const p = await verifyJwt(token);
  return p ? { userId: p.userId, email: p.email } : null;
}

export async function setSessionCookie(s: Session): Promise<void> {
  (await cookies()).set(SESSION_COOKIE, await createSessionToken(s), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * SESSION_DAYS,
  });
}

export async function clearSessionCookie(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}

/** The signed-in dashboard user, checked against the database. */
export async function getSession(): Promise<Session | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const p = await verifyJwt(token);
  if (!p) return null;
  // The user must still exist, and the session must be newer than their last password change.
  const [u] = await sql<{ id: number; email: string; changed: number }[]>`
    SELECT id, email, floor(extract(epoch FROM password_changed_at))::int AS changed FROM admin_users WHERE id = ${p.userId}`;
  if (!u || p.iat < u.changed) return null;
  return { userId: u.id, email: u.email };
}

/** For dashboard pages: signed-in user, or a redirect to the login page. */
export async function requireAdminPage(): Promise<Session> {
  const s = await getSession();
  if (!s) redirect("/admin/login");
  return s;
}

/** Use in every dashboard Server Action and page: the proxy alone is not enough. */
export async function requireSession(): Promise<Session> {
  const s = await getSession();
  if (!s) throw new Error("Not signed in");
  return s;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

let dummyHash: string | undefined;

export async function verifyLogin(email: string, password: string): Promise<Session | null> {
  const [u] = await sql<{ id: number; email: string; passwordHash: string }[]>`
    SELECT id, email, password_hash FROM admin_users WHERE lower(email) = ${email.trim().toLowerCase()}`;
  // Compare against a dummy hash when the user is unknown, so timing does not reveal accounts.
  dummyHash ??= await bcrypt.hash("not-a-real-password", 12);
  const ok = await bcrypt.compare(password, u?.passwordHash ?? dummyHash);
  if (!u || !ok) return null;
  await sql`UPDATE admin_users SET last_login_at = now() WHERE id = ${u.id}`;
  return { userId: u.id, email: u.email };
}

// Simple in-memory brute-force brake: 8 failed attempts per email per 15 minutes.
const attempts = new Map<string, { count: number; until: number }>();

export function loginLocked(key: string, now = Date.now()): boolean {
  const a = attempts.get(key);
  return Boolean(a && a.count >= 8 && a.until > now);
}

export function recordLoginFailure(key: string, now = Date.now()): void {
  const a = attempts.get(key);
  if (!a || a.until < now) attempts.set(key, { count: 1, until: now + 15 * 60_000 });
  else a.count++;
}

export function clearLoginFailures(key: string): void {
  attempts.delete(key);
}
