# Betrieb Hardening Checklist (Tasks / Protokolle / Entscheidungen)

_Last updated: 2026-02-17_

## Objective
Bring `/admin/tasks`, `/admin/protocols`, `/admin/decisions` to production-grade quality with measurable gates aligned to `CLAUDE.md`.

## Quality Gates

### 1) Core Functionality
- [ ] Tasks: create/list/edit/request/attention/complete end-to-end
- [ ] Protocols: create/list/detail/process/finalize end-to-end
- [ ] Decisions: create/list/detail/discussion/voting/transition end-to-end
- [x] Admin route protection verified (`/admin/*` redirects to login when unauthenticated)

### 2) Resilience & UX
- [x] No infinite loading state on decisions list API failure
- [x] Decisions list shows actionable error state with retry
- [ ] Unified loading/empty/error/success patterns across all 3 areas

### 3) Notifications
- [x] Task request creates in-app notifications
- [x] Task attention flag creates in-app notifications
- [ ] Verify notifications surface correctly in UI (read/unread lifecycle)

### 4) CLAUDE.md Engineering Compliance
- [x] No `console.log` in Betrieb API/UI paths
- [x] Uses `logger` in touched API routes
- [x] Uses `TABLE_NAMES` in touched API routes
- [x] Uses parameterized SQL in touched API routes
- [ ] Full-project typecheck pass (pending long-run command completion)

### 5) Automated Validation
- [x] Targeted ESLint pass on changed files
- [x] Added regression tests for critical fixes (decisions error/retry + task notification helper)
- [ ] Expand automated tests to full tasks/protocols/decisions end-to-end critical paths
- [ ] Run E2E smoke (admin login + 3 Betrieb paths)

## Implemented in this hardening pass

1. **Decisions list hardening** (`src/app/admin/decisions/DecisionListClient.tsx`)
   - Added robust async loading flow (`try/catch/finally`)
   - Added explicit error state + retry button
   - Prevents stuck loading spinner on API/network failures

2. **Task notifications implemented**
   - Added shared helper: `createInAppNotifications()` in `src/lib/api/task-helpers.ts`
   - Wired into:
     - `src/app/api/tasks/[id]/request/route.ts`
     - `src/app/api/tasks/[id]/attention/route.ts`
   - Notifications created in `notifications` table with type=`system`, related to `task`

3. **Static quality checks**
   - Targeted ESLint pass completed on changed files.

4. **Regression tests added**
   - `src/app/admin/decisions/__tests__/DecisionListClient.test.tsx`
     - verifies error state and retry recovery path
   - `src/lib/api/__tests__/task-helpers.test.ts`
     - verifies notification insert call + recipient deduplication

## Remaining work to call this “perfect”

1. Run full typecheck to completion in CI-capable environment.
2. Execute full manual/E2E verification of the three Betrieb workflows.
3. Add regression tests for:
   - decision list error/retry behavior
   - task request + attention notification creation
4. Validate notification UX visibility and interaction in admin/client surfaces.
