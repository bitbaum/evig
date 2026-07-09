import { db } from '@/db'
import { promoCodes, promoCodeRedemptions } from '@/db/schema'
import { and, eq, sql } from 'drizzle-orm'
import {
  computeDiscount,
  PROMO_CODE_TYPES,
  PROMO_INVALID_MESSAGES,
  type PromoCodeScope,
} from '@/config/promo-codes'

export interface ValidatedDiscount {
  ok: true
  codeId: string
  code: string
  discountCents: number
  type: string
}
export interface RejectedDiscount {
  ok: false
  error: string
}

/**
 * Validate a code for an order and compute the discount. Read-only — does NOT
 * consume the code. Call recordRedemption() once the order is actually placed.
 * Codes are matched case-insensitively (users type "REVAMP100").
 */
export async function validateAndComputeDiscount(
  rawCode: string,
  opts: { userId: string | null; totalCents: number; scope: PromoCodeScope; nowMs: number },
): Promise<ValidatedDiscount | RejectedDiscount> {
  const code = rawCode.trim().toLowerCase()
  if (!code) return { ok: false, error: PROMO_INVALID_MESSAGES.not_found }

  const [row] = await db
    .select()
    .from(promoCodes)
    .where(eq(sql`lower(${promoCodes.code})`, code))
    .limit(1)

  if (!row) return { ok: false, error: PROMO_INVALID_MESSAGES.not_found }

  let userRedemptions = 0
  if (opts.userId && row.perUserLimit != null) {
    const [{ n }] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(promoCodeRedemptions)
      .where(and(
        eq(promoCodeRedemptions.promoCodeId, row.id),
        eq(promoCodeRedemptions.userId, opts.userId),
      ))
    userRedemptions = n ?? 0
  }

  const result = computeDiscount(row, {
    totalCents: opts.totalCents,
    scope: opts.scope,
    nowMs: opts.nowMs,
    userRedemptions,
  })
  if (!result.ok) return { ok: false, error: PROMO_INVALID_MESSAGES[result.reason] }

  return { ok: true, codeId: row.id, code: row.code, discountCents: result.discountCents, type: row.type }
}

/**
 * Consume a code after an order is placed: log the redemption, bump the global
 * counter, and (gift cards) decrement the balance — all in one transaction so
 * concurrent redemptions can't overspend a limited/gift code.
 */
export async function recordRedemption(input: {
  codeId: string
  userId: string | null
  orderRef: string
  scope: PromoCodeScope
  amountDiscountedCents: number
  type: string
}): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.insert(promoCodeRedemptions).values({
      promoCodeId: input.codeId,
      userId: input.userId,
      orderRef: input.orderRef,
      scope: input.scope,
      amountDiscountedCents: input.amountDiscountedCents,
    })

    await tx
      .update(promoCodes)
      .set({
        redeemedCount: sql`${promoCodes.redeemedCount} + 1`,
        balanceCents: input.type === PROMO_CODE_TYPES.GIFT_CARD
          ? sql`GREATEST(0, COALESCE(${promoCodes.balanceCents}, 0) - ${input.amountDiscountedCents})`
          : promoCodes.balanceCents,
        updatedAt: sql`NOW()`,
      })
      .where(eq(promoCodes.id, input.codeId))
  })
}
