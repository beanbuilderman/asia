import fs from "node:fs";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { sql } from "@/db";
import { migrate } from "@/db/migrate";
import { posts as DEFAULT_POSTS, type Post } from "@/content/posts";
import { blogPathExists, deletePost, loadPostsForEditor, movePost, parsePosts, plain, postsSchema, savePost, slugify, summaryOf } from "./posts";

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

const post = (slug: string, extra: Partial<Post> = {}): Post => ({
  slug,
  published: true,
  date: "",
  h1: `Post ${slug}`,
  intro: "An introduction.",
  sections: [{ h2: "", p: ["Some text."] }],
  related: [],
  title: "",
  description: "",
  summary: "",
  ...extra,
});

describe("the template post", () => {
  it("passes the same checks as the dashboard, and starts as an unpublished draft", () => {
    expect(postsSchema.safeParse(DEFAULT_POSTS).success).toBe(true);
    expect(DEFAULT_POSTS.map((p) => p.published)).toEqual([false]);
  });

  it("uses no em dashes and only photos that exist", () => {
    expect(JSON.stringify(DEFAULT_POSTS)).not.toContain("—");
    for (const p of DEFAULT_POSTS) if (p.image) expect(fs.readdirSync("public/images")).toContain(p.image.url.replace("/images/", ""));
  });

  it("keeps the blog hidden until a post is published", async () => {
    expect(await blogPathExists(null)).toBe(false);
    expect(await blogPathExists("hello-im-asia")).toBe(false);
  });
});

describe("saving posts", () => {
  it("publishes a post, then hides it again as a draft", async () => {
    await savePost("hello-im-asia", { ...DEFAULT_POSTS[0], published: true });
    expect(await blogPathExists(null)).toBe(true);
    expect(await blogPathExists("hello-im-asia")).toBe(true);
    await savePost("hello-im-asia", { ...DEFAULT_POSTS[0], published: false });
    expect(await blogPathExists("hello-im-asia")).toBe(false);
  });

  it("puts a new post at the top and refuses a web address that is taken", async () => {
    await savePost(null, post("second"));
    expect((await loadPostsForEditor()).map((p) => p.slug)).toEqual(["second", "hello-im-asia"]);
    await expect(savePost(null, post("second"))).rejects.toThrow(/already uses the web address/);
  });

  it("keeps links from other posts when a web address changes, and drops them when a post is deleted", async () => {
    await savePost(null, post("first"));
    await savePost(null, post("linker", { related: ["first"] }));
    await savePost("first", post("first-renamed"));
    expect((await loadPostsForEditor()).find((p) => p.slug === "linker")?.related).toEqual(["first-renamed"]);
    await deletePost("first-renamed");
    expect((await loadPostsForEditor()).find((p) => p.slug === "linker")?.related).toEqual([]);
  });

  it("moves a post up and down the list", async () => {
    await savePost(null, post("newest"));
    await movePost("newest", 1);
    expect((await loadPostsForEditor()).map((p) => p.slug)).toEqual(["hello-im-asia", "newest"]);
  });

  it("refuses bad web addresses, empty sections and photos from other sites", async () => {
    await expect(savePost(null, post("Not OK!"))).rejects.toThrow(/lowercase letters/);
    await expect(savePost(null, post("empty", { sections: [{ h2: "Only a heading" }] }))).rejects.toThrow(/needs some text/);
    await expect(savePost(null, post("photo", { image: { url: "https://evil.example.com/x.jpg", alt: "", focus: "center" } }))).rejects.toThrow(/did not upload properly/);
  });

  it("falls back to the template if the saved list no longer fits the rules", () => {
    expect(parsePosts([{ slug: "x" }]).map((p) => p.slug)).toEqual(["hello-im-asia"]);
  });
});

describe("text helpers", () => {
  it("makes web addresses from headings, including Polish letters", () => {
    expect(slugify("My first week at Birkbeck!")).toBe("my-first-week-at-birkbeck");
    expect(slugify("Żółć i Łódź")).toBe("zolc-i-lodz");
  });

  it("drops italics markers for Google, and uses the introduction when there is no summary", () => {
    expect(plain("Directing *Noah* at Arches Lane")).toBe("Directing Noah at Arches Lane");
    expect(summaryOf(post("x", { intro: "Short intro with *italics*." }))).toBe("Short intro with italics.");
    expect(summaryOf(post("x", { summary: "Her summary." }))).toBe("Her summary.");
    expect(summaryOf(post("x", { intro: "word ".repeat(80) })).length).toBeLessThanOrEqual(200);
  });
});
