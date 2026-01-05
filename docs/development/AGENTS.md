---
created_date: 2026-01-30
last_modified_date: 2026-01-30
last_modified_summary: Initial creation of agent index and quick reference
---

# AI Agent Quick Reference

**Quick index for AI agents working on RevampIT**

> **Purpose**: This document provides a quick reference to agent-specific documentation and helps agents choose the right guide.

---

## Which Agent Are You?

### 🤖 Cursor Cloud Code (Composer)
**You are:** Working directly in Cursor IDE with file access, terminal, and browser tools

**Read:** [`docs/development/cursor.md`](./cursor.md)

**Key capabilities:**
- ✅ Direct file read/write access
- ✅ Terminal command execution
- ✅ Browser automation via MCP
- ✅ Real-time linter access
- ✅ Multi-file editing

**Quick start:**
1. Read `docs/development/cursor.md`
2. Read `docs/development/DEV_GUIDE.md`
3. Read `docs/BEST_PRACTICES.md`

---

### 🤖 Google Gemini
**You are:** Working via Google Gemini interface (no direct file access)

**Read:** [`docs/development/gemini.md`](./gemini.md)

**Key capabilities:**
- ✅ Code generation and analysis
- ✅ Documentation assistance
- ✅ Problem solving
- ⚠️ No direct file access
- ⚠️ No terminal access

**Quick start:**
1. Read `docs/development/gemini.md`
2. Read `docs/development/DEV_GUIDE.md`
3. Always provide complete context in prompts

---

### 🤖 Claude/Codex
**You are:** Working via Claude interface (strong analysis, limited file access)

**Read:** [`docs/development/claude.md`](./claude.md)

**Key capabilities:**
- ✅ Strong code analysis
- ✅ Pattern recognition
- ✅ Refactoring suggestions
- ✅ Architecture understanding
- ⚠️ Limited direct file access

**Quick start:**
1. Read `docs/development/claude.md`
2. Read `docs/development/DEV_GUIDE.md`
3. Leverage Claude's analysis strengths

---

## Universal Requirements

**All agents MUST:**

1. ✅ **Read core documentation:**
   - `docs/development/DEV_GUIDE.md` - Main development guide
   - `docs/BEST_PRACTICES.md` - AI slop prevention
   - `DEVELOPMENT_GUIDELINES.md` - File deletion protection

2. ✅ **Follow critical rules:**
   - Never delete files without explicit approval
   - Always search before creating new files
   - Prevent AI slop (duplicates, conflicts)
   - Use `src/lib/logger.ts` instead of `console.log`
   - Follow TypeScript strict mode

3. ✅ **Check before creating:**
   - Search codebase for existing functionality
   - Verify naming conventions
   - Ensure no duplicates exist
   - Follow existing patterns

---

## Quick Decision Tree

```
Start: I need to work on RevampIT codebase
│
├─ Do I have direct file access?
│  │
│  ├─ YES → Read cursor.md (Cursor agent)
│  │        Use file operations, terminal, browser tools
│  │
│  └─ NO → Continue...
│
├─ Am I Google Gemini?
│  │
│  ├─ YES → Read gemini.md
│  │        Provide complete code, request verification steps
│  │
│  └─ NO → Continue...
│
└─ Am I Claude/Codex?
   │
   ├─ YES → Read claude.md
   │        Leverage analysis strengths, provide context
   │
   └─ UNKNOWN → Read DEV_GUIDE.md
                Follow general guidelines
```

---

## Common Tasks Across All Agents

### Creating a New Component

**All agents should:**
1. ✅ Search for existing similar components
2. ✅ Follow patterns in `docs/development/DEV_GUIDE.md`
3. ✅ Use TypeScript with proper types
4. ✅ Include error handling
5. ✅ Use Tailwind CSS for styling
6. ✅ Reference existing components for structure

**Agent-specific differences:**
- **Cursor**: Can create files directly, check linter immediately
- **Gemini**: Must provide complete file contents
- **Claude**: Can analyze and suggest improvements

### Creating an API Route

**All agents should:**
1. ✅ Follow RESTful conventions
2. ✅ Use `src/lib/logger.ts` for logging
3. ✅ Implement proper error handling
4. ✅ Validate inputs
5. ✅ Return consistent response format

**Agent-specific differences:**
- **Cursor**: Can test with terminal commands
- **Gemini**: Must provide complete route code
- **Claude**: Can review and suggest improvements

### Refactoring Code

**All agents should:**
1. ✅ Follow DRY principles
2. ✅ Maintain SSOT (Single Source of Truth)
3. ✅ Preserve functionality
4. ✅ Update all usages
5. ✅ Verify with tests

**Agent-specific differences:**
- **Cursor**: Can refactor multiple files, verify immediately
- **Gemini**: Must provide complete refactored code
- **Claude**: Can provide detailed analysis and plan

---

## File Organization

```
docs/development/
├── DEV_GUIDE.md          # Main development guide (all agents)
├── AGENTS.md            # This file - agent index
├── cursor.md            # Cursor-specific guide
├── gemini.md            # Gemini-specific guide
└── claude.md            # Claude-specific guide
```

---

## Quick Links

### Core Documentation
- [`DEV_GUIDE.md`](./DEV_GUIDE.md) - Main development guide
- [`../BEST_PRACTICES.md`](../BEST_PRACTICES.md) - Best practices
- [`../../DEVELOPMENT_GUIDELINES.md`](../../DEVELOPMENT_GUIDELINES.md) - File protection

### Agent-Specific Guides
- [`cursor.md`](./cursor.md) - Cursor agent guide
- [`gemini.md`](./gemini.md) - Gemini agent guide
- [`claude.md`](./claude.md) - Claude agent guide

### Architecture & Setup
- [`../guides/ARCHITECTURE.md`](../guides/ARCHITECTURE.md) - System architecture
- [`../../CONTRIBUTING.md`](../../CONTRIBUTING.md) - Contribution guide

---

## Remember

**All agents:**
- ✅ Read the appropriate agent-specific guide first
- ✅ Follow universal requirements
- ✅ Prevent AI slop
- ✅ Protect files from deletion
- ✅ Maintain code quality

**Choose your guide and start coding!**

---

**Last Updated**: 2026-01-30  
**Purpose**: Quick reference for AI agents
