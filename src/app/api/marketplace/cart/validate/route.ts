/**
 * POST /api/marketplace/cart/validate
 *
 * Availability check for the client-side cart (localStorage, no server cart).
 * A stored cart can go stale — items sell out or get reserved while the buyer
 * is away. The cart page calls this on load and drops unavailable items up
 * front instead of letting checkout fail with a locked-row error.
 *
 * Available = listing exists, status 'active', is_revampit (cart is RevampIT
 * shop stock only). Public data, so no auth — but rate-limited like browse.
 */
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { apiSuccess, apiError, apiBadRequest, apiRateLimited } from '@/lib/api/helpers'
import { db } from '@/db'
import { listings } from '@/db/schema'
import { and, eq, inArray } from 'drizzle-orm'
import { LISTING_STATUS } from '@/config/marketplace'
import { rateLimiters, getClientIdentifier } from '@/lib/security/rate-limit'

const CartValidateSchema = z.object({
  listing_ids: z.array(z.string().uuid()).min(1).max(50),
})

export async function POST(request: NextRequest) {
  try {
    const clientIp = getClientIdentifier(request)
    if (!rateLimiters.listingBrowse(clientIp)) {
      return apiRateLimited()
    }

    const body = await request.json().catch(() => ({}))
    const parsed = CartValidateSchema.safeParse(body)
    if (!parsed.success) return apiBadRequest('Ungültiger Warenkorb')
    const ids = [...new Set(parsed.data.listing_ids)]

    const available = await db
      .select({ id: listings.id })
      .from(listings)
      .where(and(
        inArray(listings.id, ids),
        eq(listings.status, LISTING_STATUS.ACTIVE),
        eq(listings.isRevampit, true),
      ))

    const availableIds = new Set(available.map((r) => r.id))
    const unavailable_ids = ids.filter((id) => !availableIds.has(id))

    return apiSuccess({ unavailable_ids })
  } catch (error) {
    return apiError(error, 'Fehler beim Prüfen des Warenkorbs')
  }
}
