# Project Structure

This document outlines the organization of the RevampIT website project.

## 📁 Root Directory Structure

```
revampit/
├── 📄 README.md                    # Project overview and quick start
├── 📄 CONTRIBUTING.md               # Contribution guidelines
├── 📄 package.json                 # Node.js dependencies and scripts
├── 📄 next.config.js               # Next.js configuration
├── 📄 tailwind.config.ts           # Tailwind CSS configuration
├── 📄 tsconfig.json                # TypeScript configuration
├── 📄 .env.local                   # Environment variables (not in git)
├── 📄 deploy.sh                    # Main deployment script
├── 📄 deploy-trigger.sh            # Deployment trigger script
└── 📄 vercel.json                  # Vercel deployment config
```

## 📂 Key Directories

### `/src` - Application Source Code
```
src/
├── app/                            # Next.js App Router pages
│   ├── page.tsx                    # Homepage
│   ├── layout.tsx                  # Root layout
│   ├── globals.css                 # Global styles
│   ├── about/                      # About page
│   ├── blog/                       # Blog pages (Strapi-powered)
│   ├── contact/                    # Contact page
│   ├── get-involved/               # Get involved sections
│   ├── projects/                   # Project showcase pages
│   ├── services/                   # Service pages
│   └── workshops/                  # Workshop information
├── components/                     # React components
│   ├── layout/                     # Layout components (Header, Footer, MobileMenu, MainLayout)
│   ├── ui/                         # Reusable UI components (Button, Card, Logo, Dropdowns, etc.)
│   ├── providers/                  # Context providers (ThemeProvider, DropdownProvider)
│   └── workshops/                  # Workshop-specific components (WorkshopCard)
├── lib/                           # Utility libraries
│   ├── strapi.ts                  # Strapi CMS client
│   ├── utils.ts                   # General utilities
│   ├── contexts/                  # React contexts
│   └── hooks/                     # Custom React hooks
├── types/                         # TypeScript type definitions
│   └── strapi.ts                  # Strapi content types
└── config/                        # Configuration files
    ├── navigation.tsx             # Main navigation structure for header and footer
    └── site.ts                    # Site-wide configuration (contact info, metadata)
```

### `/strapi` - Content Management System
```
strapi/
├── 📄 package.json                # Strapi dependencies
├── 📄 tsconfig.json               # Strapi TypeScript config
├── config/                        # Strapi configuration
├── src/
│   ├── api/                       # Content type definitions
│   │   ├── blog-post/             # Blog post content type
│   │   ├── static-page/           # Static page content type
│   │   ├── category/              # Category content type
│   │   └── tag/                   # Tag content type
│   └── extensions/                # Strapi extensions
└── public/                        # Strapi public files and uploads
```

### `/docs` - Documentation
```
docs/
├── setup/                         # Setup guides
│   ├── STRAPI_SETUP_GUIDE.md     # Strapi CMS setup
│   ├── BLOG_SETUP.md             # Blog setup guide
│   └── DEPLOYMENT_SETUP.md       # Deployment instructions
├── architecture/                  # Architecture documentation
├── DEVELOPER_DOC.md              # Developer documentation
├── SERVICE_ADDITION_GUIDE.md     # How to add new services
└── WEBSITE_BLUEPRINT.md          # Website design blueprint
```

### `/scripts` - Automation Scripts
```
scripts/
├── migrate-to-strapi.js          # Migrate content to Strapi
├── setup-blog.sh                # Blog setup automation
├── setup-deploy-keybind.sh      # Deploy keybinding setup
└── start-blog.sh                 # Start blog development
```

### `/public` - Static Assets
```
public/
├── images/                       # Image assets
│   ├── about/                    # About page images
│   ├── branding/                 # Brand assets
│   ├── certification/            # Certification images
│   └── Article Pics/             # Blog article images
├── robots.txt                    # SEO robots file
├── sitemap.xml                   # Generated sitemap
└── *.svg                         # Icon files
```

### `/content` - Internationalization
```
content/
├── en/                           # English content
│   ├── common.json               # Common translations
│   └── services.json             # Service translations
└── de/                           # German content
    ├── common.json               # Common translations
    └── services.json             # Service translations
```

## 🎯 File Naming Conventions

### Pages (App Router)
- `page.tsx` - Page component
- `layout.tsx` - Layout component
- `loading.tsx` - Loading component
- `error.tsx` - Error component
- `not-found.tsx` - 404 component

### Components
- `PascalCase.tsx` - React components
- `kebab-case.tsx` - Utility components
- `index.ts` - Barrel exports

### Utilities and Libraries
- `kebab-case.ts` - Utility functions
- `camelCase.ts` - Configuration files

### Documentation
- `UPPERCASE.md` - Important documentation
- `PascalCase.md` - Feature documentation
- `kebab-case.md` - Technical guides

## 🔧 Configuration Files

| File | Purpose |
|------|---------|
| `next.config.js` | Next.js framework configuration |
| `tailwind.config.ts` | Tailwind CSS styling configuration |
| `tsconfig.json` | TypeScript compiler settings |
| `eslint.config.mjs` | Code linting rules |
| `postcss.config.js` | PostCSS processing configuration |
| `next-sitemap.config.js` | Sitemap generation settings |

## 📦 Package Scripts

| Script | Command | Purpose |
|--------|---------|---------|
| `dev` | `npm run dev` | Start Next.js development server |
| `dev:all` | `npm run dev:all` | Start both Next.js and Strapi |
| `dev:strapi` | `npm run dev:strapi` | Start only Strapi CMS |
| `build` | `npm run build` | Build for production |
| `migrate-strapi` | `npm run migrate-strapi` | Migrate content to Strapi |
| `setup-blog` | `npm run setup-blog` | Set up blog environment |

## 🎨 Styling Organization

- **Global styles**: `src/app/globals.css`
- **Component styles**: Tailwind classes in components
- **Custom components**: `src/components/ui/`
- **Layout components**: `src/components/layout/`

## 📊 Content Management

- **Static content**: React components in `/src/app`
- **Dynamic content**: Strapi CMS at `http://localhost:1337/admin`
- **Blog posts**: Managed through Strapi
- **Page content**: Editable via Strapi static pages
- **Media uploads**: Stored in `/strapi/public/uploads`

## 🔒 Environment Configuration

```bash
# .env.local (not committed to git)
STRAPI_API_URL=http://localhost:1337
STRAPI_API_TOKEN=your_token_here
NEXT_PUBLIC_STRAPI_URL=http://localhost:1337
DATABASE_URL=postgresql://...
```

This structure ensures maintainability, scalability, and clear separation of concerns across the entire project.