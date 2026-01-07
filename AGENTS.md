# RevampIT — Codex (terminal) Instructions (AGENTS.md)

Codex reads this file automatically when you run it in this repository.

---

## Canonical Rules (Single Source of Truth)

**Primary rules live here (always follow them):**
- `/.cursorrules` — Cursor project rules (shared coding standards)
- `/.cursor/rules/*.mdc` — Modular rules (code-quality, database, deployment, swiss-context)
- `/.claude/CLAUDE.md` — Claude Code context (project overview, commands, structure)

**SSOT Files (reference these, don't duplicate):**
- `docs/SHARED_CONTEXT.md` — Project context (mission, tech stack, database, file structure)
- `docs/COMMANDS.md` — All npm scripts and commands
- `docs/MISSION_STATEMENT.md` — Official mission statement
- `docs/CODE_AUDIT.md` — Current code quality issues

This `AGENTS.md` should stay **lean** and mainly point to the canonical sources above.

---

## Critical Rules (must follow)

- **No file deletions without explicit approval**, especially:
  - `cms-api/src/migrations/*`
  - `scripts/db/migrations/*`
  - `.env*`
  - docs
- **No `console.log`** in app code — use `import { logger } from '@/lib/logger'`.
- **No hardcoded table names** — use `TABLE_NAMES` from `src/config/database.ts`.
- **No hardcoded URLs** — use `URLS` from `src/config/urls.ts`.
- **TypeScript strictness** — avoid `any` unless justified.
- **Search before creating files** to avoid duplicates.
- **Swiss context** for German copy: use Swiss High German ("ss" not "ß", "Velo" not "Fahrrad").

**Detailed rules**: See `.cursor/rules/code-quality.mdc`

---

## Quick commands (verified)

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

## Repository map (high level)

- `src/` — Next.js 14 app
- `cms-api/` — Custom CMS backend
- `medusa-backend/` — Medusa e-commerce backend
- `docs/` — Documentation (see `docs/development/DEV_GUIDE.md`)

**Project context**: See `docs/SHARED_CONTEXT.md`

---

## When unsure

- Prefer minimal changes, aligned to existing patterns.
- If a change touches auth/security/deployment/schema, **stop and ask**.
- Reference SSOT files instead of duplicating information.---

**Last Updated**: 2026-01-07
