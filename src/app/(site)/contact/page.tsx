import type { Metadata } from "next";
import { getContent } from "@/lib/content";
import { Photo } from "@/components/Photo";

export async function generateMetadata(): Promise<Metadata> {
  const { contact } = await getContent();
  return { title: contact.heading, alternates: { canonical: "/contact/" } };
}

export default async function ContactPage() {
  const { contact } = await getContent();
  return (
    <>
      <header className="page-header">
        <h1>{contact.heading}</h1>
      </header>
      <section className="section">
        <div className="contact-layout">
          <div className="contact-photo fade-in">
            <Photo image={contact.photo} className="contact-photo__image" ratio={[4, 5]} sizes="(max-width: 768px) 100vw, 420px" priority fallbackAlt="Asia Joanna Rob" />
          </div>
          <div className="contact-content fade-in stagger-1">
            {contact.text && <p className="contact-text">{contact.text}</p>}
            <a href={`mailto:${contact.email}`} className="email-link">
              {contact.email}
            </a>
            {contact.cvs.length > 0 && (
              <div className="contact-cvs">
                {contact.cvs.map((cv, i) => (
                  <a key={i} href={cv.url} target="_blank" rel="noopener" className="cv-link">
                    {cv.label}
                    <span className="cv-link__type"> (PDF)</span>
                  </a>
                ))}
              </div>
            )}
            {contact.links.length > 0 && (
              <div className="contact-socials">
                {contact.links.map((l, i) => (
                  <a key={i} href={l.url} target="_blank" rel="noopener noreferrer">
                    {l.label}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
