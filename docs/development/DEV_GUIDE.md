---
created_date: 2026-01-30
last_modified_date: 2026-01-30
last_modified_summary: Initial creation of comprehensive development guide for developers and AI agents
---

# RevampIT Development Guide

**The definitive guide for developers and AI agents working on the RevampIT platform.**

> **Purpose**: This document serves as the single source of truth for all development practices, patterns, and standards. Every code change should align with these guidelines.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Core Principles](#core-principles)
3. [Architecture Patterns](#architecture-patterns)
4. [Code Quality Standards](#code-quality-standards)
5. [File Organization](#file-organization)
6. [TypeScript & Type Safety](#typescript--type-safety)
7. [Error Handling](#error-handling)
8. [Testing Practices](#testing-practices)
9. [Security Guidelines](#security-guidelines)
10. [Performance Best Practices](#performance-best-practices)
11. [Documentation Standards](#documentation-standards)
12. [Git Workflow](#git-workflow)
13. [Code Review Checklist](#code-review-checklist)
14. [AI Agent Specific Guidelines](#ai-agent-specific-guidelines)
15. [Common Anti-Patterns](#common-anti-patterns)
16. [Quick Reference](#quick-reference)

---

## Quick Start

### For New Developers
1. **Read this guide** - Understand the principles and patterns
2. **Set up environment** - See `CONTRIBUTING.md` for setup instructions
3. **Review architecture** - See `docs/guides/ARCHITECTURE.md`
4. **Explore codebase** - Start with `src/app/` for routes and `src/components/` for UI

### For AI Agents
1. **Read `docs/BEST_PRACTICES.md`** - Critical AI slop prevention guidelines
2. **Review this guide** - Understand all principles
3. **Check `DEVELOPMENT_GUIDELINES.md`** - File deletion protection and critical rules
4. **Read agent-specific guide** - See agent-specific instructions below
5. **Use semantic search** - Always search before creating new files

#### Agent-Specific Guides

**Choose the guide for your AI agent:**
- **Cursor Cloud Code (Composer)**: `docs/development/cursor.md` - For agents in Cursor IDE
- **Google Gemini**: `docs/development/gemini.md` - For Gemini agents
- **Claude/Codex**: `docs/development/claude.md` - For Claude agents

Each guide contains agent-specific capabilities, limitations, and workflow patterns tailored to that agent's interface and tools.

---

## Core Principles

### 1. DRY (Don't Repeat Yourself)

**Definition**: Every piece of knowledge should have a single, unambiguous representation.

**In Practice**:
- Extract repeated code into shared functions/utilities
- If you copy-paste code, it should become a shared module
- Look for patterns across similar features (products, services, workshops)

**Bad Example**:
```typescript
// Multiple API routes with identical logic
// src/app/api/products/route.ts - 150 lines
// src/app/api/services/route.ts - 150 lines (95% identical)
```

**Good Example**:
```typescript
// src/lib/api/generic-handler.ts
export async function handleEntityList(entityType: string) {
  // Shared logic, entity-specific differences from config
}
```

### 2. SSOT (Single Source of Truth)

**Definition**: Each piece of data/config should be defined in exactly one place.

**In Practice**:
- Use `src/config/` for all configuration
- Database schema defines structure, types derive from it
- API endpoints, paths, names come from config files

**Bad Example**:
```typescript
// Hardcoded in multiple places
const tableName = 'user_products';
const apiEndpoint = '/api/products';
```

**Good Example**:
```typescript
// src/config/entities.ts
export const ENTITY_CONFIG = {
  product: {
    tableName: 'user_products',
    apiEndpoint: '/api/products',
    // ... all metadata
  }
};
```

### 3. Separation of Concerns

**Layers**:
- **Frontend** (`src/app/`, `src/components/`): UI rendering, user interaction
- **API Routes** (`src/app/api/`): HTTP layer, request/response handling
- **Business Logic** (`src/lib/`): Utilities, helpers, shared logic
- **CMS API** (`cms-api/`): Backend content management
- **Config** (`src/config/`): Static configuration, metadata

**Rules**:
- API routes should be thin - delegate to lib functions
- Components should not contain business logic
- CMS API should not know about Next.js specifics

### 4. Modularity & Composability

- Build small, focused modules
- Compose functionality through hooks and utilities
- Prefer composition over inheritance

**Example - React Hook Pattern**:
```typescript
// src/hooks/useEntityList.ts
export function useEntityList(entityType: string) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchEntities(entityType).then(setData).finally(() => setLoading(false));
  }, [entityType]);
  
  return { data, loading };
}
```

### 5. Type Safety

- TypeScript everywhere with strict mode
- Derive types from schemas when possible
- Avoid `any` unless absolutely necessary

```typescript
// ✅ GOOD: Proper typing
interface User {
  id: string;
  email: string;
  name: string;
}

// ✅ GOOD: Derive from schema
const userSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
});
type User = z.infer<typeof userSchema>;
```

### 6. Code Simplicity

> **Beautiful code is simple, reliable, and maintainable.**

- Every line should serve a purpose
- Every abstraction should reduce complexity, not add it
- Extract common patterns into helper functions
- Simplify conditionals
- Extract constants

**Example**:
```typescript
// ❌ BAD: Inline complex logic
const formattedDate = typeof date === 'string' 
  ? new Date(date).toLocaleDateString('de-CH')
  : date.toLocaleDateString('de-CH');

// ✅ GOOD: Extract helper
import { formatSwissDate } from '@/lib/utils';
const formattedDate = formatSwissDate(date);
```

### 7. AI Slop Prevention ⚠️ CRITICAL

**Before creating ANY new file, component, or feature:**

1. ✅ **Search the codebase thoroughly** - Use semantic search
2. ✅ **Verify file doesn't already exist** - Check exact paths and naming variations
3. ✅ **Check for conflicting patterns** - Ensure consistency
4. ✅ **Verify single source of truth** - Don't duplicate constants/types
5. ✅ **Confirm integration points** - Ensure new code integrates properly

See `docs/BEST_PRACTICES.md` for detailed AI slop prevention guidelines.

---

## Architecture Patterns

### Next.js App Router Pattern

All routes should follow Next.js 13+ App Router conventions:

```typescript
// src/app/products/page.tsx - List page
export default async function ProductsPage() {
  const products = await fetchProducts();
  return <ProductList products={products} />;
}

// src/app/products/[id]/page.tsx - Detail page
export default async function ProductPage({ params }: { params: { id: string } }) {
  const product = await fetchProduct(params.id);
  return <ProductDetail product={product} />;
}
```

### API Route Pattern

API routes should follow consistent patterns:

```typescript
// src/app/api/products/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const products = await fetchProducts();
    return NextResponse.json({ success: true, data: products });
  } catch (error) {
    logger.error('Failed to fetch products', { error });
    return NextResponse.json(
      { success: false, error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}
```

### Component Pattern

Components should follow consistent structure:

```typescript
// src/components/products/ProductCard.tsx
'use client'; // Only if using hooks

import Image from 'next/image';
import Link from 'next/link';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <Link href={`/products/${product.id}`}>
      <div className="rounded-lg border p-4">
        <Image src={product.image} alt={product.name} />
        <h3>{product.name}</h3>
        <p>{product.description}</p>
      </div>
    </Link>
  );
}
```

### CMS API Integration Pattern

When integrating with the custom CMS API:

```typescript
// src/lib/cms-api.ts
import { CMS_API_URL } from '@/config/site';

export async function fetchPage(id: string) {
  const response = await fetch(`${CMS_API_URL}/api/pages/${id}`, {
    headers: {
      'Authorization': `Bearer ${getAuthToken()}`,
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch page');
  }
  
  return response.json();
}
```

---

## Code Quality Standards

### Consistency

- All similar features should follow identical patterns
- If Products use a pattern, Services, Workshops, etc. should too
- If one entity has a feature, decide: all entities get it, or none

### Error Handling

- Use standardized response helpers
- Never return raw errors to clients
- Log detailed errors server-side using `src/lib/logger.ts`

```typescript
// ✅ GOOD: Consistent error handling
import { logger } from '@/lib/logger';

try {
  const data = await processRequest();
  return NextResponse.json({ success: true, data });
} catch (error) {
  logger.error('Operation failed', { error, context });
  return NextResponse.json(
    { success: false, error: 'Operation failed' },
    { status: 500 }
  );
}
```

### Naming Conventions

- **Components**: PascalCase (`ProductCard.tsx`)
- **Hooks**: camelCase with `use` prefix (`useProductList`)
- **Utilities**: camelCase (`formatPrice`, `getPagination`)
- **Constants**: UPPER_SNAKE_CASE (`CMS_API_URL`)
- **Types/Interfaces**: PascalCase (`ProductMetadata`)
- **Files**: kebab-case for files (`product-card.tsx`), PascalCase for components

### Code Style

- ESLint + Prettier for consistent formatting
- TypeScript strict mode enabled
- No `any` types (except in rare, well-documented cases)
- Comprehensive error handling
- **No `console.log` in production** - Use `src/lib/logger.ts` instead

### File Size Guidelines

- Keep files under 400 lines when possible
- If a file grows large, extract sub-components or utilities
- Prefer multiple small files over one large file

---

## File Organization

### Directory Structure

```
src/
├── app/                    # Next.js 13+ App Router
│   ├── api/               # API routes (thin layer)
│   ├── (authenticated)/   # Protected routes
│   └── auth/              # Authentication pages
├── components/            # React components
│   ├── ui/               # Generic UI (Button, Card)
│   ├── products/         # Product-specific components
│   └── layout/           # Layout components
├── config/               # Static configuration
│   ├── site.ts           # Site-wide config
│   └── navigation.tsx   # Navigation config
├── lib/                  # Utilities and helpers
│   ├── api/             # API helpers
│   ├── auth/            # Authentication utilities
│   └── utils.ts         # General utilities
├── hooks/                # React hooks
├── middleware/           # Next.js middleware
└── types/                # TypeScript types

cms-api/                  # Custom CMS API (Express.js)
├── src/
│   ├── controllers/     # Request handlers
│   ├── middleware/      # Express middleware
│   ├── routes/          # API route definitions
│   └── utils/           # Utility functions
```

### File Placement Rules

**NEVER create files in the root directory except**:
- Standard config files (package.json, tsconfig.json, .env, etc.)
- Essential project files (README.md, LICENSE, .gitignore)

**ALWAYS place files in appropriate directories**:
- Scripts → `/scripts/{category}/` (db, deployment, dev, test, etc.)
- Tests → `/__tests__/` or `/src/**/__tests__/`
- Documentation → `/docs/{category}/`
- Build artifacts → `/dist/` or `/build/`
- Logs → `/logs/` (and add to .gitignore)
- Temp files → `/tmp/` (and add to .gitignore)

**BEFORE creating ANY new file**:
1. Check if similar functionality exists
2. Determine the correct directory based on file purpose
3. Follow existing naming conventions
4. Never create duplicate functionality

---

## TypeScript & Type Safety

### Type Safety Rules

- **Always use proper TypeScript types** - Avoid `any` unless absolutely necessary
- **Prefer interfaces for object shapes** - Use types for unions/primitives
- **Derive types from schemas** - Zod schemas should be the source of truth when possible
- **Use strict mode** - TypeScript strict mode is enabled

### Type Patterns

```typescript
// ✅ GOOD: Interface for object shape
interface UserProfile {
  id: string;
  name: string;
  email: string;
}

// ✅ GOOD: Type for union
type Status = 'draft' | 'active' | 'paused';

// ✅ GOOD: Derive from schema (when using Zod)
const userSchema = z.object({
  name: z.string(),
  email: z.string().email(),
});
type User = z.infer<typeof userSchema>;

// ❌ BAD: Using any
function processData(data: any) { ... }

// ✅ GOOD: Proper typing
function processData<T>(data: T): ProcessedData<T> { ... }
```

### Validation

- **Always validate user input** - Validate all incoming requests
- **Validate at API boundaries** - Check data at API route entry points
- **Type-safe database queries** - Use typed database clients

```typescript
// ✅ GOOD: Validate at API boundary
export async function POST(request: NextRequest) {
  const body = await request.json();
  
  // Validate with schema or manual checks
  if (!body.email || !body.name) {
    return NextResponse.json(
      { success: false, error: 'Missing required fields' },
      { status: 400 }
    );
  }
  
  // ... use validated data
}
```

---

## Error Handling

### Error Classification

```typescript
// Use appropriate HTTP status codes
enum HttpStatus {
  OK = 200,
  CREATED = 201,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  INTERNAL_SERVER_ERROR = 500,
}
```

### Error Handling Patterns

**API Routes**:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const data = await fetchData();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    logger.error('Failed to fetch data', { error, url: request.url });
    
    if (error instanceof ValidationError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

**Frontend Components**:
```typescript
'use client';

import { ErrorBoundary } from 'react-error-boundary';

function ErrorFallback({ error, resetErrorBoundary }: any) {
  return (
    <div role="alert" className="p-4 border border-red-500 rounded">
      <p>Something went wrong:</p>
      <pre className="text-sm">{error.message}</pre>
      <button onClick={resetErrorBoundary}>Try again</button>
    </div>
  );
}

export function ComponentWithErrorBoundary() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      {/* Your component */}
    </ErrorBoundary>
  );
}
```

### Error Handling Rules

- **Never expose internal errors** - Sanitize error messages for clients
- **Log detailed errors server-side** - Include context, stack traces using logger
- **Use error boundaries** - Catch React component errors gracefully
- **Handle async errors** - Always catch promises and async/await

---

## Testing Practices

### Testing Philosophy

- **Write tests alongside code** - Don't defer testing
- **Test behavior, not implementation** - Focus on what, not how
- **Keep tests simple** - One assertion per test when possible
- **Use descriptive test names** - `it('should return 404 when product not found')`

### Test Organization

- **Colocate tests** - Place tests next to code (`Component.test.tsx`)
- **Use `__tests__` directories** - For test utilities and fixtures
- **Test files should mirror source structure**

### Testing Patterns

```typescript
// ✅ GOOD: Descriptive test
import { render, screen } from '@testing-library/react';
import { ProductCard } from './ProductCard';

describe('ProductCard', () => {
  it('should display product title and description', () => {
    const product = { id: '1', title: 'Test Product', description: 'Test desc' };
    render(<ProductCard product={product} />);
    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('Test desc')).toBeInTheDocument();
  });
});
```

### Test Coverage Goals

- **Critical paths**: 100% coverage
- **Business logic**: 80%+ coverage
- **UI components**: Test user interactions
- **API routes**: Test all endpoints

---

## Security Guidelines

### Authentication & Authorization

- **Always check authentication** - Use middleware for protected routes
- **Verify permissions** - Check user can access resource
- **Use secure password hashing** - bcrypt with appropriate rounds
- **Never trust client input** - Validate and sanitize all inputs

### Input Validation

- **Validate all inputs** - Check at API boundaries
- **Sanitize user content** - Prevent XSS attacks
- **Use parameterized queries** - Prevent SQL injection
- **Rate limit APIs** - Prevent abuse

### Security Checklist

- [ ] All API routes have authentication checks
- [ ] User inputs are validated
- [ ] Database queries use parameterized statements
- [ ] Sensitive data is not logged
- [ ] Environment variables are not committed
- [ ] Dependencies are up to date
- [ ] HTTPS enforced in production

---

## Performance Best Practices

### Frontend Performance

- **Code splitting** - Use dynamic imports for large components
- **Image optimization** - Use Next.js Image component
- **Lazy loading** - Load components and data on demand
- **Memoization** - Use React.memo, useMemo, useCallback appropriately

### Backend Performance

- **Database indexing** - Index frequently queried columns
- **Query optimization** - Avoid N+1 queries, use joins
- **Caching** - Cache expensive computations and API responses
- **Pagination** - Always paginate large datasets

### Performance Patterns

```typescript
// ✅ GOOD: Dynamic import for code splitting
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <Loading />,
});

// ✅ GOOD: Memoize expensive computations
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data);
}, [data]);

// ✅ GOOD: Paginate queries
const { data } = await supabase
  .from('products')
  .select('*')
  .range(offset, offset + limit - 1);
```

---

## Documentation Standards

### Documentation Requirements

Every documentation file must include frontmatter:

```yaml
---
created_date: YYYY-MM-DD
last_modified_date: YYYY-MM-DD
last_modified_summary: Brief description of changes
---
```

### Documentation Rules

1. **Check for existing documentation** - Update, don't duplicate
2. **Update dates** - Always update `last_modified_date`
3. **Clear summaries** - Describe changes concisely
4. **Proper organization** - Place in appropriate `docs/` subdirectory

### Code Documentation

- **Document complex logic** - Explain why, not what
- **Use JSDoc for functions** - Document parameters and return values
- **Keep comments up to date** - Update when code changes
- **Prefer self-documenting code** - Good names > comments

```typescript
// ✅ GOOD: Self-documenting code
function calculateTotalPrice(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

// ✅ GOOD: Document complex logic
/**
 * Calculates the discounted price based on user tier and quantity.
 * Applies tier discount first, then bulk discount if applicable.
 */
function calculateDiscountedPrice(
  basePrice: number,
  userTier: UserTier,
  quantity: number
): number {
  // ... complex logic
}
```

---

## Git Workflow

### Branch Strategy

- **`main`**: Production-ready code
- **`develop`**: Integration branch for features (if used)
- **`feature/*`**: Feature development branches
- **`fix/*`**: Bug fix branches
- **`hotfix/*`**: Critical production fixes

### Commit Messages

Follow conventional commits:

```
feat: add product card component
fix: resolve authentication redirect issue
docs: update development guide
refactor: extract common API handler logic
test: add tests for product service
chore: update dependencies
```

### Commit Rules

- **One logical change per commit** - Don't mix unrelated changes
- **Write clear commit messages** - Explain what and why
- **Test before committing** - Ensure code works
- **Review your own changes** - Check diff before committing

---

## Code Review Checklist

Before submitting code for review, verify:

### General
- [ ] Code follows project style guide
- [ ] No `console.log` statements (use `src/lib/logger.ts`)
- [ ] No commented-out code
- [ ] No hardcoded values (use constants/config)

### Principles
- [ ] **DRY**: No duplicated code
- [ ] **SSOT**: Data defined in one place
- [ ] **Consistency**: Follows patterns used by similar features
- [ ] **Type Safety**: Proper TypeScript types, no `any`
- [ ] **Error Handling**: Errors handled consistently

### Code Quality
- [ ] Clear and descriptive names
- [ ] Functions are focused (single responsibility)
- [ ] Proper error handling
- [ ] Input validation
- [ ] Tests written and passing

### Security
- [ ] Authentication checks in place
- [ ] Authorization verified
- [ ] Input validation and sanitization
- [ ] No sensitive data exposed
- [ ] Environment variables used correctly

### Performance
- [ ] No N+1 queries
- [ ] Large datasets paginated
- [ ] Images optimized
- [ ] Unnecessary re-renders avoided

---

## AI Agent Specific Guidelines

### For AI Agents Working on This Codebase

**⚠️ CRITICAL**: AI agents must follow these additional guidelines:

### 1. Guardian Role

You are a **guardian of codebase quality**. When you encounter code that violates principles:

1. **Flag the violation** - Point out what's wrong
2. **Suggest refactor** - Propose a better approach
3. **Get approval** - Ask before refactoring
4. **Fix then proceed** - Refactor first, then implement requested changes

### 2. Proactive Refactoring Workflow

When working on legacy code:

**Step 1: Analyze & Report**
> "I've analyzed this file. It contains legacy code violating DRY/SSOT principles (e.g., hardcoded values). Before proceeding, should I refactor it to meet current standards?"

**Step 2: Propose Plan (If Approved)**
> "I'll refactor this route to use shared utilities and config. This removes duplication and improves maintainability."

**Step 3: Execute**
> Upon approval, perform refactor, then proceed with original request.

### 3. First-Principles Thinking

When facing complex/ambiguous requests:

1. **Identify fundamental goal** - What is the user truly trying to achieve?
2. **Question assumptions** - Challenge "the way things are"
3. **Reason from principles** - Evaluate against DRY, SSOT, consistency
4. **Propose strategic solution** - Address root cause, not symptoms

### 4. Pre-Commit Quality Checklist

Before suggesting a commit, verify:

- [ ] **No Magic Strings** - All values from config or constants
- [ ] **No Duplicated Logic** - Uses or creates shared utilities
- [ ] **Consistent Patterns** - Follows established patterns
- [ ] **Input Validation** - All API endpoints validated
- [ ] **Test Coverage** - New logic has tests
- [ ] **No console.log** - Uses logger utility

### 5. File Deletion Protection

**NEVER delete files without explicit user approval**. See `DEVELOPMENT_GUIDELINES.md` for critical file deletion protection rules.

### 6. Browser Automation

When testing user-facing features:

- **Use browser MCP tools** - Available via cursor-ide-browser tools
- **Wait strategies** - Always wait for elements before interaction
- **Error handling** - Handle timeouts gracefully
- **Screenshots** - Take screenshots for debugging

---

## Common Anti-Patterns

### 1. Copy-Paste Programming

❌ **Bad**: Copying an API route and changing entity name
```typescript
// src/app/api/products/route.ts - 150 lines
// src/app/api/services/route.ts - 150 lines (95% identical)
```

✅ **Good**: Creating a generic handler
```typescript
// src/lib/api/generic-handler.ts
export async function handleEntityList(entityType: string) {
  // Shared logic, entity-specific differences from config
}
```

### 2. Magic Strings

❌ **Bad**: Hardcoded values scattered everywhere
```typescript
const tableName = 'user_products';
const apiEndpoint = '/api/products';
```

✅ **Good**: Dynamic from config
```typescript
import { ENTITY_CONFIG } from '@/config/entities';
const config = ENTITY_CONFIG[entityType];
```

### 3. Inconsistent Patterns

❌ **Bad**: Products uses one pattern, Services uses another
```typescript
// products/page.tsx
export default async function ProductsPage() { ... }

// services/page.tsx
'use client';
export default function ServicesPage() { ... }
```

✅ **Good**: All entities use identical pattern
```typescript
// All pages use server components when possible
export default async function EntityPage() { ... }
```

### 4. God Components

❌ **Bad**: 500-line component handling all entity types
```typescript
function EntityComponent({ type, ...props }) {
  switch (type) {
    case 'product': return <ProductView />;
    case 'service': return <ServiceView />;
    // ... 20 more cases
  }
}
```

✅ **Good**: Generic component + entity-specific config
```typescript
function EntityComponent({ entity, config }) {
  return <GenericView entity={entity} config={config} />;
}
```

### 5. Premature Optimization

❌ **Bad**: Complex abstractions for one use case
```typescript
// Over-engineered for single use
class EntityFactoryBuilder {
  // ... 200 lines of abstraction
}
```

✅ **Good**: Wait for pattern to emerge, then abstract
```typescript
// Simple, direct implementation
// Refactor when pattern appears 2-3 times
```

### 6. Console.log in Production

❌ **Bad**: Console.log statements everywhere
```typescript
console.log('User logged in:', user);
console.error('Error:', error);
```

✅ **Good**: Use logger utility
```typescript
import { logger } from '@/lib/logger';
logger.info('User logged in', { userId: user.id });
logger.error('Error occurred', { error, context });
```

### 7. Hardcoded Table Names

❌ **Bad**: Hardcoded table names in API routes
```typescript
const { data } = await supabase.from('user_products').select('*');
```

✅ **Good**: Use config or constants
```typescript
import { PRODUCT_TABLE } from '@/config/database';
const { data } = await supabase.from(PRODUCT_TABLE).select('*');
```

---

## Quick Reference

### Key Files

| File | Purpose |
|------|---------|
| `src/config/site.ts` | Site-wide configuration |
| `src/lib/logger.ts` | Logging utility (use instead of console.log) |
| `src/lib/utils.ts` | General utilities |
| `docs/BEST_PRACTICES.md` | Comprehensive best practices |
| `docs/guides/ARCHITECTURE.md` | System architecture |
| `DEVELOPMENT_GUIDELINES.md` | File deletion protection and critical rules |

### Common Commands

```bash
# Development
npm run dev              # Start dev server
npm run dev:full         # Start all services (Medusa + Next.js)
npm run d                # Alias for dev:full
npm run build            # Build for production
npm run test             # Run tests
npm run test:e2e         # Run E2E tests
npm run lint             # Run linter

# Database
npm run db:up            # Start database
npm run db:down           # Stop database
npm run services:up       # Start all Docker services

# CMS API
cd cms-api && npm run dev # Start CMS API server

# Git
git checkout -b feature/name  # Create feature branch
git commit -m "feat: ..."     # Commit with conventional format
```

### Code Patterns

**API Route**:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const data = await fetchData();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    logger.error('Failed to fetch', { error });
    return NextResponse.json(
      { success: false, error: 'Failed to fetch' },
      { status: 500 }
    );
  }
}
```

**Component**:
```typescript
import { ProductCard } from '@/components/products/ProductCard';

export default async function ProductList() {
  const products = await fetchProducts();
  return (
    <div>
      {products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
```

**Hook**:
```typescript
export function useProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts().then(setProducts).finally(() => setLoading(false));
  }, []);

  return { products, loading };
}
```

---

## References

### Internal Documentation
- [Best Practices](../BEST_PRACTICES.md) - Comprehensive best practices guide
- [Architecture Guide](../guides/ARCHITECTURE.md) - System architecture
- [Development Guidelines](../../DEVELOPMENT_GUIDELINES.md) - File deletion protection
- [Contributing Guide](../../CONTRIBUTING.md) - Contribution guidelines

### Agent-Specific Guides
- [Cursor Agent Guide](./cursor.md) - For Cursor Cloud Code agents
- [Gemini Agent Guide](./gemini.md) - For Google Gemini agents
- [Claude Agent Guide](./claude.md) - For Claude/Codex agents

### External Resources
- [Next.js Documentation](https://nextjs.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React Documentation](https://react.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

---

## Maintenance

This guide is a living document. When you:
- **Discover a new pattern** - Add it here
- **Find an anti-pattern** - Document it
- **Update practices** - Update this guide
- **Fix violations** - Reference this guide

**Last Updated**: 2026-01-30  
**Maintainers**: All developers should contribute to and follow this guide
