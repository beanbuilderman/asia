# Asia Joanna Rob website: how to change it

Portfolio site for Asia Joanna Rob, theatre director (asiajoannarob.com), with a dashboard at /admin where she edits her own wording and photos. Built on the same pattern as `~/Projects/ptwithv` (Next.js 16 + Postgres + Vercel Blob), without bookings.

## Isolation

- Personal side project. Nothing to do with CheqUp: no CheqUp colours, fonts, accounts or brand rules. Never save anything about it in Claude memory; notes live here and in `~/Projects/asia/`.
- GitHub: account `beanbuilderman`, repo `beanbuilderman/asia`. Run `gh auth switch --user beanbuilderman` before git/gh, and `gh auth switch --user Sonnybaez` after.
- No em dashes in prose we write (her own copy keeps hers).
- **Her wording needs her approval.** Never change or add visible text without it. The defaults in `src/content/defaults.ts` are the live site's wording as of 2 November 2026.

## Branches

- `main` is the old static site, still served by GitHub Pages (CNAME) until the domain moves to Vercel.
- `cms` is this Next.js version. The old pages are kept in `legacy/` for reference only (not deployed).

## Where things are

| To change | Edit |
|---|---|
| Original wording and photos (shown until she saves a page) | `src/content/defaults.ts` |
| What can be edited, limits, validation | `src/lib/content.ts` (`contentSchema`) |
| Public pages | `src/app/(site)/` (`page.tsx` = About, `productions/`, `teaching/`, `contact/`) |
| Look | `src/app/(site)/site.css` (lifted from the static site; production cards are 4:3, other photos 16:10) |
| Carousels, nav, italics | `src/components/` (`*words*` become italics via `Rich.tsx`) |
| Dashboard editors | `src/app/admin/(dash)/forms.tsx` (fields), `editor.tsx` (lists, photo galleries, save bar) |
| Sign in, reset, saving, uploads | `src/app/admin/actions.ts`, `src/lib/auth.ts`, `src/lib/email.ts`, `src/lib/uploads.ts`, `src/proxy.ts` |
| Database | `migrations/000N_*.sql`, applied by `pnpm db:migrate` |

Each page is one row in `site_content` (keys `site`, `about`, `productions`, `teaching`, `contact`). "Put this page back to the original" deletes the row.

## Run and test

```bash
~/Projects/asia/start-db.sh          # Postgres on port 5435 (asia_dev, asia_test)
brew services start mailpit          # reset emails land at http://localhost:8025
cd ~/Desktop/Asia && pnpm install
pnpm dev --port 3200                 # dashboard at http://localhost:3200/admin/
pnpm typecheck && pnpm lint && pnpm test
```

- Logins: `pnpm admin:password <email> [name]` creates a login or sets a new password and prints it. Local passwords are in `~/Projects/asia/.admin_password`.
- Local uploads go to `.uploads/` (git-ignored) and are served by `src/app/uploads/[name]/route.ts`; online they go to Vercel Blob.
- Photo filenames must be plain ASCII: macOS stores accented names decomposed, which 404s on Vercel's Linux.

## Online (not set up yet)

Needs, like ptwithv: a Vercel project under `beanbuilderman`, a Neon database (run migrations against it before the first deploy, the build prerenders from it), a Blob store, and env vars `DATABASE_URL`, `AUTH_SECRET`, `SITE_URL=https://asiajoannarob.com`, `ALLOW_INDEXING=true` (only on the real domain), `BLOB_READ_WRITE_TOKEN`, and SMTP (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM`) for reset emails. Then create the online logins with `pnpm admin:password` pointed at Neon, and move the domain's DNS from GitHub Pages to Vercel.

Keep Next.js on 16.4.1 or later: 16.0.0 to 16.4.0 have critical remote code execution advisories (GHSA-2464-fhr4-w9xw, GHSA-673q-mjm6-r5xr).
