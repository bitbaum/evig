/**
 * API: Smart Product Entry
 *
 * POST /api/ai/smart-product-entry
 * Takes a product name/model and uses Groq to look up specs and generate form data.
 *
 * Input methods supported:
 * 1. Text entry (current) - "Dell Latitude e7470"
 * 2. Voice entry (future) - Speech-to-text then process
 * 3. Image entry (future) - Vision model then process
 *
 * Uses Groq's llama-3.3-70b-versatile for fast inference.
 */

import { NextRequest } from 'next/server'
import { withAdmin } from '@/lib/api/middleware'
import { apiError, apiSuccess } from '@/lib/api/helpers'
import { logger } from '@/lib/logger'
import { validateBody, SmartProductEntrySchema } from '@/lib/schemas'
import { callWithFallback } from '@/lib/ai/providers'
import { robustJsonExtract } from '@/lib/ai/extract'
import { FORM_AI_REGISTRY, fillPromptTemplate } from '@/lib/ai/config/prompts'

interface ProductFormData {
  title: string
  handle: string
  description: string
  price: string
  category: string
  sku: string
  specs: Array<{ key: string; value: string }>
  tags: string[]
  condition: string
}

const AI_CONFIG = FORM_AI_REGISTRY['smart-product-entry']

export const POST = withAdmin('products', async (request: NextRequest) => {
  const startTime = Date.now()

  try {
    const body = await request.json()
    const validation = validateBody(SmartProductEntrySchema, body)
    if (!validation.success) return validation.error
    const { query, inputType } = validation.data

    const trimmedQuery = query.trim()

    logger.info('Smart product entry request', {
      query: trimmedQuery,
      inputType,
    })

    const result = await callWithFallback({
      systemPrompt: AI_CONFIG.system,
      userPrompt: fillPromptTemplate(AI_CONFIG.extract, { text: trimmedQuery }),
      temperature: AI_CONFIG.temperature ?? 0.3,
      maxTokens: AI_CONFIG.maxTokens ?? 1024,
    })

    if (!result) {
      return apiError(
        new Error('All AI providers failed'),
        'KI-Service nicht verfügbar. Bitte später erneut versuchen.',
        503
      )
    }

    const processingTime = Date.now() - startTime

    // Parse JSON from response
    const productData = robustJsonExtract<ProductFormData>(result.text)
    if (!productData) {
      logger.error('Failed to parse AI response', { response: result.text.substring(0, 500) })
      return apiError(
        new Error('Invalid AI response'),
        'Konnte Produktdaten nicht extrahieren',
        500
      )
    }

    // Validate required fields
    if (!productData.title) {
      return apiError(
        new Error('Missing title'),
        'Produkt konnte nicht identifiziert werden',
        400
      )
    }

    // Ensure handle is URL-safe
    if (!productData.handle) {
      productData.handle = productData.title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim()
    }

    // Ensure specs is an array
    if (!Array.isArray(productData.specs)) {
      productData.specs = []
    }

    // Ensure tags is an array
    if (!Array.isArray(productData.tags)) {
      productData.tags = []
    }

    logger.info('Smart product entry successful', {
      product: productData.title,
      processingTime,
      provider: result.provider,
      model: result.model,
    })

    return apiSuccess({
      product: productData,
      metadata: {
        query: trimmedQuery,
        inputType,
        processingTime,
        model: result.model,
        provider: result.provider,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    logger.error('Smart product entry error', { error: message })

    return apiError(error, 'Fehler bei der Produkterkennung')
  }
})
