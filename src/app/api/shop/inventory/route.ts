/**
 * Public Shop Inventory API
 *
 * GET /api/shop/inventory
 * Returns published inventory products for the public shop
 */

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { apiSuccessCached, apiError, apiBadRequest } from '@/lib/api/helpers'
import { getInventoryProducts } from '@/lib/services/inventory-service'

const inventoryQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
  category: z.string().max(100).optional(),
  search: z.string().max(200).optional(),
  profile: z.string().max(100).optional(),
})

export async function GET(request: NextRequest) {
  try {
    // 1. Parse and validate query params
    const { searchParams } = new URL(request.url)
    const rawParams = Object.fromEntries(searchParams.entries())
    const parsed = inventoryQuerySchema.safeParse(rawParams)
    if (!parsed.success) {
      return apiBadRequest(parsed.error.issues.map(i => i.message).join(', '))
    }

    // 2. Call service
    const result = await getInventoryProducts(parsed.data)

    // 3. Return response — shop inventory is public, cache 30s (stock levels change)
    return apiSuccessCached(result, 30, 15)
  } catch (error) {
    return apiError(error, 'Fehler beim Laden der Produkte')
  }
}
