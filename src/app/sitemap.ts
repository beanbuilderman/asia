import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.SITE_URL ?? "https://asiajoannarob.com";
  return [
    { url: `${base}/`, priority: 1 },
    { url: `${base}/productions/`, priority: 0.8 },
    { url: `${base}/teaching/`, priority: 0.8 },
    { url: `${base}/contact/`, priority: 0.5 },
  ];
}
