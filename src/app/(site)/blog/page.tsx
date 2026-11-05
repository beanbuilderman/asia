import type { Metadata } from "next";
import { getPublishedPosts } from "@/lib/posts";
import { PostCard } from "@/components/PostArticle";

export const metadata: Metadata = { title: "Blog", alternates: { canonical: "/blog/" } };

/** Published posts in Asia's order. With none published, the proxy answers 404 and the menu hides Blog. */
export default async function BlogPage() {
  const posts = await getPublishedPosts();
  return (
    <>
      <header className="page-header page-header--narrow">
        <h1 className="fade-in">Blog</h1>
      </header>
      <section className="section section--narrow">
        <ul className="post-list">
          {posts.map((p) => (
            <li key={p.slug} className="fade-in">
              <PostCard post={p} />
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
