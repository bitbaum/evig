# RevampIT — Codex (terminal) Instructions (AGENTS.md)

Codex reads this file automatically when you run it in this repository.

## Canonical rules (Single Source of Truth)

**Primary rules live here (always follow them):**
- `/.cursorrules` — Cursor project rules (shared coding standards)
- `/.cursor/rules/*.mdc` — Modular rules (code-quality, database, deployment, swiss-context)
- `/.claude/CLAUDE.md` — Claude Code context (project overview, commands, structure)

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
npm run test
```

---

## Repository map (high level)

- `src/` — Next.js 14 app
- `cms-api/` — Custom CMS backend
- `medusa-backend/` — Medusa e-commerce backend
- `docs/` — Documentation (see `docs/development/DEV_GUIDE.md`)

---

## When unsure

- Prefer minimal changes, aligned to existing patterns.
- If a change touches auth/security/deployment/schema, **stop and ask**.
