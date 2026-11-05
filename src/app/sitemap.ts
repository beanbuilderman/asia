import type { MetadataRoute } from "next";
import { getContent } from "@/lib/content";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.SITE_URL ?? "https://asiajoannarob.com";
  const { blog } = await getContent();
  return [
    { url: `${base}/`, priority: 1 },
    { url: `${base}/directing/`, priority: 0.8 },
    { url: `${base}/education/`, priority: 0.8 },
    ...(blog.posts.length > 0 ? [{ url: `${base}/blog/`, priority: 0.6 }] : []),
    { url: `${base}/contact/`, priority: 0.5 },
  ];
}
