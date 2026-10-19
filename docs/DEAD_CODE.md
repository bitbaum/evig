# Dead Code Inventory

**Created:** 2026-06-07  
**Last Modified:** 2026-06-19  
**Last Modified Summary:** Removed service-booking orphan; documented live pay path

Code that has zero importers in `src/` and is a candidate for removal in
a future cleanup PR. Listed here instead of deleted because the team
hasn't signed off on a bulk deletion yet (NNN.3, June 2026).

Re-verify before deleting — orphan status can change if a feature is
turned back on.

## Verified orphaned (last checked: 2026-06-15)

### ~~Payment / service-booking flow (~590 lines)~~ — REMOVED 2026-06-19

Was orphaned: `service-booking/` UI, `CurrencySelector`, `book-with-payment` API,
`useCustomerBookings`. Live service payment path is book via `POST /api/appointments`,
then pay via `POST /api/appointments/[id]/pay` from `/dashboard/appointments/[id]`.
Routes SSOT: `src/config/service-appointments.ts`.

### ~~Onboarding info page (~330 lines)~~ — REMOVED 2026-06-15

Was: `OnboardingInfoPage.tsx` + `config/onboarding.ts`. Deleted; live
onboarding is `OnboardingChecklist` on `/dashboard`.

### Seller-applications Drizzle block (~50 lines)

The schema file itself marks this `DEPRECATED, UNUSED` (per migration
031, which made seller profiles auto-created instead of going through an
application step). The live DB table can stay; only the Drizzle reference
is dead.

- `src/db/schema/marketplace.ts` (the "SELLER APPLICATIONS — DEPRECATED, UNUSED" block) — `sellerApplications` table +
  `SellerApplication` + `NewSellerApplication` type exports

**Note**: keep the email template `adminNewSellerApplication` —
that's a different thing and is still in use.

### Misc enum values

- `REPAIRER_AVAILABILITY_TYPE.BLOCKED` in `src/config/repairer-status.ts`
  — defined but never referenced.

### Technician API proxies + singular `/helper/` routes (QQQ.3) — 410 Gone (2026-06-19)

The two list proxies have since been deleted outright; their successors are
`/api/technicians?tier=professional` (was `/api/repairers`) and
`/api/technicians?tier=community` (was `/api/it-hilfe/helpers`). The
`/api/repairers/[id]/` per-resource routes are gone too: technicians are read
through `src/app/api/technicians/[id]/route.ts`.

The singular `/helper/` routes below still exist and return **410 Gone** via
`src/lib/api/deprecated-endpoint.ts` with `Link: rel="successor-version"`:

- `src/app/api/it-hilfe/helper/my-offers/route.ts` → use `/api/it-hilfe/my-offers`
- `src/app/api/it-hilfe/helper/matching-requests/route.ts` → use `/api/it-hilfe/requests?matchMySkills=true`
- ~~`IT_HILFE.api.helpers`~~ — removed; use `IT_HILFE.api.technicians` / `technician(id)`
- ~~`IT_HILFE.routes.helpers`~~ — renamed to `routes.technicians` in
  `src/config/it-hilfe.ts`; the one-release alias has since been removed

### Removed 2026-06-23

- `src/components/technicians/` — deleted; it was a duplicate TechnicianCard (zero importers; live card at
  `src/app/[locale]/it-hilfe/techniker/TechnicianCard.tsx`)

### Possibly orphaned, not yet reverified

## How to re-verify before deletion

```bash
# Replace SYMBOL with the export name.
grep -rn "from '@/components/payments/service-booking'\|ServiceBookingPayment" src

# For a whole directory:
grep -rn "components/payments/service-booking" src
```

A directory is safe to delete when both queries above return nothing
outside the directory itself.
