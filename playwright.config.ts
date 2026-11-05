import { defineConfig, devices } from "@playwright/test";

// End-to-end tests run a production build against asia_e2e (never the dev or live database),
// using the installed Chrome. Same set-up as PT with V. Run with: pnpm test:e2e
export const E2E_DB = "postgresql://asia_admin@localhost:5435/asia_e2e";
const PORT = 3400;

const env = {
  DATABASE_URL: E2E_DB,
  AUTH_SECRET: "e2e-secret-0123456789abcdef0123456789abcdef",
  SITE_URL: `http://localhost:${PORT}`,
  EMAIL_TRANSPORT: "memory",
  NEXT_DIST_DIR: ".next-e2e",
};

const phone = { ...devices["Pixel 7"], viewport: { width: 390, height: 844 }, channel: "chrome" as const };
const desktop = { viewport: { width: 1440, height: 900 }, channel: "chrome" as const };

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  use: { baseURL: `http://localhost:${PORT}`, trace: "retain-on-failure" },
  projects: [
    // What visitors see, on a phone and on a computer. These only read.
    { name: "site-phone", testMatch: /site\.spec\.ts/, use: phone },
    { name: "site-desktop", testMatch: /site\.spec\.ts/, use: desktop },
    // Asia's dashboard, at phone size, after the read-only checks because it changes the database.
    { name: "dashboard", testMatch: /dashboard\.spec\.ts/, use: phone, dependencies: ["site-phone", "site-desktop"] },
  ],
  webServer: {
    command: `pnpm exec tsx e2e/reset-db.ts && pnpm exec next build && pnpm exec next start --port ${PORT}`,
    url: `http://localhost:${PORT}`,
    timeout: 300_000,
    reuseExistingServer: false,
    env,
  },
});
