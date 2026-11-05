import { getContent } from "@/lib/content";
import { getPublishedPosts } from "@/lib/posts";
import { SiteNav } from "@/components/SiteNav";
import { FadeIn } from "@/components/FadeIn";
import "./site.css";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [{ site, about, productions, teaching, contact }, posts] = await Promise.all([getContent(), getPublishedPosts()]);
  // Menu labels follow the page headings Asia sets in her dashboard. Blog shows once a post is published.
  const links = [
    { href: "/", label: "About" },
    { href: "/directing/", label: productions.heading },
    { href: "/education/", label: teaching.heading },
    ...(posts.length > 0 ? [{ href: "/blog/", label: "Blog" }] : []),
    { href: "/contact/", label: contact.heading },
  ];
  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <SiteNav name={site.name} links={links} overPhoto={about.photos.length > 0} />
      <main id="main">{children}</main>
      <footer className="site-footer">{site.footer}</footer>
      <FadeIn />
    </>
  );
}
