import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminPage } from "@/lib/auth";
import { defaultPost, loadPostsForEditor, plain } from "@/lib/posts";
import { PostEditor } from "../PostEditor";

export const instant = false;

export default async function EditPostPage(props: PageProps<"/admin/blog/[slug]">) {
  await requireAdminPage();
  const [{ slug }, sp, posts] = await Promise.all([props.params, props.searchParams, loadPostsForEditor()]);
  const post = posts.find((x) => x.slug === slug);
  if (!post) notFound();
  return (
    <>
      <p style={{ margin: "0 0 8px" }}>
        <Link href="/admin/blog/">← All posts</Link>
      </p>
      <h1>Edit post</h1>
      {sp.saved === "1" && (
        <p className="flash ok" role="status">
          Saved.
        </p>
      )}
      <PostEditor
        key={post.slug}
        initial={post}
        original={post.slug}
        isNew={false}
        others={posts.filter((x) => x.slug !== post.slug).map((x) => ({ slug: x.slug, h1: plain(x.h1) }))}
        defaultVersion={defaultPost(post.slug) ?? null}
      />
    </>
  );
}
