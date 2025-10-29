# Design System Documentation

**Created**: 2025-01-27  
**Last Modified**: 2025-01-27  
**Last Modified Summary**: Initial design system documentation

## Overview

This document outlines the design system, color palette, and CSS best practices for the RevampIT project.

## Technology Stack

### CSS Framework: Tailwind CSS
- **Version**: 3.4.1
- **Approach**: Utility-first CSS framework
- **Configuration**: Custom color system with CSS variables

### Utility Libraries
- **tailwind-merge**: Merges Tailwind classes intelligently
- **clsx**: Conditional className composition
- **Usage**: Combined in `src/lib/utils.ts` via `cn()` helper

### Component Library: Custom Components
**Decision**: Not using shadcn/ui

**Rationale**:
- Already have custom components built
- Components follow similar patterns to shadcn
- Better control over styling and behavior
- No need for additional dependencies
- Components are modular and maintainable

## Color System

### Primary Color: Green (Sustainability)
```typescript
primary: {
  50: '#f0fdf4',   // Very light green
  100: '#dcfce7',  // Light green
  200: '#bbf7d0',  // Lighter green
  300: '#86efac',  // Light-medium green
  400: '#4ade80',  // Medium green
  500: '#22c55e',  // Base green
  600: '#16a34a',  // Medium-dark green
  700: '#15803d',  // Dark green
  800: '#166534',  // Darker green
  900: '#14532d',  // Very dark green
}
```

**Usage**: Primary brand color for buttons, links, and important UI elements.

### Secondary Color: Bitcoin Orange
```typescript
secondary: {
  50: '#fff7ed',   // Very light orange
  100: '#ffedd5',  // Light orange
  200: '#fed7aa',  // Lighter orange
  300: '#fdba74',  // Light-medium orange
  400: '#fb923c',  // Medium orange
  500: '#F7931A',  // Bitcoin orange (base)
  600: '#ea580c',  // Medium-dark orange
  700: '#c2410c',  // Dark orange
  800: '#9a3412',  // Darker orange
  900: '#7c2d12',  // Very dark orange
}
```

**Usage**: Secondary actions, highlights, and accents.

## CSS Variables (Theming Support)

The design system includes CSS variables for proper theming support:

```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --card: 0 0% 100%;
  --card-foreground: 222.2 84% 4.9%;
  --primary: 142.1 76.2% 36.3%;
  --primary-foreground: 355.7 100% 97.3%;
  --secondary: 24.6 95% 53.1%;
  --secondary-foreground: 355.7 100% 97.3%;
  --muted: 210 40% 96.1%;
  --muted-foreground: 215.4 16.3% 46.9%;
  --accent: 210 40% 96.1%;
  --accent-foreground: 222.2 47.4% 11.2%;
  --border: 214.3 31.8% 91.4%;
  --input: 214.3 31.8% 91.4%;
  --ring: 142.1 76.2% 36.3%;
}
```

**Dark mode** support is also included with `.dark` class.

## Component Patterns

### Button Component
**Location**: `src/components/ui/button.tsx`

**Variants**:
- `default` / `primary`: Green background (primary brand color)
- `secondary`: Bitcoin orange background
- `outline`: Border with transparent background
- `ghost`: Transparent background with hover effect

**Sizes**:
- `sm`: Compact size
- `default`: Standard size
- `lg`: Large size

**Best Practices**:
- Uses `forwardRef` for proper ref forwarding
- Supports `as` prop for element polymorphism
- Includes focus-visible states for accessibility
- Proper disabled states

### Logo Component
**Location**: `src/components/ui/Logo.tsx`

**Current Implementation**: Stylized "R" letter with gradient background

**Props**:
- `variant`: 'light' | 'dark' (for text color)
- `showText`: boolean (shows/hides "RevampIT" text)
- `href`: string (defaults to '/')

**Status**: Ready for new logo image integration

## Accessibility Features

### Included in globals.css:

1. **Reduced Motion Support**
   ```css
   @media (prefers-reduced-motion: reduce) {
     .animate-in { animation: none; }
     * { transition-duration: 0ms !important; }
   }
   ```

2. **High Contrast Mode**
   ```css
   @media (prefers-contrast: high) {
     .dropdown-menu {
       border: 2px solid;
       box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
     }
   }
   ```

3. **Touch Targets**
   - Minimum 44x44px for mobile interaction
   - Applied via `.touch-target` utility class

4. **Focus States**
   - All interactive elements have visible focus rings
   - Uses `focus-visible` for keyboard navigation

## Icon System

### Current Icons: Lucide React
- **Package**: `lucide-react`
- **Benefits**: Tree-shakeable, consistent, high-quality
- **Usage**: Import individual icons as needed

## Responsive Design

### Breakpoints (Tailwind Default)
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

### Mobile-First Approach
All components are designed mobile-first with progressive enhancement.

## Custom Utilities

### Defined in globals.css:

1. **Animations**
   - `.animate-in`: Fade in animation
   - `.zoom-in-95`: Zoom animation
   - `.animate-slideUp`: Slide up animation

2. **Text Truncation**
   - `.line-clamp-2`: Clamp to 2 lines
   - `.line-clamp-3`: Clamp to 3 lines

3. **Scrollbars**
   - `.scrollbar-hide`: Hide scrollbar
   - `.dropdown-scroll`: Custom scrollbar styling

4. **Focus States**
   - `.focus-ring`: Standardized focus ring

## Next Steps

### TODO: Logo Integration
When the new logo is ready:
1. Add logo files to `public/images/branding/`
2. Update `Logo.tsx` to use `<Image>` component
3. Add multiple sizes for different use cases
4. Update favicon and app icons

### TODO: App Icons
Modern apps require multiple icon formats:
- `icon.svg` - SVG favicon
- `apple-icon.png` - Apple touch icon
- `icon.png` - Android icon
- Various sizes: 16x16, 32x32, 180x180, 512x512

## Migration from Hardcoded Colors

When updating components to use the new color system:

### Before:
```tsx
className="bg-green-600 text-white hover:bg-green-700"
```

### After:
```tsx
className="bg-primary-600 text-white hover:bg-primary-700"
```

This provides:
- Better consistency
- Easier theming
- Dark mode support
- Easier maintenance

## Best Practices

1. **Always use the `cn()` utility** for className composition
2. **Use semantic color names** (primary, secondary) instead of hardcoded colors
3. **Include hover and focus states** for all interactive elements
4. **Test with keyboard navigation** (Tab key)
5. **Consider dark mode** in component design
6. **Use Tailwind utilities** instead of custom CSS when possible
7. **Mobile-first** responsive design
8. **Accessibility first** - ensure sufficient contrast and proper ARIA labels

## References

- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Dark Mode Best Practices](https://uxdesign.cc/how-to-design-for-dark-mode-effb8d8e7d73)


