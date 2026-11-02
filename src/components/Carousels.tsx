"use client";

import { Children, useCallback, useEffect, useRef, useState } from "react";

/** Photos in a carousel wait until they are needed. Fetch the next one in advance so it is ready when shown. */
function usePreload(root: React.RefObject<HTMLDivElement | null>, index: number) {
  useEffect(() => {
    const imgs = root.current?.querySelectorAll<HTMLImageElement>("img");
    if (imgs?.[index + 1]) imgs[index + 1].loading = "eager";
  }, [root, index]);
  // Someone pointing at or touching the carousel is about to click through: fetch the rest.
  return () => root.current?.querySelectorAll<HTMLImageElement>('img[loading="lazy"]').forEach((i) => (i.loading = "eager"));
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

/** Large photo carousel at the top of the Teaching page. Moves on every 5 seconds. */
export function PhotoCarousel({ children }: { children: React.ReactNode }) {
  const slides = Children.toArray(children);
  const { index, go } = useSlides(slides.length);
  const [paused, setPaused] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  usePreload(root, index);
  useEffect(() => {
    if (paused || slides.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => go(index + 1), 5000);
    return () => clearInterval(t);
  }, [paused, index, go, slides.length]);
  if (slides.length === 0) return null;
  return (
    <div
      className="carousel fade-in stagger-1"
      ref={root}
      aria-roledescription="carousel"
      aria-label="Teaching photos"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="carousel__track" style={{ transform: `translateX(-${index * 100}%)` }}>
        {slides.map((s, i) => (
          <div className="carousel__slide" key={i} aria-hidden={i !== index}>
            {s}
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
