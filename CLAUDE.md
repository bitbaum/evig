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

### Token SSOT: `src/app/globals.css`

**There are NO CSS custom properties (no `:root` block) in `globals.css`.** The file defines only utility classes and animation keyframes — no color tokens.

**All design tokens live in `tailwind.config.ts` as literal hex values** and in `src/lib/design/tokens.ts` as Tailwind class strings.

**Tailwind config (`tailwind.config.ts`) — literal hex values (⚠️ violations: should reference CSS vars):**

```
primary:   50→#f0fdf4  100→#dcfce7  200→#bbf7d0  300→#86efac  400→#4ade80
           500→#22c55e  600→#16a34a  700→#15803d  800→#166534  900→#14532d
           (green — sustainability brand color)

secondary: 50→#fff7ed  100→#ffedd5  200→#fed7aa  300→#fdba74  400→#fb923c
           500→#F7931A  600→#ea580c  700→#c2410c  800→#9a3412  900→#7c2d12
           (Bitcoin orange)

neutral:   50→#fafafa  100→#f5f5f5  200→#e5e5e5  300→#d4d4d4  400→#a3a3a3
           500→#737373  600→#525252  700→#404040  800→#262626  900→#171717

success:   500→#22c55e  600→#16a34a  (mirrors primary)
warning:   500→#f59e0b  600→#d97706
error:     500→#ef4444  600→#dc2626
info:      500→#3b82f6  600→#2563eb
```

Font: `var(--font-inter)` (CSS var set externally, e.g. via Next.js `localFont`)

**Design token TypeScript SSOT: `src/lib/design/tokens.ts`**

`DESIGN_TOKENS` exports Tailwind class strings (not raw hex values) for page-level theming:
- `gradients` — page background gradients (e.g. `from-orange-50 to-error-50`)
- `iconBadges` — `{ bg, text }` pairs per section/page
- `buttons.primary` / `buttons.secondary` — per-section button class strings
- `focusOutline` — per-section focus ring classes
- `cards.hoverText` / `cards.border` — card-level class tokens

This file is the SSOT for **which section uses which palette**. Never hardcode section color strings in components — import from `DESIGN_TOKENS`.

**Utility classes defined in `globals.css` (`@layer utilities`):**
- `.animate-in` — 200ms animation base
- `.fade-in-0` — fadeIn keyframe
- `.zoom-in-95` — zoomIn keyframe
- `.line-clamp-2`, `.line-clamp-3` — webkit line-clamp
- `.backdrop-blur-sm` — 4px blur
- `.touch-target` — min 44×44px touch area
- `.grid-cols-responsive` — `auto-fit minmax(200px, 1fr)`
- `.fix-text-rendering` — antialiasing + kerning
- `.animate-slideUp` — 0.3s ease-out slide-up

**Named keyframes:** `fadeIn`, `zoomIn`, `slideUp`

**Utility class `.focus-ring`** (defined in globals.css):
```css
@apply focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2;
```

### SSOT Rule

Design tokens have **two SSOTs that must stay in sync**:
1. `tailwind.config.ts` — raw palette scales (hex literals — see violations below)
2. `src/lib/design/tokens.ts` — semantic Tailwind class mappings per section

Components MUST use Tailwind semantic classes from the config palette (`bg-primary-500`, `text-warning-600`), never arbitrary hex values.

Section/page color choices MUST come from `DESIGN_TOKENS` in `tokens.ts`, never hardcoded in component files.

### Violations to fix when touching UI

**No remaining `[#hex]` violations** — all arbitrary hex values have been resolved.

Third-party brand colors (Mastodon, LinkedIn, Facebook) are now named tokens under `brand.*` in `tailwind.config.ts`.
Use `bg-brand-mastodon`, `bg-brand-linkedin`, `bg-brand-facebook` (and `-hover` variants) in social/share components.

**Structural violation (known, low priority):** All palette values in `tailwind.config.ts` are literal hex strings, not CSS var references. This means retheme requires changing the config, not just `globals.css`.

**Audit commands:**
```bash
# Find all arbitrary hex violations in className props (should return zero)
grep -rn '\[#' src/
```

