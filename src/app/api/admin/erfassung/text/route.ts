/**
 * API: Text-to-Product Erfassung
 *
 * POST /api/admin/erfassung/text
 * Accepts text input and returns structured product data.
 *
 * Example:
 *   POST { "text": "Dell Latitude E7470 i5 8GB 256GB SSD" }
 *   Returns: { success: true, data: { hersteller: "Dell", produktname: "Latitude E7470", ... } }
 */

import { NextRequest } from 'next/server'
import { withAdmin } from '@/lib/api/middleware'
import { canAccessSection } from '@/lib/permissions'
import { logger } from '@/lib/logger'
import { apiSuccess, apiError, apiForbidden, apiBadRequest } from '@/lib/api/helpers'
import { extractProductFromText } from '@/lib/erfassung/ai-extraction'

export const POST = withAdmin(async (request, session) => {
  try {
    const user = {
      email: session.user.email,
      is_staff: session.user.isStaff,
      staff_permissions: session.user.staffPermissions,
    }

    // Check permission - erfassung is part of products section
    if (!canAccessSection(user, 'products')) {
      return apiForbidden('Keine Berechtigung für Produkterfassung')
    }

    // Get text from request body
    const body = await request.json()
    const { text } = body

    if (!text || typeof text !== 'string') {
      return apiBadRequest('Text ist erforderlich')
    }

    if (text.trim().length < 3) {
      return apiBadRequest('Text ist zu kurz. Bitte mehr Details eingeben.')
    }

    logger.info('Text erfassung started', {
      userId: session.user.id,
      textLength: text.length,
    })

    // Extract product data using shared service
    const result = await extractProductFromText(text, 'text')

    if (!result.success) {
      return apiError(result.error, result.error || 'Extraktionsfehler')
    }

    logger.info('Text erfassung complete', {
      userId: session.user.id,
      product: result.data.produktname,
    })

    return apiSuccess({
      inputText: result.inputText,
      data: result.data,
      metadata: result.metadata,
      model: result.model,
      sourceType: result.sourceType,
      verificationSources: result.verificationSources,
    })
  } catch (error) {
    return apiError(error, 'Interner Serverfehler')
  }
})
