# Codebase Bug List

**Created**: 2026-03-19
**Last Updated**: 2026-03-19

---

## Critical — ALL FIXED

| # | Bug | File | Status |
|---|-----|------|--------|
| 1 | `ANY()` with JS array — inventory route | `src/app/api/admin/inventory/route.ts` | FIXED (prior branch) |
| 2 | Double-wrapped `apiSuccess` on AI extract | `src/app/api/ai/extract/route.ts` | FIXED (prior branch) |
| 3 | `ANY()` with array literal in dashboard stats | `src/components/admin/dashboard/getDashboardStats.ts` | FIXED |
| 4 | Double `apiSuccess({ success: true })` in inventory DELETE | `src/app/api/admin/inventory/[id]/route.ts` | FIXED |
| 5 | Double `apiSuccess({ success: true, ... })` in inventory PUT | `src/app/api/admin/inventory/[id]/route.ts` | FIXED |
| 6 | Double `apiSuccess({ success: true })` in products PUT | `src/app/api/admin/products/[id]/route.ts` | FIXED |
| 7 | Double `apiSuccess({ success: true })` in products DELETE | `src/app/api/admin/products/[id]/route.ts` | FIXED |

Also fixed: Double `apiSuccess({ success: true })` in inventory PATCH (same file as #4/#5).

---

## Medium — ALL FIXED

`ANY()` with JS arrays converted to `IN (${sql.join(...)})` pattern.

| # | File | Status |
|---|------|--------|
| 8 | `src/lib/services/decisions-voting.ts` | FIXED |
| 9 | `src/lib/services/decisions-core.ts` | FIXED |
| 10 | `src/lib/services/order-service.ts` | FIXED |
| 11 | `src/lib/services/inventory-service.ts` | FIXED |
| 12 | `src/lib/hirn/retrieval.ts` | FIXED |

---

## Low — Won't Fix

| # | Issue | Reason |
|---|-------|--------|
| 13 | Products GET nests as `{ product: ... }` | Frontend consumers (`factsheet/page.tsx`, `useSmartEntry.ts`) depend on `data.data.product` shape — changing would break them |
| 14 | Legacy raw SQL in erfassung create-product | Uses `getTableName()` from Drizzle (safe constant from schema), in a legacy PoolClient path marked for future removal |
