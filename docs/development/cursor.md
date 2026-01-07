---
created_date: 2026-01-30
last_modified_date: 2026-01-06
last_modified_summary: Updated to clarify this is a human reference guide; AI rules are in .cursorrules and .cursor/rules/
---

# Cursor IDE Reference Guide for Humans

**For developers and team members using Cursor IDE**

> **Note for AI Agents**: This is a **human reference guide**. Cursor AI automatically reads project rules from:
> - `.cursorrules` (main rules file)
> - `.cursor/rules/*.mdc` (modular rule files)
> 
> **Purpose**: This document helps **human developers** understand how to use Cursor IDE effectively when working on the RevampIT codebase.

---

## Quick Start

**Before starting any task:**
1. ✅ Read `docs/development/DEV_GUIDE.md` - Core development principles
2. ✅ Read `docs/BEST_PRACTICES.md` - Critical AI slop prevention
3. ✅ Read `DEVELOPMENT_GUIDELINES.md` - File deletion protection rules
4. ✅ Use semantic search before creating ANY new file

---

## Cursor-Specific Capabilities

### Available Tools

Cursor provides access to:
- ✅ **File operations** - Read, write, edit, delete (with caution!)
- ✅ **Terminal commands** - Run npm, git, docker commands
- ✅ **Codebase search** - Semantic and grep search
- ✅ **Browser automation** - Test web features via MCP
- ✅ **MCP servers** - Supabase, Context7, browser tools
- ✅ **Linter access** - Read and fix linting errors

### Key Advantages

1. **Context Awareness** - Cursor has access to open files and recent context
2. **Multi-file Editing** - Can edit multiple files in one operation
3. **Terminal Integration** - Can run commands and see output
4. **Real-time Feedback** - Can check linter errors immediately

---

## Cursor-Specific Best Practices

### 1. Always Search Before Creating

**Use semantic search first:**
```
Before creating: src/components/products/ProductCard.tsx
Search for: "product card component"
```

**Check for existing files:**
```bash
# Use glob_file_search or grep
glob_file_search: **/ProductCard.tsx
grep: ProductCard
```

### 2. Use Multi-file Operations Wisely

**✅ GOOD**: Edit related files together
```typescript
// When adding a new feature:
// 1. Create component
// 2. Create hook
// 3. Update types
// 4. Add to page
// All in one operation when related
```

**❌ BAD**: Making unrelated changes together
```typescript
// Don't mix:
// - Fixing a bug in auth
// - Adding a new product feature
// - Updating documentation
// All in one operation
```

### 3. Leverage Terminal Commands

**Use terminal for verification:**
```bash
# After creating files, verify they work
npm run lint
npm run build
npm run test

# Check git status
git status

# Verify services are running
docker compose ps
```

### 4. Check Linter Errors Immediately

**After making changes:**
```typescript
// Always check linter errors
read_lints: ['src/components/new-component.tsx']
```

**Fix errors before proceeding:**
- Don't leave linting errors
- Fix TypeScript errors immediately
- Ensure code compiles

### 5. Use Browser Tools for Testing

**When working on UI features:**
```typescript
// Use browser MCP tools to test
// 1. Navigate to page
// 2. Take snapshot
// 3. Interact with elements
// 4. Verify behavior
```

---

## Critical Rules for Cursor Agents

### File Deletion Protection

**⚠️ NEVER delete files without explicit user approval**

**Before deleting ANY file:**
1. ✅ Ask user explicitly
2. ✅ Show what will be deleted
3. ✅ Explain impact
4. ✅ Wait for confirmation

**Protected files (NEVER delete):**
- Migration files (`supabase/migrations/*`)
- Core config files
- Documentation files
- `.env` files

### AI Slop Prevention

**Before creating ANY new file:**
1. ✅ Search codebase thoroughly (semantic + grep)
2. ✅ Check for similar functionality
3. ✅ Verify naming conventions
4. ✅ Ensure no duplicates exist

**Red flags to avoid:**
- 🚩 Creating `Button.tsx` when `components/ui/Button.tsx` exists
- 🚩 Creating `utils.ts` when `lib/utils.ts` exists
- 🚩 Duplicating existing patterns

### Code Quality

**Always:**
- ✅ Use TypeScript strict mode
- ✅ Follow existing patterns
- ✅ Use `src/lib/logger.ts` instead of `console.log`
- ✅ Handle errors properly
- ✅ Write self-documenting code

**Never:**
- ❌ Use `any` types
- ❌ Leave `console.log` statements
- ❌ Create duplicate functionality
- ❌ Mix different patterns

---

## Cursor Workflow Patterns

### Pattern 1: Adding a New Feature

```typescript
// Step 1: Search for existing patterns
codebase_search: "How are similar features implemented?"

// Step 2: Check for existing components
glob_file_search: **/SimilarComponent.tsx

// Step 3: Create new files following existing patterns
// - Component file
// - Types file (if needed)
// - Hook file (if needed)

// Step 4: Integrate into existing code
// - Add to page/route
// - Update navigation if needed

// Step 5: Verify
// - Check linter errors
// - Run tests
// - Test in browser
```

### Pattern 2: Fixing a Bug

```typescript
// Step 1: Understand the bug
// - Read error messages
// - Check logs
// - Reproduce issue

// Step 2: Find root cause
// - Search for related code
// - Check error handling
// - Review recent changes

// Step 3: Fix the issue
// - Make minimal changes
// - Follow existing patterns
// - Add error handling if needed

// Step 4: Verify fix
// - Test the fix
// - Check for regressions
// - Update tests if needed
```

### Pattern 3: Refactoring

```typescript
// Step 1: Analyze current code
// - Identify duplication
// - Find patterns to extract

// Step 2: Propose refactor
// - Explain what will change
// - Show benefits
// - Get approval

// Step 3: Execute refactor
// - Extract shared code
// - Update all usages
// - Maintain functionality

// Step 4: Verify
// - Run tests
// - Check linter
// - Verify no regressions
```

---

## Common Tasks

### Creating a New Component

```typescript
// 1. Check if similar component exists
codebase_search: "product card component"

// 2. Create component following pattern
// src/components/products/ProductCard.tsx
'use client';

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
      </div>
    </Link>
  );
}

// 3. Check linter
read_lints: ['src/components/products/ProductCard.tsx']

// 4. Export from index if needed
```

### Creating an API Route

```typescript
// 1. Check existing API patterns
codebase_search: "API route handler pattern"

// 2. Create route following pattern
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

// 3. Verify it works
run_terminal_cmd: curl http://localhost:3000/api/products
```

### Updating Documentation

```typescript
// 1. Find relevant documentation
glob_file_search: **/*DEV_GUIDE*.md

// 2. Update with new information
// - Update last_modified_date
// - Add last_modified_summary
// - Update content

// 3. Ensure frontmatter is correct
---
created_date: YYYY-MM-DD
last_modified_date: YYYY-MM-DD
last_modified_summary: Description of changes
---
```

---

## Error Handling in Cursor

### When You Encounter Errors

**1. Read error messages carefully**
```typescript
// Check terminal output
// Check linter errors
// Check browser console
```

**2. Search for similar errors**
```typescript
codebase_search: "How is this error handled elsewhere?"
```

**3. Fix systematically**
```typescript
// - Fix TypeScript errors first
// - Fix linting errors
// - Fix runtime errors
// - Test after each fix
```

### Common Error Patterns

**TypeScript Errors:**
```typescript
// ❌ BAD: Using any
function process(data: any) { ... }

// ✅ GOOD: Proper typing
function process<T>(data: T): ProcessedData<T> { ... }
```

**Linting Errors:**
```typescript
// ❌ BAD: console.log
console.log('Debug:', data);

// ✅ GOOD: Use logger
import { logger } from '@/lib/logger';
logger.debug('Debug info', { data });
```

---

## Testing in Cursor

### Use Browser Tools

```typescript
// 1. Start dev server
run_terminal_cmd: npm run dev

// 2. Navigate to page
browser_navigate: http://localhost:3000/products

// 3. Take snapshot
browser_snapshot

// 4. Interact with page
browser_click: element="Add to cart button"

// 5. Verify behavior
browser_snapshot
```

### Use Terminal Commands

```bash
# Run tests
npm run test

# Run linter
npm run lint

# Check build
npm run build

# Check services
docker compose ps
```

---

## Quick Reference

### Essential Commands

```bash
# Development
npm run dev              # Start dev server
npm run d                # Start all services
npm run lint             # Check code quality
npm run test             # Run tests
npm run build            # Build for production

# Git
git status               # Check changes
git diff                 # See differences
git log --oneline        # Recent commits
```

### Key Files to Reference

- `docs/development/DEV_GUIDE.md` - Main development guide
- `docs/BEST_PRACTICES.md` - Best practices and AI slop prevention
- `DEVELOPMENT_GUIDELINES.md` - File deletion protection
- `docs/guides/ARCHITECTURE.md` - System architecture

### Cursor-Specific Tips

1. **Use semantic search** before creating anything
2. **Check linter errors** after every change
3. **Test in browser** for UI changes
4. **Run terminal commands** to verify
5. **Never delete files** without approval

---

## Remember

- ✅ **Search before creating** - Always check for existing code
- ✅ **Follow patterns** - Consistency is key
- ✅ **Test your changes** - Use browser and terminal tools
- ✅ **Check linter** - Fix errors immediately
- ✅ **Protect files** - Never delete without approval
- ✅ **Prevent AI slop** - No duplicates, no conflicts

**When in doubt, ask the user or search the codebase!**

---

**Last Updated**: 2026-01-30  
**For**: Cursor Cloud Code (Composer) agents
