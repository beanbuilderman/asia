import Link from "next/link";
import { requireAdminPage } from "@/lib/auth";
import { loadPostsForEditor, plain } from "@/lib/posts";
import { MoveButtons } from "./MoveButtons";

export const instant = false;

export default async function BlogAdminPage(props: PageProps<"/admin/blog">) {
  await requireAdminPage();
  const [posts, sp] = await Promise.all([loadPostsForEditor(), props.searchParams]);
  const live = posts.filter((p) => p.published).length;
  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <h1>Blog</h1>
        <Link href="/admin/blog/new/" className="btn">
          + Write a new post
        </Link>
      </div>
      <p className="muted lead">
        Each post has its own page. Published posts are listed at{" "}
        {live > 0 ? (
          <a href="/blog/" target="_blank" rel="noopener">
            asiajoannarob.com/blog
          </a>
        ) : (
          "asiajoannarob.com/blog"
        )}{" "}
        in this order, and Blog appears in your menu once at least one is published.
        {live === 0 && " Nothing is published yet, so the Blog tab is hidden."}
      </p>
      {sp.deleted === "1" && (
        <p className="flash ok" role="status">
          Post deleted.
        </p>
      )}
      {posts.length === 0 ? (
        <p className="muted">No posts yet.</p>
      ) : (
        posts.map((p, i) => (
          <div className="panel post-row" key={p.slug}>
            <div style={{ minWidth: 0 }}>
              <b>{plain(p.h1)}</b>{" "}
              <span className={p.published ? "badge badge-live" : "badge"}>{p.published ? "Published" : "Draft"}</span>
              <div className="muted small" style={{ overflowWrap: "anywhere" }}>
                {p.date ? `${p.date} · ` : ""}/blog/{p.slug}
              </div>
            </div>
            <span className="row-actions" style={{ marginTop: 0 }}>
              <MoveButtons slug={p.slug} first={i === 0} last={i === posts.length - 1} title={plain(p.h1)} />
              <Link className="mini-btn" href={p.published ? `/blog/${p.slug}/` : `/preview/blog/${p.slug}/`} target="_blank">
                {p.published ? "View" : "Preview"}
              </Link>
              <Link className="mini-btn primary" href={`/admin/blog/${p.slug}/`}>
                Edit
              </Link>
            </span>
          </div>
        ))
      )}
    </>
  );
}
