import { requireAdminPage } from "@/lib/auth";
import { loadContentForEditor } from "@/lib/content";
import { DEFAULT_CONTENT } from "@/content/defaults";
import { SiteForm } from "../forms";
import { PasswordForm } from "./PasswordForm";

export const instant = false;

export default async function SettingsPage() {
  const session = await requireAdminPage();
  const { content } = await loadContentForEditor();
  return (
    <>
      <h1>Settings</h1>
      <SiteForm initial={content.site} defaults={DEFAULT_CONTENT.site} />
      <section className="panel editor-section" style={{ marginTop: 40 }}>
        <h2>Your password</h2>
        <p className="muted small">You are signed in as {session.email}.</p>
        <PasswordForm />
      </section>
    </>
  );
}
