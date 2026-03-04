/**
 * Intake AI Text Extraction API
 *
 * POST /api/admin/intake/extract-text
 * Accepts text input and returns structured product data for form pre-fill.
 * Reuses the shared extractProductFromText() pipeline.
 */

import { withAdmin } from '@/lib/api/middleware'
import { logger } from '@/lib/logger'
import { apiSuccess, apiError, apiBadRequest } from '@/lib/api/helpers'
import { extractProductFromText } from '@/lib/erfassung/ai-extraction'

export const POST = withAdmin('intake', async (request, session) => {
  try {
    const body = await request.json()
    const { text } = body

    if (!text || typeof text !== 'string') {
      return apiBadRequest('Text ist erforderlich')
    }

    if (text.trim().length < 3) {
      return apiBadRequest('Text ist zu kurz. Bitte mehr Details eingeben.')
    }

    logger.info('Intake text extraction started', {
      userId: session.user.id,
      textLength: text.length,
    })

    const result = await extractProductFromText(text, 'text')

    if (!result.success) {
      return apiError(result.error, result.error || 'Extraktionsfehler')
    }

    logger.info('Intake text extraction complete', {
      userId: session.user.id,
      product: result.data.produktname,
    })

    return apiSuccess({
      data: result.data,
      metadata: result.metadata,
      model: result.model,
      sourceType: result.sourceType,
    })
  } catch (error) {
    return apiError(error, 'Interner Serverfehler')
  }
})
