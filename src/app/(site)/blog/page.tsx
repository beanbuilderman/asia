import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getContent, paragraphs, postSlugs } from "@/lib/content";
import { Rich } from "@/components/Rich";
import { Photo } from "@/components/Photo";
import { PhotoCarousel } from "@/components/Carousels";

export async function generateMetadata(): Promise<Metadata> {
  const { blog } = await getContent();
  return { title: blog.heading, alternates: { canonical: "/blog/" } };
}

/**
 * Every post on one page, newest first (the order Asia sets in her dashboard).
 * Each post has its own link, /blog/#post-title, so she can share one post.
 * Until she publishes her first post the page does not exist and the menu hides it.
 */
export default async function BlogPage() {
  const { blog } = await getContent();
  if (blog.posts.length === 0) notFound();
  const slugs = postSlugs(blog.posts);
  return (
    <>
      <header className="page-header page-header--blog">
        <h1 className="fade-in">{blog.heading}</h1>
      </header>
      <section className="section blog">
        {blog.posts.map((post, i) => (
          <article className="blog-post fade-in" id={slugs[i]} key={slugs[i]}>
            <h2 className="blog-post__title">
              <a href={`#${slugs[i]}`}>
                <Rich text={post.title} />
              </a>
            </h2>
            {post.date && <p className="blog-post__date">{post.date}</p>}
            {post.photos.length === 1 && (
              <Photo image={post.photos[0]} className="blog-post__photo" sizes="(max-width: 900px) 100vw, 760px" fallbackAlt={post.title} />
            )}
            {post.photos.length > 1 && (
              <div className="blog-post__carousel">
                <PhotoCarousel label={`${post.title} photos`}>
                  {post.photos.map((img, j) => (
                    <Photo key={j} image={img} sizes="(max-width: 900px) 100vw, 760px" fallbackAlt={`${post.title}, photo ${j + 1}`} />
                  ))}
                </PhotoCarousel>
              </div>
            )}
            <div className="blog-post__body">
              {paragraphs(post.body).map((p, j) => (
                <p key={j}>
                  <Rich text={p} />
                </p>
              ))}
            </div>
          </article>
        ))}
      </section>
    </>
  );
}
