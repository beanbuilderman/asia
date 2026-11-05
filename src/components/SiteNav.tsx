"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export type NavLink = { href: string; label: string };

const norm = (p: string) => (p.endsWith("/") ? p : `${p}/`);

/** overPhoto: the home page opens on full-screen photos, so the bar is see-through until they are scrolled past. */
export function SiteNav({ name, links, overPhoto }: { name: string; links: NavLink[]; overPhoto: boolean }) {
  const path = norm(usePathname() ?? "/");
  const [scrolled, setScrolled] = useState(false);
  const [pastPhotos, setPastPhotos] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 40);
      setPastPhotos(window.scrollY > window.innerHeight - 90);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <nav className={`site-nav${scrolled ? " scrolled" : ""}${overPhoto && path === "/" && !pastPhotos && !open ? " site-nav--over-photo" : ""}`} aria-label="Main">
      <Link href="/" className="site-nav__name">
        {name}
      </Link>
      <button
        className={`nav-toggle${open ? " open" : ""}`}
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        aria-controls="navLinks"
        onClick={() => setOpen((o) => !o)}
      >
        <span></span>
        <span></span>
        <span></span>
      </button>
      <ul className={`site-nav__links${open ? " open" : ""}`} id="navLinks">
        {links.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className={path === l.href ? "active" : undefined}
              aria-current={path === l.href ? "page" : undefined}
              onClick={() => setOpen(false)}
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
