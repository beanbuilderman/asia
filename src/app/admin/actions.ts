"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { sql } from "@/db";
import {
  clearLoginFailures,
  clearSessionCookie,
  hashPassword,
  loginLocked,
  recordLoginFailure,
  requireSession,
  setSessionCookie,
  verifyLogin,
} from "@/lib/auth";
import { passwordResetEmail, sendEmail, siteUrl } from "@/lib/email";
import { hashToken, newToken } from "@/lib/tokens";

export type FormState = { ok?: boolean; error?: string; message?: string } | undefined;

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();

/** Turns a validation problem into a sentence Asia can act on, e.g. "This cannot be empty (Production 3: title)". */
const FIELD_NAMES: Record<string, string> = {
  items: "Production", images: "Photo", photos: "Photo", training: "Training", testimonials: "Testimonial", experience: "Experience",
  links: "Link", title: "title", meta: "details line", description: "description", name: "name", detail: "place and date",
  quote: "quote", role: "who they are", url: "link", label: "label", alt: "photo description", heading: "heading",
  subtitle: "subtitle", bio: "introduction", intro: "introduction", email: "email", text: "text", portrait: "main photo",
  seoTitle: "Google title", seoDescription: "Google description", footer: "footer", trainingHeading: "training heading",
  experienceHeading: "experience heading",
};
function describe(path: PropertyKey[]): string {
  const out: string[] = [];
  for (let i = 0; i < path.length; i++) {
    const k = path[i];
    if (typeof k === "number") continue;
    const name = FIELD_NAMES[String(k)] ?? String(k);
    const next = path[i + 1];
    out.push(typeof next === "number" ? `${name} ${next + 1}` : name);
  }
  return out.join(": ");
}

// ---------- Sign in ----------

export async function login(_: FormState, fd: FormData): Promise<FormState> {
  const email = str(fd, "email").toLowerCase();
  const password = String(fd.get("password") ?? "");
  // Keyed on the email only: a forged X-Forwarded-For header cannot reset the count.
  if (loginLocked(email)) return { error: "Too many attempts. Please wait 15 minutes and try again." };
  const session = await verifyLogin(email, password);
  if (!session) {
    recordLoginFailure(email);
    return { error: "That email and password do not match." };
  }
  clearLoginFailures(email);
  await setSessionCookie(session);
  const next = str(fd, "next");
  redirect(next.startsWith("/admin") && !next.startsWith("//") ? next : "/admin/");
}

export async function logout(): Promise<void> {
  await clearSessionCookie();
  redirect("/admin/login/");
}

export async function requestPasswordReset(_: FormState, fd: FormData): Promise<FormState> {
  const email = str(fd, "email").toLowerCase();
  // Same brake as sign in, so nobody can flood an inbox with reset emails.
  const key = `reset:${email}`;
  if (loginLocked(key)) return { ok: true, message: RESET_SENT };
  recordLoginFailure(key);
  const [u] = await sql<{ id: number; email: string }[]>`SELECT id, email FROM admin_users WHERE lower(email) = ${email}`;
  if (u) {
    const token = newToken();
    await sql`INSERT INTO password_resets (user_id, token_hash, expires_at)
              VALUES (${u.id}, ${hashToken(token)}, now() + interval '1 hour')`;
    await sendEmail(passwordResetEmail(u.email, siteUrl(`/admin/reset/${token}/`)));
  }
  // Same answer either way, so the form does not reveal which emails have accounts.
  return { ok: true, message: RESET_SENT };
}
const RESET_SENT = "If that email has an account, a reset link is on its way. It works for 1 hour. Check your spam folder if it does not arrive.";

export async function resetPassword(_: FormState, fd: FormData): Promise<FormState> {
  const token = str(fd, "token");
  const password = String(fd.get("password") ?? "");
  if (password.length < 10) return { error: "Please use at least 10 characters." };
  if (password !== String(fd.get("confirm") ?? "")) return { error: "The two passwords do not match." };
  const hash = await hashPassword(password);
  const userId = await sql.begin(async (tx) => {
    const [r] = await tx<{ id: number; userId: number }[]>`
      SELECT id, user_id FROM password_resets
      WHERE token_hash = ${hashToken(token)} AND used_at IS NULL AND expires_at > now() FOR UPDATE`;
    if (!r) return null;
    await tx`UPDATE password_resets SET used_at = now() WHERE id = ${r.id}`;
    await tx`UPDATE admin_users SET password_hash = ${hash}, password_changed_at = now() WHERE id = ${r.userId}`;
    return r.userId;
  });
  if (!userId) return { error: "This link has expired or was already used. Please ask for a new one." };
  return { ok: true, message: "Password changed. You can sign in now." };
}

export async function changePassword(_: FormState, fd: FormData): Promise<FormState> {
  const s = await requireSession();
  const current = String(fd.get("current") ?? "");
  const password = String(fd.get("password") ?? "");
  if (!(await verifyLogin(s.email, current))) return { error: "Your current password is not right." };
  if (password.length < 10) return { error: "Please use at least 10 characters." };
  if (password !== String(fd.get("confirm") ?? "")) return { error: "The two new passwords do not match." };
  await sql`UPDATE admin_users SET password_hash = ${await hashPassword(password)}, password_changed_at = now() WHERE id = ${s.userId}`;
  // Changing the password signs out every other device; a fresh cookie keeps this one signed in.
  await setSessionCookie(s);
  return { ok: true, message: "Password changed. Other devices have been signed out." };
}

// ---------- Website wording and photos ----------

export async function actSaveSection(key: string, value: unknown): Promise<FormState> {
  await requireSession();
  const { isSectionKey, saveSection } = await import("@/lib/content");
  if (!isSectionKey(key)) return { error: "Unknown part of the website." };
  try {
    await saveSection(key, value);
    revalidatePath("/", "layout");
    return { ok: true, message: "Saved. The website shows your changes now." };
  } catch (e) {
    if (e instanceof z.ZodError) {
      const issue = e.issues[0];
      const where = issue ? describe(issue.path) : "";
      return { error: `${issue?.message ?? "Please check the form"}${where ? ` (${where})` : ""}` };
    }
    console.error("[save]", e);
    return { error: "Something went wrong and nothing was saved. Please try again." };
  }
}

export async function actResetSection(key: string): Promise<FormState> {
  await requireSession();
  const { isSectionKey, resetSection } = await import("@/lib/content");
  if (!isSectionKey(key)) return { error: "Unknown part of the website." };
  await resetSection(key);
  revalidatePath("/", "layout");
  return { ok: true, message: "Back to the original wording and photos." };
}

export async function actUploadPhoto(fd: FormData): Promise<{ url?: string; error?: string }> {
  await requireSession();
  const { storePhoto, UploadError } = await import("@/lib/uploads");
  const file = fd.get("photo");
  if (!(file instanceof File) || file.size === 0) return { error: "Choose a photo first." };
  try {
    return { url: await storePhoto(file, "photo") };
  } catch (e) {
    if (e instanceof UploadError) return { error: e.message };
    console.error("[upload]", e);
    return { error: "The photo could not be uploaded. Please try again." };
  }
}
