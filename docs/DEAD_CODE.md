# Dead Code Inventory

Code that has zero importers in `src/` and is a candidate for removal in
a future cleanup PR. Listed here instead of deleted because the team
hasn't signed off on a bulk deletion yet (NNN.3, June 2026).

Re-verify before deleting — orphan status can change if a feature is
turned back on.

## Verified orphaned (last checked: 2026-06-07)

### Payment / service-booking flow (~590 lines)

The on-frontend payment flow for service appointments. The page that
would have hosted it was never wired up; the API route was only called
from the orphaned hook.

- `src/components/payments/service-booking/` — 9 files
  - `BookingForm.tsx`, `ErrorView.tsx`, `PaymentView.tsx`, `ProcessingView.tsx`,
    `ServiceBookingPayment.tsx`, `SuccessView.tsx`, `index.ts`, `types.ts`,
    `useServiceBooking.ts`
- `src/components/payments/CurrencySelector.tsx` — only imported by the
  orphaned `BookingForm.tsx`
- `src/app/api/appointments/book-with-payment/` — only called by the
  orphaned `useServiceBooking.ts`

### Onboarding info page (~330 lines)

Generic onboarding-info config + its renderer. Neither is referenced
outside the pair itself.

- `src/components/onboarding/OnboardingInfoPage.tsx`
- `src/config/onboarding.ts` (exports `OnboardingConfig`, `REPAIRER_ONBOARDING`
  — only the orphan component imports them)

### Seller-applications Drizzle block (~50 lines)

The schema file itself marks this `DEPRECATED, UNUSED` (per migration
031, which made seller profiles auto-created instead of going through an
application step). The live DB table can stay; only the Drizzle reference
is dead.

- `src/db/schema/marketplace.ts:283-332` — `sellerApplications` table +
  `SellerApplication` + `NewSellerApplication` type exports

**Note**: keep the email template `adminNewSellerApplication` —
that's a different thing and is still in use.

### Misc enum values

- `REPAIRER_AVAILABILITY_TYPE.BLOCKED` in `src/config/repairer-status.ts`
  — defined but never referenced.

### Technician API proxies + singular `/helper/` routes (QQQ.3)

Zero src/ consumers confirmed via grep across hooks/components/apps.
Marked `@deprecated` in their route files so any future import
surfaces a warning. Drop these once a quarterly grep confirms still
unused:

- `src/app/api/repairers/route.ts` — proxy → /api/technicians?tier=professional
- `src/app/api/it-hilfe/helpers/route.ts` — proxy → /api/technicians?tier=community
- `src/app/api/it-hilfe/helper/my-offers/route.ts` — duplicate of /api/it-hilfe/my-offers
- `src/app/api/it-hilfe/helper/matching-requests/route.ts` — no caller
- `IT_HILFE.api.helpers` in `src/config/it-hilfe.ts` — orphan config string
- `IT_HILFE.routes.helpers` in `src/config/it-hilfe.ts` — renamed to
  `routes.technicians`, old key kept as one-release alias

### Possibly orphaned, not yet reverified

- `src/components/technicians/` — 193 lines (TechnicianCard, types,
  index). Zero importers at last check, but kept aside.

## How to re-verify before deletion

```bash
# Replace SYMBOL with the export name.
grep -rn "from '@/components/payments/service-booking'\|ServiceBookingPayment" src

# For a whole directory:
grep -rn "components/payments/service-booking" src
```

A directory is safe to delete when both queries above return nothing
outside the directory itself.
