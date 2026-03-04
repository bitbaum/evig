/**
 * AI Extraction Service for Erfassung
 *
 * Shared service for extracting structured product data from text using cloud AI.
 * Uses Groq (primary) with Ollama as fallback for local development.
 * Used by: voice route, text route, image route (after OCR)
 *
 * Flow:
 * 1. Receive text (from voice transcription, direct input, or OCR)
 * 2. Send to Groq (cloud) for structured parsing
 * 3. Fall back to Ollama (local) or regex parser if unavailable
 * 4. Return ErfassungFormData ready to fill the form
 */

import { logger } from '@/lib/logger'
import type { VoiceProductData, AIFieldSource, AIFieldMetadata, ErfassungFormData, VerificationSource } from '@/types/erfassung'
import { ERFASSUNG_PROMPTS, fillPromptTemplate } from '@/lib/ai/config/prompts'
import { callWithFallback } from '@/lib/ai/providers'
import { KATEGORIEN } from '@/config/erfassung/categories'
import { OLLAMA_URL } from '@/config/urls'

const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2'

// =============================================================================
// VERIFICATION SOURCES
// =============================================================================

/**
 * Manufacturer spec page URLs
 */
const MANUFACTURER_SPEC_URLS: Record<string, (product: string) => string> = {
  apple: (product) => {
    const searchQuery = encodeURIComponent(product)
    return `https://support.apple.com/de-ch/search?q=${searchQuery}`
  },
  dell: (product) => {
    const searchQuery = encodeURIComponent(product)
    return `https://www.dell.com/support/home/de-ch/product-support/servicetag-lookup/${searchQuery}`
  },
  lenovo: (product) => {
    const searchQuery = encodeURIComponent(product)
    return `https://pcsupport.lenovo.com/ch/de/search?query=${searchQuery}`
  },
  hp: (product) => {
    const searchQuery = encodeURIComponent(product)
    return `https://support.hp.com/ch-de/search?q=${searchQuery}`
  },
  microsoft: (product) => {
    const searchQuery = encodeURIComponent(product)
    return `https://support.microsoft.com/de-ch/search/results?query=${searchQuery}`
  },
  asus: (product) => {
    const searchQuery = encodeURIComponent(product)
    return `https://www.asus.com/ch-de/support/search/?searchType=product&searchKey=${searchQuery}`
  },
  acer: (product) => {
    const searchQuery = encodeURIComponent(product)
    return `https://www.acer.com/ch-de/support/product-search?text=${searchQuery}`
  },
}

/**
 * Swiss marketplace search URLs for price comparison
 */
const SWISS_MARKETPLACES = [
  {
    name: 'Ricardo.ch',
    baseUrl: 'https://www.ricardo.ch/de/s/',
    buildUrl: (query: string) => `https://www.ricardo.ch/de/s/${encodeURIComponent(query)}`,
    type: 'marketplace' as const,
  },
  {
    name: 'tutti.ch',
    baseUrl: 'https://www.tutti.ch/de/q/',
    buildUrl: (query: string) => `https://www.tutti.ch/de/q/${encodeURIComponent(query)}`,
    type: 'marketplace' as const,
  },
  {
    name: 'Revendo.ch',
    baseUrl: 'https://www.revendo.ch/search?q=',
    buildUrl: (query: string) => `https://www.revendo.ch/search?q=${encodeURIComponent(query)}`,
    type: 'marketplace' as const,
  },
]

/**
 * Tech review/specs sites
 */
const TECH_REVIEW_SITES = [
  {
    name: 'Notebookcheck',
    buildUrl: (query: string) => `https://www.notebookcheck.com/Search.8222.0.html?q=${encodeURIComponent(query)}`,
    type: 'review' as const,
  },
  {
    name: 'Geizhals.ch',
    buildUrl: (query: string) => `https://geizhals.ch/?fs=${encodeURIComponent(query)}`,
    type: 'price' as const,
  },
]

/**
 * Generate verification sources for extracted product data
 */
export function generateVerificationSources(
  data: VoiceProductData
): { fieldSources: Record<string, VerificationSource[]>; allSources: VerificationSource[] } {
  const fieldSources: Record<string, VerificationSource[]> = {}
  const allSources: VerificationSource[] = []
  const searchQuery = `${data.hersteller} ${data.produktname}`.trim()

  // 1. Manufacturer specs source (for hersteller, produktname, specs)
  const herstellerLower = data.hersteller?.toLowerCase() || ''
  const manufacturerUrlBuilder = MANUFACTURER_SPEC_URLS[herstellerLower]

  if (manufacturerUrlBuilder && data.produktname) {
    const manufacturerSource: VerificationSource = {
      title: `${data.hersteller} Support`,
      url: manufacturerUrlBuilder(data.produktname),
      type: 'manufacturer',
      relevance: 0.95,
    }

    fieldSources.hersteller = [manufacturerSource]
    fieldSources.produktname = [manufacturerSource]
    fieldSources.specs = [manufacturerSource]
    allSources.push(manufacturerSource)
  }

  // 2. Swiss marketplace sources (for verkaufspreis)
  const priceeSources: VerificationSource[] = []
  for (const marketplace of SWISS_MARKETPLACES) {
    const source: VerificationSource = {
      title: marketplace.name,
      url: marketplace.buildUrl(searchQuery),
      type: marketplace.type,
      relevance: 0.85,
    }
    priceeSources.push(source)
    allSources.push(source)
  }
  fieldSources.verkaufspreis = priceeSources

  // 3. Tech review sources (for specs, kurzbeschreibung)
  const reviewSources: VerificationSource[] = []
  for (const site of TECH_REVIEW_SITES) {
    const source: VerificationSource = {
      title: site.name,
      url: site.buildUrl(searchQuery),
      type: site.type,
      relevance: 0.8,
    }
    reviewSources.push(source)
    allSources.push(source)
  }

  // Add review sources to specs and description
  fieldSources.specs = [...(fieldSources.specs || []), ...reviewSources.filter(s => s.type === 'review')]
  fieldSources.kurzbeschreibung = reviewSources.filter(s => s.type === 'review')

  return { fieldSources, allSources }
}

/**
 * Fast regex-based fallback parser for when Ollama is slow/unavailable
 * Extracts product info directly from text using pattern matching
 */
function fastParseProductText(text: string): VoiceProductData {
  const textLower = text.toLowerCase()

  // Known manufacturers
  const manufacturers = ['dell', 'hp', 'lenovo', 'apple', 'asus', 'acer', 'microsoft', 'samsung', 'thinkpad', 'macbook']
  const hersteller = manufacturers.find(m => textLower.includes(m)) || ''

  // Extract model name (words after manufacturer, typically alphanumeric)
  const modelMatch = text.match(/(?:latitude|thinkpad|elitebook|probook|macbook|surface|inspiron|xps|pavilion)\s*[\w\-]+/i)
  const produktname = modelMatch ? modelMatch[0] : text.split(/\s+/).slice(0, 3).join(' ')

  // Extract specs
  const specs: Array<{key: string, value: string}> = []

  // CPU
  const cpuMatch = text.match(/i[357]\s*[-]?\s*\d{4,5}[a-z]?|ryzen\s*\d|m[123]\s*(pro|max)?|core\s*\d/i)
  if (cpuMatch) specs.push({ key: 'CPU', value: cpuMatch[0] })

  // RAM
  const ramMatch = text.match(/(\d+)\s*gb\s*(ram)?/i)
  if (ramMatch) specs.push({ key: 'RAM', value: `${ramMatch[1]} GB` })

  // Storage
  const storageMatch = text.match(/(\d+)\s*gb\s*(ssd|hdd|nvme)|(\d+)\s*tb/i)
  if (storageMatch) {
    const size = storageMatch[1] || storageMatch[3]
    const unit = storageMatch[3] ? 'TB' : 'GB'
    const type = storageMatch[2]?.toUpperCase() || 'SSD'
    specs.push({ key: 'Speicher', value: `${size} ${unit} ${type}` })
  }

  // Price - look for number with currency indicator, or standalone price-like number at end
  // Must have currency indicator OR be a reasonable price (50-9999) not followed by GB/SSD/etc
  const priceWithCurrency = text.match(/(\d{2,4})\s*(chf|franken|fr\.?|sfr|.-)/i)
  const priceAtEnd = text.match(/\b(\d{2,4})\s*$/i) // number at end of string
  const verkaufspreis = priceWithCurrency ? priceWithCurrency[1]
    : (priceAtEnd && parseInt(priceAtEnd[1]) >= 50 && parseInt(priceAtEnd[1]) <= 9999) ? priceAtEnd[1]
    : ''

  // Condition
  let zustand = 'good'
  if (textLower.includes('neu') && !textLower.includes('wie neu')) zustand = 'new'
  else if (textLower.includes('wie neu')) zustand = 'like_new'
  else if (textLower.includes('gut')) zustand = 'good'
  else if (textLower.includes('akzeptabel') || textLower.includes('fair')) zustand = 'fair'
  else if (textLower.includes('schlecht')) zustand = 'poor'

  // Category - default to laptops (values derived from KATEGORIEN SSOT)
  const catLaptops = KATEGORIEN.find(k => k.label === 'Laptops')!
  const catDesktops = KATEGORIEN.find(k => k.label === 'Desktop PCs')!
  const catMonitors = KATEGORIEN.find(k => k.label === 'Monitore')!

  const hauptkategorie = textLower.includes('monitor') ? catMonitors.value
    : textLower.includes('desktop') || textLower.includes('pc') ? catDesktops.value
    : catLaptops.value

  const subBusiness = catLaptops.subs.find(s => s.label === 'Business Laptops')?.value || ''
  const subConsumer = catLaptops.subs.find(s => s.label === 'Consumer Laptops')?.value || ''
  const subGaming = catLaptops.subs.find(s => s.label === 'Gaming Laptops')?.value || ''

  const unterkategorie = hauptkategorie === catLaptops.value
    ? (textLower.includes('gaming') ? subGaming : textLower.includes('business') || textLower.includes('latitude') || textLower.includes('thinkpad') ? subBusiness : subConsumer)
    : ''

  // Customer profiles based on product type
  const kundenprofile: string[] = []
  if (textLower.includes('thinkpad') || textLower.includes('latitude') || textLower.includes('elitebook')) {
    kundenprofile.push('buero', 'dev')
  }
  if (textLower.includes('gaming')) kundenprofile.push('gamer')
  if (kundenprofile.length === 0) kundenprofile.push('buero', 'student')

  return {
    hersteller: hersteller.charAt(0).toUpperCase() + hersteller.slice(1),
    produktname,
    kurzbeschreibung: `${hersteller} ${produktname} - gebrauchtes Gerät in gutem Zustand`,
    specs,
    verkaufspreis,
    zustand,
    hauptkategorie,
    unterkategorie,
    kundenprofile,
  }
}

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
 * Calculate confidence scores for extracted fields based on input analysis
 * Higher confidence if the field was explicitly mentioned in input
 * Also attaches verification sources to each field
 */
function calculateFieldConfidence(
  inputText: string,
  data: VoiceProductData,
  sourceType: 'voice' | 'text' | 'image',
  modelName: string = OLLAMA_MODEL
): { metadata: AIFieldMetadata; allSources: VerificationSource[] } {
  const timestamp = Date.now()
  const inputLower = inputText.toLowerCase()

  // Generate verification sources
  const { fieldSources, allSources } = generateVerificationSources(data)

  // Helper to check if a value was likely mentioned in input
  const wasExplicitlyMentioned = (value: string): boolean => {
    if (!value) return false
    const valueLower = value.toLowerCase()
    const words = valueLower.split(/\s+/).filter(w => w.length > 2)
    return words.some(word => inputLower.includes(word))
  }

  // Helper to create source with confidence and verification links
  const createSource = (confidence: number, fieldName: string): AIFieldSource => ({
    type: sourceType,
    inputText,
    confidence,
    model: modelName,
    timestamp,
    sources: fieldSources[fieldName] || [],
  })

  const metadata: AIFieldMetadata = {}

  if (data.hersteller) {
    const mentioned = wasExplicitlyMentioned(data.hersteller)
    metadata.hersteller = createSource(mentioned ? 0.95 : 0.7, 'hersteller')
  }
  if (data.produktname) {
    const mentioned = wasExplicitlyMentioned(data.produktname)
    metadata.produktname = createSource(mentioned ? 0.9 : 0.6, 'produktname')
  }
  if (data.kurzbeschreibung) {
    metadata.kurzbeschreibung = createSource(0.75, 'kurzbeschreibung')
  }
  if (data.specs?.length) {
    const specsConfidence = ['ram', 'gb', 'ssd', 'cpu', 'i5', 'i7', 'ghz', 'core'].some(
      kw => inputLower.includes(kw)
    ) ? 0.85 : 0.5
    metadata.specs = createSource(specsConfidence, 'specs')
  }
  if (data.verkaufspreis) {
    const pricePattern = /\d+\s*(chf|franken|fr|sfr|.-)?/i
    const priceMatch = inputLower.match(pricePattern)
    metadata.verkaufspreis = createSource(priceMatch ? 0.9 : 0.4, 'verkaufspreis')
  }
  if (data.zustand) {
    const conditionKeywords = ['neu', 'new', 'gut', 'good', 'gebraucht', 'used', 'zustand', 'condition']
    const mentioned = conditionKeywords.some(kw => inputLower.includes(kw))
    metadata.zustand = createSource(mentioned ? 0.85 : 0.5, 'zustand')
  }
  if (data.hauptkategorie) {
    metadata.hauptkategorie = createSource(0.8, 'hauptkategorie')
  }
  if (data.unterkategorie) {
    metadata.unterkategorie = createSource(0.7, 'unterkategorie')
  }
  if (data.kundenprofile?.length) {
    metadata.kundenprofile = createSource(0.6, 'kundenprofile')
  }

  return { metadata, allSources }
}

/**
 * Extract structured product data from text using AI
 * Uses centralized callWithFallback (Groq → OpenRouter → Ollama).
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
 * Analyze an image using Ollama vision model
 * Falls back to text extraction if vision model not available
 *
 * @param imageBase64 - Base64 encoded image
 * @returns Structured product data or error
 */
export async function extractProductFromImage(
  imageBase64: string
): Promise<ExtractProductResult> {
  // Use llama3.2-vision if available, otherwise return error
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
