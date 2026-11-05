# Asia Joanna Rob website: how to change it

Portfolio site for Asia Joanna Rob, theatre director (asiajoannarob.com), with a dashboard at /admin where she edits her own wording and photos. Built on the same pattern as `~/Projects/ptwithv` (Next.js 16 + Postgres + Vercel Blob), without bookings.

## Isolation

- Personal side project. Nothing to do with CheqUp: no CheqUp colours, fonts, accounts or brand rules. Never save anything about it in Claude memory; notes live here and in `~/Projects/asia/`.
- GitHub: account `beanbuilderman`, repo `beanbuilderman/asia`. Run `gh auth switch --user beanbuilderman` before git/gh, and `gh auth switch --user Sonnybaez` after.
- No em dashes in prose we write (her own copy keeps hers).
- **Her wording needs her approval.** Never change or add visible text without it. The defaults in `src/content/defaults.ts` are the live site's wording as of 2 November 2026.

## Branches

- `main` is the live site. Vercel deploys every push to `main` to asiajoannarob.com. GitHub Pages is off (since 2 November 2026).
- `cms` was the build branch, now merged. The old static pages are kept in `legacy/` for reference only (not deployed).

## Where things are

| To change | Edit |
|---|---|
| Original wording and photos (shown until she saves a page) | `src/content/defaults.ts` |
| What can be edited, limits, validation | `src/lib/content.ts` (`contentSchema`) |
| Public pages | `src/app/(site)/` (`page.tsx` = About, `directing/`, `education/`, `blog/`, `contact/`) |
| Photos and CVs added on 5 Nov 2026 (home carousel, contact photo, CV buttons) | `src/content/added-defaults.ts`, CV PDFs in `public/cv/` |
| Look | `src/app/(site)/site.css` (lifted from the static site; production cards are 4:3, other photos 16:10) |
| Carousels, nav, italics | `src/components/` (`*words*` become italics via `Rich.tsx`) |
| Dashboard editors | `src/app/admin/(dash)/forms.tsx` (fields), `editor.tsx` (lists, photo galleries, save bar) |
| Sign in, reset, saving, uploads | `src/app/admin/actions.ts`, `src/lib/auth.ts`, `src/lib/email.ts`, `src/lib/uploads.ts`, `src/proxy.ts` |
| Database | `migrations/000N_*.sql`, applied by `pnpm db:migrate` |

Each page is one row in `site_content` (keys `site`, `about`, `productions`, `teaching`, `contact`, `blog`). "Put this page back to the original" deletes the row.

### Changes of 5 November 2026 (Asia's WhatsApp requests of 3 November)

- Home: big show-photo carousel at the top (fades every 5 seconds), then About, then testimonials. Training removed (it is in her CV). Pages saved before this keep their wording and get the default carousel through `.default()` in the schema.
- Productions is now **Directing** at `/directing/`, Teaching is now **Education** at `/education/`; the old URLs redirect (next.config.ts). The section keys and dashboard URLs stay `productions` / `teaching`. Menu labels come from each page's heading.
- **Blog** (rebuilt the same day the PT with V way): every post has its own page `/blog/<slug>`, list at `/blog/`. Posts live in one `site_content` row, key `posts` (`src/lib/posts.ts`, defaults in `src/content/posts.ts`). Dashboard: `/admin/blog/` list (reorder, Draft/Published badges), `new/`, `[slug]/` editor (`PostEditor.tsx`). Drafts: `published: false`, only visible at `/preview/blog/<slug>/` when signed in. The proxy answers 404 for drafts, unknown posts and `/blog/` until one post is published, and the menu hides Blog until then. The template post "Hello, I’m Asia" (from her bio, CVs and productions) ships as a draft: she rewrites and publishes it herself.
- **Contact**: her photo, and CV buttons (Professional CV = her Directing CV, Academic CV). She replaces a CV by uploading a new PDF in the dashboard (`storePdf` in `src/lib/uploads.ts`, Blob path `cv/`). The Academic CV includes her phone number and postcode; Sonny chose to publish it as she sent it.
- Home hero (rebuilt the same day after Sonny's mobile feedback): full-screen photos with her name and role on the first screen, menu bar see-through over them (`site-nav--over-photo`), swipe on phones, story-style progress bars, pause button, scroll chevron. Each photo has a "keep this part in view" choice (middle, top, left, right) because phones show only a slice of wide photos.
- Speed: carousels only put the current photo on the page (plus the next one once the page has loaded), because the hero stacks every photo in one place and browser lazy loading would fetch all of them. Retina desktops get the 2048px hero, not 3840px (`HERO_SIZES` in the home page). Measured 5 Nov on a throttled phone: hero photo on screen at 0.8s, 261KB of images (all 11 photos and 887KB before the fix).
- Fade-in uses `element.animate()`, not a class: React 19 reports any class or attribute change made before hydration.
- Still to come from her: a new photo for Contact, an Instagram for photography (she can add it under Links), trimming marketing roles from Directing (her call, in the dashboard).

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

### End-to-end tests (Playwright)

`pnpm test:e2e` builds into `.next-e2e` and runs against `asia_e2e` (reset each run by `e2e/reset-db.ts`, login in `e2e/admin.ts`) on port 3400, with the installed Chrome. `site.spec.ts` runs at phone and desktop size and only reads; `dashboard.spec.ts` runs at phone size afterwards and changes things (publish, new post, photo focus, CV upload). Next keeps the page you just left mounted but hidden, so after a save that changes the address prefer role-based locators or `.filter({ visible: true })`.

## Online

- Vercel project `asia` (beanbuildermans-projects, Hobby, London). Live at https://asiajoannarob.com (www redirects to it). DNS at Namecheap: A @ 216.198.79.1 and 64.29.17.1, CNAME www aa2e8d68550a6353.vercel-dns-017.com. Keep the Namecheap email forwarding records.
- Pushes to `main` deploy automatically. Manual deploy: `npx --cache /tmp/ptv-npm vercel deploy --prod --yes`. Back up `.env.local` first: `vercel link`, `integration add`, `blob create-store` and `env pull` rewrite it.
- Database: Neon `asia-db` (free, London) via the Vercel marketplace. DataGrip: get the URL with `vercel env pull <tmpfile> --environment production` and use `DATABASE_URL_UNPOOLED`. Run migrations against it before a deploy that adds one.
- Photos: Vercel Blob store `asia-media` (public, London).
- Online logins: `~/Projects/asia/.admin_password_online`. Change one with `pnpm admin:password` and `DATABASE_URL` set to the Neon URL.
- Email: "forgotten password" emails send through the PT with V Brevo account (SMTP login bd21a7001@smtp-brevo.com, key stored as a sensitive Vercel value, separate key from ptwithv's). Sender: Asia <iamjoannarob@gmail.com>, verified in Brevo. Brevo shows it as iamjoannarob@12394919.brevosend.com because it is a Gmail address. Tested live on 2 November 2026: arrived in the inbox. If emails start landing in spam, authenticate asiajoannarob.com in Brevo (DNS records in Namecheap) and send from an @asiajoannarob.com address.

Keep Next.js on 16.4.1 or later: 16.0.0 to 16.4.0 have critical remote code execution advisories (GHSA-2464-fhr4-w9xw, GHSA-673q-mjm6-r5xr).
