# Responsive Design System

**Created**: 2025-01-27  
**Last Modified**: 2026-06-27  
**Last Modified Summary**: Added current mobile marketplace/profile/header guidance, compact display scale rules, and task-first IA constraints

## Overview

This document describes the centralized responsive design system that ensures consistent, maintainable styling across all pages. Instead of manually adding responsive classes to every element, use the provided utilities and components.

## Philosophy

**Single Source of Truth**: All responsive styling is defined in one place (`src/lib/responsive.ts`), making it easy to update the entire site's mobile experience with a single change.

**Component-Based**: Use reusable components that handle responsive styling automatically, rather than manual class management.

**Mobile-First**: All styles are designed mobile-first, then enhanced for larger screens.

**Task-First Mobile**: On transactional pages, global chrome must not bury the task. Keep mobile headers compact, collapse secondary navigation into menus/sheets, and surface the page's primary action within the first viewport.

**One Primary Path**: Buyer/requester pages must make one next action visually dominant. Examples:
- `/it-hilfe`: primary = submit a request; technician browsing and open requests are secondary.
- `/it-hilfe/techniker`: primary = request help; becoming a technician is a secondary supplier path.
- `/marketplace/cart`: primary = review delivery and pay; pickup/shipping options are one review step, not separate pages.
- `/services`: primary = choose the right service; service detail pages handle booking.

## Core Utilities

### Import

```typescript
import { responsiveTypography, responsiveSpacing, responsiveButtons, responsiveGrid } from '@/lib/responsive'
```

### Typography

```typescript
// Hero headings (h1)
<h1 className={responsiveTypography.hero}>Title</h1>
// Result: text-3xl sm:text-4xl md:text-5xl lg:text-6xl

// Section headings (h2)
<h2 className={responsiveTypography.section}>Section</h2>
// Result: text-2xl sm:text-3xl md:text-4xl

// Body text
<p className={responsiveTypography.body}>Content</p>
// Result: text-sm sm:text-base
```

Current public pages should prefer `ui-public-display-md` / `ui-public-display-lg` for major headings. These utilities are intentionally restrained, use zero letter spacing, and are safer on mobile than ad hoc `text-6xl` or `tracking-tight` stacks.

### Spacing

```typescript
// Section padding
<section className={responsiveSpacing.section}>
// Result: py-12 sm:py-16 md:py-20

// Container padding
<div className={responsiveSpacing.container}>
// Result: px-4 sm:px-6

// Gaps
<div className={cn('grid', responsiveSpacing.gap)}>
// Result: gap-4 sm:gap-6 md:gap-8
```

### Buttons

```typescript
<button className={cn('bg-green-600 text-white rounded-lg', responsiveButtons.primary)}>
  Click Me
</button>
// Result: px-4 sm:px-6 md:px-8 py-2.5 sm:py-3 md:py-4 text-sm sm:text-base md:text-lg
```

### Grids

```typescript
<div className={responsiveGrid.cards}>
// Result: grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3
```

## Reusable Components

The early `ResponsiveSection` / `ResponsiveHero` / `ResponsiveHeading` components
were removed. Their jobs now belong to the shared layout primitives (see the
"Design" section of `AGENTS.md`):

### Section

```typescript
import { Section } from '@/components/layout/Section'

<Section density="default" tone="tinted">
  <h2>Content</h2>
</Section>
```

**Props** (`src/components/layout/Section.tsx`):
- `density`: 'compact' | 'default' | 'spacious' — the vertical rhythm SSOT
- `tone`: 'canvas' | 'surface' | 'tinted' | 'inverse' — token-driven, flips in dark mode
- `contained`: boolean (default: true) — content stays in the `max-w-7xl` container

### PageHero

```typescript
import { PageHero } from '@/components/layout/PageHero'

<PageHero theme="about" title="Welcome" subtitle="Subtitle" size="display">
  {/* CTAs */}
</PageHero>
```

### Heading

```typescript
import Heading from '@/components/ui/Heading'

<Heading level={2} variant="site">Section Title</Heading>
```

## Migration Guide

### Before (Manual Responsive Classes)

```typescript
<section className="py-20 bg-white">
  <div className="container mx-auto px-4">
    <h2 className="text-3xl md:text-4xl font-bold mb-6">Title</h2>
    <p className="text-lg text-gray-600">Content</p>
  </div>
</section>
```

### After (Using Components)

```typescript
<Section tone="surface">
  <Heading level={2} variant="site" className="mb-6">Title</Heading>
  <p className={responsiveTypography.bodyLarge}>Content</p>
</Section>
```

## Benefits

1. **Maintainability**: Change responsive behavior site-wide by updating one file
2. **Consistency**: All pages automatically use the same responsive breakpoints
3. **Less Code**: No need to repeat responsive classes everywhere
4. **Type Safety**: TypeScript ensures correct usage
5. **Future-Proof**: Easy to adjust breakpoints or add new responsive utilities

## Best Practices

1. **Always use components** for sections, heroes, and headings
2. **Import utilities** when you need custom responsive behavior
3. **Don't mix** manual responsive classes with the system (unless necessary)
4. **Update the system** when you need site-wide changes, not individual pages
5. **Use one control per setting** on mobile. Theme mode is one cyclic button; advanced filters live in a sheet; long nav lists live behind the menu.
6. **Use shared commerce/profile primitives**. Marketplace grids use `ListingCard`; seller/technician profiles use the same flat profile rhythm instead of nested cards.
7. **Do not duplicate module boundaries in mobile nav**. Keep user-facing choices job-based: buy/sell hardware, request IT help, book professional services, learn, contribute.

## Examples

See these files for examples:
- `src/app/[locale]/get-involved/page.tsx` - Uses `PageHero`
- `src/components/layout/PageHero.tsx` - Hero implementation (`ResponsiveHero` was folded into it)
- `src/components/services/ServiceHero.tsx` - Service-specific hero










