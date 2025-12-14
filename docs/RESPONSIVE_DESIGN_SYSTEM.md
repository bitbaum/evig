# Responsive Design System

**Created**: 2025-01-27  
**Last Modified**: 2025-01-27  
**Last Modified Summary**: Created centralized responsive design system for maintainable mobile-first styling

## Overview

This document describes the centralized responsive design system that ensures consistent, maintainable styling across all pages. Instead of manually adding responsive classes to every element, use the provided utilities and components.

## Philosophy

**Single Source of Truth**: All responsive styling is defined in one place (`src/lib/responsive.ts`), making it easy to update the entire site's mobile experience with a single change.

**Component-Based**: Use reusable components that handle responsive styling automatically, rather than manual class management.

**Mobile-First**: All styles are designed mobile-first, then enhanced for larger screens.

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

### ResponsiveSection

Use this instead of manual section styling:

```typescript
import { ResponsiveSection } from '@/components/layout/ResponsiveSection'

<ResponsiveSection backgroundColor="gray" padding="default">
  <h2>Content</h2>
</ResponsiveSection>
```

**Props:**
- `backgroundColor`: 'white' | 'gray' | 'green' | 'gradient'
- `padding`: 'default' | 'large' | 'small'
- `container`: boolean (default: true)
- `maxWidth`: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'

### ResponsiveHero

Use this for hero sections:

```typescript
import { ResponsiveHero } from '@/components/layout/ResponsiveHero'

<ResponsiveHero
  title="Welcome"
  subtitle="Subtitle"
  description="Description text"
  backgroundColor="green"
  ctas={[
    { text: 'Get Started', href: '/start', variant: 'primary' },
    { text: 'Learn More', href: '/about', variant: 'outline' }
  ]}
/>
```

### ResponsiveHeading & ResponsiveText

Use these for consistent typography:

```typescript
import { ResponsiveHeading, ResponsiveText } from '@/components/layout/ResponsiveSection'

<ResponsiveHeading level={2} align="center">Section Title</ResponsiveHeading>
<ResponsiveText variant="lead" align="center">Description text</ResponsiveText>
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
<ResponsiveSection backgroundColor="white">
  <ResponsiveHeading level={2} className="mb-6">Title</ResponsiveHeading>
  <ResponsiveText variant="bodyLarge" className="text-gray-600">Content</ResponsiveText>
</ResponsiveSection>
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

## Examples

See these files for examples:
- `src/app/get-involved/page.tsx` - Uses ResponsiveSection
- `src/components/layout/ResponsiveHero.tsx` - Hero implementation
- `src/components/services/ServiceHero.tsx` - Service-specific hero












