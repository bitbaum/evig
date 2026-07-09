import { NextRequest } from 'next/server'
import { z } from 'zod'
import { withAdmin, type ValidSession } from '@/lib/api/middleware'
import { apiSuccess, apiError, apiBadRequest } from '@/lib/api/helpers'
import { logger } from '@/lib/logger'
import { db } from '@/db'
import { promoCodes } from '@/db/schema'
import { desc } from 'drizzle-orm'
import { PROMO_CODE_TYPES, PROMO_CODE_SCOPES } from '@/config/promo-codes'

/** GET /api/admin/promo-codes — list all codes (super-admin, sensitive section). */
export const GET = withAdmin('promo-codes', async () => {
  try {
    const rows = await db.select().from(promoCodes).orderBy(desc(promoCodes.createdAt))
    return apiSuccess({ codes: rows })
  } catch (error) {
    logger.error('Failed to list promo codes', { error })
    return apiError(error, 'Aktionscodes konnten nicht geladen werden')
  }
})

const CreateSchema = z.object({
  code: z.string().trim().min(3).max(64).regex(/^[a-zA-Z0-9_-]+$/, 'Nur Buchstaben, Zahlen, - und _'),
  type: z.enum([PROMO_CODE_TYPES.PERCENT, PROMO_CODE_TYPES.FIXED, PROMO_CODE_TYPES.GIFT_CARD]),
  percent: z.number().int().min(1).max(100).nullable().optional(),
  amountChf: z.number().min(0).nullable().optional(),
  scope: z.enum([
    PROMO_CODE_SCOPES.ALL, PROMO_CODE_SCOPES.MARKETPLACE, PROMO_CODE_SCOPES.MEMBERSHIP,
    PROMO_CODE_SCOPES.WORKSHOP, PROMO_CODE_SCOPES.SERVICE,
  ]).default(PROMO_CODE_SCOPES.ALL),
  minOrderChf: z.number().min(0).default(0),
  maxRedemptions: z.number().int().positive().nullable().optional(),
  perUserLimit: z.number().int().positive().nullable().optional(),
  validUntil: z.string().datetime().nullable().optional(),
})

/** POST /api/admin/promo-codes — issue a new code. */
export const POST = withAdmin('promo-codes', async (request: NextRequest, session: ValidSession) => {
  try {
    const parsed = CreateSchema.safeParse(await request.json())
    if (!parsed.success) return apiBadRequest('Ungültige Eingabe', parsed.error.flatten().fieldErrors)
    const d = parsed.data

    // Enforce the value that matches the type.
    if (d.type === PROMO_CODE_TYPES.PERCENT && !d.percent) {
      return apiBadRequest('Prozentwert (1–100) erforderlich')
    }
    if (d.type !== PROMO_CODE_TYPES.PERCENT && (d.amountChf == null || d.amountChf <= 0)) {
      return apiBadRequest('Betrag (CHF) erforderlich')
    }

    const amountCents = d.amountChf != null ? Math.round(d.amountChf * 100) : null

    const [row] = await db
      .insert(promoCodes)
      .values({
        code: d.code.toLowerCase(),
        type: d.type,
        percent: d.type === PROMO_CODE_TYPES.PERCENT ? d.percent : null,
        amountCents: d.type === PROMO_CODE_TYPES.PERCENT ? null : amountCents,
        // Gift cards start fully loaded.
        balanceCents: d.type === PROMO_CODE_TYPES.GIFT_CARD ? amountCents : null,
        scope: d.scope,
        minOrderCents: Math.round(d.minOrderChf * 100),
        maxRedemptions: d.maxRedemptions ?? null,
        perUserLimit: d.perUserLimit ?? null,
        validUntil: d.validUntil ?? null,
        createdBy: session.user.id,
      })
      .returning()

    logger.info('Promo code issued', { code: row.code, type: row.type, by: session.user.id })
    return apiSuccess({ code: row }, 201)
  } catch (error) {
    const message = error instanceof Error ? error.message : ''
    if (message.includes('unique') || message.includes('duplicate')) {
      return apiBadRequest('Dieser Code existiert bereits')
    }
    logger.error('Failed to create promo code', { error })
    return apiError(error, 'Aktionscode konnte nicht erstellt werden')
  }
})
