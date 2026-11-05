import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { requireAdminPage } from "@/lib/auth";
import { loadPostsForEditor } from "@/lib/posts";
import { PostArticle } from "@/components/PostArticle";

export const metadata: Metadata = { title: "Preview", robots: { index: false, follow: false } };

// The site menu reads the address, so Cache Components needs at least one address it can build.
// This placeholder is never a real post; previews always render on request, after the sign-in check.
export function generateStaticParams() {
  return [{ slug: "placeholder" }];
}

// Real posts are not in the build, so previews render on request (same as /blog/<slug>).
export const instant = false;

/**
 * How a post looks on the website, drafts included, with the real menu and styles.
 * Only Asia (signed in) can open it: the proxy checks the cookie and this page checks the database.
 */
export default function PreviewPostPage(props: PageProps<"/preview/blog/[slug]">) {
  return (
    <Suspense fallback={null}>
      <Preview {...props} />
    </Suspense>
  );
}

async function Preview(props: PageProps<"/preview/blog/[slug]">) {
  await connection();
  await requireAdminPage();
  const [{ slug }, posts] = await Promise.all([props.params, loadPostsForEditor()]);
  const post = posts.find((x) => x.slug === slug);
  if (!post) notFound();
  const related = post.related.map((r) => posts.find((p) => p.slug === r && p.published)).filter((p) => p !== undefined);
  return (
    <>
      <p className="post-preview-bar" role="status">
        {post.published ? "Preview. This post is published." : "Preview of a draft. Only you can see this."}{" "}
        <Link href={`/admin/blog/${post.slug}/`}>Back to editing</Link>
      </p>
      <PostArticle post={post} related={related} blogHref="/admin/blog/" />
    </>
  );
}
