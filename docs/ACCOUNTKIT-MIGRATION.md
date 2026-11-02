# AccountKit migration

evig signs in through AccountKit since 2026-11-01, and on AccountKit's own
screens since the release that added migration 143 (see "AccountKit's
screens" below). Auth.js is gone from the tree; `src/auth.ts` only reads the
session. Migration
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

The import finally attaches the mirror triggers defined in migrations 142 and
143. From then on every writer of `users` (IT-Hilfe and invite accounts, the
HR hire, admin edits, the 6-digit code) keeps `auth_users` in step, and a
verification, address, name or deletion made by AccountKit reaches `users`.
A password is copied only when `users.password_hash` itself changes, and that
change ends every shared session; since AccountKit's screens nothing in evig
writes that column.

## AccountKit's screens

Every auth page is AccountKit's own form (`@bitbaum/accountkit/auth/react`,
in evig's look in `src/components/auth/AuthForms.tsx`):

- `/auth/login`: password, "Mit Passkey anmelden", an email sign-in link,
  "Passwort vergessen?", Sign in with OrangeCat and the shared bitbaum sign-in
  (Morulia). Each shows when its env is set
  (`src/lib/auth/shared/methods.ts`): the email link and recovery need account
  mail (`RESEND_*`), OrangeCat needs `ORANGECAT_OAUTH_CLIENT_ID` and `_SECRET`,
  the bitbaum sign-in needs `SIGNIN_ISSUER`, `SIGNIN_CLIENT_ID` and
  `SIGNIN_CLIENT_SECRET`.
- `/auth/register`: the same methods, asking for an email and a password. The
  new person lands on `/auth/verify-email`, where evig's 6-digit code confirms
  the address (skipping is one tap; the dashboard banner resends the code). A
  referral link (`?ref=`) still credits the inviter.
- `/auth/forgot-password`: AccountKit's recovery form. The mailed link lands on
  the sign-in page, which sets the new password. An account with no password
  yet (IT-Hilfe, an HR hire) sets its first one the same way.
- `/dashboard/security` (linked from the settings): AccountKit's account
  panel, with password change, passkeys, two-step sign-in, linked sign-ins and
  deleting the account. "Connect OrangeCat" on the profile still works.

`src/lib/auth/shared/compat.ts` passes `screens: 'accountkit'` (AccountKit
0.20.0), which opens every AccountKit endpoint. Its credentials callback stays
for the E2E helpers. `auth()` keeps today's session shape, read from the shared
session and the `users` row on every request (`src/lib/auth/claims.ts`), so a
demotion, a deletion or a newly verified address applies on the next request.
Confirming the address still unlocks staff powers.

AccountKit is the only credential writer. evig's own `/api/auth/register`,
`forgot-password`, `reset-password` and `verify-email` and
`/api/user/change-password` are removed: they would have shadowed AccountKit's
endpoints of the same names. What stays evig's
(`src/lib/auth/shared/evig-plugin.ts` and its neighbours):

- the per-account lockout (`src/lib/auth/lockout.ts`) on AccountKit's password
  sign-in: a locked account is refused even with the right password, as
  "too many attempts";
- the 6-digit code: AccountKit's confirmation mail is replaced by evig's code
  mail (`confirmation-code.ts`), and `/api/auth/verify-code` and
  `resend-code` are unchanged;
- IT-Hilfe's 7-day claim link: `createPasswordResetToken` stores the token as
  AccountKit's reset value too (`credentials.ts`), and `/auth/reset-password`
  hands it to the sign-in page. A link mailed before this release is honoured
  the same way (`reset-links.ts`). Using it confirms the address;
- a team invitation's claim sets the password through AccountKit;
- the HR hire, invitations and staff permissions are unchanged: they write
  `users`, and the mirror keeps AccountKit in step;
- deleting an account is refused, before anything is deleted, for a super
  admin and for a person named on records evig must keep. The security page
  says so and offers deletion by the team.

Migration `143_accountkit_screens.sql` (additive, idempotent) makes the
panel's rename and deletion reach `users`. It replaces the mirror function in
place and attaches the delete trigger only where the mirror is attached
(production), so the deploy applies it; the import attaches it on a fresh
database.

Existing accounts keep their ids. Imported bcrypt hashes verify through
`legacyBcrypt`; a password set through AccountKit is its native scrypt and
lives in `auth_accounts`. OrangeCat links (`orangecat` account rows, and
`users.orangecat_actor_id`) are kept.

Known changes: AccountKit's labels say "Sie" where evig's own pages say "du";
and when an email sign-in link proves an unconfirmed address, better-auth
drops any password set before that proof (its pre-hijack guard), so the
person sets one again through recovery.

`src/lib/auth/shared/__tests__/journeys.test.ts` runs the ways in through the
real handlers on the real migration chain and the real import (CI's
"Migration Drift Check"). The browser journey
(`tests/e2e/account-journey.spec.ts`) runs in CI's "Local E2E Journeys" job
after the seeded accounts and one Auth.js-era account are imported, with mail
caught by `scripts/ci/mail-sink.cjs`. That is not deployed evidence.

To roll back the screens, revert the pull request. The shared runtime keeps
verifying every password set since then. Do not use Loki's
`accountkit-switch.yml rollback` any more: it would empty the only copy of
those credentials.

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

Not proven by a machine: a reset mail arriving in a real inbox.
