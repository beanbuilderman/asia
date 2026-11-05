import { expect, type Page } from "@playwright/test";
import { ADMIN } from "./admin";

export async function expectNoHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
}

/** Collects browser errors on a page, so a test can assert there were none. */
export function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (m) => {
    if (m.type() === "error" && !/favicon/.test(m.location()?.url ?? "")) errors.push(`${m.text().split("\n")[0]} ${m.location()?.url ?? ""}`);
  });
  page.on("pageerror", (e) => errors.push(e.message));
  return errors;
}

export async function signIn(page: Page) {
  await page.goto("/admin/login/");
  await page.getByLabel("Email").fill(ADMIN.email);
  await page.getByLabel("Password").fill(ADMIN.password);
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/admin\/$/);
}

/** Simulates a finger swipe across an element (dx < 0 is a swipe to the left). */
export async function swipe(page: Page, selector: string, dx: number) {
  await page.locator(selector).evaluate((el, dx) => {
    const r = el.getBoundingClientRect();
    const y = r.top + r.height / 2;
    const x0 = r.left + r.width / 2;
    const touch = (x: number) => new Touch({ identifier: 1, target: el, clientX: x, clientY: y });
    el.dispatchEvent(new TouchEvent("touchstart", { bubbles: true, touches: [touch(x0)], changedTouches: [touch(x0)] }));
    el.dispatchEvent(new TouchEvent("touchend", { bubbles: true, touches: [], changedTouches: [touch(x0 + dx)] }));
  }, dx);
}
