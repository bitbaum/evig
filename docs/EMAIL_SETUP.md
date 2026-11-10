# Email

> **Current (2026-11-10).** Outbound mail goes through **Resend**, via the
> fleet package `@bitbaum/mail-kit` (`src/lib/email/resend.ts`). The address
> people are told to write to is `CONTACT.email` in `src/config/org.ts` (today
> `cato@orangecat.ch`). `evig.ch` is not registered yet, and `noreply@revamp-it.ch`
> is Revamp-IT's domain, not a mailbox this app sends as.

Email is required for registration (verification codes), password reset and
notifications.

## How mail leaves

| Provider | Chosen when | Code |
| --- | --- | --- |
| Resend (default) | always, unless Listmonk is enabled | `src/lib/email/resend.ts` → `@bitbaum/mail-kit` |
| Listmonk | `LISTMONK_ENABLED=true`; falls back to Resend if a Listmonk send fails | `src/lib/email/listmonk.ts` |

`getEmailProvider()` in `src/config/email.ts` is the one place this is decided.

There is no direct-SMTP path any more. The old Brevo/nodemailer fallback was
removed on 2026-11-10: its production credential was dead (the relay answered
"Login denied", verified 2026-09-05), so it delivered nothing. If evig ever
needs its own mail server, `@bitbaum/mail-kit` sends over SMTP itself
(`MAIL_TRANSPORT=smtp`, mail-kit README) — add no second implementation here.

## Configuration

```bash
RESEND_API_KEY=re_…          # the shared fleet key (/opt/fleet/env on the box)
# RESEND_FROM="Evig <evig@fleetcrown.orangecat.ch>"   # optional; this is the default
```

The default sender is `<org name> <evig@fleetcrown.orangecat.ch>`
(`RESEND_CONFIG.FROM`): the shared Resend account has one verified sending
domain, so every fleet app sends from it (mail-kit `FLEET_SENDER_DOMAIN`).
Replies go to the app's own address (mail-kit `appAddressFromEnv`).

Listmonk (optional):

```bash
LISTMONK_ENABLED=true
LISTMONK_URL=http://localhost:9090
LISTMONK_USERNAME=admin
LISTMONK_PASSWORD=…
LISTMONK_FROM_EMAIL=…
LISTMONK_FROM_NAME=…
```

Listmonk relays through the SMTP server configured **inside Listmonk**
(Settings → SMTP); this app passes it no SMTP settings.

## Checking it

- **Admin email diagnostics** (`EmailDiagnostics`, backed by `/api/admin/email/diagnostics`): the active
  provider, whether the key is set, a live connection test (Resend: an
  authenticated read, no send), and a button that sends a real test message.
- A provider accepting a message is not delivery. Check the recipient's inbox.

## Email Templates

The app includes these email templates (all in Swiss German):

### Authentication Emails

1. **Verification Code** (`verificationCode`)
   - Sent: After registration
   - Contains: 6-digit code
   - Expires: 15 minutes
   - File: `src/lib/email/templates/auth.ts`

2. **Staff Verification** (`staffVerificationCode`)
   - Sent: After staff member registration (@revamp-it.ch)
   - Contains: 6-digit code + onboarding info
   - Expires: 15 minutes

3. **Welcome Email** (`welcome`)
   - Sent: After email verification
   - Contains: Getting started guide

4. **Staff Welcome** (`staffWelcome`)
   - Sent: After staff email verification
   - Contains: Admin dashboard link, team info

5. **Password Reset** (`passwordReset`)
   - Sent: After forgot password request
   - Contains: Reset link (1-hour expiry)

Templates live in `src/lib/email/templates/`. Every template returns HTML and
a plain-text version.
