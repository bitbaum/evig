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
import { detectCategory } from './ai-classification'
import { CONDITION_ALIASES } from '@/config/erfassung/conditions'
import { callWithFallback } from '@/lib/ai/providers'

// Re-export client-safe heuristic (lives in its own file to avoid pulling
// server-only imports into 'use client' components)
export { detectMultipleProducts } from './detect-multi'

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
  try {
    const prompt = fillPromptTemplate(ERFASSUNG_PROMPTS.extractMulti, {
      text,
      schema: ERFASSUNG_PROMPTS.schema,
    })

    const result = await callWithFallback({
      systemPrompt: ERFASSUNG_PROMPTS.system,
      userPrompt: prompt,
      temperature: 0.3,
      maxTokens: 4096,
      timeoutMs: 30000,
    })

    if (!result) {
      logger.warn('All AI providers failed for multi-extract')
      return fallbackParse(text, sourceType)
    }

    const responseText = result.text

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
    logger.info('Multi-extract successful', { count: products.length, provider: result.provider })

    return products.map(p => voiceDataToBulkProduct(p, sourceType))
  } catch (error) {
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
 * Fallback: parse each line as a separate product with smart extraction.
 * Extracts brand, model, condition, price, and category from free-text lines.
 */
function fallbackParse(text: string, sourceType: 'text' | 'voice'): BulkProduct[] {
  const lines = text.split(/\n+/).map(l => l.trim()).filter(l => l.length > 5)

  return lines.map(line => {
    const lineLower = line.toLowerCase()
    let remaining = line

    // 1. Extract brand
    const brandMap: Record<string, string> = {
      dell: 'Dell', hp: 'HP', lenovo: 'Lenovo', apple: 'Apple', asus: 'ASUS',
      acer: 'Acer', microsoft: 'Microsoft', samsung: 'Samsung', toshiba: 'Toshiba', fujitsu: 'Fujitsu',
    }
    const brand = Object.keys(brandMap).find(b => lineLower.includes(b))
    const hersteller = brand ? brandMap[brand] : ''
    // Remove brand from remaining text for cleaner product name
    if (brand) {
      remaining = remaining.replace(new RegExp(brand, 'i'), '').trim()
    }

    // 2. Extract price — use the LAST standalone number on the line (most likely the price)
    // Match numbers that appear at the end or are followed by currency/whitespace, not embedded in model names
    const priceMatch = line.match(/\b(\d{2,4})\s*(chf|franken|fr\.?|sfr|.-)?\s*$/i)
    let verkaufspreis = ''
    if (priceMatch) {
      const price = parseInt(priceMatch[1])
      if (price >= 10 && price <= 9999) {
        verkaufspreis = priceMatch[1]
        // Remove price from remaining
        remaining = remaining.replace(new RegExp(priceMatch[0].replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*$'), '').trim()
      }
    }

    // 3. Extract condition — check for known condition words
    // Sort by alias length descending so "wie neu" matches before "neu"
    let zustand = 'good' // default
    const sortedAliases = Object.entries(CONDITION_ALIASES).sort((a, b) => b[0].length - a[0].length)
    for (const [alias, value] of sortedAliases) {
      // Match whole word/phrase boundaries to avoid false positives
      const aliasPattern = new RegExp(`\\b${alias.replace(/\s+/g, '\\s+')}\\b`, 'i')
      if (aliasPattern.test(remaining)) {
        zustand = value
        // Remove condition from remaining
        remaining = remaining.replace(aliasPattern, '').trim()
        break
      }
    }

    // 4. Detect category via the shared keyword classifier (KATEGORIEN SSOT)
    const hauptkategorie = detectCategory(line)

    // 5. Clean up product name — remove extra whitespace, leading/trailing punctuation
    remaining = remaining.replace(/\s+/g, ' ').replace(/^[\s,;-]+|[\s,;-]+$/g, '').trim()
    // If brand was extracted, prepend it to make a nice product name like "ThinkPad T480 i5 8GB 256GB SSD"
    const produktname = remaining || line.substring(0, 100)

    const formData: Partial<ErfassungFormData> = {
      hersteller,
      produktname,
      kurzbeschreibung: `${hersteller} ${produktname}`.trim(),
      verkaufspreis,
      zustand,
      hauptkategorie,
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
