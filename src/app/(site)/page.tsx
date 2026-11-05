import type { Metadata } from "next";
import { getContent, paragraphs } from "@/lib/content";
import { Rich } from "@/components/Rich";
import { Photo } from "@/components/Photo";
import { PhotoCarousel, TestimonialsCarousel } from "@/components/Carousels";

export const metadata: Metadata = { alternates: { canonical: "/" } };

// Full width, but a retina laptop gets the 2048px version instead of 3840px (a third of the download,
// still sharp at that size). Phones and ordinary monitors are unaffected.
const HERO_SIZES = "(min-resolution: 2dppx) and (min-width: 1024px) 1024px, 100vw";

export default async function AboutPage() {
  const { about, contact } = await getContent();
  const base = process.env.SITE_URL ?? "https://asiajoannarob.com";
  // Tells Google who the site is about. Built only from what is already on the site, so no new wording.
  const person = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: about.name,
    jobTitle: about.subtitle,
    url: `${base}/`,
    image: about.portrait.url.startsWith("http") ? about.portrait.url : `${base}${encodeURI(about.portrait.url)}`,
    email: `mailto:${contact.email}`,
    sameAs: contact.links.map((l) => l.url),
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(person).replace(/</g, "\\u003c") }} />
      {about.photos.length > 0 && (
        <PhotoCarousel label="Photos from my productions" variant="hero">
          {about.photos.map((img, i) => (
            <Photo key={i} image={img} sizes={HERO_SIZES} ratio={[3, 2]} priority={i === 0} fallbackAlt={`Production photo ${i + 1}`} />
          ))}
        </PhotoCarousel>
      )}
      <section className={about.photos.length > 0 ? "hero hero--after-carousel" : "hero"}>
        <div className="hero__inner">
          <div className="hero__image-wrap fade-in">
            <Photo image={about.portrait} className="hero__image" ratio={[3, 4]} sizes="(max-width: 768px) 100vw, 540px" priority={about.photos.length === 0} fallbackAlt={about.name} />
          </div>
          <div className="hero__text fade-in stagger-2">
            <h1>{about.name}</h1>
            <p className="subtitle">{about.subtitle}</p>
            <div className="bio">
              {paragraphs(about.bio).map((p, i) => (
                <p key={i}>
                  <Rich text={p} />
                </p>
              ))}
            </div>
          </div>
        </div>
      </section>

      {about.testimonials.length > 0 && (
        <>
          <div className="divider"></div>
          <section className="testimonials">
            <TestimonialsCarousel>
              {about.testimonials.map((t, i) => (
                <div key={i}>
                  <p className="testimonial__quote">
                    “<Rich text={t.quote} />”
                  </p>
                  <p className="testimonial__attribution">{t.name}</p>
                  {t.role && (
                    <p className="testimonial__role">
                      <Rich text={t.role} />
                    </p>
                  )}
                </div>
              ))}
            </TestimonialsCarousel>
          </section>
        </>
      )}
    </>
  );
}
