/**
 * API: Bulk Text-to-Products Erfassung
 *
 * POST /api/admin/erfassung/bulk-text
 * Accepts text with multiple products and returns structured product data array.
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/api/middleware'
import { logger } from '@/lib/logger'
import { apiSuccess } from '@/lib/api/helpers'
import { validateBody, BulkTextSchema } from '@/lib/schemas'
import { extractMultipleProducts } from '@/lib/erfassung/bulk-extraction'

export const POST = withAdmin(async (request: NextRequest, session) => {
  try {
    const raw = await request.json()
    const validation = validateBody(BulkTextSchema, raw)
    if (!validation.success) return validation.error
    const { text } = validation.data

    logger.info('Bulk text erfassung started', {
      userId: session.user.id,
      textLength: text.length,
    })

    const products = await extractMultipleProducts(text, 'text')

    logger.info('Bulk text erfassung complete', {
      userId: session.user.id,
      productCount: products.length,
    })

    return apiSuccess({
      productCount: products.length,
      products,
    })
  } catch (error) {
    logger.error('Bulk text erfassung error', { error })
    return NextResponse.json(
      { success: false, error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
})
