"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

export const PAGES = [
  { href: "/admin/about/", label: "About", site: "/" },
  { href: "/admin/productions/", label: "Directing", site: "/directing/" },
  { href: "/admin/teaching/", label: "Education", site: "/education/" },
  { href: "/admin/blog/", label: "Blog", site: "/blog/" },
  { href: "/admin/contact/", label: "Contact", site: "/contact/" },
  { href: "/admin/settings/", label: "Settings", site: "/" },
];

export function AdminNav() {
  const path = usePathname() ?? "";
  const nav = useRef<HTMLElement>(null);
  // On a phone the active tab can be off to the side; bring it into view.
  useEffect(() => {
    nav.current?.querySelector('[aria-current="page"]')?.scrollIntoView({ inline: "center", block: "nearest" });
  }, [path]);
  return (
    <nav className="admin-nav" aria-label="Dashboard" ref={nav}>
      {PAGES.map((l) => {
        const active = (path.endsWith("/") ? path : `${path}/`).startsWith(l.href);
        return (
          <Link key={l.href} href={l.href} aria-current={active ? "page" : undefined}>
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
