# Revamp-IT

Swiss non-profit platform enabling free exchange of technology — used computers repaired and rehomed, not landfilled.

@~/.claude/CLAUDE.md
@.claude/CLAUDE.md

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
| Styling | Tailwind CSS 3.4 |
| Database | PostgreSQL (prod: self-hosted on Hetzner; dev: Docker on 5433), Drizzle ORM |
| Auth | NextAuth v5 (Auth.js) + @auth/pg-adapter |
| Search | Meilisearch |
| Payments | Payrexx |

## Production URL — don't get this wrong

**This codebase runs at https://revampit.orangecat.ch** (self-hosted Hetzner, deployed from `main` by `deploy-selfhost.yml`). Health check: `https://revampit.orangecat.ch/api/health`. Staff time entry (Zeiterfassung): `/admin/zeiterfassung`.

**https://www.revamp-it.ch is the org's LEGACY Joomla site — not this app.** Never verify deploys or smoke-test there. Full URL list: `docs/SHARED_CONTEXT.md` → Access Points.

---

## Design System

### How it works — three layers, each with one job

```
globals.css             ← SSOT: CSS custom properties + global dark overrides
tailwind.config.ts      ← palette scales (hex literals) + Tailwind utilities
src/lib/design/         ← TypeScript SSOT for section theming (tokens.ts) and component primitives (design-system.ts)
```

### Layer 1 — `src/app/globals.css`

**CSS custom properties** (`:root` + `.dark`) define semantic surface, text, and border tokens:

```
light / dark
--color-bg:              #fafafa   / #0a0a0a    (page background)
--color-surface:         #ffffff   / #171717    (card/panel = neutral-900)
--color-surface-raised:  #f5f5f5   / #262626    (section bg = neutral-800)
--color-border:          #e5e5e5   / rgba(255,255,255,0.06)
--color-text:            #171717   / #ffffff
--color-text-muted:      #525252   / #a3a3a3
```

**Global dark mode overrides** (in `@layer utilities`) auto-remap standard Tailwind classes in dark mode.
This means: **you do NOT need explicit `dark:` variants for these common classes**:

| Class you write | In dark mode becomes |
|---|---|
| `bg-white` | `var(--color-surface)` = neutral-900 |
| `bg-neutral-50` | `var(--color-surface-raised)` = neutral-800 |
| `bg-neutral-100` | same as neutral-50 |
| `border-neutral-200` | `var(--color-border)` = white/6% |
| `border-neutral-100` | `var(--color-border-subtle)` = white/4% |
| `text-neutral-900/800` | white |
| `text-neutral-700/600` | `var(--color-text-muted)` = neutral-400 |
| `text-neutral-500` | `var(--color-text-faint)` = neutral-500 |
| `text-primary-600` | `var(--primitive-green-500)` = #22c55e |

**Use explicit `dark:` only when** the automatic mapping is wrong for your use case (e.g. `dark:bg-neutral-950` for a deeper black, or `dark:text-primary-400` for a lighter green).

**What breaks dark mode** — avoid these:
- `shadow-lg`, `shadow-xl`, `shadow-2xl` on cards (no global override, invisible on dark)
- `bg-gradient-to-*` for decoration (flat colors only — brand CTA: `bg-primary-700`)
- Inline `style={{ background: '...' }}` (bypasses the override system)
- `border-neutral-100` on white cards (too subtle — use `border-neutral-200`)

### Layer 2 — `tailwind.config.ts`

Color palette scales (hex literals). Used via Tailwind utilities like `bg-primary-600`, `text-warning-500`.

```
primary:   green  (50→#f0fdf4 … 900→#14532d) — sustainability brand
secondary: orange (50→#fff7ed … 900→#7c2d12) — commerce/marketplace
neutral:   gray   (50→#fafafa … 900→#171717)
warning/error/info/success: standard semantic palette
brand.*:   social (mastodon, linkedin, facebook) — bg-brand-mastodon etc.
```

### Layer 3 — `src/lib/design/`

**`tokens.ts` → `DESIGN_TOKENS`**: which section uses which icon badge color (green vs orange) and button variant. Import when a component needs to know its section theme.

**`design-system.ts` → `designPrimitive`**: TypeScript strings for component-level primitives:
- `designPrimitive.surface.card` — full card class string (used by `<Card>`)
- `designPrimitive.type.*` — heading/body/meta typography strings
- `designPrimitive.button.*` — button variant strings

### Component primitives — always use these

| Pattern | Use this | Never write this |
|---|---|---|
| Content card | `<Card className="p-6">` | `<div className="bg-white rounded-xl border...">` |
| Icon circle/badge | `<IconBadge icon={X} theme="about" size="lg">` | `<div className="w-14 h-14 bg-primary-100 rounded-xl flex...">` |
| CTA band | `bg-primary-700 text-white` | `bg-gradient-to-r from-primary-700 to-primary-800` |
| Section BG light | `bg-neutral-50` (dark auto-handled) | `bg-neutral-50 dark:bg-neutral-900` (redundant) |
| Section BG white | `bg-white` (dark auto-handled) | `bg-white dark:bg-neutral-950` (unless deeper black needed) |
| Card hover | `hover:border-neutral-300` | `hover:shadow-xl` |

### Audit commands

```bash
# Arbitrary hex violations (must be zero)
grep -rn '\[#' src/

# Shadow-lg on cards (should be zero for static cards)
grep -rn 'shadow-lg\|shadow-xl\|shadow-2xl' src/app/[locale]/ src/components/

# Gradient backgrounds that should be flat
grep -rn 'bg-gradient-to' src/app/[locale]/ src/components/ | grep -v 'from-black\|to-transparent'
```

