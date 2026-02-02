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

// AI Provider configuration - prefer Groq (cloud) over Ollama (local)
const GROQ_API_KEY = process.env.GROQ_API_KEY || ''
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_MODEL = 'llama-3.3-70b-versatile'

// Ollama fallback for local development
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434'
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2'
const AI_TIMEOUT_MS = 15000 // 15 second timeout

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

  // Category - default to laptops
  const hauptkategorie = textLower.includes('monitor') ? '30'
    : textLower.includes('desktop') || textLower.includes('pc') ? '20'
    : '10'

  const unterkategorie = hauptkategorie === '10'
    ? (textLower.includes('gaming') ? '103' : textLower.includes('business') || textLower.includes('latitude') || textLower.includes('thinkpad') ? '101' : '102')
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
    kurzbeschreibung: `${hersteller} ${produktname} - gebrauchtes Geraet in gutem Zustand`,
    specs,
    verkaufspreis,
    zustand,
    hauptkategorie,
    unterkategorie,
    kundenprofile,
  }
}

// Product form structure for Ollama to fill
export const PRODUCT_SCHEMA = `{
  "hersteller": "manufacturer name (Dell, Lenovo, HP, Apple, etc.)",
  "produktname": "product model name",
  "kurzbeschreibung": "short German description of the product",
  "specs": [
    { "key": "CPU", "value": "processor model" },
    { "key": "RAM", "value": "memory amount" },
    { "key": "Speicher", "value": "storage type and size" },
    { "key": "Display", "value": "screen size and resolution" }
  ],
  "verkaufspreis": "price in CHF as number only",
  "zustand": "one of: new, like_new, good, fair, poor",
  "hauptkategorie": "10 for Laptops, 20 for Desktop PCs, 30 for Monitors, 40 for Peripherals",
  "unterkategorie": "101 for Business Laptops, 102 for Consumer, 103 for Gaming",
  "kundenprofile": ["suitable profiles: oma, buero, chiller, gamer, kreativ, dev, student"],
  "bemerkungen": "any additional notes about condition or features"
}`

const OLLAMA_PROMPT = `Du bist ein Assistent für die Produkterfassung bei RevampIT, einem Schweizer Non-Profit für gebrauchte IT-Geräte.

Der Benutzer hat folgendes eingegeben:
"{TEXT}"

Extrahiere die Produktinformationen und fülle folgendes JSON-Schema aus. Wenn Informationen fehlen, nutze sinnvolle Standardwerte basierend auf dem Produkttyp.

Schema:
${PRODUCT_SCHEMA}

Wichtige Regeln:
- Preise in CHF ohne Währungssymbol
- Zustand mappen: "gut" -> "good", "wie neu" -> "like_new", "neu" -> "new", "akzeptabel" -> "fair", "schlecht" -> "poor"
- Bei Laptops: Kategorien 10 (Hauptkategorie) und 101/102/103 (Unterkategorie je nach Typ)
- Kundenprofile basierend auf Gerät wählen (z.B. ThinkPad -> buero, dev; Gaming Laptop -> gamer)
- Beschreibung auf Deutsch
- Specs basierend auf bekanntem Modell ergänzen falls nicht genannt

Antworte NUR mit dem ausgefüllten JSON, keine Erklärungen.`

export interface ExtractionResult {
  success: true
  data: VoiceProductData
  metadata: AIFieldMetadata
  sourceType: 'voice' | 'text' | 'image'
  inputText: string
  model: string
  verificationSources?: VerificationSource[] // Links for admin to verify AI-generated data
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
  sourceType: 'voice' | 'text' | 'image'
): { metadata: AIFieldMetadata; allSources: VerificationSource[] } {
  const timestamp = Date.now()
  const model = OLLAMA_MODEL
  const inputLower = inputText.toLowerCase()

  // Generate verification sources
  const { fieldSources, allSources } = generateVerificationSources(data)

  // Helper to check if a value was likely mentioned in input
  const wasExplicitlyMentioned = (value: string): boolean => {
    if (!value) return false
    const valueLower = value.toLowerCase()
    // Check for exact match or partial match of significant words
    const words = valueLower.split(/\s+/).filter(w => w.length > 2)
    return words.some(word => inputLower.includes(word))
  }

  // Helper to create source with confidence and verification links
  const createSource = (confidence: number, fieldName: string): AIFieldSource => ({
    type: sourceType,
    inputText,
    confidence,
    model,
    timestamp,
    sources: fieldSources[fieldName] || [],
  })

  const metadata: AIFieldMetadata = {}

  // Hersteller - high confidence if brand name mentioned
  if (data.hersteller) {
    const mentioned = wasExplicitlyMentioned(data.hersteller)
    metadata.hersteller = createSource(mentioned ? 0.95 : 0.7, 'hersteller')
  }

  // Produktname - high confidence if model number/name mentioned
  if (data.produktname) {
    const mentioned = wasExplicitlyMentioned(data.produktname)
    metadata.produktname = createSource(mentioned ? 0.9 : 0.6, 'produktname')
  }

  // Kurzbeschreibung - lower confidence as it's generated
  if (data.kurzbeschreibung) {
    metadata.kurzbeschreibung = createSource(0.75, 'kurzbeschreibung')
  }

  // Specs - check each spec for confidence
  if (data.specs?.length) {
    // Check if common spec keywords mentioned
    const specsConfidence = ['ram', 'gb', 'ssd', 'cpu', 'i5', 'i7', 'ghz', 'core'].some(
      kw => inputLower.includes(kw)
    ) ? 0.85 : 0.5
    metadata.specs = createSource(specsConfidence, 'specs')
  }

  // Verkaufspreis - high if number mentioned with currency indicators
  if (data.verkaufspreis) {
    const pricePattern = /\d+\s*(chf|franken|fr|sfr|.-)?/i
    const priceMatch = inputLower.match(pricePattern)
    metadata.verkaufspreis = createSource(priceMatch ? 0.9 : 0.4, 'verkaufspreis')
  }

  // Zustand - check for condition keywords
  if (data.zustand) {
    const conditionKeywords = ['neu', 'new', 'gut', 'good', 'gebraucht', 'used', 'zustand', 'condition']
    const mentioned = conditionKeywords.some(kw => inputLower.includes(kw))
    metadata.zustand = createSource(mentioned ? 0.85 : 0.5, 'zustand')
  }

  // Categories - medium confidence as often inferred
  if (data.hauptkategorie) {
    metadata.hauptkategorie = createSource(0.8, 'hauptkategorie')
  }
  if (data.unterkategorie) {
    metadata.unterkategorie = createSource(0.7, 'unterkategorie')
  }

  // Kundenprofile - lower confidence as it's AI-inferred
  if (data.kundenprofile?.length) {
    metadata.kundenprofile = createSource(0.6, 'kundenprofile')
  }

  return { metadata, allSources }
}

/**
 * Try Groq (cloud) API for extraction
 */
async function tryGroqExtraction(
  text: string,
  sourceType: 'voice' | 'text' | 'image'
): Promise<ExtractProductResult | null> {
  if (!GROQ_API_KEY) {
    logger.info('Groq API key not configured, skipping cloud AI')
    return null
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), AI_TIMEOUT_MS)

  try {
    logger.info('Sending text to Groq for extraction', {
      textLength: text.length,
      model: GROQ_MODEL,
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
          {
            role: 'system',
            content: `Du bist ein Assistent für die Produkterfassung bei RevampIT, einem Schweizer Non-Profit für gebrauchte IT-Geräte. Extrahiere Produktinformationen und antworte NUR mit JSON.`,
          },
          {
            role: 'user',
            content: `Extrahiere die Produktinformationen aus folgendem Text und fülle das JSON-Schema aus:\n\nText: "${text.trim()}"\n\nSchema:\n${PRODUCT_SCHEMA}\n\nWichtige Regeln:\n- Preise in CHF ohne Währungssymbol\n- Zustand: "gut" -> "good", "wie neu" -> "like_new", "neu" -> "new"\n- Bei Laptops: Kategorien 10 (Hauptkategorie)\n- Beschreibung auf Deutsch\n\nAntworte NUR mit dem JSON, keine Erklärungen.`,
          },
        ],
        temperature: 0.3,
        max_tokens: 1024,
      }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorText = await response.text()
      logger.warn('Groq API error', { status: response.status, error: errorText })
      return null
    }

    const groqResult = await response.json()
    const responseText = groqResult.choices?.[0]?.message?.content || ''

    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      logger.warn('No JSON in Groq response', { response: responseText })
      return null
    }

    const productData = JSON.parse(jsonMatch[0]) as VoiceProductData
    const { metadata, allSources } = calculateFieldConfidence(text, productData, sourceType)

    logger.info('Groq extraction successful', {
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
      model: GROQ_MODEL,
      verificationSources: allSources,
    }
  } catch (error) {
    clearTimeout(timeoutId)
    const message = error instanceof Error ? error.message : 'unknown'
    logger.warn('Groq extraction failed', { error: message })
    return null
  }
}

/**
 * Try Ollama (local) API for extraction
 */
async function tryOllamaExtraction(
  text: string,
  sourceType: 'voice' | 'text' | 'image'
): Promise<ExtractProductResult | null> {
  const prompt = OLLAMA_PROMPT.replace('{TEXT}', text.trim())
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), AI_TIMEOUT_MS)

  try {
    logger.info('Sending text to Ollama for extraction', {
      textLength: text.length,
      model: OLLAMA_MODEL,
    })

    const response = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt,
        stream: false,
        options: {
          temperature: 0.3,
          num_predict: 500,
        },
      }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      return null
    }

    const ollamaResult = await response.json()
    const responseText = ollamaResult.response

    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return null
    }

    const productData = JSON.parse(jsonMatch[0]) as VoiceProductData
    const { metadata, allSources } = calculateFieldConfidence(text, productData, sourceType)

    logger.info('Ollama extraction successful', {
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
      model: OLLAMA_MODEL,
      verificationSources: allSources,
    }
  } catch (error) {
    clearTimeout(timeoutId)
    return null
  }
}

/**
 * Extract structured product data from text using AI
 * Priority: Groq (cloud) -> Ollama (local) -> Fast regex parser (fallback)
 *
 * @param text - Raw text input (from voice, typing, or OCR)
 * @param sourceType - Where the text came from (voice transcription, direct text, or image OCR)
 * @returns Structured product data with confidence metadata or error
 */
export async function extractProductFromText(
  text: string,
  sourceType: 'voice' | 'text' | 'image' = 'text'
): Promise<ExtractProductResult> {
  if (!text || text.trim() === '') {
    return { success: false, error: 'Kein Text zum Verarbeiten' }
  }

  // 1. Try Groq (cloud) first - works for all users
  const groqResult = await tryGroqExtraction(text, sourceType)
  if (groqResult) {
    return groqResult
  }

  // 2. Try Ollama (local) as fallback for development
  const ollamaResult = await tryOllamaExtraction(text, sourceType)
  if (ollamaResult) {
    return ollamaResult
  }

  // 3. Fall back to fast regex-based parser
  logger.warn('All AI providers failed, using fast parser', {
    text: text.substring(0, 50),
    hasGroqKey: !!GROQ_API_KEY,
  })

  const productData = fastParseProductText(text)
  const { metadata, allSources } = calculateFieldConfidence(text, productData, sourceType)

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
- Geschätzer Preis für Schweizer Markt (CHF)

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
