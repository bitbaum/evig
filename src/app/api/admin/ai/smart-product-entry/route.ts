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
import { apiError, apiSuccess } from '@/lib/api/helpers'
import { logger } from '@/lib/logger'
import { GroqProvider } from '@/lib/hirn/providers/groq'

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

const SYSTEM_PROMPT = `Du bist ein Experte für IT-Hardware, insbesondere für gebrauchte Business-Laptops, Desktop-PCs und Monitore.

Wenn der Benutzer ein Produkt nennt (z.B. "Dell Latitude e7470" oder "ThinkPad T480"), identifiziere das genaue Produkt und liefere detaillierte Informationen.

Antworte NUR mit validem JSON im folgenden Format:
{
  "title": "Voller Produktname mit Hersteller",
  "handle": "url-freundlicher-slug",
  "description": "Ausführliche deutsche Produktbeschreibung für Schweizer Markt (2-3 Sätze)",
  "price": "geschätzter Preis in CHF für gebrauchtes Gerät in gutem Zustand (nur Zahl)",
  "category": "Kategorie (Laptops, Desktop PCs, Monitore, Zubehör, Server, Netzwerk, Software)",
  "sku": "Hersteller-Modellnummer",
  "specs": [
    { "key": "CPU", "value": "Prozessor-Details" },
    { "key": "RAM", "value": "Arbeitsspeicher" },
    { "key": "Speicher", "value": "SSD/HDD Kapazität" },
    { "key": "Display", "value": "Bildschirmgrösse und Auflösung" },
    { "key": "Baujahr", "value": "Erscheinungsjahr" }
  ],
  "tags": ["relevante", "suchbegriffe"],
  "condition": "good"
}

Wichtige Regeln:
- Preise sind für den Schweizer Gebrauchtmarkt (CHF), basierend auf typischen refurbished Preisen
- Business-Laptops (Latitude, ThinkPad, EliteBook) sind wertvoller als Consumer-Geräte
- Beschreibung auf Deutsch für Schweizer Kunden
- Wenn du das genaue Modell nicht kennst, nutze dein Wissen über ähnliche Modelle
- Handle muss URL-freundlich sein (kleinbuchstaben, bindestriche)`

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    const { query, inputType = 'text' } = await request.json()

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return apiError(
        new Error('Query required'),
        'Bitte gib einen Produktnamen ein',
        400
      )
    }

    const trimmedQuery = query.trim()

    logger.info('Smart product entry request', {
      query: trimmedQuery,
      inputType,
    })

    // Initialize Groq provider
    const groq = new GroqProvider()
    const isAvailable = await groq.isAvailable()

    if (!isAvailable) {
      logger.error('Groq provider not available')
      return apiError(
        new Error('AI service unavailable'),
        'KI-Service nicht verfügbar. Bitte GROQ_API_KEY konfigurieren.',
        503
      )
    }

    // Call Groq for product lookup
    const response = await groq.chat({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Produkt: ${trimmedQuery}` },
      ],
      temperature: 0.3,
      maxTokens: 1024,
    })

    const processingTime = Date.now() - startTime

    // Parse JSON from response
    const responseText = response.content
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)

    if (!jsonMatch) {
      logger.error('No JSON in Groq response', { response: responseText })
      return apiError(
        new Error('Invalid AI response'),
        'Konnte Produktdaten nicht extrahieren',
        500
      )
    }

    let productData: ProductFormData
    try {
      productData = JSON.parse(jsonMatch[0])
    } catch (parseError) {
      logger.error('JSON parse error', { error: parseError, json: jsonMatch[0] })
      return apiError(
        new Error('JSON parse error'),
        'Fehler beim Verarbeiten der KI-Antwort',
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
      model: response.model,
    })

    return apiSuccess({
      product: productData,
      metadata: {
        query: trimmedQuery,
        inputType,
        processingTime,
        model: response.model,
        provider: response.provider,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    logger.error('Smart product entry error', { error: message })

    // Handle rate limiting
    if (message.includes('rate') || message.includes('429')) {
      return apiError(
        error,
        'Zu viele Anfragen. Bitte warte einen Moment.',
        429
      )
    }

    return apiError(error, 'Fehler bei der Produkterkennung')
  }
}
