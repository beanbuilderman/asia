import fs from "node:fs";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { sql } from "@/db";
import { migrate } from "@/db/migrate";
import { DEFAULT_CONTENT } from "@/content/defaults";
import { contentSchema, loadContentForEditor, mergeContent, paragraphs, resetSection, saveSection } from "./content";

beforeAll(async () => {
  await sql`DROP TABLE IF EXISTS site_content, password_resets, admin_users, schema_migrations CASCADE`;
  await migrate(sql);
});
beforeEach(async () => {
  await sql`DELETE FROM site_content`;
});
afterAll(async () => {
  await sql.end();
});

describe("original wording", () => {
  it("passes the same checks the dashboard applies when saving", () => {
    expect(contentSchema.safeParse(DEFAULT_CONTENT).success).toBe(true);
  });

  it("only points at photos that exist, with names that work on Linux servers", () => {
    const all = [
      DEFAULT_CONTENT.about.portrait,
      ...DEFAULT_CONTENT.about.photos,
      DEFAULT_CONTENT.contact.photo,
      ...DEFAULT_CONTENT.productions.items.flatMap((p) => p.images),
      ...DEFAULT_CONTENT.teaching.photos,
    ];
    for (const img of all) {
      expect(img.url, img.url).toBe(img.url.normalize("NFC"));
      expect(fs.readdirSync("public/images"), img.url).toContain(img.url.replace("/images/", ""));
    }
  });

  it("only points at CVs that exist", () => {
    for (const cv of DEFAULT_CONTENT.contact.cvs) {
      expect(fs.readdirSync("public/cv"), cv.url).toContain(cv.url.replace("/cv/", ""));
    }
  });
});

describe("pages saved before the 5 November 2026 changes", () => {
  it("keep their wording and get the new carousel, contact photo and CVs", () => {
    const { photos, ...oldAbout } = DEFAULT_CONTENT.about;
    const { photo, cvs, ...oldContact } = DEFAULT_CONTENT.contact;
    const merged = mergeContent([
      { key: "about", value: { ...oldAbout, bio: "Saved bio.", trainingHeading: "Training", training: [{ name: "Course", detail: "" }] } },
      { key: "contact", value: { ...oldContact, text: "Saved message." } },
    ]);
    expect(merged.about.bio).toBe("Saved bio.");
    expect(merged.about.photos).toEqual(photos);
    expect(merged.about).not.toHaveProperty("training");
    expect(merged.contact.text).toBe("Saved message.");
    expect(merged.contact.photo).toEqual(photo);
    expect(merged.contact.cvs).toEqual(cvs);
  });
});

describe("saving a page", () => {
  it("shows the saved version, and the original for pages never saved", async () => {
    await saveSection("contact", { ...DEFAULT_CONTENT.contact, email: "new@example.com" });
    const { content, saved } = await loadContentForEditor();
    expect(content.contact.email).toBe("new@example.com");
    expect(content.about).toEqual(DEFAULT_CONTENT.about);
    expect(Object.keys(saved)).toEqual(["contact"]);
  });

  it("refuses a photo address that is not one of ours", async () => {
    const productions = structuredClone(DEFAULT_CONTENT.productions);
    productions.items[0].images[0].url = "https://evil.example.com/x.jpg";
    await expect(saveSection("productions", productions)).rejects.toThrow(/did not upload properly/);
  });

  it("accepts a photo uploaded to Vercel Blob and to the local uploads folder", async () => {
    const productions = structuredClone(DEFAULT_CONTENT.productions);
    productions.items[0].images = [
      { url: "https://abc123.public.blob.vercel-storage.com/site/photo-1-ab12cd34.jpg", alt: "", focus: "center" },
      { url: "/uploads/photo-1-ab12cd34.jpg", alt: "", focus: "top" },
    ];
    await saveSection("productions", productions);
    expect((await loadContentForEditor()).content.productions.items[0].images).toHaveLength(2);
  });

  it("refuses a production without photos, and a link that is not https", async () => {
    const productions = structuredClone(DEFAULT_CONTENT.productions);
    productions.items[0].images = [];
    await expect(saveSection("productions", productions)).rejects.toThrow(/at least one photo/);
    await expect(saveSection("contact", { ...DEFAULT_CONTENT.contact, links: [{ label: "x", url: "javascript:alert(1)" }] })).rejects.toThrow();
  });

  it("drops the editor's hidden list keys instead of saving them", async () => {
    const testimonials = DEFAULT_CONTENT.about.testimonials.map((t, i) => ({ ...t, _k: `k${i}` }));
    await saveSection("about", { ...DEFAULT_CONTENT.about, testimonials });
    const [row] = await sql<{ value: { testimonials: object[] } }[]>`SELECT value FROM site_content WHERE key = 'about'`;
    expect(row.value.testimonials[0]).not.toHaveProperty("_k");
  });

  it("goes back to the original when the page is reset", async () => {
    await saveSection("teaching", { ...DEFAULT_CONTENT.teaching, heading: "Workshops" });
    await resetSection("teaching");
    expect((await loadContentForEditor()).content.teaching.heading).toBe("Education");
  });

  it("falls back to the original if a saved page no longer fits the rules", () => {
    const merged = mergeContent([{ key: "contact", value: { heading: "" } }, { key: "unknown", value: 1 }]);
    expect(merged.contact).toEqual(DEFAULT_CONTENT.contact);
  });
});

describe("CVs", () => {
  it("accepts an uploaded PDF and refuses a CV link to another site", async () => {
    const cvs = [
      { label: "Professional CV", url: "https://abc123.public.blob.vercel-storage.com/cv/asia-joanna-rob-cv-1-1-ab12cd34.pdf" },
      { label: "Academic CV", url: "/uploads/asia-joanna-rob-cv-2-1-ab12cd34.pdf" },
    ];
    await saveSection("contact", { ...DEFAULT_CONTENT.contact, cvs });
    expect((await loadContentForEditor()).content.contact.cvs).toEqual(cvs);
    await expect(saveSection("contact", { ...DEFAULT_CONTENT.contact, cvs: [{ label: "CV", url: "https://evil.example.com/cv.pdf" }] })).rejects.toThrow(/did not upload properly/);
    await expect(saveSection("contact", { ...DEFAULT_CONTENT.contact, cvs: [{ label: "CV", url: "/uploads/photo-1.jpg" }] })).rejects.toThrow();
  });

});

describe("paragraphs", () => {
  it("splits on blank lines and ignores extra spacing", () => {
    expect(paragraphs("One.\n\n\nTwo.\n  \nThree.")).toEqual(["One.", "Two.", "Three."]);
  });
});
