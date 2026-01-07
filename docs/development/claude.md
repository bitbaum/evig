---
created_date: 2026-01-30
last_modified_date: 2026-01-06
last_modified_summary: Updated to clarify terminal CLI vs web usage; terminal tools have file/terminal access
---

# Claude Agent Guidelines

**For AI agents working via Claude on the RevampIT codebase**

> **Note for Terminal Users**: If you're using **Claude Code** (terminal tool), it automatically loads `.claude/CLAUDE.md` and has full file/terminal access. This guide is for **web/non-terminal** Claude usage.
>
> **Purpose**: This document provides Claude-specific instructions for web/non-terminal usage where file access is limited.

---

## Quick Start

**Before starting any task:**
1. ✅ Read `docs/development/DEV_GUIDE.md` - Core development principles
2. ✅ Read `docs/BEST_PRACTICES.md` - Critical AI slop prevention
3. ✅ Read `DEVELOPMENT_GUIDELINES.md` - File deletion protection rules
4. ✅ Understand Claude's capabilities and best practices

---

## Claude Usage Modes

### 🤖 Claude Code (Terminal Tool)
**If you're using Claude Code in the terminal:**
- ✅ **Auto-loads**: `.claude/CLAUDE.md` (project context)
- ✅ **Has file access** - Can read/write files directly
- ✅ **Has terminal access** - Can run commands
- ✅ **Full repository context** - Understands codebase structure
- 📖 **See**: `.claude/CLAUDE.md` for terminal-specific instructions

### 🌐 Claude Web/Non-Terminal
**If you're using Claude via web interface or without terminal tools:**

### Capabilities

Claude provides:
- ✅ **Strong code analysis** - Excellent at understanding code structure
- ✅ **Pattern recognition** - Good at identifying patterns and anti-patterns
- ✅ **Refactoring suggestions** - Strong at suggesting improvements
- ✅ **Documentation** - Good at writing clear documentation
- ✅ **Problem solving** - Excellent debugging capabilities

### Strengths

Claude excels at:
- 🎯 **Code review** - Thorough analysis of code quality
- 🎯 **Architecture** - Understanding system design
- 🎯 **Best practices** - Applying development principles
- 🎯 **Explanations** - Clear, detailed explanations

### Limitations (Web/Non-Terminal Only)

When using Claude **without terminal tools**:
- ⚠️ **No direct file access** - Cannot read/write files directly (depends on interface)
- ⚠️ **Limited real-time context** - Works with provided context
- ⚠️ **No terminal access** - Cannot run commands directly
- ⚠️ **Context window limits** - May need to work in chunks for large codebases

---

## Claude-Specific Best Practices

### 1. Leverage Code Analysis

**Use Claude's strength in code review:**

```typescript
// ✅ GOOD: Request thorough analysis
"Analyze this code for:
1. Adherence to docs/development/DEV_GUIDE.md
2. TypeScript best practices
3. Error handling patterns
4. Potential improvements
5. Anti-patterns from docs/BEST_PRACTICES.md

Code:
[Paste code here]

Provide:
- Detailed analysis
- Specific improvements
- Refactored code if needed
- Explanation of changes"
```

### 2. Request Pattern Matching

**Use Claude's pattern recognition:**

```typescript
// ✅ GOOD: Ask for pattern analysis
"Review these files and identify:
- Common patterns
- Inconsistencies
- Opportunities for refactoring
- Best practices violations

Files:
- src/app/api/products/route.ts
- src/app/api/services/route.ts
- src/app/api/workshops/route.ts

Suggest:
- Unified pattern to follow
- Refactoring approach
- Implementation plan"
```

### 3. Request Detailed Explanations

**Use Claude's explanation strength:**

```typescript
// ✅ GOOD: Request explanations
"Explain:
1. Why this pattern is used
2. How it relates to docs/development/DEV_GUIDE.md
3. What alternatives exist
4. Trade-offs of each approach

Code:
[Paste code]"
```

### 4. Provide Architectural Context

**Claude works well with architecture:**

```typescript
// ✅ GOOD: Provide architecture context
"Context:
- System architecture: docs/guides/ARCHITECTURE.md
- Development guide: docs/development/DEV_GUIDE.md
- Current implementation: [describe]

Task:
[Describe task]

Request:
- Analysis of approach
- Alignment with architecture
- Implementation suggestions"
```

### 5. Request Incremental Refactoring

**For large changes:**

```typescript
// ✅ GOOD: Break into steps
"Refactor this codebase incrementally:

Phase 1: Extract shared utilities
Phase 2: Standardize patterns
Phase 3: Update all usages
Phase 4: Verify and test

Provide:
- Step-by-step plan
- Code for each phase
- Verification steps"
```

---

## Critical Rules for Claude Agents

### File Deletion Protection

**⚠️ NEVER suggest deleting files without explicit user request**

**Before suggesting deletion:**
1. ✅ Confirm user intent
2. ✅ Analyze impact thoroughly
3. ✅ Suggest alternatives (deprecation, migration)
4. ✅ Provide backup strategy

**Protected files (NEVER suggest deleting):**
- Migration files (`supabase/migrations/*`)
- Core configuration files
- Documentation files
- `.env` files
- Test files

### AI Slop Prevention

**Before suggesting new code:**
1. ✅ Analyze existing codebase structure
2. ✅ Identify similar implementations
3. ✅ Check for naming conflicts
4. ✅ Verify no duplicates exist
5. ✅ Ensure consistency with patterns

**Red flags to identify:**
- 🚩 Duplicate components with similar names
- 🚩 Conflicting utility functions
- 🚩 Inconsistent patterns across similar features
- 🚩 Orphaned code that should be integrated

### Code Quality Standards

**Always suggest:**
- ✅ TypeScript strict mode compliance
- ✅ Proper error handling with logger
- ✅ Following DRY principles
- ✅ Single Source of Truth (SSOT)
- ✅ Consistent patterns
- ✅ Self-documenting code

**Never suggest:**
- ❌ `any` types without justification
- ❌ `console.log` statements
- ❌ Duplicate functionality
- ❌ Magic strings/numbers
- ❌ Inconsistent error handling

---

## Claude Workflow Patterns

### Pattern 1: Code Review and Improvement

```typescript
// Step 1: Request comprehensive review
"Review this code comprehensively:

File: src/app/api/products/route.ts
[Paste code]

Check against:
- docs/development/DEV_GUIDE.md
- docs/BEST_PRACTICES.md
- TypeScript best practices
- Error handling patterns

Provide:
- Detailed analysis
- Specific issues found
- Improvement suggestions
- Refactored code"
```

### Pattern 2: Architecture Alignment

```typescript
// Step 1: Provide context
"Current architecture: docs/guides/ARCHITECTURE.md
Development guide: docs/development/DEV_GUIDE.md

Task: [Describe task]

Analyze:
- Alignment with architecture
- Consistency with patterns
- Best approach given constraints

Suggest:
- Implementation approach
- File structure
- Integration points"
```

### Pattern 3: Refactoring Plan

```typescript
// Step 1: Identify issues
"Analyze these files for refactoring opportunities:

Files:
- [List files]

Issues observed:
- Code duplication
- Inconsistent patterns
- Hardcoded values

Request:
- Refactoring strategy
- Step-by-step plan
- Risk assessment
- Implementation code"
```

---

## Common Tasks with Claude

### Code Review

```typescript
// Request format:
"Perform comprehensive code review:

Code:
[Paste code]

Checklist:
- [ ] Follows docs/development/DEV_GUIDE.md
- [ ] TypeScript best practices
- [ ] Error handling
- [ ] No console.log (use logger)
- [ ] Proper types (no any)
- [ ] Follows existing patterns
- [ ] No duplicate functionality

Provide:
- Detailed findings
- Priority of issues
- Specific fixes
- Improved code"
```

### Refactoring

```typescript
// Request format:
"Refactor this code to follow DRY and SSOT principles:

Current code:
[Paste code]

Issues:
- Duplicated logic
- Hardcoded values
- Inconsistent patterns

Requirements:
1. Extract shared utilities
2. Move constants to config
3. Standardize patterns
4. Maintain functionality
5. Follow docs/development/DEV_GUIDE.md

Provide:
- Refactoring plan
- Refactored code
- Migration guide
- Testing strategy"
```

### Architecture Analysis

```typescript
// Request format:
"Analyze architecture alignment:

Current implementation:
[Describe current state]

Proposed changes:
[Describe proposed changes]

Reference:
- docs/guides/ARCHITECTURE.md
- docs/development/DEV_GUIDE.md

Analyze:
- Architectural fit
- Pattern consistency
- Integration points
- Potential issues

Suggest:
- Best approach
- Alternative options
- Trade-offs
- Implementation plan"
```

---

## Code Examples for Claude

### Requesting Component Creation

```typescript
// Provide template and requirements:
"Create a new component following these specifications:

Template:
'use client'; // If using hooks
import { /* imports */ } from '@/lib/...';

interface ComponentProps {
  // Define props
}

export function ComponentName({ /* props */ }: ComponentProps) {
  // Implementation
}

Requirements:
1. Location: src/components/[category]/[Name].tsx
2. Props: [describe props]
3. Functionality: [describe behavior]
4. Styling: Tailwind CSS, follow design system
5. Error handling: Proper error states
6. Types: Full TypeScript types

Reference:
- docs/development/DEV_GUIDE.md for patterns
- src/components/products/ProductCard.tsx for structure

Provide complete implementation with explanations."
```

### Requesting API Route

```typescript
// Provide template and requirements:
"Create an API route following this pattern:

Template:
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export async function METHOD(request: NextRequest) {
  try {
    // Implementation
    return NextResponse.json({ success: true, data });
  } catch (error) {
    logger.error('Error', { error });
    return NextResponse.json(
      { success: false, error: 'Message' },
      { status: 500 }
    );
  }
}

Requirements:
1. Endpoint: /api/[resource]
2. Method: [GET/POST/PUT/DELETE]
3. Authentication: [required/optional]
4. Validation: [describe]
5. Error handling: Use logger

Reference:
- docs/development/DEV_GUIDE.md
- src/app/api/products/route.ts

Provide complete implementation with error handling."
```

---

## Verification and Testing

### Code Review Checklist

**Always suggest user verify:**

```typescript
// After code generation, suggest:
"Verify the implementation:

1. TypeScript compilation:
   npm run build

2. Linting:
   npm run lint

3. Tests:
   npm run test

4. Manual testing:
   npm run dev
   # Test in browser

5. Code review checklist:
   - [ ] Follows docs/development/DEV_GUIDE.md
   - [ ] No console.log
   - [ ] Proper TypeScript types
   - [ ] Error handling
   - [ ] Follows patterns
   - [ ] No duplicates"
```

### Refactoring Verification

```typescript
// After refactoring, suggest:
"Verify refactoring:

1. Functionality preserved:
   - Run existing tests
   - Manual testing
   - Check all usages updated

2. Code quality:
   - npm run lint
   - npm run build
   - Check for regressions

3. Documentation:
   - Update relevant docs
   - Update last_modified_date
   - Add change summary"
```

---

## Advanced Patterns

### Incremental Refactoring

```typescript
// For large refactoring:
"Plan incremental refactoring:

Phase 1: Extract shared code
- Identify common patterns
- Create utility functions
- Update one file as example

Phase 2: Standardize patterns
- Apply pattern to all files
- Ensure consistency
- Update types

Phase 3: Verify and test
- Run tests
- Check for regressions
- Update documentation

Provide:
- Detailed plan for each phase
- Code for Phase 1
- Migration strategy"
```

### Pattern Analysis

```typescript
// Request pattern analysis:
"Analyze patterns across codebase:

Files to analyze:
- [List similar files]

Identify:
- Common patterns
- Inconsistencies
- Best practices violations
- Refactoring opportunities

Suggest:
- Unified pattern
- Implementation approach
- Migration plan"
```

---

## Quick Reference

### Essential Prompts

**For code review:**
```
"Review [code] against docs/development/DEV_GUIDE.md.
Check for:
- TypeScript best practices
- Error handling
- Pattern consistency
- AI slop prevention

Provide detailed analysis and improvements."
```

**For refactoring:**
```
"Refactor [code] to follow DRY and SSOT principles.
Extract shared logic.
Move constants to config.
Follow docs/development/DEV_GUIDE.md patterns.
Provide refactored code and migration plan."
```

**For architecture:**
```
"Analyze [proposal] against:
- docs/guides/ARCHITECTURE.md
- docs/development/DEV_GUIDE.md

Provide:
- Architectural analysis
- Alignment check
- Implementation suggestions
- Trade-offs"
```

### Key Files to Reference

- `docs/development/DEV_GUIDE.md` - Main development guide
- `docs/BEST_PRACTICES.md` - Best practices and AI slop prevention
- `DEVELOPMENT_GUIDELINES.md` - File deletion protection
- `docs/guides/ARCHITECTURE.md` - System architecture

---

## Remember

- ✅ **Leverage analysis strength** - Use Claude for thorough code review
- ✅ **Provide context** - Architecture and patterns help Claude
- ✅ **Request explanations** - Claude excels at explaining decisions
- ✅ **Incremental approach** - Break large tasks into phases
- ✅ **Protect files** - Never suggest deletion without approval
- ✅ **Prevent AI slop** - Analyze before suggesting new code
- ✅ **Verify everything** - Always suggest verification steps

**Use Claude's strengths in analysis and explanation to improve code quality!**

---

**Last Updated**: 2026-01-30  
**For**: Claude/Codex agents
