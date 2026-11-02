import type { Metadata } from "next";
import { getContent, paragraphs } from "@/lib/content";
import { Rich } from "@/components/Rich";
import { Photo } from "@/components/Photo";
import { PhotoCarousel } from "@/components/Carousels";

export async function generateMetadata(): Promise<Metadata> {
  const { teaching } = await getContent();
  return { title: teaching.heading, alternates: { canonical: "/teaching/" } };
}

export default async function TeachingPage() {
  const { teaching } = await getContent();
  const intro = paragraphs(teaching.intro);
  return (
    <>
      <header className="page-header">
        <h1 className="fade-in">{teaching.heading}</h1>
      </header>

      <PhotoCarousel>
        {teaching.photos.map((img, i) => (
          <Photo key={i} image={img} sizes="(max-width: 900px) 100vw, 900px" priority={i === 0} fallbackAlt={`Teaching photo ${i + 1}`} />
        ))}
      </PhotoCarousel>

      {intro.length > 0 && (
        <section className="section">
          <div className="teaching-content fade-in stagger-1">
            <div className="bio">
              {intro.map((p, i) => (
                <p key={i}>
                  <Rich text={p} />
                </p>
              ))}
            </div>
          </div>
        </section>
      )}

      {teaching.experience.length > 0 && (
        <>
          <div className="divider"></div>
          <section className="section">
            <h2 className="section__heading fade-in">{teaching.experienceHeading}</h2>
            <div className="teaching-list">
              {teaching.experience.map((e, i) => (
                <div className="teaching-item fade-in" key={i}>
                  <h3 className="teaching-item__title">
                    <Rich text={e.title} />
                  </h3>
                  {e.meta && <p className="teaching-item__meta">{e.meta}</p>}
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </>
  );
}
