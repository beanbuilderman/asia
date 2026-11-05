import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // Photos Asia uploads in her dashboard are stored in Vercel Blob.
  images: { remotePatterns: [{ protocol: "https", hostname: "*.public.blob.vercel-storage.com" }] },
  // Photos are shrunk in the browser before upload; this leaves headroom (Vercel's own cap is 4.5MB).
  experimental: { serverActions: { bodySizeLimit: "4mb" } },
  // The old static site used folder URLs (/productions/), keep them working.
  trailingSlash: true,
  // Pages renamed on 5 November 2026 at Asia's request; old links and Google results still land.
  async redirects() {
    return [
      { source: "/productions/", destination: "/directing/", permanent: true },
      { source: "/teaching/", destination: "/education/", permanent: true },
    ];
  },
};

export default nextConfig;
