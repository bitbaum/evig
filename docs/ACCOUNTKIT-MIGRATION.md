# AccountKit migration

evig signs in through AccountKit since 2026-11-01 (`AUTH_RUNTIME=accountkit`).
Auth.js (`src/auth.ts`) stays in the tree for a rollback. Migration
`scripts/db/migrations/142_accountkit_staging.sql` adds AccountKit's tables
beside it under the `auth_` prefix (`createAuthTables('auth_')` in
`src/db/schema/accountkit.ts`), because Auth.js already owns `users`,
`accounts` and `sessions`. The fleet's
acceptance queue is
[Fleet's checkpoint](https://github.com/bitbaum/fleet/blob/main/docs/remediation-resume-2026-10-29.md).

## Rehearse the import

Against an isolated database holding an authorised snapshot, after every
migration:

```sh
DATABASE_URL=postgres://… pnpm run db:rehearse-import
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

## Shared runtime (on since 2026-11-01)

With `AUTH_RUNTIME=accountkit` the runtime in `src/lib/auth/shared/` answers
every sign-in; unset, Auth.js answers as today. The secret is
`BETTER_AUTH_SECRET`, or the `AUTH_SECRET` the box already holds.

- `auth()` keeps today's session shape, read from the shared session and the
  `users` row on every request (`src/lib/auth/claims.ts`, the same rule the
  Auth.js jwt callback uses). A demotion, a deletion or a newly verified
  address applies on the next request; `token_version` is not needed.
- The pages keep `next-auth/react`. AccountKit's compat layer
  (`@bitbaum/accountkit/auth/nextauth-compat`, configured in
  `src/lib/auth/shared/compat.ts`) answers its calls (`session`, `csrf`,
  `providers`, `signout`, `callback/credentials`, `signin/orangecat`) in
  evig's own login codes. Of AccountKit's own endpoints only the session,
  sign-in, sign-out and the OAuth callback are open. The proxy asks AccountKit
  for the session.
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

## Switched (2026-11-01)

The switch ran from Loki's
[`accountkit-switch.yml`](https://github.com/bitbaum/loki/blob/main/.github/workflows/accountkit-switch.yml)
(see Loki's
[AccountKit migration](https://github.com/bitbaum/loki/blob/main/docs/architecture/accountkit-migration.md)):

1. A survey counted 21 accounts and nobody whose only way in would be
   lost.
2. The import ran once, under locks, and attached the mirror triggers.
3. `AUTH_RUNTIME=accountkit` was set and the app restarted.
4. A live proof ran on the public site. A throwaway account signed in through
   the product's own sign-in route, read its session back, signed out, and
   was deleted.

Everyone signed in under Auth.js signs in again once.

The OrangeCat round-trip starts on the live site: the sign-in button reaches
OrangeCat's authorize page with the redirect `/api/auth/callback/orangecat`,
which client `evig` accepts. AccountKit 0.18.1 made that work; 0.18.0
started it through an endpoint better-auth 1.7 removed (bitbaum/accountkit#55).

To roll back, run the same workflow with `rollback`. It unsets `AUTH_RUNTIME`,
restarts on Auth.js, drops the mirrors and empties the shared tables.
A password changed through AccountKit is scrypt, which Auth.js cannot read, so after a rollback those people reset their password once more.

Proven live on 2026-11-01 by Loki's `accountkit-switch.yml` `prove` action,
using throwaway accounts that it deleted again:

- two sessions at once;
- a change to the person's row, read on the next request (the path a role,
  staff or company change takes);
- a password write, which is what a reset and a password change do. It ended
  both sessions, the old password was refused and the new one signed in;
- sign-out, and deleting the person ending their session;
- a real browser sign-in with a throwaway OrangeCat account: the product's
  OrangeCat button, OrangeCat's sign-in and consent, and back in, signed in.
  Its first run found that the first such sign-in failed
  (`unable_to_create_user`); AccountKit 0.19.0 fixed it
  (bitbaum/accountkit#56).

Not proven by a machine: a reset mail arriving in a real inbox. The reset
code is the product's own and did not change in the switch.
