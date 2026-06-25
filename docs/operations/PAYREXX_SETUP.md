---
created_date: 2026-06-25
last_modified_date: 2026-06-25
last_modified_summary: Initial Payrexx setup checklist — env SSOT, webhook, E2E, go-live
---

# Payrexx setup (when ready)

Payrexx powers **marketplace checkout**, **paid workshop registration**, and **appointment payments**. Code is wired; prod currently runs without credentials and returns `PAYREXX_SETUP_MESSAGE` until configured.

**Config SSOT:** `src/config/payrexx.ts` · **Client:** `src/lib/payments/payrexx-client.ts`

---

## Environment variables

Add to prod `/opt/revampit/app/.env` (and GitHub `SELFHOST_ENV` if using Actions deploy):

| Variable | Purpose |
|----------|---------|
| `PAYREXX_INSTANCE` | Payrexx instance name (subdomain) |
| `PAYREXX_API_SECRET` | API secret for HMAC gateway calls |
| `PAYREXX_WEBHOOK_SECRET` | HMAC secret for incoming webhooks (required in prod) |

Local dev: leave unset → mock redirect at `PAYREXX_MOCK_REDIRECT_PATH` (`/api/payments/payrexx-mock-redirect`).

Templates: `environment.example`, `.env.selfhost.local.example`

---

## Payrexx dashboard checklist

1. Create Payrexx instance (sandbox first).
2. Copy **API secret** → `PAYREXX_API_SECRET`.
3. Set **webhook URL** to `https://revampit.orangecat.ch/api/payments/payrexx-webhook`.
4. Copy **webhook signing secret** → `PAYREXX_WEBHOOK_SECRET`.
5. Enable **reservation** mode for marketplace (gateways created with `reservation=true` in code).

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
| Webhook | `POST /api/payments/payrexx-webhook` |
| Dev mock page | `GET /api/payments/payrexx-mock-redirect` (blocked when `PAYREXX_INSTANCE` set) |

---

## E2E behaviour without Payrexx

| Journey | Without Payrexx on prod |
|---------|-------------------------|
| `test:e2e:marketplace:journey` | Listing + checkout UI + own-listing guard; Payrexx error banner |
| `test:e2e:workshops:journey` | Free registration + admin instances; paid workshop shows setup message |

Full payment completion requires credentials + (optional) `PAYREXX_WEBHOOK_SECRET` in CI for webhook simulation.
