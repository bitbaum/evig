# Money representation — convention SSOT

**Decision (2026-06-03):** All new monetary columns and code should use **integer cents** (a/k/a "minor units"). Existing `decimal(n, 2)` columns stay until a dedicated migration sweeps them — documented here so no one accidentally extends the inconsistency.

## Why integer cents

| Representation | Float math safety | Storage | DB-level constraints | Wire format |
|---|---|---|---|---|
| `integer` cents (canonical) | exact — no rounding | 4 bytes | trivial `CHECK (amount >= 0)` | one number, no decimal points |
| `decimal(10, 2)` (legacy) | exact in DB; rounding risk on app side if cast to float | 5–14 bytes | enforced precision but ambiguous on app side | "12.34" string, easy to mis-parse |
| `real` / `double` | unsafe — never use for money | 4–8 bytes | none | scientific notation possible |

Cents wins on:
- **Bug class eliminated.** No `0.1 + 0.2 = 0.30000000000000004` ever. Float-to-decimal conversion at API/UI boundary is the only place where things can go wrong, and we control that boundary.
- **Trivially summable.** `SUM(amount_cents)` is integer arithmetic; no `numeric` casts needed in aggregates.
- **Wire format consistent.** JSON serializes as a single number; UI divides by 100 for display. No string parsing, no locale ambiguity.

## The convention

- New columns: name suffix `_cents` (e.g. `subtotal_cents`, `tax_cents`, `donation_amount_cents`).
- Type: `integer` (rarely `bigint` — we're a Swiss nonprofit, not a hedge fund).
- Currency: store separately in `currency_code` (e.g. `'CHF'`, `'EUR'`) with default `'CHF'`. Don't infer currency from column name.
- Display: divide by 100 at the formatter (`formatCHF(cents)` in `src/config/marketplace.ts`).

## Existing columns that don't follow yet

These are `decimal(10, 2)` or similar today. They work — float-conversion bugs haven't surfaced. Leave them alone until a dedicated migration sweep:

| Table.column | Current type |
|---|---|
| `listings.price_chf` | `decimal(10, 2)` |
| `payment_transactions.amount` | `decimal(10, 2)` |
| `refunds.amount` | `decimal(10, 2)` |
| `services.price` | `decimal(10, 2)` |
| `workshops.price` | `decimal(10, 2)` |
| ... and ~10 more | `decimal(10, 2)` |

A future migration will:
1. Add `*_cents` column alongside the old `decimal` column.
2. Backfill: `UPDATE tbl SET price_cents = (price_chf * 100)::int`.
3. Update app code to read from `_cents`.
4. Drop the `decimal` column after a deprecation window.

## What's already in cents (don't migrate)

- `orders.subtotal_cents`
- `orders.tax_cents`
- `orders.shipping_cents`
- `orders.total_cents`

These set the precedent. New tables should follow them.

## Common mistakes to avoid

```ts
// WRONG — float math on decimals
const total = items.reduce((sum, item) => sum + item.price_chf, 0)
// 0.1 + 0.2 problem; .toFixed(2) hides bugs at scale.

// RIGHT — integer math on cents
const totalCents = items.reduce((sum, item) => sum + item.price_cents, 0)
const totalDisplay = formatCHF(totalCents)  // formatter handles /100
```

```ts
// WRONG — letting a decimal column flow through JS as a number
const price = Number(row.price_chf)  // string "12.34" → 12.34, but parse risk

// RIGHT — explicit conversion at boundary, use cents internally
const priceCents = Math.round(Number(row.price_chf) * 100)
```

## Validation at API boundary

When accepting monetary input from a form / API:

```ts
const schema = z.object({
  // Accept either decimal CHF (UI convenience) or cents (API native).
  // Store as cents internally.
  amount_cents: z.number().int().min(0),
})
```

If the UI sends CHF as a decimal, convert at the boundary:

```ts
amount_cents: Math.round(amountChf * 100)
```

Never let `0.1 + 0.2` math survive past the API layer.

---

**Last updated:** 2026-06-03 — convention established; sweep migration not yet scheduled.
