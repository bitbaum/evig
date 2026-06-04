# Design System — The Final Solution

**Last updated:** 2026-06-04 (commits `0c62f5c7`, `48fb78a0`)

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
| Primary button bg | `bg-action hover:bg-action-hover text-text-inverted` | `bg-primary-600 dark:bg-primary-500 ...` |
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

Counted via grep at the time of writing:

| Pattern | Count | Priority |
|---|---|---|
| Raw `<select>` in feature code | 44 | High — covered by lint warning |
| Raw `<textarea>` in feature code | 49 | High — covered by lint warning |
| `bg-white` (palette) | hundreds | Medium — auto-handled by global override; visual works but tokens are cleaner |
| `text-neutral-X` (palette) | hundreds | Medium |
| `bg-primary-X` (palette) | hundreds | Medium |
| Explicit `dark:` variants | hundreds | Low — they work, just verbose; remove during routine refactors |

Run `npm run lint` to see current warning count.

## Tailwind 4 + shadcn — the deferred upgrades

These were on the table for this session but deferred for safety:

- **Tailwind 3 → 4** is a build-tool migration (CSS-first `@theme`,
  removed utilities like `bg-opacity-X`, changed shadow defaults). The
  upgrade tool `npx @tailwindcss/upgrade` automates ~80% of it. Worth
  doing as a dedicated session AFTER the token migration is at >50%
  coverage, so the upgrade doesn't mask design drift.
- **shadcn/ui** would replace the custom primitives with Radix-based
  accessible components. Worth doing if the team welcomes the Radix
  peer-dep weight. Lower priority — the existing primitives already
  consume semantic tokens correctly, so the bug-prevention goal is met
  without shadcn.

Order of operations when ready:

1. Run `npx @tailwindcss/upgrade` on a branch.
2. Fix breakage (typecheck + dev compile).
3. Visual smoke-test the migrated surfaces (the ones already on semantic
   tokens — they should look identical).
4. Roll out shadcn primitive-by-primitive (Input first, then Select,
   etc.). Keep the existing public API of each primitive so callers
   don't break.

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
