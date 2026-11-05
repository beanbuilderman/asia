/**
 * What visitors see, checked on a phone (site-phone) and on a computer (site-desktop).
 * Read-only: the dashboard tests that change things run afterwards (see playwright.config.ts).
 */
import { expect, test, type Page } from "@playwright/test";
import { collectErrors, expectNoHorizontalScroll, swipe } from "./helpers";

const isPhone = () => test.info().project.name === "site-phone";
const activeSlide = (page: Page) => page.locator(".hero-photos__seg[aria-current='true']");

test("home opens on full-screen show photos with Asia's name over them, then About and testimonials", async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto("/");
  const hero = page.locator(".hero-photos");
  await expect(hero).toBeVisible();
  const box = (await hero.boundingBox())!;
  const viewport = page.viewportSize()!;
  expect(box.y).toBe(0);
  expect(box.height).toBeGreaterThanOrEqual(viewport.height - 1);
  await expect(page.getByRole("heading", { level: 1, name: "Asia Joanna Rob" })).toBeVisible();
  await expect(page.locator(".hero-photos__role")).toHaveText("Theatre Director");
  // One h1 on the page: the name is on the photo, not repeated in About.
  await expect(page.locator("h1")).toHaveCount(1);
  await expect(page.locator("#about .bio")).toContainText("pronounced Asha");
  await expect(page.locator(".testimonials")).toContainText("Ece Ozdemiroglu");
  // Training was removed at Asia's request.
  await expect(page.getByText("Rinova Dance Leadership")).toHaveCount(0);
  await expectNoHorizontalScroll(page);
  expect(errors).toEqual([]);
});

test("the home photos load one at a time, not all at once", async ({ page }) => {
  await page.goto("/", { waitUntil: "load" });
  await page.waitForTimeout(500);
  // The photo on screen, plus the next one once the page has loaded. Not all ten.
  expect(await page.locator(".hero-photos__slide img").count()).toBeLessThanOrEqual(2);
  await expect(page.locator(".hero-photos__seg")).toHaveCount(10);
  // Every photo has a description for screen readers.
  for (const alt of await page.locator(".hero-photos__slide img").evaluateAll((imgs) => imgs.map((i) => i.getAttribute("alt")))) {
    expect(alt?.length).toBeGreaterThan(3);
  }
});

test("the menu bar is see-through over the photos and turns solid after scrolling", async ({ page }) => {
  await page.goto("/");
  const nav = page.locator(".site-nav");
  await expect(nav).toHaveClass(/site-nav--over-photo/);
  const down = page.getByRole("link", { name: "Scroll down" });
  await expect(down).toBeVisible();
  await down.click({ force: true }); // it gently bobs to draw the eye, which Playwright reads as "moving"
  await expect(nav).not.toHaveClass(/site-nav--over-photo/);
  await expect(page.locator("#about")).toBeInViewport();
});

test("the photos move on by themselves, can be paused, and change by swipe or arrows", async ({ page }) => {
  await page.goto("/");
  await page.mouse.move(5, 5); // off the photos, so hovering does not pause them
  await expect(activeSlide(page)).toHaveAttribute("aria-label", "Photo 1 of 10");
  await expect(activeSlide(page)).toHaveAttribute("aria-label", "Photo 2 of 10", { timeout: 8000 });

  await page.getByRole("button", { name: "Pause the photos" }).click();
  await page.waitForTimeout(6000);
  await expect(activeSlide(page)).toHaveAttribute("aria-label", "Photo 2 of 10");
  await page.getByRole("button", { name: "Play the photos" }).click();

  if (isPhone()) {
    await expect(page.getByRole("button", { name: "Next photo" })).toBeHidden(); // phones swipe instead
    await swipe(page, ".hero-photos", -120);
    await expect(activeSlide(page)).toHaveAttribute("aria-label", "Photo 3 of 10");
    await swipe(page, ".hero-photos", 120);
    await expect(activeSlide(page)).toHaveAttribute("aria-label", "Photo 2 of 10");
  } else {
    await page.locator(".hero-photos").hover();
    await page.getByRole("button", { name: "Next photo" }).click();
    await expect(activeSlide(page)).toHaveAttribute("aria-label", "Photo 3 of 10");
  }
  await page.getByRole("button", { name: "Photo 7 of 10" }).click();
  await expect(activeSlide(page)).toHaveAttribute("aria-label", "Photo 7 of 10");
  await expect(page.locator(".hero-photos__slide.is-active img")).toHaveJSProperty("complete", true);
});

test("the menu lists About, Directing, Education and Contact, and Blog stays hidden with no posts", async ({ page }) => {
  await page.goto("/directing/");
  if (isPhone()) {
    await page.getByRole("button", { name: "Open menu" }).click();
    await expect(page.locator("#navLinks")).toHaveClass(/open/);
  }
  const links = page.locator("#navLinks a");
  await expect(links).toHaveText(["About", "Directing", "Education", "Contact"]);
  await expect(links.filter({ hasText: "Directing" })).toHaveAttribute("aria-current", "page");
  if (isPhone()) {
    await page.keyboard.press("Escape");
    await expect(page.locator("#navLinks")).not.toHaveClass(/open/);
  }
});

test("old Productions and Teaching links land on Directing and Education", async ({ page }) => {
  await page.goto("/productions/");
  await expect(page).toHaveURL(/\/directing\/$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Directing");
  await expect(page.locator(".production-card").first()).toBeVisible();
  await page.goto("/teaching/");
  await expect(page).toHaveURL(/\/education\/$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Education");
  await expectNoHorizontalScroll(page);
});

test("contact shows Asia's photo, her email and two CVs that open as PDFs", async ({ page, request }) => {
  await page.goto("/contact/");
  await expect(page.locator(".contact-photo img")).toHaveAttribute("alt", "Asia Joanna Rob");
  await expect(page.getByRole("link", { name: "iamjoannarob@gmail.com" })).toHaveAttribute("href", "mailto:iamjoannarob@gmail.com");
  const cvs = page.locator(".cv-link");
  await expect(cvs).toHaveText(["Professional CV (PDF)", "Academic CV (PDF)"]);
  for (const href of await cvs.evaluateAll((as) => as.map((a) => a.getAttribute("href")!))) {
    const res = await request.get(href);
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("application/pdf");
  }
  await expectNoHorizontalScroll(page);
});

test("the blog, drafts and made-up post addresses answer 404 until a post is published", async ({ request }) => {
  for (const path of ["/blog/", "/blog/hello-im-asia/", "/blog/none-yet/", "/blog/not-a-post/", "/blog/a/b/", "/blog/%E0/"]) {
    expect((await request.get(path, { maxRedirects: 0 })).status(), path).toBe(404);
  }
});

test("draft previews need Asia's login", async ({ page }) => {
  await page.goto("/preview/blog/hello-im-asia/");
  await expect(page).toHaveURL(/\/admin\/login\//);
});
