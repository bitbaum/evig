import { NextRequest } from 'next/server'
import { z } from 'zod'
import { withAdmin } from '@/lib/api/middleware'
import { apiSuccess, apiError, apiBadRequest, apiNotFound } from '@/lib/api/helpers'
import { logger } from '@/lib/logger'
import { db } from '@/db'
import { promoCodes } from '@/db/schema'
import { eq, sql } from 'drizzle-orm'

const PatchSchema = z.object({ isActive: z.boolean() })

/** PATCH /api/admin/promo-codes/[id] — activate / deactivate a code. */
export const PATCH = withAdmin('promo-codes', async (request: NextRequest, _session, context) => {
  try {
    const id = context?.params?.id
    if (!id) return apiBadRequest('ID erforderlich')

    const parsed = PatchSchema.safeParse(await request.json())
    if (!parsed.success) return apiBadRequest('Ungültige Eingabe', parsed.error.flatten().fieldErrors)

    const [row] = await db
      .update(promoCodes)
      .set({ isActive: parsed.data.isActive, updatedAt: sql`NOW()` })
      .where(eq(promoCodes.id, id))
      .returning({ id: promoCodes.id, isActive: promoCodes.isActive })

    if (!row) return apiNotFound('Aktionscode')
    return apiSuccess({ id: row.id, isActive: row.isActive })
  } catch (error) {
    logger.error('Failed to toggle promo code', { error })
    return apiError(error, 'Aktionscode konnte nicht geändert werden')
  }
})
