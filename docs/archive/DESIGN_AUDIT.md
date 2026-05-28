# Design Audit Report

**Date**: 2026-04-21  
**Branch**: main  
**Commit**: 0f5c3ffa  

---

## Executive Summary

The codebase has a well-designed *design system* that is largely unused. `tailwind.config.ts` defines a proper semantic token layer (primary/secondary/neutral palettes, status colors), `src/lib/design/tokens.ts` defines button themes and gradients, and reusable `Button`, `Card`, `Badge` components exist in `src/components/ui/`. None of these are used on the homepage — every button, card, and color is manually inlined in JSX.

The result: the homepage looks inconsistent because it *is* inconsistent. Three different secondary button styles exist side by side. Card radii vary. Colors mix configured semantic tokens with raw Tailwind defaults (emerald, blue, purple) that have no definition in the theme. The footer has a WCAG AA contrast failure. The design system is a SSOT violation waiting to be fixed.

Information hierarchy is structurally correct (h1 → h2 → h3, mobile-first, max-w containers), but section 2 has six CTAs in one view and the social proof section has no heading — both weaken the visual rhythm.

---

## Health Scores

| Area | Score | Notes |
|------|-------|-------|
| Design Token SSOT | 3/10 | Tokens defined, almost never used |
| Typography | 5/10 | Heading scale exists; body copy has no scale |
| Color System | 4/10 | Palette defined; raw colors bypass it everywhere |
| Information Hierarchy | 7/10 | Structurally sound; CTA overload in section 2 |
| Component Consistency | 3/10 | Button/Card components ignored; everything inline |
| Responsive Design | 8/10 | Mobile-first, consistent breakpoints |
| Accessibility | 5/10 | Footer contrast fails WCAG AA; form labels missing |
| **Overall** | **5/10** | Good bones, poor execution |

---

## Critical Issues

### 1. Footer WCAG AA Contrast Failure
`src/components/layout/footer/Footer.tsx`

- `text-gray-400` (`#a3a3a3`) on `bg-gray-900` (`#171717`) → contrast ratio ≈ **2.5:1** (WCAG AA requires 4.5:1)
- Lines: gray-400 at ~L82, L111, L144; gray-500 at L85 — all fail
- **Fix:** Replace `text-gray-400` → `text-gray-200`, `text-gray-500` → `text-gray-300` in footer

### 2. Design Tokens Defined, Never Used
`src/lib/design/tokens.ts`, `tailwind.config.ts`

The file `src/lib/design/tokens.ts` defines `DESIGN_TOKENS.buttons` (themed button colors for every section) and `DESIGN_TOKENS.gradients` (13 named page gradients). The `tailwind.config.ts` defines `primary` (green), `secondary` (orange), `neutral`, `success`, `warning`, `error`, `info` semantic tokens.

**What actually happens on the homepage:**
- `src/app/[locale]/page.tsx:122` — `bg-green-600` (raw class, not `bg-primary-600`)
- `src/app/[locale]/page.tsx:160` — `bg-emerald-100` (NOT in tailwind.config.ts at all)
- `src/app/[locale]/page.tsx:275` — `bg-purple-100`, `border-purple-300`, `ring-purple-200` (NOT defined)
- `src/app/[locale]/page.tsx:164` — `bg-emerald-600 hover:bg-emerald-500` on the Repair card button
- PageHero.tsx at L34-38: only component that uses DESIGN_TOKENS — the rest of the codebase ignores it

**Colors used but not in theme:** emerald (full palette), blue (full palette), purple (full palette)  
These resolve to Tailwind's bundled defaults, bypassing the configured palette entirely.

### 3. Button and Card Components Not Used
`src/components/ui/button.tsx`, `src/components/ui/card.tsx`

Both components are fully built with variants and sizes. Neither appears on the homepage. Every button is an inline-styled `<Link>` or `<a>` tag. Every card is a `<div>` or `<Link>` with hand-rolled classes.

**Three different "secondary" button styles coexist:**
- Hero secondary: plain `text-base font-semibold text-gray-900` + arrow (`src/app/[locale]/page.tsx:127`)
- Card secondary border style: `border bg-white text-{color}` (`src/app/[locale]/page.tsx:200`)
- Community card: entire card is the link, no button element

**Two different card border radii:** `rounded-2xl` (action cards) vs `rounded-xl` (community cards)

### 4. Newsletter Form — No Labels
`src/components/community/NewsletterSignup.tsx`

Form inputs use placeholder text as the only label. `<label>` elements are missing. Screen readers and users who focus the input (which clears placeholder) have no indication of what the field is.

---

## High-Priority Issues

### 5. Heading Component Default Scale is Wrong for Marketing Pages
`src/components/ui/Heading.tsx:43`

```tsx
const variant = variantProp ?? 'admin'
```

The `admin` scale produces `text-xl` for h1 — far too small for a marketing homepage. Every page that doesn't explicitly pass `variant="site"` gets the admin (dashboard-sized) headings. The homepage uses `<Heading level={2}>` at L137 without specifying variant, likely defaulting to `text-xl` instead of the intended `text-2xl sm:text-3xl`.

**Fix:** Change default to `'site'` for `[locale]` pages, or make the default `'site'`.

### 6. Focus Style Inconsistency
Multiple files

Three different focus styles in use:
- Skip link (`src/app/layout.tsx:32`): `focus:bg-blue-600` — hardcoded **blue**
- Hero button (`src/app/[locale]/page.tsx:123`): `focus-visible:outline-green-600` — outline style, **green**
- Nav link (`src/components/layout/header/Header.tsx:100`): `focus-visible:ring-2 focus-visible:ring-emerald-500` — ring style, **emerald**
- Button component (`src/components/ui/button.tsx:17`): `focus-visible:ring-green-600` — ring style, **green**

Skip link should use green (brand color), not blue. All focus indicators should use the same style (prefer `ring-2` over outline for cross-browser consistency) and same color.

### 7. Social Proof Section Has No Heading
`src/app/[locale]/page.tsx:228-256`

Section 3 (media logos + community metrics) has no `<Heading>` — it jumps directly to logo list and stat numbers. This breaks the page's visual rhythm. The `AsSeenInLogos` component renders `"Bekannt aus"` as a `<p>` tag with `font-medium` styling, not a semantic heading.

### 8. Six CTAs in Section 2
`src/app/[locale]/page.tsx:141-209`

Three cards × (1 primary CTA + 1 secondary CTA) = 6 calls to action in one content band. Users face choice paralysis. Best practice: one primary CTA per section; secondary action as text link below.

### 9. Body Text Has No Scale
Homepage mixes arbitrary text sizes for body copy with no system:
- `text-xs` — footnotes
- `text-sm` — labels  
- `text-base` — body
- `text-lg`, `text-xl`, `text-2xl` — emphasis text, all manually picked per element

No semantic mapping (caption, body, lead, display). Every developer picks a raw Tailwind size.

---

## Medium Issues

### 10. Inline Gradients Bypass Token System
`src/app/[locale]/page.tsx`, multiple sections

`DESIGN_TOKENS.gradients` defines 13 named gradients (`'from-white to-gray-50'`, `'from-green-50 to-emerald-50'`, etc.). The homepage applies gradient classes inline on each section div, duplicating gradient values instead of using the token. `PageHero.tsx:34-38` is the only component using the token.

### 11. Custom Utilities Defined but Unused
`src/app/globals.css:42-80`

- `.touch-target` (min 44×44px) — defined, never applied; card buttons are 36px tall
- `.focus-ring` — defined, but components define their own focus styles
- `.grid-cols-responsive` — defined, unused
- `.fix-text-rendering` — defined, unused
- Custom font sizes `xs-mobile`, `sm-mobile`, `base-mobile` in `tailwind.config.ts:91-95` — defined, unused

### 12. Dark Mode Half-Implemented
`tailwind.config.ts:9` — `darkMode: 'class'`

`Button` and `Card` components have `dark:` variants. The homepage has none. Footer is fixed dark (no light-mode variant). Dark mode would render the homepage as white-on-white if class were ever toggled.

### 13. Card Button Touch Targets Below 44px
`src/app/[locale]/page.tsx:194-196`

Card primary buttons: `px-4 py-3` = 12px + 12px vertical = 24px content + 2×12px padding = 48px height. Wait — that's fine (48px > 44px).  
Card secondary buttons: `px-4 py-2` = 8px + 8px = borderline 32-36px depending on font-size. Below the 44px WCAG 2.5.5 guideline.

---

## Quick Wins (< 1 hour each)

| Fix | File | Impact |
|-----|------|--------|
| Fix footer contrast: `gray-400` → `gray-200`, `gray-500` → `gray-300` | `Footer.tsx` | WCAG AA compliance |
| Fix skip link color: `bg-blue-600` → `bg-green-600` | `src/app/layout.tsx:32` | Brand consistency |
| Add `<label>` to newsletter inputs | `NewsletterSignup.tsx` | Accessibility |
| Change Heading default variant to `'site'` | `Heading.tsx:43` | Marketing page headings |
| Add `underline` to green text links on homepage | `page.tsx:249` | Accessibility |
| Add section heading to social proof section | `page.tsx:228` | Visual hierarchy |

---

## Medium Effort (1–4 hours each)

| Task | Impact |
|------|--------|
| Replace homepage buttons with `<Button>` component | Consistency, DRY |
| Replace homepage cards with `<Card>` component | Consistency, DRY |
| Standardize focus styles to `ring-2 ring-green-600` everywhere | Accessibility |
| Add undefined colors (emerald, blue, purple) to tailwind theme or replace with configured tokens | SSOT |
| Reduce section 2 to 3 CTAs (1 primary per card, secondary as text link) | UX clarity |

---

## Strategic (Design System Unification)

The core problem is a design system that nobody follows. The fix isn't adding more tokens — it's enforcing what already exists:

1. **Mandate Button component** — remove the ability to create unstyled buttons in JSX; the component should cover all cases
2. **Remove raw color classes from homepage** — audit with `npm run lint` rule that flags raw `green-*`, `emerald-*`, `blue-*`, `purple-*` outside the ui/ components directory (add eslint-plugin-tailwindcss class order rules)
3. **Add Storybook or similar** — make the component library visible and usable
4. **Define a typographic scale** — add `prose` CSS class or a `Typography` component for body copy sections, preventing arbitrary text-size mixing

---

## File Reference Index

| File | Issue |
|------|-------|
| `src/app/[locale]/page.tsx:122` | Raw `bg-green-600` instead of primary token |
| `src/app/[locale]/page.tsx:127` | Inconsistent secondary CTA style (no border) |
| `src/app/[locale]/page.tsx:160` | `emerald-*` not in theme |
| `src/app/[locale]/page.tsx:164` | `bg-emerald-600` on Repair button |
| `src/app/[locale]/page.tsx:228–256` | Social proof section missing heading |
| `src/app/[locale]/page.tsx:249` | Green link without underline |
| `src/app/[locale]/page.tsx:275` | Purple not in theme |
| `src/app/layout.tsx:32` | Skip link uses blue, not brand green |
| `src/components/ui/Heading.tsx:43` | Default variant is 'admin', not 'site' |
| `src/components/layout/footer/Footer.tsx:82,85,111,144` | WCAG AA contrast failure |
| `src/components/community/NewsletterSignup.tsx:83–105` | Missing `<label>` on inputs |
| `src/lib/design/tokens.ts` | Comprehensive tokens, unused by homepage |
| `src/components/ui/button.tsx` | Component exists, unused on homepage |
| `src/components/ui/card.tsx` | Component exists, unused on homepage |
| `tailwind.config.ts:91-95` | Custom font sizes defined, zero usage |
| `src/app/globals.css:42-80` | Multiple utilities defined, unused |
