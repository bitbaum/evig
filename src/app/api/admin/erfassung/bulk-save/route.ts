/**
 * API: Bulk Save Products
 *
 * POST /api/admin/erfassung/bulk-save
 * Accepts an array of products and saves them in chunked transactions.
 * Each chunk runs in its own transaction — failed rows don't block successful ones.
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { canAccessSection } from '@/lib/permissions'
import { logger } from '@/lib/logger'
import { transaction } from '@/lib/auth/db'
import { apiUnauthorized, apiForbidden, apiBadRequest } from '@/lib/api/helpers'
import { createErfassungProduct } from '@/lib/erfassung/create-product'
import { BULK_LIMITS } from '@/config/erfassung'
import type { BulkSaveRequest, BulkSaveResponse } from '@/types/erfassung'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return apiUnauthorized()
    }

    const user = {
      email: session.user.email,
      is_staff: session.user.isStaff,
      staff_permissions: session.user.staffPermissions,
    }

    if (!canAccessSection(user, 'products')) {
      return apiForbidden('Keine Berechtigung für Produkterfassung')
    }

    const body: BulkSaveRequest = await request.json()
    const { products, action } = body

    if (!products || !Array.isArray(products) || products.length === 0) {
      return apiBadRequest('Keine Produkte zum Speichern')
    }

    if (products.length > BULK_LIMITS.maxProducts) {
      return apiBadRequest(`Maximal ${BULK_LIMITS.maxProducts} Produkte pro Vorgang`)
    }

    if (!action || !['draft', 'erfassen', 'publish'].includes(action)) {
      return apiBadRequest('Ungültige Aktion')
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

          if (product.verkaufspreis === undefined || product.verkaufspreis < 0) {
            results.push({
              index: globalIndex,
              success: false,
              error: 'Gültiger Verkaufspreis erforderlich',
            })
            failed++
            continue
          }

          // Set action on each product payload
          const payload = { ...product, action }

          const result = await transaction(async (client) => {
            return createErfassungProduct(payload, session.user.id, client)
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

    return NextResponse.json({ success: true, data: response })
  } catch (error) {
    logger.error('Bulk save error', { error })
    return NextResponse.json(
      { success: false, error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}
