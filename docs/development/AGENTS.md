---
created_date: 2026-01-30
last_modified_date: 2026-01-06
last_modified_summary: Added Codex CLI (terminal) and Gemini CLI (terminal) auto-loaded context files; clarified terminal tool vs web usage
---

# AI Agent Quick Reference

**Quick index for AI agents working on RevampIT**

> **Purpose**: This document provides a quick reference to agent-specific documentation and helps agents choose the right guide.

---

## Which Agent Are You?

### 🤖 Cursor Cloud Code (Composer)
**You are:** Working directly in Cursor IDE with file access, terminal, and browser tools

**Read:**
- **Primary:** `.cursorrules` (main rules - auto-discovered by Cursor)
- **Modular:** `.cursor/rules/*.mdc` (topic-specific rules)
- **Human Reference:** [`docs/development/cursor.md`](./cursor.md) (for developers, not AI)

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

### 🤖 Gemini CLI (terminal)
**You are:** Using Gemini in the terminal inside this repo

**Auto-loaded context:**
- **Primary:** `.gemini/GEMINI.md` (Gemini CLI project context)

**Also follow (canonical rules):**
- `.cursorrules`
- `.cursor/rules/*.mdc`

**Quick start:**
1. Keep `.gemini/GEMINI.md` lean and SSOT-oriented
2. Prefer `.cursorrules` + `.cursor/rules/*.mdc` for canonical rules

---

### 🤖 Google Gemini (web / non-terminal)
**You are:** Using Gemini outside Cursor/terminal tooling (no repo tools)

**Read:** [`docs/development/gemini.md`](./gemini.md)

---

### 🤖 Codex CLI (terminal)
**You are:** Using OpenAI Codex in the terminal inside this repo

**Auto-loaded context:**
- **Primary:** `AGENTS.md` (repo root) (Codex CLI)

**Also follow (canonical rules):**
- `.cursorrules`
- `.cursor/rules/*.mdc`

---

### 🤖 Claude Code (terminal)
**You are:** Using Claude Code in the terminal inside this repo

**Auto-loaded context:**
- **Primary:** `.claude/CLAUDE.md`

---

### 🤖 Claude (web / non-terminal)
**You are:** Using Claude outside Cursor/terminal tooling (limited file access)

**Read:** [`docs/development/claude.md`](./claude.md)

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
└─ Am I running a terminal agent?
   │
   ├─ Codex CLI → Uses `AGENTS.md` (repo root)
   ├─ Gemini CLI → Uses `.gemini/GEMINI.md`
   ├─ Claude Code → Uses `.claude/CLAUDE.md`
   │
   └─ Otherwise → Use DEV_GUIDE.md + the appropriate docs/development/* guide
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
- **Cursor:**
  - [`/.cursorrules`](../../.cursorrules) - Main Cursor rules (auto-discovered)
  - [`/.cursor/rules/`](../../.cursor/rules/) - Modular rules
  - [`cursor.md`](./cursor.md) - Human reference guide
- **Claude:**
  - [`/.claude/CLAUDE.md`](../../.claude/CLAUDE.md) - Claude Code standard (auto-discovered)
  - [`claude.md`](./claude.md) - Detailed reference guide
- **Gemini:**
  - [`gemini.md`](./gemini.md) - Gemini agent guide

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
