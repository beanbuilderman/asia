/**
 * Asia's dashboard, at phone size. Runs after the read-only site checks because it changes the
 * (throwaway) e2e database: publishing posts, saving pages, uploading a CV.
 */
import { expect, test } from "@playwright/test";
import { collectErrors, signIn } from "./helpers";

test.describe.configure({ mode: "serial" });
// Next.js keeps the page you just left mounted but hidden (React Activity), so after a save that changes
// the address there can be two editors in the page. Role-based locators only match the visible one.

test("the template post about Asia waits as a draft she can preview, then publish", async ({ page, request }) => {
  const errors = collectErrors(page);
  await signIn(page);
  await page.getByRole("link", { name: /^Blog/ }).first().click();
  await expect(page).toHaveURL(/\/admin\/blog\/$/);
  const row = page.locator(".post-row", { hasText: "Hello, I’m Asia" });
  await expect(row.locator(".badge")).toHaveText("Draft");
  await expect(page.getByText("Nothing is published yet")).toBeVisible();

  // Preview shows the draft with the real site menu and styles, and says it is a draft.
  await page.goto("/preview/blog/hello-im-asia/");
  await expect(page.getByRole("status")).toContainText("Preview of a draft");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Hello, I’m Asia");
  await expect(page.getByRole("heading", { level: 2 })).toHaveText(["Three theatre cultures", "The work I make", "The classroom and the rehearsal room", "What comes next"]);
  await expect(page.locator(".post-body em", { hasText: "Hasmukh" })).toBeVisible();
  expect((await request.get("/blog/hello-im-asia/", { maxRedirects: 0 })).status()).toBe(404);

  // Publish it.
  await page.goto("/admin/blog/hello-im-asia/");
  await page.getByRole("checkbox", { name: /Publish this post/ }).check();
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.locator(".editor-savebar .flash.ok").filter({ visible: true })).toContainText("The post is live");

  await page.goto("/");
  await page.getByRole("button", { name: "Open menu" }).click();
  await expect(page.locator("#navLinks a")).toHaveText(["About", "Directing", "Education", "Blog", "Contact"]);
  await page.locator("#navLinks a", { hasText: "Blog" }).click();
  await expect(page).toHaveURL(/\/blog\/$/);
  await expect(page.locator(".post-card__title")).toHaveText(["Hello, I’m Asia"]);
  await page.locator(".post-card").first().click();
  await expect(page).toHaveURL(/\/blog\/hello-im-asia\/$/);
  await expect(page.locator(".post-intro")).toContainText("pronounced Asha");
  expect(await (await request.get("/sitemap.xml")).text()).toContain("/blog/hello-im-asia/");
  expect(errors).toEqual([]);
});

test("Asia writes a new post: it starts as a draft, goes live when published, and deleting it takes it down", async ({ page, request }) => {
  await signIn(page);
  await page.goto("/admin/blog/new/");
  // A mistake is explained in words she can act on.
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.locator(".flash.bad")).toContainText("Web address");

  await page.getByLabel("Heading", { exact: true }).fill("Rehearsal notes: week one at *Birkbeck*");
  await expect(page.getByLabel("Web address")).toHaveValue("rehearsal-notes-week-one-at-birkbeck");
  await page.getByLabel("Introduction").fill("What I learned in the first week.");
  await page.locator("#s0-text").fill("First paragraph.\n\nSecond paragraph.");
  await page.locator("#s0-list").fill("- One\n- Two");
  await page.getByRole("checkbox", { name: /Hello, I’m Asia/ }).check(); // link the first post at the bottom
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/blog\/rehearsal-notes-week-one-at-birkbeck\/\?saved=1$/);
  expect((await request.get("/blog/rehearsal-notes-week-one-at-birkbeck/", { maxRedirects: 0 })).status()).toBe(404);
  // A brand-new draft can be previewed (its address was not known when the site was built).
  const preview = await page.context().newPage();
  await preview.goto("/preview/blog/rehearsal-notes-week-one-at-birkbeck/");
  await expect(preview.getByRole("heading", { level: 1 })).toHaveText("Rehearsal notes: week one at Birkbeck");
  await preview.close();

  await page.getByRole("checkbox", { name: /Publish this post/ }).check();
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.locator(".editor-savebar .flash.ok").filter({ visible: true })).toContainText("The post is live");

  await page.goto("/blog/rehearsal-notes-week-one-at-birkbeck/");
  await expect(page.locator(".post-title em")).toHaveText("Birkbeck");
  await expect(page.locator(".post-body p")).toHaveText(["First paragraph.", "Second paragraph."]);
  await expect(page.locator(".post-body li")).toHaveText(["One", "Two"]);
  await expect(page.locator(".post-related .post-card__title")).toHaveText(["Hello, I’m Asia"]);
  await expect(page).toHaveTitle(/Rehearsal notes: week one at Birkbeck/);
  // Newest first on the blog list.
  await page.goto("/blog/");
  await expect(page.locator(".post-card__title")).toHaveText(["Rehearsal notes: week one at Birkbeck", "Hello, I’m Asia"]);

  // Reorder from the list.
  await page.goto("/admin/blog/");
  await page.getByRole("button", { name: 'Move "Rehearsal notes: week one at Birkbeck" down' }).click();
  await expect(page.locator(".post-row b").first()).toHaveText("Hello, I’m Asia");

  // Delete.
  await page.goto("/admin/blog/rehearsal-notes-week-one-at-birkbeck/");
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Delete this post" }).click();
  await expect(page).toHaveURL(/\/admin\/blog\/\?deleted=1$/);
  expect((await request.get("/blog/rehearsal-notes-week-one-at-birkbeck/", { maxRedirects: 0 })).status()).toBe(404);
});

test("Asia chooses which part of a home photo stays in view on phones", async ({ page }) => {
  await signIn(page);
  await page.goto("/admin/about/");
  const firstPhoto = page.locator(".photo-tile").first();
  await firstPhoto.getByRole("button", { name: "Details" }).click();
  await firstPhoto.getByLabel("When the photo is cropped, keep this part in view").selectOption("left");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.locator(".editor-savebar .flash.ok").filter({ visible: true })).toContainText("Saved");
  await page.goto("/");
  await expect(page.locator(".hero-photos__slide").first().locator("img")).toHaveClass(/img-left/);
});

test("Asia replaces a CV by uploading a new PDF", async ({ page, request }) => {
  await signIn(page);
  await page.goto("/admin/contact/");
  await page.locator('input[type=file][accept*="pdf"]').first().setInputFiles("public/cv/Asia-Joanna-Rob-Academic-CV.pdf");
  await expect(page.getByText("You have unsaved changes.")).toBeVisible();
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.locator(".editor-savebar .flash.ok").filter({ visible: true })).toContainText("Saved");
  await page.goto("/contact/");
  const href = (await page.locator(".cv-link").first().getAttribute("href"))!;
  expect(href).toMatch(/^\/uploads\/asia-joanna-rob-cv-1-.*\.pdf$/);
  const res = await request.get(href);
  expect(res.headers()["content-type"]).toContain("application/pdf");
});
