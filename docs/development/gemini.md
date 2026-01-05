---
created_date: 2026-01-30
last_modified_date: 2026-01-30
last_modified_summary: Initial creation of Gemini-specific agent guidelines
---

# Google Gemini Agent Guidelines

**For AI agents working via Google Gemini on the RevampIT codebase**

> **Purpose**: This document provides Gemini-specific instructions and best practices for AI agents working on the RevampIT codebase.

---

## Quick Start

**Before starting any task:**
1. ✅ Read `docs/development/DEV_GUIDE.md` - Core development principles
2. ✅ Read `docs/BEST_PRACTICES.md` - Critical AI slop prevention
3. ✅ Read `DEVELOPMENT_GUIDELINES.md` - File deletion protection rules
4. ✅ Understand Gemini's limitations and capabilities

---

## Gemini-Specific Considerations

### Capabilities

Gemini provides:
- ✅ **Code generation** - Can write TypeScript, React, Next.js code
- ✅ **Code analysis** - Can review and suggest improvements
- ✅ **Documentation** - Can help with documentation tasks
- ✅ **Problem solving** - Can help debug and troubleshoot

### Limitations

Gemini has:
- ⚠️ **No direct file access** - Cannot read/write files directly
- ⚠️ **No terminal access** - Cannot run commands
- ⚠️ **No real-time context** - Limited to provided context
- ⚠️ **No browser automation** - Cannot test web features directly

### Workflow Adaptation

**Since Gemini cannot directly modify files:**
1. ✅ **Provide complete code** - Give full file contents, not just changes
2. ✅ **Include context** - Provide relevant surrounding code
3. ✅ **Explain changes** - Describe what and why
4. ✅ **Suggest verification** - Recommend how to test changes

---

## Gemini-Specific Best Practices

### 1. Provide Complete Context

**When asking for code changes:**

```typescript
// ✅ GOOD: Provide full context
"Here's the current ProductCard component. I need to add a price display."

// Current file: src/components/products/ProductCard.tsx
interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <div>
      <h3>{product.name}</h3>
      {/* Add price here */}
    </div>
  );
}

// Product type:
interface Product {
  id: string;
  name: string;
  price: number;
  // ...
}
```

**❌ BAD: Minimal context**
```typescript
"Add price to ProductCard"
// Gemini doesn't know the current structure
```

### 2. Request Complete Files

**When creating new files:**

```typescript
// ✅ GOOD: Request complete file
"Create a new ProductList component that:
- Takes an array of products
- Renders ProductCard for each
- Handles loading and error states
- Uses TypeScript with proper types
- Follows the patterns in docs/development/DEV_GUIDE.md

Provide the complete file contents."
```

**❌ BAD: Vague request**
```typescript
"Make a product list component"
```

### 3. Include Type Definitions

**Always provide types:**

```typescript
// ✅ GOOD: Include types
"Create a function that processes products. Here are the types:

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
}

interface ProcessedProduct extends Product {
  formattedPrice: string;
  categorySlug: string;
}

function processProducts(products: Product[]): ProcessedProduct[] {
  // Implementation
}"
```

### 4. Reference Existing Patterns

**Point to existing code:**

```typescript
// ✅ GOOD: Reference existing patterns
"Create a new API route following the pattern in:
- src/app/api/products/route.ts
- Use the same error handling pattern
- Use logger from src/lib/logger.ts
- Follow the structure in docs/development/DEV_GUIDE.md"
```

### 5. Request Verification Steps

**Ask for testing instructions:**

```typescript
// ✅ GOOD: Request verification
"After implementing this, what commands should I run to verify it works?
- npm run lint?
- npm run test?
- curl http://localhost:3000/api/endpoint?"
```

---

## Critical Rules for Gemini Agents

### File Deletion Protection

**⚠️ NEVER suggest deleting files without explicit user request**

**Before suggesting deletion:**
1. ✅ Confirm user wants deletion
2. ✅ List what will be deleted
3. ✅ Explain impact
4. ✅ Suggest backup approach

**Protected files (NEVER suggest deleting):**
- Migration files
- Core config files
- Documentation files
- `.env` files

### AI Slop Prevention

**Before suggesting new code:**
1. ✅ Ask user to search codebase first
2. ✅ Request existing code examples
3. ✅ Verify no duplicates exist
4. ✅ Check naming conventions

**Red flags to avoid:**
- 🚩 Suggesting `Button.tsx` when `components/ui/Button.tsx` exists
- 🚩 Creating duplicate utilities
- 🚩 Suggesting conflicting patterns

### Code Quality Standards

**Always suggest:**
- ✅ TypeScript with strict types
- ✅ Proper error handling
- ✅ Using `src/lib/logger.ts` instead of `console.log`
- ✅ Following existing patterns
- ✅ Self-documenting code

**Never suggest:**
- ❌ `any` types
- ❌ `console.log` statements
- ❌ Duplicate functionality
- ❌ Inconsistent patterns

---

## Gemini Workflow Patterns

### Pattern 1: Code Generation Request

```typescript
// Step 1: Provide context
"I need to create a new component. Here's what exists:
- Similar component: src/components/products/ProductCard.tsx
- Types: src/types/product.ts
- Patterns: docs/development/DEV_GUIDE.md"

// Step 2: Describe requirements
"Create ProductList component that:
- Takes products array
- Renders ProductCard for each
- Handles empty state
- Uses TypeScript
- Follows existing patterns"

// Step 3: Request complete file
"Provide the complete file contents for:
src/components/products/ProductList.tsx"
```

### Pattern 2: Code Review Request

```typescript
// Step 1: Provide code to review
"Review this code for:
- TypeScript best practices
- Error handling
- Following project patterns
- Potential improvements

Code:
[Paste code here]"

// Step 2: Request specific feedback
"Check:
- Does it follow docs/development/DEV_GUIDE.md?
- Are there any anti-patterns from docs/BEST_PRACTICES.md?
- Any security concerns?"
```

### Pattern 3: Bug Fix Request

```typescript
// Step 1: Describe the bug
"Bug: Products not displaying on homepage

Error message:
[Paste error]

Relevant files:
- src/app/page.tsx
- src/components/products/ProductList.tsx
- src/lib/api/products.ts"

// Step 2: Request analysis
"Analyze the code and suggest:
- Root cause
- Fix approach
- Complete fixed code
- Verification steps"
```

---

## Common Tasks with Gemini

### Creating a New Component

```typescript
// Request format:
"Create a new [ComponentName] component following these requirements:

1. Location: src/components/[category]/[ComponentName].tsx
2. Props interface: [describe props]
3. Functionality: [describe behavior]
4. Styling: Use Tailwind CSS, follow design system
5. Patterns: Follow docs/development/DEV_GUIDE.md

Reference existing components:
- src/components/products/ProductCard.tsx (for structure)
- src/components/ui/Button.tsx (for UI patterns)

Provide complete file contents with:
- Proper TypeScript types
- Error handling
- Loading states if needed
- Comments for complex logic"
```

### Creating an API Route

```typescript
// Request format:
"Create a new API route at src/app/api/[endpoint]/route.ts

Requirements:
1. Method: [GET/POST/PUT/DELETE]
2. Authentication: [required/optional]
3. Validation: [describe validation needed]
4. Error handling: Use logger from src/lib/logger.ts
5. Response format: { success: boolean, data?: T, error?: string }

Reference existing routes:
- src/app/api/products/route.ts

Provide complete file contents following:
- docs/development/DEV_GUIDE.md patterns
- Error handling best practices
- TypeScript strict mode"
```

### Refactoring Code

```typescript
// Request format:
"Refactor this code to follow DRY principles:

Current code:
[Paste code]

Issues:
- Duplicated logic in multiple files
- Hardcoded values
- Inconsistent patterns

Requirements:
1. Extract shared logic to src/lib/utils.ts
2. Move constants to src/config/
3. Follow patterns in docs/development/DEV_GUIDE.md
4. Maintain backward compatibility

Provide:
- Refactored code
- Updated files list
- Migration notes"
```

---

## Code Examples for Gemini

### Component Template

```typescript
// When requesting components, provide this template:
'use client'; // Only if using hooks

import { /* imports */ } from '@/lib/...';

interface ComponentProps {
  // Props definition
}

export function ComponentName({ /* props */ }: ComponentProps) {
  // Implementation
  return (
    <div className="...">
      {/* JSX */}
    </div>
  );
}
```

### API Route Template

```typescript
// When requesting API routes, provide this template:
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    // Implementation
    return NextResponse.json({ success: true, data });
  } catch (error) {
    logger.error('Error message', { error });
    return NextResponse.json(
      { success: false, error: 'Error message' },
      { status: 500 }
    );
  }
}
```

---

## Verification Steps for Gemini

### After Code Generation

**Always suggest these verification steps:**

```bash
# 1. Check TypeScript compilation
npm run build

# 2. Check linting
npm run lint

# 3. Run tests
npm run test

# 4. Test manually
npm run dev
# Then test in browser

# 5. Check for console errors
# Open browser DevTools
```

### Code Review Checklist

**Suggest user verify:**

- [ ] Code follows `docs/development/DEV_GUIDE.md`
- [ ] No `console.log` statements (use logger)
- [ ] Proper TypeScript types (no `any`)
- [ ] Error handling implemented
- [ ] Follows existing patterns
- [ ] No duplicate functionality
- [ ] Files in correct directories

---

## Limitations and Workarounds

### No Direct File Access

**Workaround:**
- Provide complete file contents
- User copies code into files
- User runs verification commands

### No Terminal Access

**Workaround:**
- Suggest commands to run
- Provide expected output
- Guide user through verification

### No Real-time Context

**Workaround:**
- Request full context in prompts
- Ask user to provide relevant files
- Reference documentation files

### No Browser Testing

**Workaround:**
- Suggest manual testing steps
- Provide test scenarios
- Guide user through browser DevTools

---

## Quick Reference

### Essential Prompts

**For new features:**
```
"Create [feature] following docs/development/DEV_GUIDE.md.
Reference [existing file] for patterns.
Provide complete code with TypeScript types."
```

**For bug fixes:**
```
"Fix [bug description]. 
Current code: [paste code]
Error: [paste error]
Provide fix following project patterns."
```

**For refactoring:**
```
"Refactor [code] to follow DRY principles.
Extract shared logic to [location].
Maintain backward compatibility.
Reference docs/development/DEV_GUIDE.md."
```

### Key Files to Reference

- `docs/development/DEV_GUIDE.md` - Main development guide
- `docs/BEST_PRACTICES.md` - Best practices
- `DEVELOPMENT_GUIDELINES.md` - File protection rules
- `docs/guides/ARCHITECTURE.md` - System architecture

---

## Remember

- ✅ **Provide complete context** - Gemini needs full information
- ✅ **Request complete files** - Not just snippets
- ✅ **Include types** - Always provide TypeScript types
- ✅ **Reference patterns** - Point to existing code
- ✅ **Suggest verification** - Guide user through testing
- ✅ **Protect files** - Never suggest deletion without approval
- ✅ **Prevent AI slop** - Check for duplicates first

**Work with the user to ensure code quality and consistency!**

---

**Last Updated**: 2026-01-30  
**For**: Google Gemini agents
