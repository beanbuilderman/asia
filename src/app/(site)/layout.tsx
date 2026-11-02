import { getContent } from "@/lib/content";
import { SiteNav } from "@/components/SiteNav";
import { FadeIn } from "@/components/FadeIn";
import "./site.css";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const { site } = await getContent();
  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <SiteNav name={site.name} />
      <main id="main">{children}</main>
      <footer className="site-footer">{site.footer}</footer>
      <FadeIn />
    </>
  );
}
