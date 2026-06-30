---
created_date: 2026-06-25
last_modified_date: 2026-06-30
last_modified_summary: Plug-and-play go-live — corrected webhook header (X-Webhook-Signature) + reservation=1, partial-config guard, capture model, escrow-release cron
---

# Payrexx setup (plug-and-play go-live)

Payrexx powers **marketplace checkout**, **paid workshop registration**, and **appointment payments**. The integration is **plug-and-play**: set the three env vars below + the dashboard webhook, restart, and live payments work with **zero code changes**. Until then prod returns `PAYREXX_SETUP_MESSAGE` and dev uses a mock redirect.

**Config SSOT:** `src/config/payrexx.ts` · **Client:** `src/lib/payments/payrexx-client.ts` · **Webhook:** `src/app/api/payments/payrexx-webhook/route.ts`

---

## Environment variables — set ALL THREE together

Add to prod `/opt/revampit/app/.env` (and GitHub `SELFHOST_ENV` if using Actions deploy):

| Variable | Purpose |
|----------|---------|
| `PAYREXX_INSTANCE` | Payrexx instance name (subdomain) |
| `PAYREXX_API_SECRET` | API secret for signing outbound gateway/capture calls |
| `PAYREXX_WEBHOOK_SECRET` | Per-webhook signing secret for **incoming** webhooks |

> ⚠️ **Set all three at once.** Checkout activates on `INSTANCE` + `API_SECRET` alone, but **without `PAYREXX_WEBHOOK_SECRET` every webhook is rejected** (fail-closed) → customers are charged but orders never advance. `createGateway` logs a loud error if it ever runs in this partial state (`isPayrexxPartiallyConfigured()`).

Also confirm `NEXTAUTH_URL=https://revampit.orangecat.ch` (redirect URLs sent to Payrexx derive from it; otherwise they point at localhost).

Local dev: leave unset → mock redirect at `/api/payments/payrexx-mock-redirect`.
Templates: `.env.example`, `environment.example`, `.env.selfhost.local.example`

---

## Payrexx dashboard checklist

1. Create Payrexx instance (sandbox first).
2. Copy **API secret** → `PAYREXX_API_SECRET`.
3. Set **webhook URL** to `https://revampit.orangecat.ch/api/payments/payrexx-webhook`.
4. Copy the **webhook signing secret** → `PAYREXX_WEBHOOK_SECRET`. The webhook handler verifies the `X-Webhook-Signature` header (lowercase-hex SHA-256 HMAC of the raw body, key = this secret as UTF-8). No code change needed — just paste the secret.
5. Reservation mode is enabled in code (`reservation=1`): funds are **authorized** then captured. Capture is automatic — marketplace on buyer receipt-confirm; workshops/appointments immediately in the webhook (non-escrow) or via the escrow-release cron (escrow).

---

## Schedule the escrow-release cron (one-time, on the box)

Escrow payments (workshop/appointment with `useEscrow=true`) are held until released. The safety-net cron captures any still-held past its deadline so funds aren't lost when the Payrexx reservation expires (~7 days). Install it like the existing timers:

```bash
sudo cp /opt/revampit/ops/revampit-cron@release-escrow.timer /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now revampit-cron@release-escrow.timer
```

(The generic `revampit-cron@.service` already exists; this only adds the schedule — daily 01:00 UTC → `GET /api/cron/release-escrow`, authenticated by `CRON_SECRET`.)

---

## Verify after configure

```bash
# Restart app on box after .env change
sudo systemctl restart revampit-app

# E2E (full payment flows)
AUTH_TEST_USER_PASSWORD='…' AUTH_TEST_ADMIN_PASSWORD='…' \
PAYREXX_WEBHOOK_SECRET='…' \  # optional: simulates webhook in marketplace journey
npm run test:e2e:marketplace:journey
npm run test:e2e:workshops:journey
npm run test:e2e:inventory:prod
```

When configured, `isPayrexxCheckoutUnavailable()` is false on prod and checkout returns a hosted Payrexx URL instead of `PAYREXX_SETUP_MESSAGE`.

---

## Surfaces using Payrexx

| Surface | API / route |
|---------|-------------|
| Marketplace single listing | `POST /api/marketplace/orders` |
| Marketplace cart | `POST /api/marketplace/cart/checkout` |
| Paid workshop | `POST /api/workshops/[slug]/register-with-payment` |
| Appointments | `POST /api/appointments/[id]/pay` |
| Webhook (reconciles all of the above) | `POST /api/payments/payrexx-webhook` |
| Escrow auto-release (safety net) | `GET /api/cron/release-escrow` (daily timer) |
| Dev mock page | `GET /api/payments/payrexx-mock-redirect` (blocked when `PAYREXX_INSTANCE` set) |

---

## E2E behaviour without Payrexx

| Journey | Without Payrexx on prod |
|---------|-------------------------|
| `test:e2e:marketplace:journey` | Listing + checkout UI + own-listing guard; Payrexx error banner |
| `test:e2e:workshops:journey` | Free registration + admin instances; paid workshop shows setup message |

Full payment completion requires credentials + (optional) `PAYREXX_WEBHOOK_SECRET` in CI for webhook simulation.
