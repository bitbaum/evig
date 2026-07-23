# GNU Taler — Operator Setup

Everything on the Revamp-IT side is built and dormant. Taler goes live the moment
these env vars are set on prod — **no code change, no deploy needed beyond setting
the secrets.** Until then the rail is hidden from customers.

## What Taler is (and why)

GNU Taler is **regulated digital cash**: privacy-preserving for the payer,
taxable/auditable for the merchant, **no chargebacks**. It settles through a
merchant backend that talks to a Taler **exchange** denominated in CHF. Payment is
**capture-on-pay** (the wallet transfers value at checkout), so Taler is offered
for **non-escrow** flows only (donations, workshops, appointments — not P2P
marketplace escrow).

## What YOU must provision (the external dependency)

1. **A Taler merchant backend** reachable over HTTPS, with an instance for
   Revamp-IT. Either self-host the merchant backend or use a hosted provider.
2. **An exchange that settles in CHF** (e.g. a Swiss Taler exchange). The backend
   must be configured to trust that exchange. *(This is Cem's track per the team
   discussion.)*
3. **An API access token** for the merchant instance.

## Environment variables

Set these in `/opt/revampit/app/.env` (and GitHub `SELFHOST_ENV`):

| Var | Required | Meaning |
|-----|----------|---------|
| `TALER_BACKEND_URL` | ✅ | Merchant instance base URL, e.g. `https://backend.taler.example/instances/revampit` |
| `TALER_API_TOKEN` | ✅ | Bearer token for the merchant instance |
| `TALER_WEBHOOK_SECRET` | optional | Shared secret checked on webhook deliveries (defence-in-depth; payment truth is re-queried from the backend regardless) |

`isTalerConfigured()` is true once `TALER_BACKEND_URL` + `TALER_API_TOKEN` are set.

## Wire the backend to us

Point the merchant backend's order-status webhook at:

```
https://revampit.orangecat.ch/api/payments/webhook/taler
```

We treat the delivery only as "order X changed" — the **authoritative** status +
amount are re-queried from `GET {backend}/private/orders/{id}` (authenticated), so
a forged webhook body cannot flip an order to paid.

## Verify

1. Set the two required vars, restart the app.
2. `GET /api/payments/providers` should now list `taler` (non-escrow) alongside
   `payrexx`. The payment method picker appears automatically at checkout.
3. Run a real 1-CHF workshop/appointment payment end-to-end; confirm the order
   flips to paid and a Kivvi CHF invoice is booked.

## Notes

- Zero platform fee is seeded (`payment_providers` row, migration 139).
- The provider row is app-managed; the rail's escrow-incompatibility is enforced
  in code (`src/config/payment-providers.ts`), not a DB constraint.
