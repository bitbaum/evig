created_date: 2025-10-20
last_modified_date: 2025-10-20
last_modified_summary: Added AI efficiency goals; noted automation-first approach and updated share button enhancement workflow (Mastodon support).

## User Style Profile (Living Document)

Purpose: Capture how you like to work so I can adapt guidance and keep you in flow, especially when you want me to carry the project forward.

### Communication & Language
- Prefer Swiss High German (no ß; use Velo, etc.).
- Concise, skimmable updates with clear next steps and options; I recommend one and note alternatives.
- Default to taking initiative without constant confirmation; only pause if blocked or for security-sensitive changes.

### Code & Project Organization
- Professional, modern stack; clean architecture and clear separation of concerns.
- DRY, single-responsibility functions/components; meaningful names.
- Update existing docs before creating new ones; consolidate under `docs/`.
- Never create files at repo root unless config/essential.

### Documentation Standards
- Every doc includes: created_date, last_modified_date, last_modified_summary (YYYY-MM-DD).
- Keep docs current with edits; documentation drives development.

### Security & Data Handling
- Never commit secrets, env values, or credentials.
- Ask before editing auth/security, deployment, or schema.

### Migrations & Scripts
- Never modify or delete existing migrations; add new timestamped migrations.
- Scripts live under `/scripts/{category}/` (db, dev, deployment, test, maintenance).

### Developer Experience
- One-key dev: `d` runs all dev servers.
- Prefer automated validation (Playwright/CI) before asking you to check UI.

### Product & UX Preferences
- Flows should be fast, low-friction, and enjoyable for short attention spans.
- Provide sensible defaults and quick actions; avoid modal fatigue and multi-step friction.

### When You Say “Carry Me”
- I will:
  - Propose and execute a plan end-to-end (code + tests + docs) without hand-holding.
  - Add/adjust tests (Playwright) to prove flows work before asking you to open the site.
  - Keep status updates brief with clear outcomes and links to artifacts (reports, diffs).

### Current Known Preferences (Seeded)
- Use Swiss High German across UI and comms.
- Refer to the custom CMS backend as “Cem Backend”.
- Prefer professionally organized, fully documented codebases.
- Start all dev servers via `d`.
- I should continue tasks independently and update you once ready for review.

### AI Communication Efficiency Goals
- You want to become the most efficient not-so-technical communicator with AI.
- We are automating everything - I should proactively automate workflows, tests, and validations.
- When you give high-level direction, I should fill in technical details and execute end-to-end.
- I should anticipate next steps and dependencies without asking for clarification.
- Default to "show, don't tell" - demonstrate working solutions rather than explaining approaches.

### How To Evolve This Profile
- I will update this file whenever I observe new preferences.
- You can add bullet points here in free form; I will adhere and refine.


