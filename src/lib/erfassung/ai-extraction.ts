/**
 * AI Extraction Service for Erfassung
 *
 * Orchestrator that coordinates AI-powered product data extraction.
 * Uses Groq (primary) with Ollama as fallback for local development.
 * Used by: voice route, text route, image route (after OCR)
 *
 * Flow:
 * 1. Receive text (from voice transcription, direct input, or OCR)
 * 2. Send to Groq (cloud) for structured parsing
 * 3. Fall back to Ollama (local) or regex parser if unavailable
 * 4. Return ErfassungFormData ready to fill the form
 *
 * Split modules:
 * - ai-field-mapping.ts: Confidence scoring, verification sources
 * - ai-classification.ts: Regex-based product classification fallback
 */

import { logger } from '@/lib/logger'
import type { VoiceProductData, AIFieldMetadata, VerificationSource } from '@/types/erfassung'
import { ERFASSUNG_PROMPTS, fillPromptTemplate } from '@/lib/ai/config/prompts'
import { callWithFallback } from '@/lib/ai/providers'
import { OLLAMA_URL } from '@/config/urls'

// Re-export from split modules so existing imports don't break
export { generateVerificationSources, calculateFieldConfidence } from './ai-field-mapping'
export { fastParseProductText } from './ai-classification'

// Import for internal use
import { calculateFieldConfidence } from './ai-field-mapping'
import { fastParseProductText } from './ai-classification'

// Product form structure for AI to fill - imported from SSOT
export const PRODUCT_SCHEMA = ERFASSUNG_PROMPTS.schema

// Build extraction prompt using SSOT prompts
const buildExtractionPrompt = (text: string) => fillPromptTemplate(ERFASSUNG_PROMPTS.extract, {
  text,
  schema: ERFASSUNG_PROMPTS.schema,
})

export interface ExtractionResult {
  success: true
  data: VoiceProductData
  metadata: AIFieldMetadata
  sourceType: 'voice' | 'text' | 'image'
  inputText: string
  model: string
  verificationSources?: VerificationSource[]
}

export interface ExtractionError {
  success: false
  error: string
  rawResponse?: string
}

export type ExtractProductResult = ExtractionResult | ExtractionError

/**
 * Extract structured product data from text using AI.
 * Uses centralized callWithFallback (Groq -> OpenRouter -> Ollama).
 * Falls back to fast regex parser if all AI providers fail.
 */
export async function extractProductFromText(
  text: string,
  sourceType: 'voice' | 'text' | 'image' = 'text'
): Promise<ExtractProductResult> {
  if (!text || text.trim() === '') {
    return { success: false, error: 'Kein Text zum Verarbeiten' }
  }

  // Try AI providers in cascade via centralized provider
  const result = await callWithFallback({
    systemPrompt: ERFASSUNG_PROMPTS.system,
    userPrompt: buildExtractionPrompt(text.trim()),
    temperature: 0.3,
    maxTokens: 1024,
    timeoutMs: 15000,
  })

  if (result) {
    // Extract JSON from response
    const jsonMatch = result.text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      try {
        const productData = JSON.parse(jsonMatch[0]) as VoiceProductData
        const { metadata, allSources } = calculateFieldConfidence(text, productData, sourceType, result.model)

        logger.info('AI extraction successful', {
          product: productData.produktname,
          hersteller: productData.hersteller,
          provider: result.provider,
          sourcesCount: allSources.length,
        })

        return {
          success: true,
          data: productData,
          metadata,
          sourceType,
          inputText: text,
          model: result.model,
          verificationSources: allSources,
        }
      } catch {
        logger.warn('Failed to parse AI JSON response', {
          provider: result.provider,
          responsePreview: result.text.substring(0, 200),
        })
      }
    }
  }

  // Fall back to fast regex-based parser
  logger.warn('All AI providers failed, using fast parser', {
    text: text.substring(0, 50),
  })

  const productData = fastParseProductText(text)
  const { metadata, allSources } = calculateFieldConfidence(text, productData, sourceType, 'fast-parser')

  // Adjust confidence for fallback parser (slightly lower)
  Object.keys(metadata).forEach(key => {
    const field = metadata[key as keyof AIFieldMetadata]
    if (field) {
      field.confidence = Math.max(0.5, field.confidence - 0.1)
      field.model = 'fast-parser'
    }
  })

  logger.info('Fast parser extraction successful', {
    product: productData.produktname,
    hersteller: productData.hersteller,
    sourcesCount: allSources.length,
  })

  return {
    success: true,
    data: productData,
    metadata,
    sourceType,
    inputText: text,
    model: 'fast-parser',
    verificationSources: allSources,
  }
}

/**
 * Analyze an image using Ollama vision model.
 * Falls back to text extraction if vision model not available.
 */
export async function extractProductFromImage(
  imageBase64: string
): Promise<ExtractProductResult> {
  const VISION_MODEL = process.env.OLLAMA_VISION_MODEL || 'llama3.2-vision'

  const imagePrompt = `Analysiere dieses Produktbild und extrahiere alle sichtbaren Informationen.

Beschreibe:
- Hersteller/Marke (z.B. Dell, HP, Lenovo, Apple)
- Produktname/Modell (z.B. "Latitude E7470", "ThinkPad T480")
- Sichtbare Specs (CPU-Sticker, RAM-Aufkleber, etc.)
- Zustand (Kratzer, Abnutzung, wie neu)
- Geschätzter Preis für Schweizer Markt (CHF)

Dann fülle folgendes JSON-Schema aus:
${PRODUCT_SCHEMA}

Antworte NUR mit dem ausgefüllten JSON, keine Erklärungen.`

  try {
    // Remove data URL prefix if present
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '')

    logger.info('Sending image to Ollama for analysis', {
      model: VISION_MODEL,
      imageSize: base64Data.length,
    })

    const response = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: VISION_MODEL,
        prompt: imagePrompt,
        images: [base64Data],
        stream: false,
        options: {
          temperature: 0.3,
        },
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      logger.error('Ollama vision request failed', { status: response.status, error })

      // Check if model not found
      if (error.includes('model') && error.includes('not found')) {
        return {
          success: false,
          error: `Vision-Modell "${VISION_MODEL}" nicht installiert. Bitte mit "ollama pull ${VISION_MODEL}" installieren.`,
        }
      }

      return {
        success: false,
        error: 'Bildanalyse fehlgeschlagen',
        rawResponse: error,
      }
    }

    const ollamaResult = await response.json()
    const responseText = ollamaResult.response

    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      logger.error('No JSON found in vision response', { response: responseText })
      return {
        success: false,
        error: 'Konnte Produktdaten nicht aus Bild extrahieren',
        rawResponse: responseText,
      }
    }

    const productData = JSON.parse(jsonMatch[0]) as VoiceProductData

    // For image extraction, use a generic input description for confidence
    const { metadata, allSources } = calculateFieldConfidence('[image analysis]', productData, 'image')

    logger.info('Image extraction successful', {
      product: productData.produktname,
      hersteller: productData.hersteller,
      fieldsExtracted: Object.keys(metadata).length,
      sourcesCount: allSources.length,
    })

    return {
      success: true,
      data: productData,
      metadata,
      sourceType: 'image',
      inputText: '[Bild-Analyse]',
      model: VISION_MODEL,
      verificationSources: allSources,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unbekannter Fehler'
    logger.error('Image extraction failed', { error })

    if (message.includes('fetch') || message.includes('ECONNREFUSED')) {
      return {
        success: false,
        error: 'KI-Service nicht erreichbar. Bitte später versuchen.',
      }
    }

    return { success: false, error: 'Fehler bei der Bildanalyse' }
  }
}
