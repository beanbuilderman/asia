import Link from "next/link";
import { requireAdminPage } from "@/lib/auth";
import { blankPost, loadPostsForEditor, plain } from "@/lib/posts";
import { PostEditor } from "../PostEditor";

export const instant = false;

export default async function NewPostPage() {
  await requireAdminPage();
  const posts = await loadPostsForEditor();
  return (
    <>
      <p style={{ margin: "0 0 8px" }}>
        <Link href="/admin/blog/">← All posts</Link>
      </p>
      <h1>Write a new post</h1>
      <p className="muted lead">It starts as a draft. Save it, check it with Preview, then tick Publish when you are happy.</p>
      <PostEditor initial={blankPost()} original={null} isNew others={posts.map((x) => ({ slug: x.slug, h1: plain(x.h1) }))} defaultVersion={null} />
    </>
  );
}
