/**
 * Website wording and photos that Asia edits in her dashboard.
 * Each page is one section, saved as one row in site_content. A section she has never saved
 * shows the original wording from src/content/defaults.ts.
 */
import { z } from "zod";
import { cacheLife, cacheTag, updateTag } from "next/cache";
import { sql } from "@/db";
import { DEFAULT_CONTENT } from "@/content/defaults";
import { CONTACT_PHOTO, CVS, HOME_PHOTOS } from "@/content/added-defaults";

const short = (max = 120) => z.string().trim().min(1, "This cannot be empty").max(max, `Keep this under ${max} characters`);
const long = (max = 1200) => z.string().trim().min(1, "This cannot be empty").max(max, `Keep this under ${max} characters`);
const optional = (max: number) => z.string().trim().max(max, `Keep this under ${max} characters`);

/** Photos from the original site, uploads stored locally in development, or uploads in Vercel Blob. */
export const IMAGE_URL = /^(\/images\/[^/?#]+|\/uploads\/[\w.-]+|https:\/\/[\w-]+\.public\.blob\.vercel-storage\.com\/[\w./-]+)$/;

export const image = z.object({
  url: z.string().regex(IMAGE_URL, "One of the photos did not upload properly. Remove it and add it again."),
  alt: optional(160),
  /** Which part of the photo stays in view when it is cropped (phones crop wide photos the most). */
  focus: z.enum(["center", "top", "left", "right"]).default("center"),
});
export type SiteImage = z.infer<typeof image>;

/** PDFs: the CVs shipped with the site, uploads stored locally in development, or uploads in Vercel Blob. */
export const PDF_URL = /^(\/cv\/[\w.-]+\.pdf|\/uploads\/[\w.-]+\.pdf|https:\/\/[\w-]+\.public\.blob\.vercel-storage\.com\/[\w./-]+\.pdf)$/;

const httpsUrl = z
  .string()
  .trim()
  .url("Enter a full link starting with https://")
  .refine((u) => u.startsWith("https://"), "Enter a full link starting with https://");

export const contentSchema = z.object({
  site: z.object({
    name: short(60),
    seoTitle: short(80),
    seoDescription: optional(220),
    footer: short(160),
  }),
  about: z.object({
    name: short(80),
    subtitle: short(80),
    /** The big rotating photos at the top of the home page. Older saved versions without them get the originals. */
    photos: z.array(image).max(30, "The top of the page can have up to 30 photos").default(() => structuredClone(HOME_PHOTOS)),
    portrait: image,
    bio: long(5000),
    testimonials: z.array(z.object({ quote: long(1200), name: short(80), role: optional(200) })).max(12),
  }),
  productions: z.object({
    heading: short(60),
    items: z
      .array(
        z.object({
          title: short(120),
          meta: optional(240),
          description: optional(1500),
          images: z.array(image).min(1, "Every production needs at least one photo").max(30, "A production can have up to 30 photos"),
        }),
      )
      .max(60),
  }),
  teaching: z.object({
    heading: short(60),
    photos: z.array(image).max(30, "The teaching page can have up to 30 photos"),
    intro: optional(5000),
    experienceHeading: short(60),
    experience: z.array(z.object({ title: short(160), meta: optional(200) })).max(40),
  }),
  contact: z.object({
    heading: short(60),
    text: optional(800),
    email: z.string().trim().email("Enter a valid email address"),
    photo: image.default(() => structuredClone(CONTACT_PHOTO)),
    cvs: z
      .array(z.object({ label: short(40), url: z.string().regex(PDF_URL, "One of the CVs did not upload properly. Upload it again.") }))
      .max(4)
      .default(() => structuredClone(CVS)),
    links: z.array(z.object({ label: short(40), url: httpsUrl })).max(8),
  }),
});

export type SiteContent = z.infer<typeof contentSchema>;
export type SectionKey = keyof SiteContent;
export const SECTION_KEYS = Object.keys(contentSchema.shape) as SectionKey[];

export const CONTENT_TAG = "content";

export function isSectionKey(k: unknown): k is SectionKey {
  return typeof k === "string" && (SECTION_KEYS as string[]).includes(k);
}

/** Saved sections replace the default section as a whole; unknown or invalid sections are ignored. */
export function mergeContent(rows: { key: string; value: unknown }[]): SiteContent {
  const out: SiteContent = structuredClone(DEFAULT_CONTENT);
  for (const { key, value } of rows) {
    if (!isSectionKey(key)) continue;
    const parsed = contentSchema.shape[key].safeParse(value);
    if (parsed.success) (out as Record<string, unknown>)[key] = parsed.data;
    else console.error(`[content] saved "${key}" no longer matches the schema, showing the original`, parsed.error.issues[0]);
  }
  return out;
}

async function readRows() {
  return sql<{ key: string; value: unknown }[]>`SELECT key, value FROM site_content`;
}

/** Cached: the public pages stay instant. Saving in the dashboard refreshes it. */
export async function getContent(): Promise<SiteContent> {
  "use cache";
  cacheTag(CONTENT_TAG);
  cacheLife("days");
  return mergeContent(await readRows());
}

/** Uncached read for the dashboard. */
export async function loadContentForEditor(): Promise<{ content: SiteContent; saved: Partial<Record<SectionKey, Date>> }> {
  const rows = await sql<{ key: string; value: unknown; updatedAt: Date }[]>`SELECT key, value, updated_at FROM site_content`;
  const saved: Partial<Record<SectionKey, Date>> = {};
  for (const r of rows) if (isSectionKey(r.key)) saved[r.key] = r.updatedAt;
  return { content: mergeContent(rows), saved };
}

export async function saveSection<K extends SectionKey>(key: K, input: unknown): Promise<SiteContent[K]> {
  const value = contentSchema.shape[key].parse(input) as SiteContent[K];
  await sql`
    INSERT INTO site_content (key, value) VALUES (${key}, ${sql.json(value as never)})
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`;
  refreshContent();
  return value;
}

/** Forget the saved version, so the page shows the original wording again. */
export async function resetSection(key: SectionKey): Promise<void> {
  await sql`DELETE FROM site_content WHERE key = ${key}`;
  refreshContent();
}

function refreshContent() {
  try {
    updateTag(CONTENT_TAG);
  } catch {
    // Outside a Server Action (tests, scripts): nothing cached to refresh.
  }
}

/** Splits a long text into paragraphs on blank lines. */
export function paragraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}
