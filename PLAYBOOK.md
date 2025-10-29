# Communication Playbook

Purpose: help you “speak computer” clearly and get fast, correct outcomes while learning technical skills in this repo.

## Principles
- Goal first: state the outcome, not the implementation.
- Context matters: where in the app, who it affects, related files.
- Constraints upfront: style, performance, security, i18n, timeline.
- Acceptance criteria: observable checks that confirm “done”.
- Small steps: sequence changes; prefer iterative plans.

## Templates

### Feature Request
- Context: [page/area, users, files]
- Goal: [what users can do after this change]
- Constraints: [UI/a11y/perf/i18n/security]
- Acceptance criteria: [numbered, testable]
- Examples: [happy path + edge]
- Out of scope: [excluded work]

### Bug Report
- Context: [where, branch/version]
- Steps to reproduce: [1–2–3]
- Expected vs actual: [clear contrast]
- Evidence: [logs, screenshots]
- Impact: [severity/user impact]

### Refactor Request
- Context: [file(s), pain point]
- Goal: [simpler API, clearer types, tested]
- Constraints: [no behavior change unless stated]
- Acceptance criteria: [size ↓, complexity ↓, tests pass]

### Code Review Ask
- Context: [PR/commit, scope]
- Focus areas: [correctness, UX, security]
- Concerns: [tradeoffs]
- Definition of done: [the confirmation you want]

## Daily Practice Loop (15–30 min)
1) Target: 2 bullets (goal + acceptance criteria)
2) Explore: skim 1–2 files; use `rg` to find identifiers
3) Apply: 10–30 line change; run locally; summarize in 1 sentence

## 2‑Week Skill Sprint
- Core concepts: React props/state, Next.js routes, TypeScript types, API routes.
- Tooling: `rg` search, diffs, `npm run dev`, reading tests.
- Proof: ship 4 tiny, safe PR‑level changes.

Repo shortcuts: frontend `src/app/**`, chatbot `src/features/chatbot/**`, feedback `src/features/feedback/**`, language strings `src/lib/chatbot-language.ts`, API routes `src/app/api/**`.

