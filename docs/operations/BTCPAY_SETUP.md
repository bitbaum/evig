# BTCPay Server (Bitcoin) — Operator Setup

Everything on the Revamp-IT side is built and dormant. Bitcoin payment goes live
the moment these env vars are set on prod — **no code change needed.** Until then
the rail is hidden from customers.

> **Team greenlight required first.** Creating a store wallet means holding BTC (or
> auto-converting it). That's a treasury decision — the team should approve wallet
> creation and a volatility policy (hold vs. auto-convert to CHF) before this goes
> live. This doc covers only the technical setup.

## What BTCPay is (and why)

BTCPay Server is a **self-hosted, non-custodial** Bitcoin payment processor
(on-chain **and** Lightning). Invoices are **priced in CHF**; the buyer pays the
BTC equivalent at the rate BTCPay quotes. Payment is **capture-on-pay**, so Bitcoin
is offered for **non-escrow** flows only. The authoritative CHF amount for
reconciliation is read back from the invoice — never trusted from the webhook body.

## What YOU must provision (the external dependency)

1. **A BTCPay Server instance** (self-hosted; e.g. the one-click LunaNode/VPS
   deploy, or on the existing Hetzner box).
2. **A store** with a **wallet** connected (on-chain xpub and/or a Lightning node).
   *This is the step that needs the treasury greenlight.*
3. **A Greenfield API key** with invoice create/read permissions on that store.
4. **A webhook** on the store (see below), whose signing secret you copy into env.

## Environment variables

Set these in `/opt/revampit/app/.env` (and GitHub `SELFHOST_ENV`):

| Var | Required | Meaning |
|-----|----------|---------|
| `BTCPAY_SERVER_URL` | ✅ | Base URL, e.g. `https://btcpay.example.org` |
| `BTCPAY_API_KEY` | ✅ | Greenfield API key (`Authorization: token <key>`) |
| `BTCPAY_STORE_ID` | ✅ | Store the invoices are created under |
| `BTCPAY_WEBHOOK_SECRET` | ✅ (for live) | Webhook signing secret — without it deliveries are rejected (fail closed) |

`isBtcpayConfigured()` is true once SERVER_URL + API_KEY + STORE_ID are set.

## Wire the store webhook to us

In the store's **Webhooks** settings, add:

```
URL:     https://revampit.orangecat.ch/api/payments/webhook/btcpay
Events:  Invoice settled, Invoice expired, Invoice invalid
Secret:  <the value you put in BTCPAY_WEBHOOK_SECRET>
```

We verify `BTCPay-Sig: sha256=<hex>` (HMAC of the raw body) before acting, then
re-query the invoice for the authoritative CHF amount.

## Verify

1. Set the four vars, restart the app.
2. `GET /api/payments/providers` should list `btcpay` (non-escrow). The picker
   appears automatically at checkout.
3. Create a test invoice (BTCPay testnet/regtest first), pay it, and confirm the
   order flips to paid and a Kivvi CHF invoice is booked at the invoice amount.

## Notes

- Zero platform fee is seeded (`payment_providers` row, migration 139). Bitcoin
  network fees are the buyer's.
- Escrow-incompatibility is enforced in code, not a DB constraint.
