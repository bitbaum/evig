/**
 * API: AI Product Data Refinement
 *
 * POST /api/admin/erfassung/refine
 * Refines existing product data using AI based on instructions.
 */

import { NextRequest } from 'next/server'
import { withAdmin } from '@/lib/api/middleware'
import { logger } from '@/lib/logger'
import { apiSuccess, apiError } from '@/lib/api/helpers'
import { validateBody, ErfassungRefineSchema } from '@/lib/schemas'
import { ERFASSUNG_PROMPTS, fillPromptTemplate } from '@/lib/ai/config/prompts'
import { callWithFallback } from '@/lib/ai/providers'
import { robustJsonExtract } from '@/lib/ai/extract'

interface ProductData {
  hersteller?: string
  produktname?: string
  kurzbeschreibung?: string
  specs?: Array<{ key: string; value: string }>
  verkaufspreis?: string
  zustand?: string
  hauptkategorie?: string
  unterkategorie?: string
  kundenprofile?: string[]
  bemerkungen?: string
}

interface RefinedProductData extends ProductData {
  fieldsChanged: string[]
}

export const POST = withAdmin('products', async (request, session) => {
  try {
    const body = await request.json()
    const validation = validateBody(ErfassungRefineSchema, body)
    if (!validation.success) return validation.error
    const { currentProduct: currentProductRaw, instruction } = validation.data
    const currentProduct = currentProductRaw as ProductData

    // Format current product as JSON string for the prompt
    const currentProductJson = JSON.stringify(currentProduct, null, 2)

    // Build the refinement prompt
    const userPrompt = fillPromptTemplate(ERFASSUNG_PROMPTS.refine, {
      currentProduct: currentProductJson,
      instruction: instruction,
    })

    const result = await callWithFallback({
      systemPrompt: ERFASSUNG_PROMPTS.system,
      userPrompt,
      temperature: 0.3,
      maxTokens: 2048,
    })

    if (!result) {
      return apiError(
        new Error('All AI providers failed'),
        'KI-Service nicht verfügbar. Bitte später erneut versuchen.',
        503
      )
    }

    const content = result.text
    if (!content) {
      return apiError(
        new Error('Empty AI response'),
        'Keine Antwort vom KI-Service erhalten'
      )
    }

    // Parse the JSON response
    const parsed = robustJsonExtract<RefinedProductData>(content)
    if (!parsed) {
      logger.error('Failed to parse AI response', {
        content: content.substring(0, 500),
      })
      return apiError(
        new Error('Invalid AI response format'),
        'Fehler beim Verarbeiten der KI-Antwort. Bitte versuchen Sie es erneut.'
      )
    }

    const refined: RefinedProductData = {
      hersteller: parsed.hersteller || currentProduct.hersteller,
      produktname: parsed.produktname || currentProduct.produktname,
      kurzbeschreibung: parsed.kurzbeschreibung || currentProduct.kurzbeschreibung,
      specs: Array.isArray(parsed.specs) ? parsed.specs : currentProduct.specs,
      verkaufspreis: parsed.verkaufspreis?.toString() || currentProduct.verkaufspreis,
      zustand: parsed.zustand || currentProduct.zustand,
      hauptkategorie: parsed.hauptkategorie?.toString() || currentProduct.hauptkategorie,
      unterkategorie: parsed.unterkategorie?.toString() || currentProduct.unterkategorie,
      kundenprofile: Array.isArray(parsed.kundenprofile) ? parsed.kundenprofile : currentProduct.kundenprofile,
      bemerkungen: parsed.bemerkungen || currentProduct.bemerkungen,
      fieldsChanged: Array.isArray(parsed.fieldsChanged) ? parsed.fieldsChanged : [],
    }

    logger.info('Product data refined with AI', {
      instruction: instruction.substring(0, 100),
      userId: session.user.id,
      provider: result.provider,
      fieldsChanged: refined.fieldsChanged,
    })

    return apiSuccess({
      refined,
      fieldsChanged: refined.fieldsChanged,
    })
  } catch (error) {
    logger.error('Failed to refine product data', { error })
    return apiError(error, 'Produktverbesserung fehlgeschlagen')
  }
})
