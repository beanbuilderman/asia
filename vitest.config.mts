import { defineConfig } from "vitest/config";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Tests run against asia_test on the isolated Postgres instance (port 5435), never the dev database.
const pwPath = path.resolve(process.env.HOME ?? "", "Projects/asia/.db_password");
const pw = fs.existsSync(pwPath) ? fs.readFileSync(pwPath, "utf8").trim() : "";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  test: {
    globals: true,
    environment: "node",
    fileParallelism: false,
    include: ["src/**/*.test.{ts,tsx}"],
    env: {
      DATABASE_URL: process.env.TEST_DATABASE_URL ?? `postgresql://asia:${pw}@localhost:5435/asia_test`,
      AUTH_SECRET: "test-secret-0123456789abcdef0123456789abcdef",
      EMAIL_TRANSPORT: "memory",
      SITE_URL: "http://localhost:3200",
    },
  },
});
