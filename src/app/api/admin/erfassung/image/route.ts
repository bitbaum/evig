/**
 * API: Photo-to-Product Erfassung
 *
 * POST /api/admin/erfassung/image
 * Accepts a base64 image and returns the SAME structured product data as the
 * text route — full fidelity (specs, category, description, profiles), not the
 * four-field subset the old /api/ai/analyze-product path handed back.
 *
 * Staff-only; part of the /api/admin/erfassung/* family (text, voice, bulk-*).
 *
 * Example:
 *   POST { "image": "data:image/jpeg;base64,..." }
 *   Returns: { success: true, data: { hersteller, produktname, specs, ... }, metadata }
 */

import { withAdmin } from '@/lib/api/middleware'
import { logger } from '@/lib/logger'
import { apiSuccess, apiError, apiRateLimited } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { validateBody, ErfassungImageSchema } from '@/lib/schemas'
import { extractProductFromImage } from '@/lib/erfassung/ai-extraction'
import { rateLimiters } from '@/lib/security/rate-limit'

export const POST = withAdmin('products', async (request, session) => {
  try {
    // Bound expensive vision inference per operator (generous staff limit).
    if (!rateLimiters.erfassungImage(session.user.id + ':erfassung-image')) {
      return apiRateLimited()
    }

    const body = await request.json()
    const validation = validateBody(ErfassungImageSchema, body)
    if (!validation.success) return validation.error
    const { image } = validation.data

    logger.info('Image erfassung started', {
      userId: session.user.id,
      imageBytes: image.length,
    })

    const result = await extractProductFromImage(image)

    if (!result.success) {
      return apiError(result.error, result.error || ERROR_MESSAGES.EXTRACTION_FAILED)
    }

    logger.info('Image erfassung complete', {
      userId: session.user.id,
      product: result.data.produktname,
      model: result.model,
    })

    return apiSuccess({
      data: result.data,
      metadata: result.metadata,
      model: result.model,
      sourceType: result.sourceType,
      verificationSources: result.verificationSources,
    })
  } catch (error) {
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
})
