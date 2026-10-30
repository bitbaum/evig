# AGENTS.md — evig

<!-- fleet:rules:begin — generated from bitbaum/fleet templates/agent-rules.md; edit it there, not here -->

## Org rules

Read `bitbaum/fleet` `AGENTS.md`, `SHARED.md` and the registers it names before
inventing a host, a name, a page or a shared behaviour. Do not copy their facts
into this file.

- **Packages first.** If a `@bitbaum/*` package (or `bip-kit`, `limitkit`,
  `threadkit`, `ai-forms`) already does it, use it and fix a defect in the
  package, not in this app. Every chat is `@bitbaum/chatkit`, every search box
  `@bitbaum/searchkit`, every chart `@bitbaum/chartkit`, accounts
  `@bitbaum/accountkit`, model calls `@bitbaum/ai-kit`. Review this product's
  `package-plan.json` before building anything. When a second product needs
  what one product built (a map, a globe, a calculator), extract it into a
  package before writing the second copy.
- **A gap is a task, not an answer.** Never end the work, or a reply, at "not
  supported" or "not available". When a source cannot be read or a case does
  not fit the model, find another way (another format or publisher, the
  official tool measured, the model extended) and do it. What truly cannot be
  done yet is tracked with its plan, never presented as a limit of the product.
- **Every page leads to an action.** What a reader learns, they can act on
  from the same screen: file, pay, apply, compare, ask, contact.
- **One shape per kind.** Things of the same kind look the same and sit in the
  same place (fleet `AGENTS.md`, "One shape per kind").
- **Finished work ships by itself.** Open a non-draft pull request; the fleet
  auto-merge sweep is the only merge path. Never merge by hand, through the
  merge API, with `--auto` or with an admin bypass, and never force-push a
  shared branch.
- **Nothing made up.** A fact on a page or in a doc needs a source that was
  opened; where there is none, the line is removed or softened. A gap is
  filled with sourced data, never with a guess.
- **Bitcoin orange is for Bitcoin and top-of-funnel actions only.**
- **No model identifier** in anything pushed to a repository.
- Before you finish, run `node <fleet>/scripts/ci/docs-truth-audit.mjs --dir .`:
  the same check the sweep runs on every pull request.

<!-- fleet:rules:end -->

Affordable intelligence. Curated, durable hardware, repair, and digital access
at a fair price. Founded 2026 in Zürich, in formation. This repository is evig.
It is not Revamp-IT.

Revamp-IT (https://www.revamp-it.ch) is the Zürich non-profit evig grew out of.
Its history, its shop, and its mail domain are its own. Do not brief them as
evig's, and do not "fix" them back into this codebase.

Identity (name, motto, site, contact) has one producer: `src/config/org.ts`.
Who is staff has one producer: `src/lib/permissions.ts`. Do not restate either
here. A sentence in this file that disagrees with those two is a bug.

## What an agent gets wrong if it skips the code

- Staff is the `users.is_staff` column, granted by a super admin. An email
  domain grants nothing. `isStaffEmail` only picks a welcome-email template.
- Production is one Next.js app on the Hetzner box at https://evig.orangecat.ch,
  deployed by GitHub Actions (`deploy-selfhost.yml`) and systemd. There is no
  separate CMS and no second frontend host. Vercel is not used.
- `https://www.revamp-it.ch` is Revamp-IT's old Joomla site. Never smoke-test
  a deploy there.

- `revampit.orangecat.ch` still redirects here through Caddy, and that redirect
  must stay a **308**, never a 301: a 301 turns every POST into a bodyless GET,
  and on 2026-08-16 that broke the credentials callback for every non-browser
  client. CI smoke and `scripts/post-deploy-smoke.sh` target the canonical host.
- **Two layers of naming.** User-facing brand says evig (copy, messages,
  `src/config/org.ts`). Infra identifiers that still carry `revampit` — the
  `revampit` / `revampit_cms` databases, the `is_revampit` column, the
  `revampit-backups` bucket — stay accurate to the running system until a
  deliberate cutover; renaming them in code or docs without migrating the infra
  makes the docs lie. The box directory (`/opt/evig`), systemd units and host
  are already cut over.
- **Non-profit, in formation.** evig may be described as a gemeinnütziger
  Verein *in Gründung*. Until it is registered and recognised as tax-exempt it
  issues no tax-deductible donation receipts (Spendenbescheinigungen) and claims
  no recognised status, UID or receipt authority.

Retired claims the
fleet must not repeat live in `bitbaum/fleet` `registers/retired.json`, and
`pnpm run lint:claims` fails the build if this repo says them again.

## Stack

- Next.js 16, TypeScript, Tailwind CSS 4
- PostgreSQL + Drizzle. Prod is self-hosted Postgres on Hetzner. Neon is retired.
- Auth: NextAuth v5 (Auth.js). See `src/lib/permissions.ts`.
- Search: Meilisearch. Payments: Payrexx.

## Develop

```bash
pnpm run d        # services + dev server
pnpm run dev      # the app only
```

## Verify — run before every commit

```bash
pnpm run verify
```

`verify` is what CI's `quality` job runs. Do not re-inline those checks.

## Database migrations

- `scripts/db/migrations/*.sql` — forward-only. Never edit one that has applied.
- `drizzle-kit push` is forbidden against dev and prod.
- Apply locally: `pnpm run db:migrate`.

## Deploy

- Push to `main` runs `.github/workflows/deploy-selfhost.yml`.
- Health check: `/api/health` on https://evig.orangecat.ch.

## Non-negotiables

- One fact, one producer. A copy in a doc is the bug.
- Swiss German: real umlauts, `ß` → `ss` (`pnpm run lint:umlauts`).
- Design tokens only, no arbitrary hex.

## Layers

`src/config/` is what exists (statuses, categories, labels, limits),
`src/lib/` is domain logic with no HTTP or JSX, `src/app/api/` is thin HTTP,
components render. Dashboard code never imports from `src/app/admin/*`; shared
UI lives in neutral `src/components/*`. A file past ~300 lines splits: state
and handlers into hooks, pure helpers into `*-utils.ts`. Extract on the third
repeat.

## Code rules

- **No `console.log`** — `logger` from `@/lib/logger`.
- **Table names from `TABLE_NAMES`** (`@/config/database`). Inside Drizzle's
  `sql` template use `sql.raw(TABLE_NAMES.X)`; plain interpolation becomes a
  bound parameter, which is invalid as a table name.
- **Parameterized SQL only**, never string concatenation.
- **No hardcoded stats or numbers in UI.** Counts come from the database or
  `src/lib/org-numbers.defaults.ts` (`getDefaultNumeric`); never `100+`.
- **CO₂ figures** derive only from `src/config/co2-impact.ts` (cited per-category
  factors, guarded by its test); a category with no defensible factor shows no
  claim. Methodology page: `/transparenz/co2`.
- **App-level enums live in `src/config/*` and zod at the write boundary**, not
  SQL CHECK constraints (the hand-synced `notifications_type_check` caused two
  incidents and was dropped in migration 110). Constraints are for true
  invariants: ranges, money, date ordering, uniqueness.
- `scripts/db/migrations/*` and `.env*` files are never deleted.

## i18n

`messages/<locale>.json` hold translatable sentences and nothing else. Slugs,
hrefs, enum keys, icons, ids, numbers and CSS classes live in `src/config/*` or
a route-local `data.ts`, paired with strings by stable key; org data (emails,
phone, address, hours) comes from `src/config/org.ts`. German is canonical and
other locales deep-merge over it in `src/i18n/request.ts` — arrays are replaced
wholesale, so iterate the config array and pull strings by key, never index a
config array by a translation array's position
(`src/config/__tests__/i18n-array-parity.test.ts`). Run
`pnpm run compliance:i18n` for parity.

German text uses real umlauts (für, können, Gerät — never fuer, koennen,
Geraet), `ss` for `ß`, and Swiss vocabulary (Velo, Billett). Run
`pnpm run lint:umlauts` before committing German.

## Database

Production is self-hosted Postgres on the box (`DATABASE_URL` in
`/opt/evig/app/.env`); local dev is the Docker Postgres from
`pnpm run services:up` on port 5433 (`revampit_cms`), never prod.
`getDbConfig()` (`src/lib/auth/config.ts`) prefers `DATABASE_URL`, so app and
auth share one pool. The deploy (`scripts/selfhost-deploy-evig.sh`) applies
unrecorded `scripts/db/migrations/*.sql` before activating. Push-created
tables are invisible to from-scratch replays and broke CI for days, which is
why `drizzle-kit push` is forbidden; CI's migration-drift job replays every
migration from zero, so replay a new one locally in a throwaway pgvector
container first.

## Storefront

One store: `listings` (+ `listing_images`, `listing_specs`), served by
`/api/listings` and rendered at `/marketplace`. Two ingestion paths converge on
it: staff intake (`/admin/erfassung` → `ai_extracted_products` +
`inventory_items` → `publishRevampitListing()`, `is_revampit = true`) and
community P2P (`/marketplace/sell` → `POST /api/listings`,
`is_revampit = false`). **`is_revampit` is a stored column and the only source
of truth**; never derive it from a seller's email. `marketplace_listings` and
`/api/shop/inventory` were removed (migration 103); `/shop/*` pages are
redirects. Do not reintroduce a separate shop table.

QC: devices of QC-required categories enter the intake pipeline with a
refurbish checklist; verdicts serialize on a row lock and support atomic bulk
marking. A failed required item always blocks publishing. Staff may publish
without QC in one audited click (`QC_SKIP_ONE_CLICK_NOTE`), and the listing then
carries no Prüfsiegel; final QA keeps the four-eyes rule with a one-click solo
override (`SECOND_PERSON_SOLO_OVERRIDE_NOTE`). "Im Shop" derives from
`listings`. See `docs/INTAKE_QC_DESIGN.md`.

ERP: **Kivitendo** is the legacy on-premise ERP — `kivitendo_article_number`
on `ai_extracted_products` and `inventory_items` is a read-only historical
reference from CSV imports; never write a new one. **Kivvi** is current:
`syncToKivvi()` (`src/lib/kivvi/client.ts`) runs non-blocking after an intake
commit and skips silently without `KIVVI_API_URL` / `KIVVI_API_TOKEN`.

## Divisions

`EVIG_DIVISIONS` in `src/config/divisions.ts` is the only list (computers at
`/marketplace`, technicians at `/it-hilfe`, ai at `/ai`); the hero rail,
footer, nav and division pages derive from it, and a wordmark is composed as
`${ORG.name} ${id}`, never typed. A division points at the surface that
already serves it; only one with no home gets a `DIVISION_PAGES` entry, rendered
by the shared `DivisionPage`, whose required `boundary` block says what the
division is not before its CTA. Strings live in messages under
`divisions.items.<id>` / `divisions.pages.<id>`. "evig technicians" is a
marketplace of people who fix things, not volunteer charity. The homepage has
no divisions card grid; `EVIG_PILLARS` says what evig does.

## Auth

- **Sign in with OrangeCat** is primary when `ORANGECAT_OAUTH_CLIENT_ID` /
  `_SECRET` are set (`src/components/auth/OrangeCatSignIn.tsx`); the password
  form sits one click behind. Rules in `src/lib/auth/orangecat.ts`:
  `users.orangecat_actor_id` (migration 141) is the only cross-product key —
  **never link by email**, since OrangeCat's sign-up does not verify it. An
  existing unlinked account with that email is refused and told to sign in with
  the password and connect from the profile.
- Super admins: `users.is_super_admin`; `SUPER_ADMIN_EMAILS` holds only the
  owner as a lockout floor.
- Admin sections are SSOT in `src/config/sections.ts`; `ADMIN_SECTIONS` derives
  from it. `DEFAULT_STAFF_PERMISSIONS` is every section minus the sensitive
  ones, so `is_staff` alone grants none of those. Gate routes with
  `withAdmin('<section>')` or the section's own helper (e.g.
  `canAccessFinance`) — **never on `session.user.isStaff`**, which once
  produced a privilege escalation.
- User content (products, services, workshops, posts) goes
  draft → pending → approved/rejected in `user_content_submissions`.

## Design

Tailwind 4, CSS-first: `src/app/globals.css` holds raw tokens on `:root` /
`.dark` and the `@theme` block that turns them into utilities. There is no
Tailwind config file; do not create one. Write the semantic names
(`bg-surface-*`, `text-text-*`, `border-*`, `bg-action` / `text-action`;
`bg-action-strong` for loud CTAs). `primary-*` is the raw lime scale and does
not flip in dark mode — brand accents use `action`. `secondary-*` (orange) is
for commerce; `success/warning/error/info` only for real status. `dark:` is
for a token that is wrong on that surface, not a routine second class. No
`shadow-lg/xl/2xl` on cards, no decorative gradients, no inline colour styles,
no `bg-opacity-*` (use `bg-black/NN`).

One primitive per shape: `<Card>` / `<Panel>` (both `card-shell`, no shadow),
`<AdminSectionHeader>`, `<PageHero>`, `<Section>`, `<BottomNav>`,
`<Drawer>` (portal, focus trap, scroll lock, scrim) and `<Modal>`; class strings
in `designPrimitive` (`src/lib/design-system.ts`), section theming in
`src/lib/design/tokens.ts`, and nav active state only from `NAV_STATE` /
`navLinkClass` (`src/lib/design/nav.ts`). Extend a primitive with a prop; never
fork a second one. `scripts/ci/card-shell-ratchet.sh` (in `verify`) pins the
count of hand-rolled card shells; lower `scripts/ci/card-shell-baseline.txt`
when you reduce it.

Admin and dashboard shells set `.has-bottom-nav`, which defines
`--bottom-nav-clearance`; every fixed or sticky bottom element and page bottom
padding offsets by that variable, never a hardcoded nav height. On a phone the
page's one task comes first — stats shrink to a glance line or move below — and
every stated problem or number links to where it is fixed. Check at 390px:
nothing behind the bottom nav, no sideways scroll. Tailwind scans every file
for class candidates, so an invalid bracket class in a markdown example breaks
the CSS build.

## Reference

`docs/SHARED_CONTEXT.md` (stack, database, structure, access points),
`docs/COMMANDS.md` (scripts), `docs/MISSION_STATEMENT.md`,
`docs/AUDIT_BACKLOG_2026-08.md` (open audit findings).
