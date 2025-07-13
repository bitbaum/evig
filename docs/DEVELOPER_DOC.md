# Revamp-it Developer Documentation

## Project Overview

This document provides technical documentation for the Revamp-it website project. The site is built using Next.js, React, TypeScript, and Tailwind CSS, with a focus on performance, accessibility, and internationalization.

## Technology Stack

- **Framework:** Next.js 14
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS
- **Content Management (CMS):** Strapi (headless CMS)
- **E-commerce Backend (Future):** MedusaJS
- **State Management:** React Context + Zustand
- **Testing:** Jest + React Testing Library
- **CI/CD:** GitHub Actions
- **Deployment:** Vercel

## Project Structure

```
revamp-it/
├── src/
│   ├── app/                 # Next.js app directory
│   │   ├── [lang]/         # Localized routes (e.g., /en, /de, /fr, /it)
│   │   │   ├── page.tsx    # Home page
│   │   │   ├── about/      # About page
│   │   │   ├── offerings/  # Services page
// Note: Webshop will be an external link in the initial phase.
// MedusaJS related structures will be added in a future phase.
│   │   │   └── ...
│   ├── components/         # Reusable components
│   │   ├── ui/            # Basic UI components
│   │   ├── layout/        # Layout components
│   │   └── sections/      # Page sections
│   ├── lib/               # Utility functions, API clients (Strapi)
│   ├── styles/            # Global styles
│   └── types/             # TypeScript types
├── public/                # Static assets
// The 'content/' directory for JSON files will be phased out as content moves to Strapi.
// It might be kept temporarily for migration purposes.
└── tests/               # Test files
```

## Setup Instructions

1. **Prerequisites:**
   - Node.js 18+
   - npm or yarn
   - Git

2. **Installation:**
   ```bash
   git clone https://github.com/revamp-it/website.git
   cd website
   npm install
   ```

3. **Environment Setup:**
   Create a `.env.local` file with API keys and endpoints for Strapi:
   ```
   NEXT_PUBLIC_STRAPI_API_URL=your_strapi_api_url
   STRAPI_API_TOKEN=your_strapi_api_token_for_server_side_ops

   # MedusaJS environment variables will be added in a future phase
   # NEXT_PUBLIC_MEDUSA_API_URL=your_medusa_api_url
   ```

4. **Development:**
   Ensure your local Strapi instance (or development instance) is running.
   ```bash
   npm run dev
   ```

## Localization Setup

Internationalization will be managed primarily through Strapi, with Next.js handling routing and locale detection for the planned languages (German, English, French, Italian).

1. **Strapi Configuration:**
   - In the Strapi admin panel, configure the required locales: English (`en`), German (`de`), French (`fr`), and Italian (`it`).
   - Enable localization for all relevant content types in Strapi.
   - Content editors will manage translations directly within Strapi.

2. **Next.js Configuration:**
   ```typescript
   // next.config.js
   module.exports = {
     i18n: {
       locales: ['en', 'de', 'fr', 'it'], // Ensure this matches Strapi locales
       defaultLocale: 'en',
     },
   }
   ```

3. **Content Fetching & Usage in Components:**
   - Content will be fetched from Strapi's API using a client (e.g., in `src/lib/strapi.ts`).
   - API calls to Strapi will specify the desired locale, typically derived from the Next.js router.
   - Example of fetching localized content:
     ```typescript
     // Example in a page component's data fetching function
     import { getStrapiClient } from '@/lib/strapi'; // Your Strapi client

     export async function getServerSideProps(context) {
       const { locale } = context;
       const strapiClient = getStrapiClient();
       // Example: Fetching data for a generic page based on a slug
       // The actual endpoint and query will depend on your Strapi setup
       const pageData = await strapiClient.get(`/pages?slug=${context.params.slug}&_locale=${locale}&populate=*`);
       return { props: { data: pageData.data[0], locale } };
     }

     // Usage in component
     export default function DynamicPage({ data, locale }) {
       // Use data.attributes.title, data.attributes.content etc.
       return <h1>{data.attributes.title}</h1>;
     }
     ```

## Component Development

1. **Component Structure:**
   ```typescript
   interface ComponentProps {
     // Props definition
   }
   
   export default function Component({ prop1, prop2 }: ComponentProps) {
     // Component logic
     return (
       // JSX
     )
   }
   ```

2. **Styling Guidelines:**
   - Use Tailwind CSS classes
   - Follow mobile-first approach
   - Maintain consistent spacing using design tokens

3. **Accessibility:**
   - Use semantic HTML
   - Include ARIA labels where needed
   - Ensure keyboard navigation
   - Test with screen readers

## Testing

1. **Unit Tests:**
   ```typescript
   import { render, screen } from '@testing-library/react'
   
   test('Component renders correctly', () => {
     render(<Component />)
     expect(screen.getByText('Expected Text')).toBeInTheDocument()
   })
   ```

2. **Testing Guidelines:**
   - Test component rendering
   - Test user interactions
   - Test accessibility
   - Test responsive behavior

## Deployment

1. **Production Build:**
   ```bash
   npm run build
   ```

2. **Deployment Process:**
   - Push to main branch
   - GitHub Actions runs tests
   - Vercel deploys automatically

## Contributing

1. **Branch Naming:**
   - feature/feature-name
   - bugfix/bug-name
   - hotfix/issue-name

2. **Commit Messages:**
   ```
   type(scope): description
   
   [optional body]
   
   [optional footer]
   ```

3. **Pull Requests:**
   - Include description of changes
   - Link to related issues
   - Request reviews from team members

## Performance Optimization

1. **Image Optimization:**
   - Use Next.js Image component
   - Provide appropriate sizes
   - Use WebP format when possible

2. **Code Splitting:**
   - Use dynamic imports for large components
   - Implement route-based code splitting

3. **Caching:**
   - Implement proper cache headers
   - Use SWR for data fetching

## Monitoring

1. **Error Tracking:**
   - Sentry for error monitoring
   - Logging for debugging

2. **Performance Monitoring:**
   - Vercel Analytics
   - Web Vitals monitoring

## Security

1. **Best Practices:**
   - Sanitize user input
   - Use HTTPS
   - Implement CSP headers
   - Regular dependency updates

2. **Authentication:**
   - Use secure session management
   - Implement rate limiting
   - Protect sensitive routes

## Troubleshooting

1. **Common Issues:**
   - Build failures
   - Localization problems
   - Styling conflicts

2. **Debugging:**
   - Use browser dev tools
   - Check server logs
   - Verify environment variables

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)
- [Strapi Documentation](https://docs.strapi.io/)
- [MedusaJS Documentation (for future reference)](https://docs.medusajs.com/)