/**
 * Blog posts (/blog/<slug>) that Asia writes, edits, publishes and deletes in her dashboard.
 * Built the same way as the PT with V guides: the whole list is one row in site_content (key 'posts').
 * Until she saves, the drafts in src/content/posts.ts are used.
 */
import { z } from "zod";
import { cacheLife, cacheTag, updateTag } from "next/cache";
import { sql } from "@/db";
import { posts as DEFAULT_POSTS, type Post } from "@/content/posts";
import { CONTENT_TAG, image } from "./content";

const text = (max: number) => z.string().trim().min(1, "This cannot be empty").max(max, `Keep this under ${max} characters`);
const optional = (max: number) => z.string().trim().max(max, `Keep this under ${max} characters`);

export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const postSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(3, "The web address needs at least 3 characters")
    .max(90, "Keep the web address under 90 characters")
    .regex(SLUG_RE, "The web address can only use lowercase letters, numbers and dashes, e.g. my-first-week-at-birkbeck"),
  published: z.boolean(),
  date: optional(40),
  h1: text(120),
  intro: text(1200),
  image: image.optional(),
  sections: z
    .array(
      z
        .object({
          h2: optional(120),
          p: z.array(text(3000)).max(20).optional(),
          list: z.array(text(400)).max(20).optional(),
          image: image.optional(),
        })
        .refine((s) => (s.p?.length ?? 0) + (s.list?.length ?? 0) > 0 || s.image, "Each section needs some text, bullet points or a photo"),
    )
    .min(1, "Add at least one section")
    .max(20),
  quote: z.object({ quote: text(600), name: text(80) }).optional(),
  related: z.array(z.string()).max(3),
  title: optional(90),
  description: optional(240),
  summary: optional(240),
});

export const postsSchema = z.array(postSchema).max(200);

/** Turns a heading into a web address: "My first week at Birkbeck!" -> "my-first-week-at-birkbeck". */
export function slugify(s: string): string {
  return s
    .replace(/ł/g, "l")
    .replace(/Ł/g, "L")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90)
    .replace(/-+$/, "");
}

/** Removes *asterisks* (the italics marker) for places that show plain text, like Google and browser tabs. */
export const plain = (s: string) => s.replace(/\*([^*]+)\*/g, "$1");

/** Card text for the list: her summary, or the start of the introduction. */
export function summaryOf(p: Post): string {
  if (p.summary) return p.summary;
  const intro = plain(p.intro);
  return intro.length <= 200 ? intro : `${intro.slice(0, 197).replace(/\s+\S*$/, "")}…`;
}

/** Saved list if it is valid, else the drafts. Links to posts that are gone are dropped. */
export function parsePosts(saved: unknown): Post[] {
  const parsed = postsSchema.safeParse(saved);
  if (saved !== null && !parsed.success) console.error("[posts] saved list no longer matches the rules, showing the originals", parsed.error.issues[0]);
  const list = (parsed.success ? parsed.data : structuredClone(DEFAULT_POSTS)) as Post[];
  const slugs = new Set(list.map((p) => p.slug));
  return list.map((p) => ({ ...p, related: p.related.filter((r) => r !== p.slug && slugs.has(r)) }));
}

async function readRow(): Promise<unknown> {
  const [row] = await sql<{ value: unknown }[]>`SELECT value FROM site_content WHERE key = 'posts'`;
  return row?.value ?? null;
}

/** Every post, drafts included. Cached for the public pages; saving refreshes it. */
async function getAllPosts(): Promise<Post[]> {
  "use cache";
  cacheTag(CONTENT_TAG);
  cacheLife("days");
  return parsePosts(await readRow());
}

/** What the public site shows: published posts only, in Asia's order. */
export async function getPublishedPosts(): Promise<Post[]> {
  const all = await getAllPosts();
  const live = all.filter((p) => p.published);
  const liveSlugs = new Set(live.map((p) => p.slug));
  return live.map((p) => ({ ...p, related: p.related.filter((r) => liveSlugs.has(r)) }));
}

export async function getPublishedPost(slug: string): Promise<Post | undefined> {
  return (await getPublishedPosts()).find((p) => p.slug === slug);
}

/** Uncached, for the dashboard. */
export async function loadPostsForEditor(): Promise<Post[]> {
  return parsePosts(await readRow());
}

async function writeAll(list: Post[]) {
  const valid = postsSchema.parse(list);
  await sql`
    INSERT INTO site_content (key, value) VALUES ('posts', ${sql.json(valid as never)})
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`;
  try {
    updateTag(CONTENT_TAG);
  } catch {
    // Outside a Server Action (tests, scripts): nothing cached to refresh.
  }
}

export class PostError extends Error {}

/** Adds a new post (originalSlug null, at the top of the list) or replaces one. Returns the saved post. */
export async function savePost(originalSlug: string | null, input: unknown): Promise<Post> {
  const post = postSchema.parse(input) as Post;
  const list = await loadPostsForEditor();
  const clash = list.find((p) => p.slug === post.slug && p.slug !== originalSlug);
  if (clash) throw new PostError(`Another post already uses the web address /blog/${post.slug}. Choose a different one.`);
  const i = originalSlug === null ? -1 : list.findIndex((p) => p.slug === originalSlug);
  if (originalSlug !== null && i === -1) throw new PostError("That post no longer exists. Reload the page.");
  const next = [...list];
  if (i === -1) next.unshift(post);
  else next[i] = post;
  // Keep "more posts" links working if the web address changed.
  if (originalSlug && originalSlug !== post.slug) {
    for (const p of next) p.related = p.related.map((r) => (r === originalSlug ? post.slug : r));
  }
  await writeAll(next);
  return post;
}

export async function deletePost(slug: string): Promise<void> {
  const list = await loadPostsForEditor();
  if (!list.some((p) => p.slug === slug)) return;
  await writeAll(list.filter((p) => p.slug !== slug).map((p) => ({ ...p, related: p.related.filter((r) => r !== slug) })));
}

/** Moves a post up or down the list (the order of the blog page). */
export async function movePost(slug: string, by: -1 | 1): Promise<void> {
  const list = await loadPostsForEditor();
  const i = list.findIndex((p) => p.slug === slug);
  const j = i + by;
  if (i === -1 || j < 0 || j >= list.length) return;
  [list[i], list[j]] = [list[j], list[i]];
  await writeAll(list);
}

export const defaultPost = (slug: string) => DEFAULT_POSTS.find((p) => p.slug === slug);

/** Starting point for a new post. */
export function blankPost(): Post {
  return {
    slug: "",
    published: false,
    date: new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "Europe/London" }),
    h1: "",
    intro: "",
    sections: [{ h2: "", p: [""] }],
    related: [],
    title: "",
    description: "",
    summary: "",
  };
}

/**
 * For the proxy: should /blog/<slug> (or /blog/ itself, slug null) answer? Checked fresh, so a save,
 * publish or delete applies at once. Drafts answer 404 like missing posts.
 */
export async function blogPathExists(slug: string | null): Promise<boolean> {
  const live = parsePosts(await readRow()).filter((p) => p.published);
  return slug === null ? live.length > 0 : live.some((p) => p.slug === slug);
}
