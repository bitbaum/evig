# Project Pages Guide

**Created**: 2025-01-27  
**Last Modified**: 2025-01-27  
**Last Modified Summary**: Initial documentation for modular project page system

## Overview

The RevampIT project pages use a **modular, DRY (Don't Repeat Yourself)** architecture that ensures consistency, maintainability, and easy extension. All project pages share the same underlying components and design patterns.

## Architecture

### Component Structure

```
src/components/projects/
├── types.ts                    # TypeScript type definitions
├── ProjectHero.tsx            # Hero section component
├── ProjectSection.tsx         # Reusable section component
├── ProjectCallToAction.tsx    # CTA section component
├── ProjectPage.tsx            # Main page orchestrator
└── index.ts                   # Component exports
```

### Key Principles

1. **DRY**: No code duplication across project pages
2. **Modular**: Each component has a single responsibility
3. **Config-Driven**: Pages are defined by configuration objects
4. **Type-Safe**: Full TypeScript type safety
5. **Consistent**: All pages share the same design patterns

## Usage

### Basic Project Page

```typescript
import { Metadata } from 'next'
import { ProjectPage, generateProjectMetadata } from '@/components/projects'
import { ProjectPageConfig } from '@/components/projects/types'

const projectConfig: ProjectPageConfig = {
  hero: {
    title: 'Project Name',
    description: 'Project description',
    ctas: [
      {
        text: 'Primary Action',
        href: '/action',
        variant: 'primary'
      },
      {
        text: 'Secondary Action',
        href: '/secondary',
        variant: 'outline'
      }
    ]
  },
  sections: [
    {
      title: 'Section Title',
      description: 'Section description',
      backgroundColor: 'white',
      layout: 'grid-3',
      cards: [
        {
          title: 'Card Title',
          description: 'Card description',
          features: ['Feature 1', 'Feature 2']
        }
      ]
    }
  ],
  metadata: {
    title: 'Project Title | RevampIT',
    description: 'Project meta description'
  }
}

export const metadata: Metadata = generateProjectMetadata(projectConfig)

export default function ProjectPage() {
  return <ProjectPage config={projectConfig} />
}
```

## Component Reference

### ProjectHero

Displays the hero section with title, description, and CTAs.

**Props:**
- `hero`: ProjectHeroType
  - `title`: string
  - `description`: string
  - `backgroundColor?`: string (for custom hero colors)
  - `ctas?`: ProjectCTA[]

**CTA Variants:**
- `primary`: White button with green text
- `outline`: Transparent button with white border
- `secondary`: Default button styling

### ProjectSection

Reusable section component with flexible layouts.

**Props:**
- `section`: ProjectSectionType
  - `title`: string
  - `description?`: string
  - `cards?`: ProjectCard[]
  - `backgroundColor?`: 'white' | 'gray' | 'primary'
  - `layout?`: 'grid-2' | 'grid-3' | 'grid-4' | 'single'

**Layout Options:**
- `grid-2`: 2 columns on medium+ screens
- `grid-3`: 3 columns on medium+ screens
- `grid-4`: 4 columns on medium+ screens
- `single`: Single column

### ProjectCallToAction

Standardized CTA section for getting involved.

**Props:**
- `title`: string
- `subtitle?`: string
- `actions`: ProjectCard[]
- `backgroundColor?`: 'white' | 'gray' | 'primary'

## Design Patterns

### Background Colors

Sections alternate between white and gray backgrounds for visual hierarchy:

```typescript
sections: [
  { backgroundColor: 'white' },  // Section 1
  { backgroundColor: 'gray' },   // Section 2
  { backgroundColor: 'white' }    // Section 3
]
```

### Card Layouts

Cards adapt to content density:

- **Grid 3**: For feature highlights (3 items)
- **Grid 2**: For detailed cards (2 items)
- **Grid 4**: For simple icon lists (4 items)

### Call-to-Action Placement

CTAs appear in two places:

1. **Hero CTAs**: Primary actions in the hero section
2. **Bottom CTA**: Full involvement section at the bottom

## Examples

### Compirat Page

Located at `src/app/projects/compirat/page.tsx`

Features:
- Hero with two CTAs
- Four sections with different layouts
- Bottom CTA section with three action cards

### Linuxola Page

Located at `src/app/projects/linuxola/page.tsx`

Features:
- Mission and impact cards
- Equipment needs section
- Social sharing integration

## Migration Guide

### Converting Custom Pages

To migrate an existing custom project page:

1. **Extract configuration**: Convert hardcoded content to config object
2. **Use components**: Replace custom JSX with ProjectPage components
3. **Add CTA**: Include ProjectCallToAction for involvement section
4. **Test**: Verify visual consistency

### Before (Custom Implementation)

```typescript
export default function CustomPage() {
  return (
    <main>
      <HeroBanner title="Project" description="Description">
        <Button>Action</Button>
      </HeroBanner>
      <section className="py-20 bg-white">
        {/* Custom section code */}
      </section>
    </main>
  )
}
```

### After (Modular Implementation)

```typescript
const config: ProjectPageConfig = {
  hero: { title: 'Project', description: 'Description', ctas: [...] },
  sections: [{ title: 'Section', ... }]
}

export default function ModularPage() {
  return <ProjectPage config={config} />
}
```

## Benefits

### Maintainability
- ✅ Single source of truth for each component
- ✅ Easy to update design across all pages
- ✅ Consistent behavior and styling

### Developer Experience
- ✅ Less code to write
- ✅ Type-safe configurations
- ✅ Clear component hierarchy

### Performance
- ✅ Smaller bundle size (shared components)
- ✅ Optimized rendering

### Consistency
- ✅ All pages look professional
- ✅ Same UX patterns
- ✅ No design inconsistencies

## Best Practices

1. **Use configurations**: Define pages with config objects, not custom JSX
2. **Follow layouts**: Choose appropriate grid layouts for content density
3. **Alternate backgrounds**: Use white/gray alternation for visual flow
4. **Keep CTAs focused**: Maximum 2-3 CTAs in hero section
5. **Add CTA section**: Always include ProjectCallToAction at bottom

## Future Enhancements

- [ ] Add animation variants
- [ ] Support for custom section components
- [ ] Theme customization per project
- [ ] Analytics integration
- [ ] SEO optimization helpers

## See Also

- `SERVICE_PAGES_GUIDE.md` - Similar guide for service pages
- `ARCHITECTURE.md` - Overall system architecture
- `/src/components/projects/` - Component source code

