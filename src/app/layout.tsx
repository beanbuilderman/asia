import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Karla } from "next/font/google";
import { getContent } from "@/lib/content";

const cormorant = Cormorant_Garamond({
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  subsets: ["latin", "latin-ext"],
  variable: "--font-cormorant",
  display: "swap",
});
const karla = Karla({ weight: ["300", "400", "500"], subsets: ["latin", "latin-ext"], variable: "--font-karla", display: "swap" });

export async function generateMetadata(): Promise<Metadata> {
  const { site, about } = await getContent();
  const portrait = about.portrait.url.startsWith("http") ? about.portrait.url : encodeURI(about.portrait.url);
  return {
    metadataBase: new URL(process.env.SITE_URL ?? "http://localhost:3200"),
    title: { default: site.seoTitle, template: `%s — ${site.name}` },
    description: site.seoDescription || undefined,
    openGraph: { type: "website", locale: "en_GB", siteName: site.name, title: site.seoTitle, description: site.seoDescription || undefined, images: [{ url: portrait, alt: about.name }] },
    // Preview deployments stay out of search engines; only the real domain is indexed.
    robots: process.env.ALLOW_INDEXING === "true" ? undefined : { index: false, follow: false },
  };
}

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#FAF8F5" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB" className={`${cormorant.variable} ${karla.variable}`}>
      <body>{children}</body>
    </html>
  );
}
