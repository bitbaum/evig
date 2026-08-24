# evig

Affordable-intelligence platform — curated, durable hardware and digital access at a fair price (rebranded from Revamp-IT 2026-07-24; see `.claude/CLAUDE.md` for the Layer A/B rebrand rule — brand is `evig`, but infra identifiers like `is_revampit`/`revampit_cms`/`@revamp-it.ch` stay until the infra cutover).

@~/.claude/CLAUDE.md
@.claude/CLAUDE.md

## Brand architecture — the evig divisions (SSOT: `src/config/divisions.ts`)

evig is one organisation stated as several divisions, all of them the same idea
at rising scale: **keep something useful for longer.**

| Division | Lives at | Status |
|---|---|---|
| `evig computers` | `/marketplace` — curated, tested hardware | live |
| `evig repairs` | `/it-hilfe` — repair instead of replace | live |
| `evig ai` | `/ai` — intelligence within reach | live |
| `evig architecture` | `/architecture` — build so the ruin still reads | research |
| `evig health` | `/health` — healthspan + preserving a person | research |

Rules:
- **`EVIG_DIVISIONS` is the only list.** The homepage hero rail, the homepage
  divisions section (including its **count** — via ICU `{count}`, never a
  number typed into a message), the footer column, the nav entries and the
  division pages all derive from it. Never hardcode a wordmark: it is composed
  as `${ORG.name} ${id}`.
- **A division is a lens, not a second storefront.** `computers` and `repairs`
  point at the surfaces that already serve them. Only add a `DIVISION_PAGES`
  entry when a division has no home; then it renders through the shared
  `DivisionPage` component — one shape, never forked.
- **Structure in config, strings in messages**, paired by the stable `id`
  (`divisions.items.<id>`, `divisions.pages.<id>`). No arrays in the message
  files for any of it.
- **`status: 'research'` is a claim-limiter, not a teaser.** It means nothing
  is sold and nothing is promised, and the page must say so: every division
  page carries a required `boundary` block ("what this is NOT") *before* its
  CTA. `evig health` states plainly that it is not medicine and issues no
  health promises; `evig architecture` states that it is not an architecture
  practice and gives no structural advice. Do not soften or drop these — they
  are what keeps an ambitious claim honest (see the honesty boundary in
  `.claude/CLAUDE.md`).

## Non-negotiable standards (the default for every change — don't wait to be told)

The full rationale lives in the imported global standards above. In this repo,
hold the line on all of it by default:

- **First-principles, not analogy.** Solve the actual human problem; derive the
  simplest correct design from constraints. Don't copy a pattern without knowing why.
- **SSOT.** Every fact lives in exactly one place. Types derive from the Drizzle
  schema; statuses/categories/labels/limits come from `src/config/*`. If a value
  exists in two places, one is a bug (e.g. `is_revampit` must be the stored column,
  never re-derived from email; conditions derive from one option list).
- **DRY + SoC.** Extract on the 3rd repeat. Layers stay separate: `config/` = what
  exists · `lib/` = domain logic (no HTTP/JSX) · `app/api/` = thin HTTP · components
  = render only. Dashboard code must NOT import from `app/admin/*` — shared UI lives
  in neutral `src/components/*`.
- **No god files.** Split anything past ~300 lines; state/handlers go in hooks,
  pure helpers in `*-utils.ts`.
- **Config-driven, nothing hardcoded.** No hardcoded labels, categories, stats,
  numbers, or magic strings in components — source from config/DB. (Stats: DB or
  `org-numbers.defaults.ts`.)
- **Design discipline — match OrangeCat / FleetCrown.** Semantic tokens + the
  shared primitives (`Card`, `Button`, `Heading`, `IconBadge`, `Section`,
  `EmptyState`, `Input`) only. NO arbitrary hex (`bg-[#…]`), NO inline style
  colors, NO `shadow-lg/xl` on cards, NO stray one-off chrome. Green is for CTAs /
  focus / sustainability semantics; chrome stays neutral. `grep -rn '\[#' src/`
  must be empty.
- **Modern + correct.** Latest stable framework features, strict TS (minimal
  `any`), parameterized SQL via `TABLE_NAMES`/Drizzle, validate at boundaries,
  handle loading/empty/error/success states.
- **Keep the repo clean.** No dead code, no stray frankenstein tools assembled
  from unrelated parts, no uncommitted/unpushed garbage. Remove what you replace.
- **Keep docs true.** When behaviour changes, update the docs/CLAUDE.md in the same
  change — stale docs are a defect.

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16, TypeScript 5.3 |
| Styling | Tailwind CSS 4 (CSS-first, no tailwind.config) |
| Database | PostgreSQL (prod: self-hosted on Hetzner; dev: Docker on 5433), Drizzle ORM |
| Auth | NextAuth v5 (Auth.js) + @auth/pg-adapter |
| Search | Meilisearch |
| Payments | Payrexx |

## Production URL — don't get this wrong

**This codebase runs at https://evig.orangecat.ch** (self-hosted Hetzner, deployed from `main` by `deploy-selfhost.yml`). Health check: `https://evig.orangecat.ch/api/health`. Staff time entry (Zeiterfassung): `/admin/zeiterfassung`.

**`revampit.orangecat.ch` still resolves and redirects here** (Caddy, `/etc/caddy/Caddyfile`). That redirect **must stay a 308, never a 301/`permanent`**: 301 does not preserve the HTTP method, so every POST to the old host arrives as a bodyless GET. On 2026-08-16 it was set to `permanent` and `/api/auth/callback/credentials` began answering `InvalidProvider: Callback for provider type (credentials) is not supported` — Auth.js rejecting a GET on a credentials callback. Browser traffic looked fine (it lands on the canonical host and posts there), so only non-browser POST clients broke: the CI auth smoke, API callers, and any webhook still aimed at the old host.

The `auth-smoke` / `inventory-smoke` CI jobs deliberately point `PLAYWRIGHT_BASE_URL` at the **old** host, so they exercise that redirect. Do not "fix" a redirect failure by repointing them at the canonical host — that deletes the only coverage of it.

**https://www.revamp-it.ch is the org's LEGACY Joomla site — not this app.** Never verify deploys or smoke-test there. Full URL list: `docs/SHARED_CONTEXT.md` → Access Points.

---

## Design System

### How it works — two layers, each with one job

```
src/app/globals.css      ← SSOT: raw tokens (:root / .dark) + the @theme block
                           that turns them into Tailwind utilities
src/lib/design-system.ts ← designPrimitive: component-level class strings
src/lib/design/          ← tokens.ts (section theming) + nav.ts (NAV_STATE)
```

**There is no `tailwind.config.ts`.** This is Tailwind v4 (`@tailwindcss/postcss`),
which is CSS-first: the palette lives in the `@theme` block of globals.css, not
in a JS config. Do not create one — that would split the token source in two,
the exact anti-pattern the rest of this section exists to prevent.

### Layer 1 — `src/app/globals.css`

Two tiers, both in this file:

1. **Raw tokens** on `:root` and `.dark` — the actual values
   (`--surface-base`, `--text-primary`, `--accent-action`, `--border-default`, …).
   Dark mode is a second definition of the same names under `.dark`.
2. **`@theme { … }`** — maps those raw tokens to Tailwind utility names:
   `--color-surface-base: var(--surface-base)` is what makes `bg-surface-base`
   exist. Utilities come from this block; nothing else defines them.

The semantic names to write in components:

```
surfaces   bg-surface-page · bg-surface-base · bg-surface-raised · bg-surface-overlay
text       text-text-primary · text-text-secondary · text-text-tertiary · text-text-muted
borders    border-default · border-subtle · border-strong · border-interactive
brand      bg-action · text-action · border-action · bg-action-muted
           bg-action-strong (loud CTA fills — the electric Ion Lime)
```

Because light and dark are defined on the same token names, these classes flip
automatically. **`dark:` is only for cases where the token itself is wrong for
that surface** — not as a routine second class.

`primary-*` is the RAW Ion Lime scale (`--color-primary-50 … 900`). It does NOT
flip in dark mode and is not the brand action colour — use `action` for brand
accents. `secondary-*` (orange) is for commerce semantics; `success/warning/
error/info` only for their real status meaning, never as decoration.

**What breaks dark mode** — avoid these:
- `shadow-lg`, `shadow-xl`, `shadow-2xl` on cards (invisible on dark)
- `bg-gradient-to-*` for decoration (flat colors only — brand CTA: `bg-action`)
- Inline `style={{ background: '...' }}` (bypasses the token system entirely)
- Any raw hex in a class (`bg-[#…]`) — `grep -rn '\[#' src/` must stay empty

### Layer 2 — the TypeScript primitives

**`src/lib/design-system.ts` → `designPrimitive`** (note: `src/lib/`, *not*
`src/lib/design/`) — class strings for component-level primitives:
- `designPrimitive.surface.card` — resolves to `card-shell`, used by `<Card>`
- `designPrimitive.type.*` — heading/body/meta typography strings
- `designPrimitive.button.*` — button variant strings

**`src/lib/design/tokens.ts` → `DESIGN_TOKENS`**: which section uses which icon
badge colour and button variant. **`src/lib/design/nav.ts` → `NAV_STATE`**: the
only definition of active/inactive navigation state.

### Component primitives — always use these

| Pattern | Use this | Never write this |
|---|---|---|
| Content card | `<Card className="p-6">` | `<div className="bg-white rounded-xl border...">` |
| Icon circle/badge | `<IconBadge icon={X} theme="about" size="lg">` | `<div className="w-14 h-14 bg-primary-100 rounded-xl flex...">` |
| CTA band | `bg-primary-700 text-white` | `bg-gradient-to-r from-primary-700 to-primary-800` |
| Section BG light | `bg-neutral-50` (dark auto-handled) | `bg-neutral-50 dark:bg-neutral-900` (redundant) |
| Section BG white | `bg-white` (dark auto-handled) | `bg-white dark:bg-neutral-950` (unless deeper black needed) |
| Card hover | `hover:border-neutral-300` | `hover:shadow-xl` |

### Chrome & Navigation — one primitive per shape (SSOT)

"Chrome" = the repeated structural shells: headers, footers, nav bars, panels,
sidebars, bottom nav. Each SHAPE has exactly ONE primitive. Never hand-roll a
card shell (`bg-surface-base rounded-lg border p-…`) or an active-nav class
(`bg-action/10 … ring-action/20`, `text-action`, `border-action bg-action-muted`)
inline — those are defined once and consumed everywhere. Retheming chrome = edit
the primitive, not N components.

| Need | Use | File | Never hand-roll |
|---|---|---|---|
| Titled bordered surface (title + subtitle + right action + body) | `<Panel title subtitle icon action>` | `components/ui/Panel.tsx` | `<div className="bg-surface-base rounded-lg border p-5">` + own `<h2>` |
| Untitled surface | `<Card>` | `components/ui/card.tsx` | `<div className="card-shell p-6">` / `rounded-xl border bg-surface-base` |
| Header row *inside* a card | `<AdminSectionHeader>` | `components/admin/AdminSectionHeader.tsx` | bespoke `flex justify-between` + divider |
| Full-bleed page hero (centered) | `<PageHero theme title subtitle>` | `components/layout/PageHero.tsx` | a one-off `<section>` with a bespoke `<h1>` type string |
| Page-section vertical rhythm / tinted band | `<Section density tone>` | `components/layout/Section.tsx` | hardcoded `py-16 sm:py-20 …` |
| Mobile bottom tab bar (`<lg`) | `<BottomNav items ariaLabel more>` | `components/layout/BottomNav.tsx` | a `fixed bottom-0 … flex` `<nav>` + tab loop |
| Edge overlay (right sheet / bottom sheet) | `<Drawer isOpen onClose side ariaLabel>` | `components/ui/Drawer.tsx` | a hand-rolled `fixed inset-0` portal + backdrop + focus-trap |
| Centered dialog | `<Modal isOpen onClose title>` | `components/ui/Modal.tsx` | a bespoke centered overlay |
| Active/inactive nav item classes | `navLinkClass(shape, active)` / `NAV_STATE` | `lib/design/nav.ts` | inline `text-action` / `ring-action/20` ladders |

Rules:
- **Nav state is one definition.** `NAV_STATE` (`sidebar` / `bottomTab` / `pill`)
  is the ONLY place "current page" is styled. `adminInteractive.navActive`
  re-exports `NAV_STATE.sidebar.active` — the value lives in `nav.ts`, not admin.
  Need a new nav shape? Add it to `NAV_STATE`, don't hand-roll a sixth encoding.
- **Neutral home for shared chrome.** Dashboard must not import from `app/admin/*`
  (see SoC rule). `BottomNav` + `nav.ts` live in neutral `components/layout` /
  `lib/design` so admin, dashboard, and public all consume them.
- **One primitive per shape.** If you find yourself building a second "hero" or a
  second "bottom bar," extend the existing primitive with a prop — don't fork it.
  (This is why `ResponsiveHero` was folded into `PageHero`.)
- **Card shell = `card-shell` only** (rounded-xl + border + surface, NO shadow).
  `<Card>`/`<Panel>` both resolve to it. `rounded-lg`, missing border, or
  `shadow-xs` on a static card is drift — fix it, don't copy it.

Every edge overlay goes through `<Drawer>` (right sheet or `side="bottom"`) —
it owns the portal, `useFocusTrap` (Escape / initial focus / Tab cycle / focus
restore), body scroll-lock, and the `bg-black/40 backdrop-blur-xs` scrim. Pass
panel size via `className`, viewport gating via `rootClassName` (`xl:hidden` /
`lg:hidden`). Never hand-roll a `fixed inset-0` overlay and never `bg-opacity-*`
(use `bg-black/NN`). Centered dialogs use `<Modal>`, its sibling.

### Mobile-first = ACTION-first, not stats-first

On a phone, the user opened the page to DO the one thing the page is for —
not to read numbers. Respect their time:

- The primary action (form, calendar, list to work through) must be visible
  within the first screen. Stats/saldi/summaries shrink to a single glance
  line on phones (full cards from `sm:` up) or move below the action.
- Use responsive ordering (`flex flex-col` + `order-*` with `lg:order-none`)
  when desktop hierarchy differs from mobile — never duplicate markup.
- Settings (reminders, schedules, preferences) sink below the action on
  phones; they are visited rarely.
- Litmus test at 390px: can the user start the page's core task without
  scrolling past anything they didn't come for?

### Contextual links — every stated problem/number links to where it's fixed

UI text that names a state, a number, or a problem MUST link to the place
where the user acts on it. A warning without a way out is a dead end; a
number without a source feels like magic.

- A warning/mismatch hint → link to the control that fixes it (anchor on the
  same page via `id` + `scroll-mt-24`, or the page where the change happens).
- A derived number (Saldo, count, quota) → its detail line names the inputs
  and links to where they're managed (e.g. Feriensaldo → Abwesenheit
  beantragen; Pensum-Hinweis → Arbeitsplan-Anker + Profil).
- An empty state → link to the action that creates the first item.
- Approval-gated changes → link to the REQUEST flow, not a silent form.

Litmus test when touching any page: for each sentence the UI says, ask
"where does the user go next after reading this?" — if the answer is a page
and it's not one click away, add the link.

### Mobile bottom-nav clearance — one variable, no hardcoded nav math

Admin and dashboard render a fixed mobile bottom nav (<lg). Their shells set
`.has-bottom-nav` (see globals.css), which defines `--bottom-nav-clearance`
(nav height + safe-area below lg, `0px` from lg up and on navless pages).

**Every fixed/sticky bottom-anchored element (FAB, submit bar, bulk bar, page
bottom padding) MUST offset itself with this var — never hardcode the nav
height or assume `bottom-0` is visible:**

```tsx
// ✓ FAB            fixed bottom-[calc(1.5rem+var(--bottom-nav-clearance,0px))]
// ✓ sticky bar     sticky bottom-[var(--bottom-nav-clearance,0px)]
// ✓ page padding   pb-[calc(1.5rem+var(--bottom-nav-clearance,0px))]
```

WRONG: `fixed bottom-6`, `sticky bottom-0`, or any arbitrary bottom offset that
bakes in 3.5rem / the safe-area env inset by hand. (Careful with examples in
docs: Tailwind v4 scans ALL files for class candidates — an invalid
bracket-class in a markdown example breaks the CSS build.)

Audit: `grep -rnE '(fixed|sticky)[^"]*bottom-(0|\d|\[calc\(3)' src/components src/app/admin` —
every hit inside an admin/dashboard surface must use the var. When touching ANY
page, check it at 390px: nothing may hide behind the bottom nav, and
`document.documentElement.scrollWidth` must equal `innerWidth`.

### Audit commands

```bash
# Arbitrary hex violations (must be zero)
grep -rn '\[#' src/

# Shadow-lg on cards (should be zero for static cards)
grep -rn 'shadow-lg\|shadow-xl\|shadow-2xl' src/app/[locale]/ src/components/

# Gradient backgrounds that should be flat
grep -rn 'bg-gradient-to' src/app/[locale]/ src/components/ | grep -v 'from-black\|to-transparent'

# Off-token brand green — `primary-*` is the RAW lime scale (does NOT flip to
# electric in dark, ≠ the brand action green). Brand accents MUST use `action`
# (bg-action / text-action / border-action / ring-action / bg-action-muted).
# `secondary-*` (orange) is allowed for commerce semantics; `success/warning/
# error/info` only for their actual status meaning, never as decoration.
grep -rnE '(bg|text|border|ring)-primary-[0-9]' src/components src/app

# Hand-rolled card shells — should be <Card>/<Panel> (resolve to card-shell).
# Enforced as a ratchet: scripts/ci/card-shell-ratchet.sh (runs in `npm run
# verify`) pins the count — it may fall or hold, never rise. When you reduce
# it, lower scripts/ci/card-shell-baseline.txt in the same PR.
grep -rnE 'bg-surface-base rounded-(lg|xl) border' src/components src/app

# Nav-active drift — active state must come from NAV_STATE / navLinkClass
grep -rn 'ring-action/30' src/components src/app

# Deprecated opacity utility on scrims (use bg-black/NN)
grep -rn 'bg-opacity-' src/components src/app
```

