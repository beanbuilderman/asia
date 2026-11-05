import type { MetadataRoute } from "next";
import { getPublishedPosts } from "@/lib/posts";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.SITE_URL ?? "https://asiajoannarob.com";
  const posts = await getPublishedPosts();
  return [
    { url: `${base}/`, priority: 1 },
    { url: `${base}/directing/`, priority: 0.8 },
    { url: `${base}/education/`, priority: 0.8 },
    ...(posts.length > 0 ? [{ url: `${base}/blog/`, priority: 0.6 }] : []),
    ...posts.map((p) => ({ url: `${base}/blog/${p.slug}/`, priority: 0.5 })),
    { url: `${base}/contact/`, priority: 0.5 },
  ];
}
