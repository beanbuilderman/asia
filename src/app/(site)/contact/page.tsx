import type { Metadata } from "next";
import { getContent } from "@/lib/content";

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
        <div className="contact-content">
          {contact.text && <p className="contact-text">{contact.text}</p>}
          <a href={`mailto:${contact.email}`} className="email-link">
            {contact.email}
          </a>
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
      </section>
    </>
  );
}
