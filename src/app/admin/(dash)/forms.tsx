"use client";

import type { SiteContent } from "@/lib/content";
import { List, Panel, PhotoField, PhotoList, SectionEditor, Text } from "./editor";

type Props<K extends keyof SiteContent> = { initial: SiteContent[K]; defaults: SiteContent[K] };

const ITALICS = "Put *asterisks* around words to show them in italics, for example *Richard II*.";
const PARAGRAPHS = "Leave an empty line between paragraphs.";

export function AboutForm({ initial, defaults }: Props<"about">) {
  return (
    <SectionEditor sectionKey="about" initial={initial} defaults={defaults} viewHref="/">
      <Panel title="Top of the page">
        <PhotoField path={["portrait"]} label="Your photo" />
        <Text path={["name"]} label="Your name (the big heading)" />
        <Text path={["subtitle"]} label="Line under your name" />
        <Text path={["bio"]} label="Your introduction" area hint={`${PARAGRAPHS} ${ITALICS}`} />
      </Panel>

      <Panel title="Training">
        <Text path={["trainingHeading"]} label="Heading" />
        <List
          path={["training"]}
          label="Training"
          max={40}
          addLabel="Add training"
          blank={() => ({ name: "", detail: "" })}
          render={(i) => (
            <div className="form-grid two">
              <Text path={["training", i, "name"]} label="Course or teacher" hint={ITALICS} />
              <Text path={["training", i, "detail"]} label="Place and date" />
            </div>
          )}
        />
      </Panel>

      <Panel title="Testimonials" intro="These rotate under your training list. Only add quotes the person has agreed you can use.">
        <List
          path={["testimonials"]}
          label="Testimonial"
          max={12}
          addLabel="Add a testimonial"
          blank={() => ({ quote: "", name: "", role: "" })}
          summary={(t) => String(t.name ?? "")}
          render={(i) => (
            <>
              <Text path={["testimonials", i, "quote"]} label="What they said (without quotation marks)" area hint={ITALICS} />
              <Text path={["testimonials", i, "name"]} label="Their name" />
              <Text path={["testimonials", i, "role"]} label="Who they are" hint={ITALICS} />
            </>
          )}
        />
      </Panel>
    </SectionEditor>
  );
}

export function ProductionsForm({ initial, defaults }: Props<"productions">) {
  return (
    <SectionEditor sectionKey="productions" initial={initial} defaults={defaults} viewHref="/productions/">
      <Panel title="Page heading">
        <Text path={["heading"]} label="Heading" />
      </Panel>
      <Panel
        title="Productions"
        intro="They show on the website in this order. Tap a production to open it. A new production goes at the top: add its photos, then press Save."
      >
        <List
          path={["items"]}
          label="Production"
          max={60}
          addAt="start"
          addLabel="Add a production"
          blank={() => ({ title: "", meta: "", description: "", images: [] })}
          summary={(p) => {
            const n = Array.isArray(p.images) ? p.images.length : 0;
            return `${String(p.title || "New production")} · ${n} photo${n === 1 ? "" : "s"}`;
          }}
          render={(i) => (
            <>
              <Text path={["items", i, "title"]} label="Title" />
              <Text path={["items", i, "meta"]} label="Your role, venue and dates" hint="Shown in small capitals, e.g. Assistant Director · Arcola Theatre · 11–14 Feb 2026" />
              <Text path={["items", i, "description"]} label="Description" area hint={`${PARAGRAPHS} ${ITALICS}`} />
              <b className="small">Photos</b>
              <p className="hint" style={{ marginTop: 0 }}>
                One photo shows on its own. Two or more become a carousel people can click through.
              </p>
              <PhotoList path={["items", i, "images"]} max={30} min={1} />
            </>
          )}
        />
      </Panel>
    </SectionEditor>
  );
}

export function TeachingForm({ initial, defaults }: Props<"teaching">) {
  return (
    <SectionEditor sectionKey="teaching" initial={initial} defaults={defaults} viewHref="/teaching/">
      <Panel title="Top of the page">
        <Text path={["heading"]} label="Heading" />
      </Panel>
      <Panel title="Photo carousel" intro="These rotate at the top of the Teaching page every 5 seconds.">
        <PhotoList path={["photos"]} max={30} />
      </Panel>
      <Panel title="Introduction">
        <Text path={["intro"]} label="Text" area hint={`${PARAGRAPHS} ${ITALICS}`} />
      </Panel>
      <Panel title="Experience">
        <Text path={["experienceHeading"]} label="Heading" />
        <List
          path={["experience"]}
          label="Experience"
          max={40}
          addLabel="Add experience"
          blank={() => ({ title: "", meta: "" })}
          render={(i) => (
            <div className="form-grid two">
              <Text path={["experience", i, "title"]} label="Where" />
              <Text path={["experience", i, "meta"]} label="Role and dates" />
            </div>
          )}
        />
      </Panel>
    </SectionEditor>
  );
}

export function ContactForm({ initial, defaults }: Props<"contact">) {
  return (
    <SectionEditor sectionKey="contact" initial={initial} defaults={defaults} viewHref="/contact/">
      <Panel title="Contact page">
        <Text path={["heading"]} label="Heading" />
        <Text path={["text"]} label="Message" area />
        <Text path={["email"]} label="Email address shown on the page" />
      </Panel>
      <Panel title="Links" intro="For example Instagram or LinkedIn.">
        <List
          path={["links"]}
          label="Link"
          max={8}
          addLabel="Add a link"
          blank={() => ({ label: "", url: "https://" })}
          render={(i) => (
            <div className="form-grid two">
              <Text path={["links", i, "label"]} label="Name shown" />
              <Text path={["links", i, "url"]} label="Link (starting with https://)" />
            </div>
          )}
        />
      </Panel>
    </SectionEditor>
  );
}

export function SiteForm({ initial, defaults }: Props<"site">) {
  return (
    <SectionEditor sectionKey="site" initial={initial} defaults={defaults} viewHref="/">
      <Panel title="Every page">
        <Text path={["name"]} label="Name at the top left of every page" />
        <Text path={["footer"]} label="Line at the bottom of every page" />
      </Panel>
      <Panel title="How the site appears on Google">
        <Text path={["seoTitle"]} label="Title" hint="Ideally under 60 characters, so Google shows it in full." />
        <Text path={["seoDescription"]} label="Description (optional)" area hint="Google shows this under your title. Ideally under 160 characters. If empty, Google picks a sentence from the page." />
      </Panel>
    </SectionEditor>
  );
}
