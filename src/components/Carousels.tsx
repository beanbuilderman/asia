"use client";

import { Children, useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

/** Photos in a carousel wait until they are needed. Fetch the next one in advance so it is ready when shown. */
function usePreload(root: React.RefObject<HTMLDivElement | null>, index: number) {
  useEffect(() => {
    const imgs = root.current?.querySelectorAll<HTMLImageElement>("img");
    if (imgs?.[index + 1]) imgs[index + 1].loading = "eager";
  }, [root, index]);
  // Someone pointing at or touching the carousel is about to click through: fetch the rest.
  return () => root.current?.querySelectorAll<HTMLImageElement>('img[loading="lazy"]').forEach((i) => (i.loading = "eager"));
}

/** True once the browser has finished loading the page (always false while the server renders). */
function usePageLoaded() {
  return useSyncExternalStore(
    (onChange) => {
      window.addEventListener("load", onChange);
      return () => window.removeEventListener("load", onChange);
    },
    () => document.readyState === "complete",
    () => false,
  );
}

function useSlides(total: number) {
  const [raw, setIndex] = useState(0);
  const go = useCallback((i: number) => setIndex(((i % total) + total) % total), [total]);
  // If there are fewer slides than before, stay in range.
  const index = raw < total ? raw : 0;
  return { index, go };
}

/** Small photo carousel inside a production card. */
export function CardCarousel({ label, children }: { label: string; children: React.ReactNode }) {
  const slides = Children.toArray(children);
  const { index, go } = useSlides(slides.length);
  const root = useRef<HTMLDivElement>(null);
  const warm = usePreload(root, index);
  return (
    <div className="card-carousel" aria-roledescription="carousel" aria-label={label} ref={root} onPointerEnter={warm} onTouchStart={warm} onFocus={warm}>
      <div className="card-carousel__track" style={{ transform: `translateX(-${index * 100}%)` }}>
        {slides.map((s, i) => (
          <div className="card-carousel__slide" key={i} aria-hidden={i !== index}>
            {s}
          </div>
        ))}
      </div>
      <button type="button" className="card-carousel__btn card-carousel__btn--prev" aria-label="Previous photo" onClick={() => go(index - 1)}>
        &#8592;
      </button>
      <button type="button" className="card-carousel__btn card-carousel__btn--next" aria-label="Next photo" onClick={() => go(index + 1)}>
        &#8594;
      </button>
      <div className="card-carousel__dots">
        {slides.map((_, i) => (
          <button
            type="button"
            key={i}
            className={`card-carousel__dot${i === index ? " active" : ""}`}
            aria-label={`Photo ${i + 1} of ${slides.length}`}
            aria-current={i === index ? "true" : undefined}
            onClick={() => go(i)}
          />
        ))}
      </div>
    </div>
  );
}

/** Large photo carousel at the top of the Education page and in blog posts. Moves on every 5 seconds and pauses while someone points at it. */
export function PhotoCarousel({ children, label = "Photos" }: { children: React.ReactNode; label?: string }) {
  const slides = Children.toArray(children);
  const { index, go } = useSlides(slides.length);
  const [paused, setPaused] = useState(false);
  const [hidden, setHidden] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  // Only the photo on screen is on the page at first, and the next one once the page has loaded,
  // so the first photo downloads on its own.
  const [mounted, setMounted] = useState(() => new Set([0]));
  const pageLoaded = usePageLoaded();
  const wanted = pageLoaded ? [index, (index + 1) % Math.max(slides.length, 1)] : [index];
  if (wanted.some((i) => !mounted.has(i))) setMounted(new Set([...mounted, ...wanted]));
  useEffect(() => {
    const onVis = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);
  useEffect(() => {
    if (paused || hidden || slides.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => go(index + 1), 5000);
    return () => clearInterval(t);
  }, [paused, hidden, index, go, slides.length]);
  if (slides.length === 0) return null;
  return (
    <div
      className="carousel fade-in stagger-1"
      ref={root}
      aria-roledescription="carousel"
      aria-label={label}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="carousel__track" style={{ transform: `translateX(-${index * 100}%)` }}>
        {slides.map((s, i) => (
          <div className={`carousel__slide${i === index ? " is-active" : ""}`} key={i} aria-hidden={i !== index}>
            {mounted.has(i) ? s : null}
          </div>
        ))}
      </div>
      {slides.length > 1 && (
        <>
          <button type="button" className="carousel__btn carousel__btn--prev" aria-label="Previous photo" onClick={() => go(index - 1)}>
            &#8592;
          </button>
          <button type="button" className="carousel__btn carousel__btn--next" aria-label="Next photo" onClick={() => go(index + 1)}>
            &#8594;
          </button>
          <div className="carousel__dots">
            {slides.map((_, i) => (
              <button
                type="button"
                key={i}
                className={`carousel__dot${i === index ? " active" : ""}`}
                aria-label={`Photo ${i + 1} of ${slides.length}`}
                aria-current={i === index ? "true" : undefined}
                onClick={() => go(i)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/** Testimonials on the About page. Moves on every 12 seconds, with a pause button. */
export function TestimonialsCarousel({ children }: { children: React.ReactNode }) {
  const slides = Children.toArray(children);
  const { index, go } = useSlides(slides.length);
  const [userPaused, setUserPaused] = useState(false);
  const [hover, setHover] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const onVis = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  useEffect(() => {
    if (userPaused || hover || hidden || slides.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => go(index + 1), 12000);
    return () => clearInterval(t);
  }, [userPaused, hover, hidden, index, go, slides.length]);

  return (
    <div
      className="testimonials-carousel fade-in"
      aria-roledescription="carousel"
      aria-label="Testimonials"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div className="testimonials-carousel__viewport">
        <div className="testimonials-carousel__track" style={{ transform: `translateX(-${index * 100}%)` }}>
          {slides.map((s, i) => (
            <div className="testimonial" key={i} aria-hidden={i !== index}>
              {s}
            </div>
          ))}
        </div>
      </div>
      {slides.length > 1 && (
        <div className="testimonials-carousel__controls">
          <button type="button" className="testimonials-carousel__btn" aria-label="Previous testimonial" onClick={() => go(index - 1)}>
            &#8592;
          </button>
          <button
            type="button"
            className="testimonials-carousel__btn testimonials-carousel__btn--play"
            aria-label={userPaused ? "Play auto-rotation" : "Pause auto-rotation"}
            aria-pressed={!userPaused}
            onClick={() => setUserPaused((p) => !p)}
          >
            {userPaused ? "▶" : "❚❚"}
          </button>
          <div className="testimonials-carousel__dots">
            {slides.map((_, i) => (
              <button
                type="button"
                key={i}
                className={`testimonials-carousel__dot${i === index ? " active" : ""}`}
                aria-label={`Go to testimonial ${i + 1}`}
                aria-current={i === index ? "true" : undefined}
                onClick={() => go(i)}
              />
            ))}
          </div>
          <button type="button" className="testimonials-carousel__btn" aria-label="Next testimonial" onClick={() => go(index + 1)}>
            &#8594;
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Full-screen photo carousel at the top of the home page, with Asia's name over the photos.
 * Swipe or tap the bars to move; it moves on by itself every 5 seconds (the bar fills as it goes)
 * unless paused, hovered, hidden or the visitor prefers reduced motion.
 */
export function HeroCarousel({ children, caption, label, nextId }: { children: React.ReactNode; caption: React.ReactNode; label: string; nextId: string }) {
  const slides = Children.toArray(children);
  const { index, go } = useSlides(slides.length);
  const [userPaused, setUserPaused] = useState(false);
  const [hover, setHover] = useState(false);
  const pageLoaded = usePageLoaded();
  // Only the photo on screen is on the page at first, the next one once the page has loaded:
  // every photo sits in the same place, so browser lazy loading would fetch them all at once.
  const [mounted, setMounted] = useState(() => new Set([0]));
  const wanted = pageLoaded ? [index, (index + 1) % Math.max(slides.length, 1)] : [index];
  if (wanted.some((i) => !mounted.has(i))) setMounted(new Set([...mounted, ...wanted]));
  const touchX = useRef<number | null>(null);
  const many = slides.length > 1;
  const running = many && !userPaused && !hover;

  return (
    <section
      className="hero-photos"
      aria-roledescription="carousel"
      aria-label={label}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        touchX.current = null;
        if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1));
      }}
    >
      {slides.map((s, i) => (
        <div className={`hero-photos__slide${i === index ? " is-active" : ""}`} key={i} aria-hidden={i !== index}>
          {mounted.has(i) ? s : null}
        </div>
      ))}
      <div className="hero-photos__shade" aria-hidden="true" />
      <div className="hero-photos__caption">{caption}</div>
      {many && (
        <>
          <button type="button" className="hero-photos__arrow hero-photos__arrow--prev" aria-label="Previous photo" onClick={() => go(index - 1)}>
            &#8592;
          </button>
          <button type="button" className="hero-photos__arrow hero-photos__arrow--next" aria-label="Next photo" onClick={() => go(index + 1)}>
            &#8594;
          </button>
          <div className="hero-photos__bar">
            <button
              type="button"
              className="hero-photos__pause"
              aria-label={userPaused ? "Play the photos" : "Pause the photos"}
              aria-pressed={userPaused}
              onClick={() => setUserPaused((p) => !p)}
            >
              {userPaused ? "▶" : "❚❚"}
            </button>
            <div className="hero-photos__progress">
              {slides.map((_, i) => (
                <button
                  type="button"
                  key={i}
                  className={`hero-photos__seg${i < index ? " done" : ""}`}
                  aria-label={`Photo ${i + 1} of ${slides.length}`}
                  aria-current={i === index ? "true" : undefined}
                  onClick={() => go(i)}
                >
                  {i === index && (
                    <span
                      key={index}
                      className="hero-photos__fill"
                      style={{ animationPlayState: running ? "running" : "paused" }}
                      onAnimationEnd={() => go(index + 1)}
                    />
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
      <a href={`#${nextId}`} className="hero-photos__down" aria-label="Scroll down">
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
          <path d="M5 9l7 7 7-7" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </a>
    </section>
  );
}
