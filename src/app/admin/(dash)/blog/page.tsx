import { requireAdminPage } from "@/lib/auth";
import { loadContentForEditor } from "@/lib/content";
import { DEFAULT_CONTENT } from "@/content/defaults";
import { BlogForm } from "../forms";

export const instant = false;

export default async function Page() {
  await requireAdminPage();
  const { content } = await loadContentForEditor();
  return (
    <>
      <h1>Blog</h1>
      <p className="muted lead">Write a new post or change an old one, then press Save at the bottom.</p>
      <BlogForm initial={content.blog} defaults={DEFAULT_CONTENT.blog} />
    </>
  );
}
