import Link from "next/link";
import type { Post } from "@/content/posts";
import { summaryOf } from "@/lib/posts";
import { Rich } from "./Rich";
import { Photo } from "./Photo";

/** One blog post. Used by the public page and by the dashboard preview of drafts. */
/** blogHref: where "Blog" at the top leads. The dashboard preview points it back to the post list. */
export function PostArticle({ post, related, blogHref = "/blog/" }: { post: Post; related: Post[]; blogHref?: string }) {
  return (
    <article className="post">
      <header className="post-head">
        <nav className="post-crumbs" aria-label="Breadcrumb">
          <Link href={blogHref}>Blog</Link>
        </nav>
        {post.date && <p className="post-date">{post.date}</p>}
        <h1 className="post-title">
          <Rich text={post.h1} />
        </h1>
        <p className="post-intro">
          <Rich text={post.intro} />
        </p>
      </header>

      {post.image && (
        <div className="post-photo">
          <Photo image={post.image} sizes="(max-width: 900px) 100vw, 860px" priority fallbackAlt={post.h1} />
        </div>
      )}

      <div className="post-body">
        {post.sections.map((s, i) => (
          <section key={i}>
            {s.h2 && (
              <h2>
                <Rich text={s.h2} />
              </h2>
            )}
            {s.p?.map((para, j) => (
              <p key={j}>
                <Rich text={para} />
              </p>
            ))}
            {s.list && (
              <ul>
                {s.list.map((li, j) => (
                  <li key={j}>
                    <Rich text={li} />
                  </li>
                ))}
              </ul>
            )}
            {s.image && (
              <figure className="post-section-photo">
                <Photo image={s.image} sizes="(max-width: 900px) 100vw, 700px" fallbackAlt={s.h2} />
              </figure>
            )}
          </section>
        ))}

        {post.quote && (
          <figure className="post-quote">
            <blockquote>
              <Rich text={post.quote.quote} />
            </blockquote>
            <figcaption>{post.quote.name}</figcaption>
          </figure>
        )}
      </div>

      {related.length > 0 && (
        <nav className="post-related" aria-label="More posts">
          <ul className="post-list">
            {related.map((r) => (
              <li key={r.slug}>
                <PostCard post={r} />
              </li>
            ))}
          </ul>
        </nav>
      )}
    </article>
  );
}

/** A post on the blog list: date, heading and a short summary. */
export function PostCard({ post }: { post: Post }) {
  return (
    <Link href={`/blog/${post.slug}/`} className="post-card">
      {post.image && (
        <span className="post-card__photo">
          <Photo image={post.image} sizes="(max-width: 768px) 100vw, 320px" ratio={[4, 3]} fallbackAlt="" />
        </span>
      )}
      <span className="post-card__text">
        {post.date && <span className="post-card__date">{post.date}</span>}
        <b className="post-card__title">
          <Rich text={post.h1} />
        </b>
        <span className="post-card__summary">{summaryOf(post)}</span>
      </span>
    </Link>
  );
}
