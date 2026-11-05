import type { Metadata } from "next";
import { getContent, paragraphs } from "@/lib/content";
import { Rich } from "@/components/Rich";
import { Photo } from "@/components/Photo";
import { HeroCarousel, TestimonialsCarousel } from "@/components/Carousels";

export const metadata: Metadata = { alternates: { canonical: "/" } };

// The photos fill the screen. On a portrait phone that means a 3:2 photo about 1.5 screens wide, so
// ask for the 2048px version (sharp, a third of the 3840px one). Retina laptops also get 2048px.
const HERO_SIZES = "(orientation: portrait) 680px, (min-resolution: 2dppx) and (min-width: 1024px) 1024px, 100vw";

export default async function AboutPage() {
  const { about, contact } = await getContent();
  const hasPhotos = about.photos.length > 0;
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
      {hasPhotos && (
        <HeroCarousel
          label="Photos from my productions"
          nextId="about"
          caption={
            <>
              <h1 className="hero-photos__name">{about.name}</h1>
              <p className="hero-photos__role">{about.subtitle}</p>
            </>
          }
        >
          {about.photos.map((img, i) => (
            <Photo key={i} image={img} sizes={HERO_SIZES} ratio={[3, 2]} priority={i === 0} fallbackAlt={`Production photo ${i + 1}`} />
          ))}
        </HeroCarousel>
      )}
      <section className={hasPhotos ? "hero hero--after-photos" : "hero"} id="about">
        <div className="hero__inner">
          <div className="hero__image-wrap fade-in">
            <Photo image={about.portrait} className="hero__image" ratio={[3, 4]} sizes="(max-width: 768px) 100vw, 540px" priority={!hasPhotos} fallbackAlt={about.name} />
          </div>
          <div className="hero__text fade-in stagger-2">
            {/* With the photos at the top, her name and role are on the first photo instead. */}
            {!hasPhotos && (
              <>
                <h1>{about.name}</h1>
                <p className="subtitle">{about.subtitle}</p>
              </>
            )}
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
