# RevampIT — Gemini CLI Project Context (GEMINI.md)

Gemini CLI auto-loads this file when running inside this repository.

---

## Canonical Rules (Single Source of Truth)

**Primary rules are maintained here:**
- `/.cursorrules` — Cursor project rules (coding standards)
- `/.cursor/rules/*.mdc` — Modular rules (code-quality, database, deployment, swiss-context)
- `/.claude/CLAUDE.md` — Claude Code context (project overview, commands, structure)
- `/AGENTS.md` — Codex CLI instructions

**SSOT Files (reference these, don't duplicate):**
- `docs/SHARED_CONTEXT.md` — Project context (mission, tech stack, database, file structure)
- `docs/COMMANDS.md` — All npm scripts and commands
- `docs/MISSION_STATEMENT.md` — Official mission statement
- `docs/CODE_AUDIT.md` — Current code quality issues

Keep this file lean; avoid duplicating large sections from the canonical sources.

---

## Project Overview

RevampIT is a Swiss non-profit enabling free exchange of technology, promoting open-source hardware and software.

**Full context**: See `docs/SHARED_CONTEXT.md`

---

## Quick Commands

```bash
npm run d              # Start everything
npm run dev            # Frontend only
npm run services:up    # Start docker services
npm run services:down  # Stop docker services
npm run setup-admins   # Create admin users
npm run lint
npm run build
npm run typecheck      # IMPORTANT: run before commits
npm run test
```

**Full command reference**: See `docs/COMMANDS.md`

---

## Hard Rules

- Do not delete migrations, `.env*`, or docs without explicit approval.
- Do not use `console.log` in app code; use `src/lib/logger.ts`.
- Use constants from `src/config/` (TABLE_NAMES, URLS, ERROR_MESSAGES).
- Avoid duplicates: search before creating new files.
- Swiss High German: use "ss" not "ß"; use Swiss vocabulary ("Velo").

**Detailed rules**: See `.cursor/rules/code-quality.mdc`

---

## Repo Map

- `src/` — Next.js app router + UI
- `cms-api/` — CMS backend
- `medusa-backend/` — e-commerce backend
- `docs/` — architecture and development guides

**Full file structure**: See `docs/SHARED_CONTEXT.md`

---

## Working Style

- Prefer minimal, surgical changes.
- Read existing patterns before implementing new ones.
- After edits: run `npm run typecheck`, `npm run lint`, and `npm run build`.
- Reference SSOT files instead of duplicating information.

---

**Last Updated**: 2026-01-07
