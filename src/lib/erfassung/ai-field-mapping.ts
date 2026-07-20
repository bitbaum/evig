/**
 * AI Field Mapping — Maps AI-extracted fields to the product form schema.
 *
 * Handles:
 * - Confidence scoring for each extracted field
 * - Verification source generation (manufacturer specs, Swiss marketplaces, tech reviews)
 * - Field-level source attachment for UI verification links
 *
 * Pure data transformation — no AI calls, no side effects.
 */

import type { VoiceProductData, AIFieldSource, AIFieldMetadata, VerificationSource } from '@/types/erfassung'

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
 * Generate verification sources for extracted product data.
 * Returns per-field sources and a flat list of all sources.
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
 * Calculate confidence scores for extracted fields based on input analysis.
 * Higher confidence if the field was explicitly mentioned in input.
 * Also attaches verification sources to each field.
 */
export function calculateFieldConfidence(
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
    // Verbatim match first — covers short brands/models ("HP", "LG", "T450")
    // that the >2-char word filter below would otherwise drop, mis-scoring an
    // obviously-present value as a low-confidence guess.
    if (inputLower.includes(valueLower)) return true
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
