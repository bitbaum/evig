# Service Addition Guide

This guide ensures consistency when adding new services to the RevampIT website. Follow ALL steps to maintain proper navigation, SEO, and user experience.

## Complete Checklist for Adding a New Service

### 1. Service Page Creation
- [ ] Create service page at `src/app/services/[service-slug]/page.tsx`
- [ ] Use kebab-case for URL slug (e.g., `enterprise-ai-solutions`)
- [ ] Include proper metadata (title, description, OpenGraph)
- [ ] Add structured data (schema.org) for SEO
- [ ] Follow existing design patterns and component structure

### 2. Main Services Page Update
- [ ] Add service to `coreServices` array in `src/app/services/page.tsx`
- [ ] Include appropriate icon from lucide-react
- [ ] Add service to `serviceType` array in structured data
- [ ] Ensure pricing and highlight information is accurate

### 3. Navigation Updates
- [ ] Add service to `subItems` in `src/config/navigation.tsx`
- [ ] Include descriptive text for dropdown menu
- [ ] Verify navigation works on both desktop and mobile

### 4. SEO and Metadata
- [ ] Update sitemap if using dynamic generation
- [ ] Verify meta tags and OpenGraph data
- [ ] Test structured data with Google's Rich Results Test
- [ ] Ensure proper canonical URLs

### 5. Content Requirements
Each service page should include:
- [ ] Hero section with clear value proposition
- [ ] Problem/solution sections
- [ ] Technical details or process explanation
- [ ] Pricing information (if applicable)
- [ ] Industry applications or use cases
- [ ] Call-to-action sections
- [ ] Contact/consultation links

### 6. Design Consistency
- [ ] Use consistent color schemes (green for RevampIT brand)
- [ ] Follow existing typography hierarchy
- [ ] Maintain consistent spacing and layout patterns
- [ ] Ensure responsive design works on all devices
- [ ] Use appropriate icons and visual elements

### 7. Testing Checklist
- [ ] Test navigation links (desktop dropdown)
- [ ] Test mobile navigation menu
- [ ] Verify all internal links work correctly
- [ ] Check responsive design on multiple screen sizes
- [ ] Test page loading performance
- [ ] Validate HTML and accessibility

## File Structure Template

When adding a new service, create these files:

```
src/app/services/[service-slug]/
├── page.tsx                 # Main service page
└── loading.tsx             # Optional loading component
```

## Code Templates

### Service Page Template (`page.tsx`)

```typescript
import { Metadata } from 'next'
import { 
  // Import relevant icons from lucide-react
} from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Service Name | RevampIT',
  description: 'Service description for SEO',
  openGraph: {
    title: 'Service Name | RevampIT',
    description: 'Service description for social sharing',
    type: 'website',
    url: 'https://revampit.org/services/service-slug',
  },
}

// Define data structures for service content
const serviceData = {
  // Service-specific data
}

export default function ServicePage() {
  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Service',
            'name': 'Service Name',
            'description': 'Service description',
            'provider': {
              '@type': 'Organization',
              'name': 'RevampIT',
              'url': 'https://revampit.org'
            },
            'serviceType': 'Service Category',
            'areaServed': {
              '@type': 'Country',
              'name': 'Switzerland'
            }
          })
        }}
      />
      
      <main className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-green-700 via-green-800 to-green-900 text-white py-24 overflow-hidden">
          {/* Hero content */}
        </section>

        {/* Additional sections */}
        
        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-green-700 to-green-800 text-white">
          {/* Call to action */}
        </section>
      </main>
    </>
  )
}
```

### Main Services Page Addition

Add to `coreServices` array in `src/app/services/page.tsx`:

```typescript
{
  title: 'Service Name',
  description: 'Brief service description for the main services page',
  icon: ServiceIcon, // Import from lucide-react
  features: [
    'Key feature 1',
    'Key feature 2',
    'Key feature 3',
    'Key feature 4'
  ],
  pricing: 'Pricing information',
  highlight: 'Special highlight or offer'
}
```

### Navigation Addition

Add to `subItems` in Services section of `src/config/navigation.tsx`:

```typescript
{
  name: 'Service Name',
  href: '/services/service-slug',
  description: 'Brief description for navigation dropdown'
}
```

## Design Guidelines

### Color Scheme
- Primary: Green (#16a34a, #15803d, #166534)
- Secondary: Gray (#f9fafb, #f3f4f6, #e5e7eb)
- Accent: Blue for specific services (if needed)

### Typography
- Headings: font-bold with appropriate text sizes
- Body: text-gray-600 or text-gray-700
- Links: text-green-600 with hover states

### Icons
- Use lucide-react icons consistently
- Size: w-6 h-6 for small, w-8 h-8 for medium, w-16 h-16 for large
- Colors: Match the section's color scheme

### Spacing
- Sections: py-20 for main sections, py-16 for smaller sections
- Containers: container mx-auto px-4
- Grids: gap-8 for main grids, gap-6 for smaller grids

## Common Mistakes to Avoid

1. **Forgetting Navigation Updates**: Always update both desktop and mobile navigation
2. **Inconsistent URLs**: Use kebab-case for all service URLs
3. **Missing Metadata**: Every page needs proper SEO metadata
4. **Broken Internal Links**: Test all links after adding new services
5. **Inconsistent Design**: Follow existing patterns for colors, spacing, and typography
6. **Missing Structured Data**: Include schema.org markup for SEO
7. **Poor Mobile Experience**: Test on mobile devices and small screens
8. **Accessibility Issues**: Ensure proper heading hierarchy and alt text

## Quality Assurance

Before considering a service addition complete:

1. **Manual Testing**
   - Navigate to the service from the main menu
   - Test all links on the service page
   - Verify mobile navigation works
   - Check responsive design

2. **SEO Validation**
   - Use Google's Rich Results Test
   - Verify meta tags in browser dev tools
   - Check page loading speed

3. **Content Review**
   - Ensure consistent tone and messaging
   - Verify all information is accurate
   - Check for typos and grammar

4. **Cross-browser Testing**
   - Test in Chrome, Firefox, Safari
   - Verify on different devices

## Maintenance

- Review service pages quarterly for accuracy
- Update pricing and features as needed
- Monitor analytics for user engagement
- Keep technical information current

---

**Remember**: Consistency is key to maintaining a professional website. When in doubt, follow existing patterns and ask for review before publishing. 