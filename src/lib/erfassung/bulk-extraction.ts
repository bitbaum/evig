/**
 * Bulk Product Extraction
 *
 * Detects and extracts multiple products from text input.
 * Used by: bulk-text API route, DataEntryTabs (client-side heuristic)
 */

import { logger } from '@/lib/logger'
import { ERFASSUNG_PROMPTS, fillPromptTemplate } from '@/lib/ai/config/prompts'
import { formDataToBulkProduct } from '@/types/erfassung'
import type { BulkProduct, ErfassungFormData } from '@/types/erfassung'
import type { VoiceProductData, AIFieldMetadata } from '@/types/erfassung'
import { BULK_LIMITS } from '@/config/erfassung'

const GROQ_API_KEY = process.env.GROQ_API_KEY || ''
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_MODEL = 'llama-3.3-70b-versatile'
const AI_TIMEOUT_MS = 30000 // 30 seconds for multi-product (longer than single)

/**
 * Client-side heuristic to detect if text contains multiple products.
 * No AI call — pure regex/line counting.
 * Safe to import and run in browser.
 */
export function detectMultipleProducts(text: string): boolean {
  const trimmed = text.trim()
  if (!trimmed) return false

  // Split by newlines and filter out empty lines
  const lines = trimmed.split(/\n+/).map(l => l.trim()).filter(l => l.length > 3)
  if (lines.length < 2) return false

  // Check for numbered list patterns: "1. ...", "1) ...", "#1 ..."
  const numberedLines = lines.filter(l => /^\d+[\.\)\s]/.test(l))
  if (numberedLines.length >= 2) return true

  // Check for bullet point patterns: "- ...", "• ...", "* ..."
  const bulletLines = lines.filter(l => /^[-•*]\s/.test(l))
  if (bulletLines.length >= 2) return true

  // Check for CSV-like structure (lines with consistent delimiters)
  const csvLines = lines.filter(l => (l.match(/[,;|\t]/g) || []).length >= 2)
  if (csvLines.length >= 2) return true

  // Check for multiple product-like lines (containing brand/model patterns)
  const productPatterns = /\b(dell|hp|lenovo|apple|asus|acer|thinkpad|latitude|elitebook|macbook|surface|samsung)\b/i
  const productLines = lines.filter(l => productPatterns.test(l))
  if (productLines.length >= 2) return true

  // Check for lines with price patterns (multiple products with prices)
  const pricePattern = /\d{2,4}\s*(chf|franken|fr\.?|sfr|.-)?$/i
  const priceLines = lines.filter(l => pricePattern.test(l.trim()))
  if (priceLines.length >= 2) return true

  // Simple line count heuristic: 3+ non-trivial lines
  if (lines.length >= 3) {
    // Check if lines look product-like (have some numbers/specs)
    const specLines = lines.filter(l => /\d/.test(l) && l.length > 10)
    if (specLines.length >= 2) return true
  }

  return false
}

/**
 * Extract multiple products from text using AI.
 * Server-side only (uses Groq API).
 */
export async function extractMultipleProducts(
  text: string,
  sourceType: 'text' | 'voice' = 'text',
): Promise<BulkProduct[]> {
  const trimmed = text.trim()
  if (!trimmed) return []

  // For large text, chunk and process sequentially
  const lines = trimmed.split(/\n+/).filter(l => l.trim().length > 3)
  const estimatedProducts = Math.max(lines.length, 1)

  if (estimatedProducts > BULK_LIMITS.aiChunkSize) {
    return extractInChunks(lines, sourceType)
  }

  return extractChunk(trimmed, sourceType)
}

/**
 * Extract a single chunk of text into multiple products
 */
async function extractChunk(
  text: string,
  sourceType: 'text' | 'voice',
): Promise<BulkProduct[]> {
  if (!GROQ_API_KEY) {
    logger.warn('Groq API key not configured, using line-based fallback')
    return fallbackParse(text, sourceType)
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), AI_TIMEOUT_MS)

  try {
    const prompt = fillPromptTemplate(ERFASSUNG_PROMPTS.extractMulti, {
      text,
      schema: ERFASSUNG_PROMPTS.schema,
    })

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: 'system', content: ERFASSUNG_PROMPTS.system },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 4096,
      }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      logger.warn('Groq multi-extract API error', { status: response.status })
      return fallbackParse(text, sourceType)
    }

    const result = await response.json()
    const responseText = result.choices?.[0]?.message?.content || ''

    // Extract JSON array from response
    const jsonMatch = responseText.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      // Try single object (AI might return one product)
      const singleMatch = responseText.match(/\{[\s\S]*\}/)
      if (singleMatch) {
        const product = JSON.parse(singleMatch[0]) as VoiceProductData
        return [voiceDataToBulkProduct(product, sourceType)]
      }
      logger.warn('No JSON array in multi-extract response')
      return fallbackParse(text, sourceType)
    }

    const products = JSON.parse(jsonMatch[0]) as VoiceProductData[]
    logger.info('Multi-extract successful', { count: products.length })

    return products.map(p => voiceDataToBulkProduct(p, sourceType))
  } catch (error) {
    clearTimeout(timeoutId)
    logger.warn('Multi-extract failed, using fallback', {
      error: error instanceof Error ? error.message : 'unknown',
    })
    return fallbackParse(text, sourceType)
  }
}

/**
 * Process large text in chunks of aiChunkSize lines
 */
async function extractInChunks(
  lines: string[],
  sourceType: 'text' | 'voice',
): Promise<BulkProduct[]> {
  const allProducts: BulkProduct[] = []
  const chunkSize = BULK_LIMITS.aiChunkSize

  for (let i = 0; i < lines.length; i += chunkSize) {
    const chunk = lines.slice(i, i + chunkSize).join('\n')
    const products = await extractChunk(chunk, sourceType)
    allProducts.push(...products)
  }

  return allProducts
}

/**
 * Fallback: parse each line as a separate product
 */
function fallbackParse(text: string, sourceType: 'text' | 'voice'): BulkProduct[] {
  const lines = text.split(/\n+/).map(l => l.trim()).filter(l => l.length > 5)

  return lines.map(line => {
    const formData: Partial<ErfassungFormData> = {
      produktname: line.substring(0, 100),
      kurzbeschreibung: line,
    }

    // Try to extract brand
    const brands = ['dell', 'hp', 'lenovo', 'apple', 'asus', 'acer', 'microsoft', 'samsung']
    const lineLower = line.toLowerCase()
    const brand = brands.find(b => lineLower.includes(b))
    if (brand) {
      formData.hersteller = brand.charAt(0).toUpperCase() + brand.slice(1)
    }

    // Try to extract price
    const priceMatch = line.match(/(\d{2,4})\s*(chf|franken|fr\.?|sfr|.-)?/i)
    if (priceMatch && parseInt(priceMatch[1]) >= 20 && parseInt(priceMatch[1]) <= 9999) {
      formData.verkaufspreis = priceMatch[1]
    }

    return formDataToBulkProduct(formData, sourceType === 'voice' ? 'voice' : 'text')
  })
}

/**
 * Convert VoiceProductData (AI result) to BulkProduct
 */
function voiceDataToBulkProduct(
  data: VoiceProductData,
  sourceType: 'text' | 'voice',
): BulkProduct {
  const formData: Partial<ErfassungFormData> = {
    hersteller: data.hersteller || '',
    produktname: data.produktname || '',
    kurzbeschreibung: data.kurzbeschreibung || '',
    specs: data.specs || [],
    verkaufspreis: data.verkaufspreis || '',
    zustand: data.zustand || 'good',
    hauptkategorie: data.hauptkategorie || '',
    unterkategorie: data.unterkategorie || '',
    kundenprofile: data.kundenprofile || [],
  }

  return formDataToBulkProduct(formData, sourceType === 'voice' ? 'voice' : 'text')
}
