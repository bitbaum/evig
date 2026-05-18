# Revamp-IT

Swiss non-profit platform enabling free exchange of technology — used computers repaired and rehomed, not landfilled.

@~/.claude/CLAUDE.md
@.claude/CLAUDE.md

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16, TypeScript 5.3 |
| Styling | Tailwind CSS 3.4 |
| Database | Neon PostgreSQL (cloud, Drizzle ORM) |
| Auth | NextAuth v5 (Auth.js) + @auth/pg-adapter |
| Search | Meilisearch |
| Payments | Payrexx |

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

