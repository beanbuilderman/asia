import type { Metadata } from "next";
import { getContent, paragraphs } from "@/lib/content";
import { Rich } from "@/components/Rich";
import { Photo } from "@/components/Photo";
import { CardCarousel } from "@/components/Carousels";

export async function generateMetadata(): Promise<Metadata> {
  const { productions } = await getContent();
  return { title: productions.heading, alternates: { canonical: "/productions/" } };
}

const SIZES = "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 380px";
const STAGGER = ["", " stagger-1", " stagger-2", " stagger-3"];

export default async function ProductionsPage() {
  const { productions } = await getContent();
  return (
    <>
      <header className="page-header">
        <h1 className="fade-in">{productions.heading}</h1>
      </header>
      <section className="section section--wide">
        <div className="productions-grid">
          {productions.items.map((p, i) => (
            <div className={`production-card fade-in${STAGGER[Math.min(i, 3)]}`} key={i}>
              {p.images.length === 1 ? (
                <Photo image={p.images[0]} className="production-card__image" sizes={SIZES} ratio={[4, 3]} fallbackAlt={p.title} />
              ) : (
                <CardCarousel label={`${p.title} photos`}>
                  {p.images.map((img, j) => (
                    <Photo key={j} image={img} sizes={SIZES} ratio={[4, 3]} fallbackAlt={`${p.title}, photo ${j + 1}`} />
                  ))}
                </CardCarousel>
              )}
              <div className="production-card__info">
                <h3 className="production-card__title">{p.title}</h3>
                {p.meta && <p className="production-card__meta">{p.meta}</p>}
                {paragraphs(p.description).map((d, j) => (
                  <p className="production-card__desc" key={j}>
                    <Rich text={d} />
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
