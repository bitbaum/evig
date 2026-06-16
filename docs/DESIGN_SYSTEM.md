# Design System — The Final Solution

**Last updated:** 2026-06-16 (Megamenu unified x.ai pattern + Marktplatz IA cleanup)

## TL;DR

The codebase had a bug class — "white text on grey dropdown" (BB.6) and
its siblings — that kept reappearing because components bypassed the
design primitives. The fix:

1. **Semantic tokens** replaced palette scales as the API. Components use
   `bg-surface-base`, `text-text-primary`, `bg-action` — not
   `bg-white dark:bg-neutral-900`, `text-neutral-700 dark:text-neutral-300`,
   `bg-primary-600`.
2. **Primitives** (`<Input>`, `<Select>`, `<Textarea>`, `<Button>`,
   `<Card>`) consume semantic tokens internally. Callers get correct
   theming without writing a single `dark:` variant.
3. **Lint** warns on raw `<select>`, `<textarea>`, and text `<input>` in
   feature code so the bug class can't return.

The colour direction: **achromatic surfaces + RevampIT green only on
action elements** (primary buttons, links, focus rings, key icons).
Everything else neutral. This preserves the brand pulse without making
the whole UI green.

## The token system

Every visual decision is one of these tokens. Component code references
them via Tailwind utility classes; the values live in `globals.css` and
flip automatically with `.dark` on `<html>`.

### Text — role-based

| Token | Tailwind class | Role |
|---|---|---|
| `--text-primary` | `text-text-primary` | Headings, primary body |
| `--text-secondary` | `text-text-secondary` | Body, descriptions |
| `--text-tertiary` | `text-text-tertiary` | Meta, labels, secondary info |
| `--text-muted` | `text-text-muted` | Placeholders, disabled |
| `--text-inverted` | `text-text-inverted` | Text on dark/action surfaces |

### Surfaces — role-based

| Token | Tailwind class | Role |
|---|---|---|
| `--surface-page` | `bg-surface-page` | Body background |
| `--surface-base` | `bg-surface-base` | Cards, panels, modals |
| `--surface-raised` | `bg-surface-raised` | Sections, secondary fills |
| `--surface-overlay` | `bg-surface-overlay` | Dropdowns, tooltips, popovers |

### Borders — role-based

| Token | Tailwind class | Role |
|---|---|---|
| `--border-subtle` | `border-subtle`, `divide-subtle` | Divider lines, table rows |
| `--border-default` | `border` (alone) | Input borders, card edges |
| `--border-strong` | `border-strong` | Focus rings, emphasis |

### Action — the only chromatic colour

| Token | Tailwind class | Role |
|---|---|---|
| `--accent-action` | `bg-action`, `text-action`, `border-action`, `ring-action` | Primary buttons, links, focus rings |
| `--accent-action-hover` | `bg-action-hover` | Hover state |
| `--accent-action-muted` | `bg-action-muted` | Subtle fills (badges, hover bg) |
| `--accent-action-text` | `text-action-text` | Text colour ON action surfaces |

### Status — minimum chromatic palette

For semantic states (error/warning/info/success) the existing `error-X`,
`warning-X`, `info-X`, `success-X` scales remain valid. These are NOT
arbitrary brand colours — they're conventional semantic signals (red =
problem, amber = caution, green = success). Keep using them for badges,
alerts, and validation states.

## Authoring rule of thumb

When writing or reviewing component code:

| Goal | Use | Don't use |
|---|---|---|
| Card / panel background | `bg-surface-base` | `bg-white dark:bg-neutral-900` |
| Section / sub-panel background | `bg-surface-raised` | `bg-neutral-50 dark:bg-neutral-800` |
| Headline text | `text-text-primary` | `text-neutral-900 dark:text-white` |
| Body text | `text-text-secondary` | `text-neutral-700 dark:text-neutral-300` |
| Meta / label text | `text-text-tertiary` | `text-neutral-500 dark:text-neutral-400` |
| Placeholder | `text-text-muted` | `text-neutral-400 dark:text-neutral-500` |
| Divider lines | `divide-subtle`, `border-subtle` | `divide-neutral-100 dark:divide-white/[0.04]` |
| Input border | (just `border`) | `border-neutral-300 dark:border-white/[0.08]` |
| Focus ring | `ring-action` | `ring-primary-500` |
| Primary button bg | `bg-action hover:bg-action-hover text-action-text` | `bg-primary-600 dark:bg-primary-500 ...` |
| Subtle "active" chip | `bg-action-muted text-action` | `bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-300` |

**Form controls (`<input>`, `<select>`, `<textarea>`):** never write raw
HTML — always use the primitives from `@/components/ui/`. ESLint warns
when you don't.

## Migrating a surface

The mechanical pattern (no thinking required):

```tsx
// BEFORE — palette scales + dark variants everywhere
<div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-white/[0.06]">
  <h2 className="text-neutral-900 dark:text-white">Title</h2>
  <p className="text-neutral-600 dark:text-neutral-400">Description</p>
  <button className="bg-primary-600 hover:bg-primary-700 text-white">Action</button>
</div>

// AFTER — semantic tokens, no dark: needed
<div className="bg-surface-base rounded-lg border">
  <h2 className="text-text-primary">Title</h2>
  <p className="text-text-secondary">Description</p>
  <button className="bg-action hover:bg-action-hover text-text-inverted">Action</button>
</div>
```

Reference migrated file: `src/app/admin/appointments/page.tsx`.

## Migration backlog

Updated 2026-06-15 after OrangeCat/FleetCrown audit + Phase 0 SSOT migration:

| Pattern | Approx. count | Status |
|---|---|---|
| Raw `<select>` in feature code | **0** | Done. ESLint warns on new occurrences. |
| Raw `<textarea>` in feature code | **0** | Done. |
| Raw text `<input>` in feature code | low | Most done; CommandBar search stays raw. |
| Semantic token classes (`text-text-*`, `bg-surface-*`, `bg-action`, `ui-public-*`) | **~6,100** | Primary API — growing. |
| Legacy palette + explicit `dark:` in feature code | **~169 → ~40** | Phase 2–4 sweep; chatbot/floating-ui migrated 2026-06-15. |
| `shadow-lg` / `shadow-xl` on static surfaces | **~5** | ESLint warns on lg/xl/2xl; overlays use `shadow-xs`. |
| **Phase 0** — SSOT adapters | done 2026-06-15 | `design-system.ts`, `tokens.ts`, `config/ui/buttons.ts`, core UI kit |
| **Phase 3b** — Shop + IT-Hilfe | done 2026-06-15 | shop overview/search/product/category, IT-Hilfe my/offers/create/accept/detail |
| **Phase 4** — Lint graduation | partial 2026-06-15 | `[locale]/**` palette+shadow rules → **error**; chatbot/floating-ui/cookie migrated |
| **Phase 5** — Admin/dashboard sweep | done 2026-06-15 | Dashboard cards → `card-shell`; overlays → `shadow-xs`; chart tooltips migrated |
| **Phase 6** — Raw control migration | done 2026-06-15 | Primitives only in feature code; ESLint design rules → **error** project-wide |

Run `npm run lint` to see palette-class warnings (new rules as of 2026-06-15).

### RevampIT vs OrangeCat — key differences

OrangeCat found semantic border utilities (`border-default`) not wired into
Tailwind. **RevampIT already wires them** via Tailwind v4 `@theme`
(`border-subtle`, `border-default`, `border-strong` in `globals.css`).

The RevampIT gap was different: **SSOT split** — `globals.css` was semantic
while `design-system.ts`, `tokens.ts`, and `config/ui/buttons.ts` still
exported palette scales into every `<Button>`, `<Card>`, and marketing
component. Phase 0 fixes that adapter layer.

**Do not blind-codemod:**
- Commerce orange (`secondary-*`) ≠ semantic `action` (green). Marketplace
  icon badges and hovers keep `secondary-*` intentionally.
- Status badges keep `error-*` / `warning-*` / `success-*` palette scales.
- `accent` / hover tints are not interchangeable with `action-muted`.

### Migration phases (recommended order)

1. **Phase 0 — SSOT adapters** (done 2026-06-15): `design-system.ts`,
   `tokens.ts`, `config/ui/buttons.ts`, core UI (`Stepper`, `Modal`,
   `Pagination`).
2. **Phase 1 — UI kit remainder**: `FilterBar`, `Tabs`, `EmptyState`,
   `ConfirmDialog`, `status-banner`, floating-ui, chatbot.
3. **Phase 2 — Feature/marketing pages**: sweep remaining ~1,200 legacy
   refs; one surface per commit.
4. **Phase 3 — Public discipline**: adopt `ui-public-*` utilities on every
   `[locale]/*` marketing page (homepage/upcycling/techniker are reference).
5. **Phase 4 — Lint graduation** (partial 2026-06-15): `[locale]/**` routes enforce
   palette + shadow rules as ESLint **errors**; chatbot, floating-ui, cookie
   banner migrated to semantic tokens. Remaining: admin/dashboard surfaces.
6. **Phase 6 — Raw control migration** (done 2026-06-15): all feature code uses
   `<Button>`, `<Input>`, `<Select>`, `<Textarea>`; design-system ESLint rules
   are **errors** project-wide (`AdminButton` + `src/components/ui/` exempt).
7. **Phase 7 — Legacy alias cleanup** (done 2026-06-15): removed duplicate
   `:root` / `.dark` `--color-bg`, `--color-surface`, `--color-text`, etc.;
   `@theme` palette scales (`primary-*`, `error-*`, …) remain for status badges.

Reference pages: `src/app/[locale]/page.tsx`, `projects/upcycling/page.tsx`,
`techniker/[id]/TechnikerProfileView.tsx`, `src/app/admin/appointments/page.tsx`.

## Tailwind 4 — current state

RevampIT runs **Tailwind CSS v4** with `@import 'tailwindcss'`,
`@custom-variant dark`, and `@theme` token wiring in `globals.css`. The
2026-06-04 note about a failed upgrade is **obsolete** — the restructure
(`@custom-variant` + semantic tokens) is complete.

Remaining work is **finishing the palette → semantic migration** in feature
code, not another Tailwind upgrade. shadcn/ui remains optional; existing
primitives in `src/components/ui/` are sufficient when they consume
`designPrimitive`.

## Why this works

The BB.6 dropdown bug was structurally enabled by:

1. The design system had primitives but didn't enforce their use.
2. The token system existed (partially) but wasn't wired into Tailwind
   utility classes, so authoring with semantic tokens was awkward.
3. There was no lint guardrail.

All three are fixed now. New components can't ship the bug. Existing
components migrate one surface at a time without breaking siblings,
because legacy palette scales still work. When the count of palette-scale
classes hits zero, we can delete the legacy aliases and the rules graduate
from warning to error.

Nothing more should be needed for the "never worry about design bugs
again" goal. Tailwind 4 + shadcn are polish, not structure.

## Navigation megamenus (2026-06-16)

Public header dropdowns follow one contract (x.ai-inspired, design-system strict):

| Element | Pattern |
|---|---|
| Panel | `bg-surface-base`, `border-subtle`, `rounded-2xl` — no shadows |
| Section label | Mono uppercase eyebrow (`font-mono text-[10px] tracking-[0.18em] text-text-tertiary`) |
| Links | Title + one-line `text-text-secondary` description when `descriptionKey` is set in nav config |
| Section footer | Mono “Overview →” linking to the section hub route |
| Avoid | Hero cards, stacked description paragraphs, `primary-*` rings, `divide-neutral-*` |

Structure SSOT: `src/config/navigation.tsx`. Rendering: `MegaMenuContent.tsx` (desktop) and `MobileMenu.tsx` (grouped sections). Labels: `nav.items.*` in locale messages.
