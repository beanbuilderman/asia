import { requireAdminPage } from "@/lib/auth";
import { loadContentForEditor } from "@/lib/content";
import { DEFAULT_CONTENT } from "@/content/defaults";
import { TeachingForm } from "../forms";

export const instant = false;

export default async function Page() {
  await requireAdminPage();
  const { content } = await loadContentForEditor();
  return (
    <>
      <h1>Education</h1>
      <p className="muted lead">Change the photos and wording on your Education page, then press Save at the bottom.</p>
      <TeachingForm initial={content.teaching} defaults={DEFAULT_CONTENT.teaching} />
    </>
  );
}
