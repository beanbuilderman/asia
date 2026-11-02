import { requireAdminPage } from "@/lib/auth";
import { loadContentForEditor } from "@/lib/content";
import { DEFAULT_CONTENT } from "@/content/defaults";
import { AboutForm } from "../forms";

export const instant = false;

export default async function Page() {
  await requireAdminPage();
  const { content } = await loadContentForEditor();
  return (
    <>
      <h1>About page</h1>
      <p className="muted lead">Your home page. Change anything below, then press Save at the bottom.</p>
      <AboutForm initial={content.about} defaults={DEFAULT_CONTENT.about} />
    </>
  );
}
