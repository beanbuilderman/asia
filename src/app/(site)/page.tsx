import { getContent, paragraphs } from "@/lib/content";
import { Rich } from "@/components/Rich";
import { Photo } from "@/components/Photo";
import { TestimonialsCarousel } from "@/components/Carousels";

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
      <section className="hero">
        <div className="hero__inner">
          <div className="hero__image-wrap fade-in">
            <Photo image={about.portrait} className="hero__image" ratio={[3, 4]} sizes="(max-width: 768px) 100vw, 540px" priority fallbackAlt={about.name} />
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

      {about.training.length > 0 && (
        <>
          <div className="divider"></div>
          <section className="section">
            <h2 className="section__heading fade-in">{about.trainingHeading}</h2>
            <div className="training-list fade-in stagger-1">
              {about.training.map((t, i) => (
                <div className="training-item" key={i}>
                  <span className="training-item__name">
                    <Rich text={t.name} />
                  </span>
                  {t.detail && <span className="training-item__detail">{t.detail}</span>}
                </div>
              ))}
            </div>
          </section>
        </>
      )}

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
