# Profiles SSOT consolidation

**Decided 2026-07-11.** Chosen scope: hoist shared public-identity fields **and
`is_verified`** to `user_profiles`; verification becomes per-person.

## The problem (grounded, not guessed)

Six `*_profiles` tables exist, but only **three are person facets**; the other
two are a product-matching taxonomy, not people:

| Table | What it is |
|---|---|
| `users` | Identity SSOT — name, email, image, created_at, is_staff |
| `user_profiles` | **Everyone's** public+personal profile — display_name, avatar_url, bio, city, canton, address, contact, prefs, visibility |
| `seller_profiles` | Seller facet — business, ratings, sales, listings, auto_publish |
| `technician_profiles` | Technician facet — services, pricing, service radius, availability, ratings |
| `team_profiles` | Staff/HR facet — employment, comp, hr_notes, skills, goals |
| ~~`customer_profiles` / `product_customer_profiles`~~ | **NOT people** — build-your-computer archetypes ("Student/Gamer" hardware-need scores + recommended OS) |

**Correct as-is:** separate seller / technician / team facet tables keyed by
`user_id`. Their columns don't overlap; merging them would be a sparse
god-table (KISS/YAGNI). Keep them.

**The real SSOT bug:** the shared *identity* fields — `display_name`,
`avatar_url`, `bio`, and `is_verified` — are duplicated onto `seller_profiles`
(and `is_verified` onto `technician_profiles`), so a person's public name /
avatar / verified status can live in 2–3 places and disagree.

**Deliberately NOT touched:** `city` / `canton` on the role tables. Those are
*distinct facts* (seller storefront / technician service base used for
geo-matching), not duplicated identity — personal city already lives in
`user_profiles`. Merging them would be wrong.

## Target model

```
users               → identity (unchanged)
user_profiles       → public identity SSOT: display_name, avatar_url, bio,
                      is_verified, verification_date  (+ existing personal fields)
seller_profiles     → seller-ONLY: business, ratings, sales, listings   (identity cols dropped)
technician_profiles → technician-ONLY: services, pricing, radius, city/canton (service base)  (is_verified dropped)
team_profiles       → staff-ONLY (already clean)
```

SSOT read chokepoint: `src/lib/services/public-identity.ts`
(`getPublicIdentityMap`, `publicIdentityColumns`, `resolveDisplayName`).

## Execution — 3 safe slices (expand → migrate reads → contract)

**Slice 1 — foundation (non-breaking). ✅ SHIPPED / in progress this session.**
- `121_profiles_identity_ssot.sql`: add `is_verified` + `verification_date` to
  `user_profiles`; backfill display_name/avatar/bio/is_verified from role tables
  (COALESCE-preserve existing; verified = OR across roles). Role columns kept.
  Replay-validated against seeded deps.
- Drizzle: `userProfiles.isVerified` / `.verificationDate`.
- New `public-identity.ts` SSOT service (unused until Slice 2).

**Split note:** Slice 2 is executed by DOMAIN (2a seller, 2b technician), each
switching reads AND writes together so there's never a stale-name window on the
live site (public read from user_profiles + write still to role table = divergence).

**Slice 2a — seller identity (reads + /me write). ✅ code done, tests green.**
`/me` PATCH now upserts identity into user_profiles + writes city/canton to
seller_profiles; all public seller reads join user_profiles. Verify badge/member/
seller page on prod.

**Slice 2b — technician identity (reads + verify write). ✅ code done, tests green.**
`is_verified` is per-PERSON, so technician verification now reads/writes
`user_profiles` everywhere. The verify action (`api/admin/it-hilfe/helpers/[id]`)
upserts `user_profiles.is_verified`; suspend/reactivate stay on the role table
(role status, not identity). All readers join `user_profiles`:
- `lib/domain/technician-visibility.ts` (SSOT visibility conditions — every
  caller must `leftJoin userProfiles`), `api/technicians/route.ts` (main+count),
  `lib/services/technician-service.ts`, `lib/services/appointments.ts`
  (`listActiveRepairers`), `lib/reviews/review-service.ts` (`validateReviewTarget`),
  `api/it-hilfe/requests/route.ts` (preferred-technician gate),
  `api/it-hilfe/requests/[id]/offers/route.ts`,
  `api/it-hilfe/requests/[id]/matches/route.ts`,
  `api/admin/it-hilfe/helpers/route.ts` (main+count), `api/admin/it-hilfe/stats/route.ts`.
- Verify on prod: technician verified filter/badge + verified-helper stat correct.

**Slice 3 — contract (drop columns). ✅ code done, tests green.**
Writes already moved in 2a/2b, so this is purely the contract:
- Migration `122_drop_profile_identity_dupes.sql`: drops
  `seller_profiles.{display_name,avatar_url,bio,is_verified,verification_date}`
  and `technician_profiles.{is_verified,verification_date}` (+ their verified
  indexes). Idempotent; ordered after 121's backfill for the from-zero replay.
- Drizzle: identity columns removed from `sellerProfiles` / `repairerProfiles`.
- MUST deploy as a SEPARATE deploy, only after 2a+2b are confirmed live (they
  are — 2b shipped and prod-verified) so no old reader hits the dropped columns.

**Done.** user_profiles is now the sole owner of public identity + per-person
verification; the role tables hold only role facts.

## Guardrails
- Prod auto-applies migrations before activating; a failed migration/build keeps
  the old build serving. Never drop a column in the same deploy that stops
  reading it — that's why contract is Slice 3.
- `is_verified` is now per-person: verifying anyone sets `user_profiles`.
