/**
 * API: Bulk Text-to-Products Erfassung
 *
 * POST /api/admin/erfassung/bulk-text
 * Accepts text with multiple products and returns structured product data array.
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { canAccessSection } from '@/lib/permissions'
import { logger } from '@/lib/logger'
import { apiUnauthorized, apiForbidden, apiBadRequest } from '@/lib/api/helpers'
import { extractMultipleProducts } from '@/lib/erfassung/bulk-extraction'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
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

    const body = await request.json()
    const { text } = body

    if (!text || typeof text !== 'string') {
      return apiBadRequest('Text ist erforderlich')
    }

    if (text.trim().length < 10) {
      return apiBadRequest('Text ist zu kurz für Mehrfacherfassung.')
    }

    logger.info('Bulk text erfassung started', {
      userId: session.user.id,
      textLength: text.length,
    })

    const products = await extractMultipleProducts(text, 'text')

    logger.info('Bulk text erfassung complete', {
      userId: session.user.id,
      productCount: products.length,
    })

    return NextResponse.json({
      success: true,
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
}
