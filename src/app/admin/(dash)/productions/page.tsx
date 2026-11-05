import { requireAdminPage } from "@/lib/auth";
import { loadContentForEditor } from "@/lib/content";
import { DEFAULT_CONTENT } from "@/content/defaults";
import { ProductionsForm } from "../forms";

export const instant = false;

export default async function Page() {
  await requireAdminPage();
  const { content } = await loadContentForEditor();
  return (
    <>
      <h1>Directing</h1>
      <p className="muted lead">Add, change, reorder or remove productions and their photos, then press Save at the bottom.</p>
      <ProductionsForm initial={content.productions} defaults={DEFAULT_CONTENT.productions} />
    </>
  );
}
