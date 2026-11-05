import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublishedPost, getPublishedPosts, plain, summaryOf } from "@/lib/posts";
import { PostArticle } from "@/components/PostArticle";

/**
 * Cache Components refuses an empty list here, so before the first post is published it lists a
 * placeholder that is never served: the proxy answers /blog/<anything> with 404 until a post is live.
 */
export async function generateStaticParams() {
  const posts = await getPublishedPosts();
  return posts.length ? posts.map((p) => ({ slug: p.slug })) : [{ slug: "none-yet" }];
}

// Posts Asia publishes later are not in the build, so this page renders on request (cached).
export const instant = false;

export async function generateMetadata(props: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const p = await getPublishedPost((await props.params).slug);
  if (!p) return {};
  const title = p.title || plain(p.h1);
  const description = p.description || summaryOf(p);
  return {
    title,
    description,
    alternates: { canonical: `/blog/${p.slug}/` },
    openGraph: {
      title,
      description,
      url: `/blog/${p.slug}/`,
      type: "article",
      ...(p.image ? { images: [{ url: p.image.url, alt: p.image.alt || plain(p.h1) }] } : {}),
    },
  };
}

export default async function PostPage(props: PageProps<"/blog/[slug]">) {
  const [all, { slug }] = await Promise.all([getPublishedPosts(), props.params]);
  const post = all.find((p) => p.slug === slug);
  if (!post) notFound();
  const related = post.related.map((r) => all.find((p) => p.slug === r)).filter((p) => p !== undefined);
  const base = process.env.SITE_URL ?? "https://asiajoannarob.com";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: plain(post.h1),
    description: post.description || summaryOf(post),
    url: `${base}/blog/${post.slug}/`,
    author: { "@type": "Person", name: "Asia Joanna Rob", url: `${base}/` },
    ...(post.image ? { image: post.image.url.startsWith("http") ? post.image.url : `${base}${encodeURI(post.image.url)}` } : {}),
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <PostArticle post={post} related={related} />
    </>
  );
}
