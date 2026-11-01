# AccountKit migration staging

evig still signs in through Auth.js (`src/auth.ts`). Migration
`scripts/db/migrations/142_accountkit_staging.sql` adds AccountKit's tables
beside it under the `auth_` prefix (`createAuthTables('auth_')` in
`src/db/schema/accountkit.ts`), because Auth.js already owns `users`,
`accounts` and `sessions`. Nothing reads or writes them yet. The fleet's
acceptance queue is
[Fleet's checkpoint](https://github.com/bitbaum/fleet/blob/main/docs/remediation-resume-2026-10-29.md).

## Rehearse the import

Against an isolated database holding an authorised snapshot, after every
migration:

```sh
DATABASE_URL=postgres://… node scripts/db/accountkit-import-rehearse.mjs
```

It runs `scripts/db/accountkit-import.sql` in one transaction, always rolls
back, and prints only counts. There is no apply mode. It takes locks even though it
rolls back, so never point it at the served database.

The import keeps each `users.id` as the shared user id, so every table that
references a person keeps pointing at them. Addresses are lower-cased and
their verification is kept (`"emailVerified" IS NOT NULL`). bcrypt hashes are
copied byte for byte and sign in through `legacyBcrypt`. An OrangeCat actor id
becomes an `orangecat` account row, the pair AccountKit's OIDC sign-in looks
up. Roles, `is_staff`, `staff_permissions` and `is_super_admin` stay on
`users`. Two addresses that collide once normalised, drift between runs, or an
already-used shared runtime fail the transaction.

The import finally attaches the mirror triggers defined in migration 142.
From then on every writer of `users` (registration, IT-Hilfe and invite
accounts, the HR hire, admin edits, the 6-digit code, evig's reset link)
keeps `auth_users` in step, and a verification or address change made by
AccountKit reaches `users`. A password is copied only when
`users.password_hash` itself changes, and that change ends every shared
session, as a reset must.

## Shared runtime (built, off)

With `AUTH_RUNTIME=accountkit` the runtime in `src/lib/auth/shared/` answers
every sign-in; unset, Auth.js answers as today. The secret is
`BETTER_AUTH_SECRET`, or the `AUTH_SECRET` the box already holds.

- `auth()` keeps today's session shape, read from the shared session and the
  `users` row on every request (`src/lib/auth/claims.ts`, the same rule the
  Auth.js jwt callback uses). A demotion, a deletion or a newly verified
  address applies on the next request; `token_version` is not needed.
- The pages keep `next-auth/react`. `/api/auth` answers its calls
  (`session`, `csrf`, `providers`, `signout`, `callback/credentials`,
  `signin/orangecat`) from AccountKit, in evig's own login codes, and hands
  every other path to AccountKit. The proxy asks AccountKit for the session.
- Nobody waits for an email confirmation to sign in: that is AccountKit's
  default for every product (owner decision, 2026-11-01), and evig's own rule
  already. Confirming the address still unlocks staff powers
  (`src/lib/auth/claims.ts`).
- Password sign-in keeps evig's per-account lockout beside AccountKit's
  limiter. Change-password goes through AccountKit. Registration, the 6-digit
  code and the reset link stay evig's and reach the shared row through the
  triggers.
- A person AccountKit creates itself (a first OrangeCat or bitbaum sign-in)
  gets an evig row under the same id (`src/lib/auth/shared/accounts.ts`).
  That needs AccountKit's `ids: 'uuid'`, because every evig table keys on a
  uuid. "Connect OrangeCat" from the profile links through AccountKit.

`src/lib/auth/shared/__tests__/journeys.test.ts` runs these through the real
handlers on the real migration chain and the real import. CI's "Migration
Drift Check" job runs it, with the rehearsal, after applying the chain. It is
not deployed or browser evidence.

## Before switching

1. **OrangeCat callback.** evig's OrangeCat client (`evig`) is registered for
   Auth.js's `/api/auth/callback/orangecat`. AccountKit returns to
   `/api/auth/oauth2/callback/orangecat`; orangecat#1501 adds that URI beside
   the old one. Confirm it is live before switching.
2. Stop Auth.js writes, import once under locks, then set `AUTH_RUNTIME`.
   Everyone signed in under Auth.js signs in again once. To roll back, unset
   `AUTH_RUNTIME` and drop the two triggers. A password changed through
   AccountKit is scrypt, which Auth.js cannot read, so those people reset
   their password once more under Auth.js.
3. Prove sign-in, recovery, a staff demotion and revocation on the deployed
   artifact with an approved test identity.
