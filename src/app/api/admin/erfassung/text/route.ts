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
import { logger } from '@/lib/logger'
import { apiSuccess, apiError } from '@/lib/api/helpers'
import { validateBody, ErfassungTextSchema } from '@/lib/schemas'
import { extractProductFromText } from '@/lib/erfassung/ai-extraction'

export const POST = withAdmin('products', async (request, session) => {
  try {
    const body = await request.json()
    const validation = validateBody(ErfassungTextSchema, body)
    if (!validation.success) return validation.error
    const { text } = validation.data

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
