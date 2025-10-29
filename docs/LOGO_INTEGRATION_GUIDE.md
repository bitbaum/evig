# Logo Integration Guide

**Created**: 2025-01-27  
**Last Modified**: 2025-01-27  
**Last Modified Summary**: Guide for integrating new logo assets

## Overview

This guide explains how to integrate the new RevampIT logo once it's generated. The current system uses a placeholder stylized "R" letter and is ready for logo image integration.

## Current Status

### Logo Component
**Location**: `src/components/ui/Logo.tsx`

**Current Implementation**:
- Stylized "R" letter with green gradient background
- Circular/rounded square container
- Responsive sizing
- Hover effects
- Text option ("RevampIT")

### Placeholder Icon
**Location**: `public/icon.svg`

**Current**: SVG placeholder with green gradient and "R" letter

## Required Logo Assets

When you generate the new logo, prepare the following sizes:

### SVG (Recommended)
- `logo.svg` - Vector version for scaling
- Optimized for web (under 50KB)
- Should work at any size

### PNG Versions
- `logo-16.png` - 16x16px (favicon)
- `logo-32.png` - 32x32px (favicon)
- `logo-180.png` - 180x180px (Apple touch icon)
- `logo-512.png` - 512x512px (PWA icon)
- `logo-full.png` - Full logo with text (for headers)

### Optional
- `logo-dark.svg` - Dark mode variant
- `logo-light.svg` - Light mode variant
- `logo-icon-only.svg` - Icon only (no text)

## Integration Steps

### Step 1: Add Logo Files

Place logo files in `public/images/branding/`:

```
public/
└── images/
    └── branding/
        ├── logo.svg
        ├── logo-full.png
        ├── logo-dark.svg
        └── logo-light.svg
```

### Step 2: Update Logo Component

Update `src/components/ui/Logo.tsx`:

```tsx
import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface LogoProps {
  className?: string
  href?: string
  showText?: boolean
  variant?: 'light' | 'dark'
}

export function Logo({ className, href = '/', showText = true, variant = 'dark' }: LogoProps) {
  const logoSrc = showText 
    ? '/images/branding/logo-full.png'
    : '/images/branding/logo.svg'
  
  return (
    <Link href={href} className={cn('flex items-center gap-3 group', className)}>
      <div className="relative w-10 h-10 transition-all duration-200 group-hover:scale-105">
        <Image
          src={logoSrc}
          alt="RevampIT Logo"
          width={40}
          height={40}
          className="object-contain"
          priority
        />
      </div>
      {showText && (
        <span className={cn(
          'text-xl font-bold',
          variant === 'light' ? 'text-white' : 'text-gray-900'
        )}>
          RevampIT
        </span>
      )}
    </Link>
  )
}
```

### Step 3: Update Favicon

Replace `src/app/favicon.ico` with new favicon:

```bash
# Convert logo to ICO format (use online tool or ImageMagick)
# Then replace src/app/favicon.ico
```

Or use Next.js metadata API in `src/app/layout.tsx`:

```tsx
export const metadata: Metadata = {
  title: "RevampIT",
  description: "...",
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: 'any' }
    ],
    apple: [
      { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' }
    ]
  }
}
```

### Step 4: Create App Icons

Update `public/icon.svg` and create `public/apple-icon.png`:

1. **icon.svg**: Use your new logo, optimize for 512x512px viewing
2. **apple-icon.png**: 180x180px PNG version

### Step 5: Update Documentation

Update `docs/DESIGN_SYSTEM.md` to reflect:
- Logo usage guidelines
- Size requirements
- Placement recommendations
- Color variants (if applicable)

## Testing Checklist

- [ ] Logo displays correctly in header/navigation
- [ ] Logo displays correctly in footer
- [ ] Favicon appears in browser tab
- [ ] Apple touch icon works on iOS
- [ ] Logo scales properly on mobile
- [ ] Logo has proper contrast in both light/dark modes
- [ ] Logo is not pixelated at any size
- [ ] Logo loads quickly (< 1s)
- [ ] Logo alt text is appropriate
- [ ] Logo is accessible (contrast ratio meets WCAG AA)

## Best Practices

### SVG vs PNG
- **Use SVG** for logos when possible (vector, scales perfectly)
- **Use PNG** only for complex gradients or when SVG isn't available
- Optimize PNG files (use tools like TinyPNG or ImageOptim)

### Size Optimization
- Keep logo files under 50KB
- Use Next.js Image component for automatic optimization
- Consider different sizes for different use cases

### Accessibility
- Always include alt text
- Ensure sufficient contrast
- Test with screen readers
- Maintain aspect ratio

### Performance
- Use `priority` prop for above-the-fold logos
- Preload critical logo assets
- Consider lazy loading for below-the-fold instances

## Color Recommendations

### Primary Logo Color
- **Green**: `#22c55e` (primary-500)
- Matches sustainability theme

### Secondary Accent
- **Bitcoin Orange**: `#F7931A` (secondary-500)
- Can be used as accent color in logo if desired

### Usage Guidelines
- Use primary green for main logo
- Use Bitcoin orange sparingly for accents
- Ensure logo maintains contrast on any background
- Consider dark mode variants

## Troubleshooting

### Logo appears pixelated
- Use SVG instead of PNG
- Ensure source file is high resolution
- Check Next.js Image optimization settings

### Logo doesn't load
- Verify file path is correct
- Check file exists in `public/` directory
- Clear browser cache
- Check browser console for errors

### Logo is too large
- Optimize SVG with SVGO
- Compress PNG files
- Use Next.js Image component for automatic optimization

## References

- [Next.js Image Optimization](https://nextjs.org/docs/pages/api-reference/components/image)
- [SVG Optimization Guide](https://css-tricks.com/understanding-how-to-use-svg-optimization/)
- [Favicon Best Practices](https://css-tricks.com/essential-favicon-howto/)


