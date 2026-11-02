import { requireAdminPage } from "@/lib/auth";
import { loadContentForEditor } from "@/lib/content";
import { DEFAULT_CONTENT } from "@/content/defaults";
import { ContactForm } from "../forms";

export const instant = false;

export default async function Page() {
  await requireAdminPage();
  const { content } = await loadContentForEditor();
  return (
    <>
      <h1>Contact</h1>
      <p className="muted lead">Change your contact details, then press Save at the bottom.</p>
      <ContactForm initial={content.contact} defaults={DEFAULT_CONTENT.contact} />
    </>
  );
}
