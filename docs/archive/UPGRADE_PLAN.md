# Dependency upgrade plan

**Status (2026-06-03):** Snapshot from `npm outdated`. Goal: a defensible sequence — what's safe today, what needs a branch + manual verification, what's worth waiting for.

## Tier 1 — safe patches (no risk, do now)

`npm update` resolves all of these. No breaking changes, no API surface affected:

| Package | Current | Wanted | Notes |
|---|---|---|---|
| `@auth/pg-adapter` | 1.11.1 | 1.11.2 | patch |
| `@playwright/test` | 1.58.2 | 1.60.0 | minor — new test APIs, fully backwards compatible |
| `eslint-config-next` | 16.2.1 | 16.2.7 | patch |
| `framer-motion` | 12.38.0 | 12.40.0 | minor |
| `jest` | 30.3.0 | 30.4.2 | minor |
| `next` | 16.2.6 | 16.2.7 | patch — pulls in upstream bug fixes |
| `next-auth` | 5.0.0-beta.30 | 5.0.0-beta.31 | beta-to-beta — verify auth smoke test after |
| `next-intl` | 4.12.0 | 4.13.0 | minor |
| `nodemailer` | 8.0.5 | 8.0.10 | patch |
| `pg` | 8.20.0 | 8.21.0 | minor |
| `postcss` | 8.5.12 | 8.5.15 | patch |
| `zod` | 4.3.6 | 4.4.3 | minor — confirm `.email()` / `.url()` still behave as documented |
| `lru-cache`, `ioredis`, `tailwind-merge`, others | various | | patch/minor |

**Action:** `npm update && npm run typecheck && npm run test && npm run build`. If all green, commit. ~30 min, low risk.

## Tier 2 — major bumps (need a branch + manual verification)

### React 19 (18.3 → 19.2) — **upgradable now** (1-day branch)

**Why now (not later):** Peer-deps check confirms ecosystem is ready:
- `next-auth@5.0.0-beta.31` → `react: ^18.2.0 || ^19.0.0` ✓
- `recharts@latest` → `react: ^16.8.0 || ^17.0.0 || ^18.0.0 || ^19.0.0` ✓
- `framer-motion@12.x` → works with React 19 ✓
- `next@16.2` → built for React 19 ✓

Custom code: the new `use()` hook is opt-in; no forced rewrite. `useFormStatus` improvements. `ref` as a prop deprecates `forwardRef` (codemod handles 90%).

**Plan when ready:**
```bash
git checkout -b upgrade/react-19
npx @next/codemod@latest upgrade  # auto-handles 90% of changes
npm install react@^19.2 react-dom@^19.2 @types/react@^19 @types/react-dom@^19
npm run typecheck   # expect ~10 errors in forwardRef components
npm run test
npm run build
# Manual smoke test: auth, marketplace listing detail, admin dashboard, modal focus
```

Effort: 4–8 h for the migration, 1 day burn-in on staging before main.

### TypeScript 6 (5.9 → 6.0) — **defer until React 19 done**

**Why:** Stricter inference. Some patterns we use intentionally (`as unknown as ...` for migrations, generic constraints on `withAdmin`) may flag. Bundle in same branch as React 19 to share verification cost.

**Plan:** `npm install -D typescript@^6` then fix the ~20–50 type errors that surface. Most will be cosmetic (`unknown` instead of `any` inference, stricter union narrowing).

### ESLint 10 (9 → 10) — **defer with React 19/TS 6**

**Why:** Flat-config-only (we already use flat config). Mostly rule renames. `eslint-config-next` 16.x supports both 9 and 10 — verify before bumping.

### Tailwind 4 (3.4 → 4.3) — **WAIT 3–6 months**

**Why:** Major engine rewrite (Rust/Oxide). Config moves from `tailwind.config.ts` to `@theme` blocks in CSS. Plugin API changed. We have a custom design-system layer (`src/lib/design/`) that uses Tailwind utilities programmatically — needs verification path-by-path.

**Plan:** Wait for one or two of (a) Next.js officially recommending Tailwind 4, (b) `eslint-config-next` shipping a Tailwind 4 lint preset, (c) at least one of our chart libs (recharts/framer-motion) confirming v4 compatibility. Then schedule a dedicated 1–2 day session.

### Other majors — case by case

| Package | Current → Latest | Verdict |
|---|---|---|
| `lucide-react` 0.488 → 1.17 | Major v1.0 cut. API stable in 0.x already; 1.x is mostly the version-pin signal. Likely a 1-line change but verify the icon-name list. | Bundle with Tier 1 update; low risk if smoke test passes. |
| `bcryptjs` 2 → 3 | Default rounds changed; salt format compatible. | Low — bump and re-verify auth.smoke.test. |
| `redis` 5 → 6 | API rename for v6 (some `client.X` → `client.command.X`). | Audit `src/lib/auth/redis.ts` usage first — ~5–10 call sites. |
| `concurrently` 9 → 10 | Dev-only. | Tier 1 — `npm install -D` and verify scripts. |
| `puppeteer` 24 → 25 | Used for PDF generation only. Major likely cosmetic. | Defer; not customer-facing. |

## Tier 3 — explicit do-not-bump

| Package | Current → Latest | Reason to skip |
|---|---|---|
| `@types/node` 20 → 25 | Node 20 LTS is our deploy target. Bumping types past runtime version flags APIs we can't actually call. | Stay on `@types/node@^20` until Node 22 LTS deploy. |
| `@types/uuid` 11 → 10 | The "latest" went *backwards* — `uuid` 14.x types ARE the 11.x package. The 10.x types are for old `uuid` v10. Don't downgrade. | Stay on 11. |
| `@types/puppeteer` 7 → 5 | Same regression — puppeteer's own types replaced this package; the 5.x stub is for legacy. | Remove `@types/puppeteer` entirely (puppeteer ships its own types now). One-line cleanup, do it as part of Tier 1. |
| `@types/nodemailer` 7 → 8 | Their version numbering desyncs from runtime. Pin to matching runtime; check after each nodemailer bump. | Hold until verified compatible. |

## Recommended schedule

| When | Do | Effort | Status |
|---|---|---|---|
| ~~Today~~ | Tier 1 (`npm update` + delete `@types/puppeteer`) | 30 min | ✅ **done 2026-06-03** |
| **Next branch** | React 19 (peer-deps already compatible — no blocker) | 4–8 h, smoke-test on staging | unblocked |
| **Same branch** | TypeScript 6 — bundle for shared verification | 2–4 h surface, mostly cosmetic | unblocked |
| **Same branch** | ESLint 10 — verify `eslint-config-next` 16.x compat first | 1 h | check first |
| **Q4 2026 or later** | Tailwind 4 — wait for ecosystem | 1–2 days, scheduled | wait |
| **Never** | `@types/node` past Node 20 until runtime catches up | — | hold |

## Notes on dependency velocity

This audit ran 2026-06-03. The list moves fast — re-run `npm outdated` and reassess Tier 2/3 each quarter. Tier 1 should run continuously via Dependabot or Renovate (currently neither is configured — that's a follow-up).

---

**Last updated:** 2026-06-03 — initial plan.
