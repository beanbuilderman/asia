"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * The original site's gentle fade-in as sections scroll into view. Runs again after each page change.
 * It uses browser animations instead of adding a class or attribute: React owns the page's HTML, and
 * changing it before a page finishes loading made React report a mismatch.
 */
export function FadeIn() {
  const path = usePathname();
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>(".fade-in")).filter((el) => !shown.has(el));
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!("IntersectionObserver" in window) || reduce) {
      els.forEach((el) => show(el, true));
      return;
    }
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          show(e.target as HTMLElement, false);
          observer.unobserve(e.target);
        }),
      { threshold: 0.15 },
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [path]);
  return null;
}

const shown = new WeakSet<Element>();

function show(el: HTMLElement, instant: boolean) {
  if (shown.has(el)) return;
  shown.add(el);
  // The stagger-N classes set a transition delay; reuse it so items still arrive one after another.
  const delay = instant ? 0 : parseFloat(getComputedStyle(el).transitionDelay) * 1000 || 0;
  el.animate(
    [
      { opacity: 0, transform: "translateY(20px)" },
      { opacity: 1, transform: "none" },
    ],
    { duration: instant ? 0 : 800, delay, easing: "ease", fill: "forwards" },
  );
}
