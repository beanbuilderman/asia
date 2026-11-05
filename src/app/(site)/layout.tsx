import { getContent } from "@/lib/content";
import { SiteNav } from "@/components/SiteNav";
import { FadeIn } from "@/components/FadeIn";
import "./site.css";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const { site, productions, teaching, blog, contact } = await getContent();
  // Menu labels follow the page headings Asia sets in her dashboard. Blog shows once she has a post.
  const links = [
    { href: "/", label: "About" },
    { href: "/directing/", label: productions.heading },
    { href: "/education/", label: teaching.heading },
    ...(blog.posts.length > 0 ? [{ href: "/blog/", label: blog.heading }] : []),
    { href: "/contact/", label: contact.heading },
  ];
  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <SiteNav name={site.name} links={links} />
      <main id="main">{children}</main>
      <footer className="site-footer">{site.footer}</footer>
      <FadeIn />
    </>
  );
}
