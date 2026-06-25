# RevampIT Unified Authentication System

**Created:** 2025-12-02  
**Last Modified:** 2026-06-25  
**Last Modified Summary:** Password reset now verifies email; register resumes unverified accounts; forgot-password surfaces SMTP failures for known users.

---

## Overview

RevampIT uses **one account** for everything on the platform:

- Shop purchases and marketplace listings
- Workshop registration
- Service appointments and IT-Hilfe
- Donations and volunteer applications
- Newsletter preferences
- **Admin dashboard** (`/admin`) — same login, gated by `isStaff` + `staff_permissions`

There is **no separate admin token system**. Staff sign in through the same `/auth/login` flow as everyone else.

---

## Architecture

### Tech stack

| Component | Technology |
|-----------|------------|
| Auth framework | Auth.js v5 (NextAuth) |
| Provider | Credentials (email + password) only |
| Session strategy | **JWT** (signed cookie, not DB sessions) |
| Database | PostgreSQL (Neon in production; Docker locally) |
| ORM | Drizzle |
| Password hashing | bcrypt (12 rounds) |
| Email | Listmonk → SMTP fallback via `sendEmail()` |

### Why JWT (not database sessions)?

The Credentials provider requires JWT strategy in Auth.js. Database sessions would need the `@auth/pg-adapter`, which is **intentionally disabled** until OAuth providers are added.

Implications:

- Sessions live in HttpOnly cookies, not the `sessions` table (table exists for future OAuth).
- Revocation is handled via **`token_version`** on the user row — admin permission changes bump this counter; the JWT callback re-fetches claims on the next token refresh (~24h via `updateAge`).
- Account lockout uses in-memory + DB rate limiting on failed login attempts.

### Staff and admin access

Staff status is determined by:

1. **`users.is_staff`** flag in the database (SSOT), or
2. **`@revamp-it.ch` email domain** for initial auto-provisioning at registration.

Permissions live in **`users.staff_permissions`** (string array). See `src/lib/permissions.ts` for section access rules.

Admin layout (`src/app/admin/layout.tsx`) requires:

- Valid session
- `session.user.isStaff === true`
- At least one accessible admin section from `getAccessibleSections()`

Super-admin checks use `session.user.isSuperAdmin` plus email allowlist helpers.

---

## User lifecycle

### 1. Registration

```
RegistrationWizard → POST /api/auth/register → registerUser() in auth.ts
```

- Validates with `RegisterSchema` (Zod)
- Rate-limited per IP
- Creates `users` row + empty `user_profiles` row
- Sends **6-digit verification code** email (`verificationCode` or `staffVerificationCode` template)
- User is **not** logged in yet — `emailVerified` remains null

Optional referral code is redeemed fire-and-forget after successful registration.

### 2. Email verification

```
RegistrationWizard step 2 → POST /api/auth/verify-code
```

- Verifies the 6-digit code against `verification_codes` table
- Sets `users.emailVerified`
- Sends welcome email (`welcome` or `staffWelcome`)
- User can now log in (login rejects unverified accounts)

Resend: `POST /api/auth/resend-code` (rate-limited).

Legacy link flow still exists at `/auth/verify-email` + `POST /api/auth/verify-email` for older tokens.

### 3. Login

```
LoginForm → Auth.js Credentials provider → JWT session cookie
```

Security checks (in order):

1. User exists
2. Account lockout (failed attempts)
3. Password valid (bcrypt)
4. **Email verified** — unverified users cannot sign in
5. Staff claims populated from DB + email domain rules

On first sign-in, `getOrCreateProfile()` ensures a `user_profiles` row exists.

New users are redirected to `/dashboard/profile` (`pages.newUser`).

### 4. Password reset

```
/auth/forgot-password → POST /api/auth/forgot-password
/auth/reset-password  → POST /api/auth/reset-password
```

- Token stored in verification infrastructure (`db-verification.ts`)
- Default TTL: 1 hour; creating a new token clears stale rows for that email
- **Successful reset sets `emailVerified`** — proves mailbox control (fixes IT-Hilfe claim + forgot-password users stuck at login)
- Unknown email: generic success (enumeration-safe). Known email + SMTP failure: **503** with actionable message
- Email via `passwordReset` template

Also used by IT-Hilfe anonymous-post claim flow (password-set link for unclaimed accounts).

**Unverified existing account at register:** `registerUser()` resumes setup (updates password, resends 6-digit code) instead of blocking with "account exists".

**Ops unlock:** `npx tsx scripts/dev/auth-unlock-user.ts <email> --verify-email` (see script header).

### 5. Onboarding (dashboard)

Live onboarding is **`OnboardingChecklist`** on `/dashboard`:

| Step | Done when |
|------|-----------|
| E-Mail bestätigen | `session.user.emailVerified` |
| Profil vervollständigen | `first_name` + `last_name` in `user_profiles` (min 2 chars each) |
| Seller steps | `seller_profiles` row exists; at least one listing |
| Repairer steps | `repairer_profiles` row exists; at least one active `repairer_services` row |

Logic: `src/lib/domain/onboarding.ts` + `src/lib/services/onboarding-state.ts`.

`EmailVerificationBanner` shows when email is unverified.

---

## Database schema (auth-related)

```sql
users (
  id, email, name, password_hash, emailVerified,
  is_staff, staff_permissions, is_super_admin, token_version,
  dashboard_mode, role  -- role column is legacy; prefer is_staff + permissions
)

user_profiles (
  user_id, first_name, last_name, phone, address_*, avatar_url, ...
)

verification_tokens   -- Auth.js adapter + legacy tokens
verification_codes    -- 6-digit email verification
sessions, accounts    -- Auth.js adapter tables (OAuth future use)
```

Full Drizzle definitions: `src/db/schema/auth.ts`.

---

## File structure

```
src/
├── auth.ts                              # Auth.js config + registerUser()
├── middleware.ts                        # Route protection, CSRF
│
├── lib/auth/
│   ├── db.ts, db-users.ts               # User/profile queries
│   ├── db-verification.ts               # Codes + password-reset tokens
│   ├── password.ts                      # bcrypt helpers
│   ├── rate-limiter.ts                  # Login/register/reset limits
│   └── audit.ts                         # Security audit events
│
├── lib/domain/onboarding.ts             # Profile completeness rules
├── lib/services/onboarding-state.ts     # Dashboard checklist DB state
│
├── components/auth/
│   ├── LoginForm.tsx
│   ├── RegistrationWizard.tsx
│   └── UserMenu.tsx
│
├── components/dashboard/
│   ├── OnboardingChecklist.tsx
│   └── EmailVerificationBanner.tsx
│
├── app/
│   ├── api/auth/
│   │   ├── [...nextauth]/route.ts
│   │   ├── register/route.ts
│   │   ├── verify-code/route.ts
│   │   ├── resend-code/route.ts
│   │   ├── verify-email/route.ts
│   │   ├── forgot-password/route.ts
│   │   └── reset-password/route.ts
│   ├── auth/login/page.tsx
│   ├── auth/register/page.tsx
│   ├── auth/forgot-password/page.tsx
│   ├── auth/reset-password/page.tsx
│   ├── dashboard/page.tsx
│   └── admin/layout.tsx                 # Staff gate
│
└── config/
    ├── security.ts                      # Session maxAge / updateAge
    ├── auth-ui.ts                       # Form labels + validation SSOT
    └── error-messages.ts
```

---

## Environment variables

```bash
# Required
AUTH_SECRET=<32+ char random string>   # openssl rand -base64 32

# Database (see docs/SHARED_CONTEXT.md)
DATABASE_URL=postgresql://...

# Email (required for registration + reset — see docs/EMAIL_SETUP.md)
EMAIL_HOST=...
EMAIL_PORT=587
EMAIL_USER=...
EMAIL_PASS=...
EMAIL_FROM=...
```

`AUTH_SECRET` or legacy `NEXTAUTH_SECRET` both work.

---

## API reference

### Authentication

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/[...nextauth]` | GET/POST | Auth.js sign-in, sign-out, session |
| `/api/auth/register` | POST | Create account + send verification code |
| `/api/auth/verify-code` | POST | Verify 6-digit code |
| `/api/auth/resend-code` | POST | Resend verification code |
| `/api/auth/forgot-password` | POST | Request reset link |
| `/api/auth/reset-password` | POST | Set new password with token |

### User profile

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/user/profile` | GET | Get profile (creates row if missing) |
| `/api/user/profile` | PUT | Update profile fields |

---

## Security features

### Password requirements

Defined in `AUTH_CONFIG` / `RegisterSchema`:

- Minimum 8 characters
- At least one uppercase, lowercase, and number

### Session security

- JWT in secure HttpOnly cookie
- 30-day max age (`SESSION_MAX_AGE_SECONDS`)
- Token refresh every 24h (`SESSION_UPDATE_AGE_SECONDS`)
- CSRF protection on mutating API routes
- Permission changes enforced via `token_version` staleness check

### Protected routes

| Route | Requirement |
|-------|-------------|
| `/dashboard/*` | Authenticated session |
| `/admin/*` | Session + `isStaff` + section permission |
| Most `/api/*` POST/PATCH/DELETE | CSRF token |

Middleware redirects unauthenticated users to `/auth/login?callbackUrl=...`.

---

## Email integration

All auth emails go through `sendEmail()` in `src/lib/email/index.ts`:

| Template | Trigger |
|----------|---------|
| `verificationCode` | Registration (regular user) |
| `staffVerificationCode` | Registration (@revamp-it.ch) |
| `welcome` / `staffWelcome` | After successful verify-code |
| `passwordReset` | Forgot-password flow |

See `docs/EMAIL_SETUP.md` for provider configuration.

Notifications for platform events (IT-Hilfe, decisions, etc.) use the central **`notifyUsers()`** pipeline in `src/lib/services/notifications.ts`, which respects `user_profiles.email_notifications`.

---

## Troubleshooting

**"Bitte bestätige zuerst deine E-Mail-Adresse"**  
User must complete verify-code step before login.

**"AUTH_SECRET is missing"**  
Add `AUTH_SECRET` to `.env.local`.

**Session not updating after permission change**  
Wait for JWT refresh (~24h) or re-login. Admins can bump `token_version` to force refresh on next request.

**Admin redirect to `/?error=not_staff`**  
User is logged in but `is_staff` is false and email is not `@revamp-it.ch`.

**Email not arriving**  
Check `docs/EMAIL_SETUP.md` — email is required for registration and reset.

---

## Future enhancements

- [ ] OAuth providers (Google, GitHub) — requires enabling `@auth/pg-adapter`
- [ ] Magic link / passwordless login
- [ ] Two-factor authentication
- [ ] Drop legacy `users.role` column once all readers migrated

---

## Related documentation

- `docs/EMAIL_SETUP.md` — email provider setup
- `docs/UNIFIED_AUTH.md` — this file
- `docs/ARCHITECTURE_DEBT.md` — notification pipeline status
- `docs/SHARED_CONTEXT.md` — tech stack and database
- `src/lib/permissions.ts` — admin section access SSOT

---

**End of Documentation**
