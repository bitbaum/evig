# Saldo

**Time tracking that balances.** — _Zeiterfassung, die aufgeht._

A dependency-free TypeScript engine for **Soll/Ist time balances**, vacation, and
honest monthly reports. It answers the one question every timesheet dodges: _did
this person work the hours they were supposed to?_ — and it does so correctly
across mid-year workload changes, public holidays, paid and unpaid absences, and
historical months.

Zero runtime dependencies. Pure functions. Bring your own storage and UI.

> The name lives in one place — [`src/brand.ts`](./src/brand.ts). Rename the whole
> product by editing that object.

## Install

```bash
npm install saldo-engine
```

## Quick start

```ts
import {
  computeTimeSaldo,
  computeVacationBalance,
  getHolidayDateSet,
  STANDARD_WEEKLY_SCHEDULE,
} from 'saldo-engine'

const result = computeTimeSaldo({
  openingMinutes: 0,              // carried-in balance
  openingDate: '2026-01-01',      // …as of this date
  periods: [{ validFrom: '2026-01-01', weeklyMinutes: 21 * 60 }], // the Pensum, effective-dated
  schedule: STANDARD_WEEKLY_SCHEDULE,   // which weekdays are worked
  entries: [{ work_date: '2026-07-06', duration_minutes: 420, category: 'work' }],
  holidays: getHolidayDateSet(2026, 2026),
  today: '2026-07-20',            // as-of date (inject for reports)
})

// → { saldoMinutes, monthSollMinutes, monthIstMinutes, monthSaldoMinutes, computedFrom }
```

## What it computes

- **Zeitsaldo (running balance)** — `opening + Σ(Ist − Soll)` through the as-of date.
  A scheduled day without entries shows as a minus immediately.
- **Soll (target)** — the effective-dated weekly Pensum distributed across the
  scheduled weekdays. A mid-year 60% → 80% change keeps every past month correct.
- **Month decomposition** — real Soll/Ist for the as-of month, computed **always**,
  even for a month before the opening date (historical reports show real numbers,
  never a fake 0).
- **Feriensaldo (vacation)** — entitlement + carryover − taken, with a pro-rata
  default when no explicit entitlement is set.

Design rules baked in: public holidays on scheduled days reduce Soll automatically;
paid absences (holiday/sick/…) count as Ist, unpaid ones don't; a manual
holiday-category entry on a real holiday is dropped so it can't double-count.

## Bring your own categories

The engine ships a sensible **Swiss** default (paid: Ferien/Krank/Unfall/Feiertag/
Militär; unpaid: Unbezahlt). Any organisation can supply its own:

```ts
import { categoryConfigFromAbsences, computeTimeSaldo } from 'saldo-engine'

const categories = categoryConfigFromAbsences(
  [{ value: 'pto', paid: true }, { value: 'sabbatical', paid: false }],
  'public_holiday', // your holiday-marker category
)
computeTimeSaldo(input, { categories })
```

## Holidays

`getHolidayDateSet` / `getPublicHolidays` ship the Kanton Zürich statutory set
(deterministic, Easter-derived — no per-year maintenance). For other countries or
cantons, pass your own `Set<'YYYY-MM-DD'>` as `holidays`.

## Scope

This is the **accounting core** — the maths, fully tested. Storage (DB), auth, the
UI, PDF/print reports, and localisation live in the app that embeds it. See the
[Saldo product](../../) for a reference Next.js implementation (self-service
timecards, four-eyes approval, printable monthly reports, and public share links
for a referring social worker).

## Develop

```bash
npm run typecheck   # tsc --noEmit
npm test            # node:test via tsx — zero external deps
npm run build       # emit dist/
```

## License

MIT — see [LICENSE](./LICENSE).
