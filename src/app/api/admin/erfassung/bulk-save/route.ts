/**
 * API: Bulk Save Products
 *
 * POST /api/admin/erfassung/bulk-save
 * Accepts an array of products and saves them in chunked transactions.
 * Each chunk runs in its own transaction — failed rows don't block successful ones.
 */

import { withAdmin } from '@/lib/api/middleware'
import { logger } from '@/lib/logger'
import { db } from '@/db'
import { apiSuccess, apiError, apiBadRequest } from '@/lib/api/helpers'
import { validateBody, BulkSaveSchema } from '@/lib/schemas'
import { createErfassungProduct } from '@/lib/erfassung/create-product'
import { BULK_LIMITS } from '@/config/erfassung'
import type { BulkSaveRequest, BulkSaveResponse } from '@/types/erfassung'

export const POST = withAdmin('products', async (request, session) => {
  try {
    const raw = await request.json()
    const validation = validateBody(BulkSaveSchema, raw)
    if (!validation.success) return validation.error
    const { products, action } = validation.data as BulkSaveRequest

    if (products.length > BULK_LIMITS.maxProducts) {
      return apiBadRequest(`Maximal ${BULK_LIMITS.maxProducts} Produkte pro Vorgang`)
    }

    logger.info('Bulk save started', {
      userId: session.user.id,
      productCount: products.length,
      action,
    })

    const results: BulkSaveResponse['results'] = []
    let succeeded = 0
    let failed = 0

    // Process in chunks for manageable transaction sizes
    const chunkSize = BULK_LIMITS.saveChunkSize
    for (let i = 0; i < products.length; i += chunkSize) {
      const chunk = products.slice(i, i + chunkSize)

      // Each product gets its own transaction so failures are isolated
      for (let j = 0; j < chunk.length; j++) {
        const product = chunk[j]
        const globalIndex = i + j

        try {
          // Validate required fields
          if (!product.hersteller || !product.produktname) {
            results.push({
              index: globalIndex,
              success: false,
              error: 'Hersteller und Produktname erforderlich',
            })
            failed++
            continue
          }

          // Coerce numeric fields (client may send strings from CSV)
          const price = typeof product.verkaufspreis === 'string'
            ? parseFloat(product.verkaufspreis)
            : Number(product.verkaufspreis)
          if (isNaN(price) || price < 0) {
            results.push({
              index: globalIndex,
              success: false,
              error: 'Gültiger Verkaufspreis erforderlich',
            })
            failed++
            continue
          }

          if (product.auf_lager !== undefined) {
            product.auf_lager = typeof product.auf_lager === 'string'
              ? parseInt(product.auf_lager, 10)
              : Number(product.auf_lager)
          }

          // Set action on each product payload
          const payload = { ...product, verkaufspreis: price, action }

          const result = await db.transaction(async (tx) => {
            return createErfassungProduct(payload, session.user.id, tx)
          })

          results.push({
            index: globalIndex,
            success: true,
            productId: result.productId,
            itemUUID: result.itemUUID,
          })
          succeeded++
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unbekannter Fehler'
          logger.error('Bulk save item failed', {
            index: globalIndex,
            hersteller: product.hersteller,
            produktname: product.produktname,
            error,
          })
          results.push({
            index: globalIndex,
            success: false,
            error: message,
          })
          failed++
        }
      }
    }

    logger.info('Bulk save complete', {
      userId: session.user.id,
      total: products.length,
      succeeded,
      failed,
    })

    const response: BulkSaveResponse = {
      total: products.length,
      succeeded,
      failed,
      results,
    }

    return apiSuccess(response)
  } catch (error) {
    return apiError(error, 'Interner Serverfehler')
  }
})
