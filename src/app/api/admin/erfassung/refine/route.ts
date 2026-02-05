/**
 * API: AI Product Data Refinement
 *
 * POST /api/admin/erfassung/refine
 * Refines existing product data using AI based on instructions.
 */

import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { canAccessSection } from '@/lib/permissions'
import { logger } from '@/lib/logger'
import { apiSuccess, apiError, apiUnauthorized, apiForbidden, apiBadRequest } from '@/lib/api/helpers'
import { ERFASSUNG_PROMPTS, fillPromptTemplate } from '@/lib/ai/config/prompts'

const GROQ_API_KEY = process.env.GROQ_API_KEY || ''
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_MODEL = 'llama-3.3-70b-versatile'

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

interface RefineRequest {
  currentProduct: ProductData
  instruction: string
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return apiUnauthorized()
    }

    // Check erfassung permission
    const user = {
      email: session.user.email,
      is_staff: session.user.isStaff,
      staff_permissions: session.user.staffPermissions,
      is_super_admin: session.user.isSuperAdmin,
    }

    if (!canAccessSection(user, 'dashboard')) {
      return apiForbidden('Keine Berechtigung für Produktbearbeitung')
    }

    const body: RefineRequest = await request.json()
    const { currentProduct, instruction } = body

    if (!currentProduct || !instruction) {
      return apiBadRequest('currentProduct und instruction sind erforderlich')
    }

    if (!GROQ_API_KEY) {
      return apiError(
        new Error('AI-Service nicht konfiguriert'),
        'KI-Service nicht verfügbar. Bitte GROQ_API_KEY konfigurieren.',
        503
      )
    }

    // Format current product as JSON string for the prompt
    const currentProductJson = JSON.stringify(currentProduct, null, 2)

    // Build the refinement prompt
    const userPrompt = fillPromptTemplate(ERFASSUNG_PROMPTS.refine, {
      currentProduct: currentProductJson,
      instruction: instruction,
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
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 2048,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      logger.error('Groq API error', { status: response.status, error: errorText })
      return apiError(
        new Error(`AI API error: ${response.status}`),
        'Fehler bei der KI-Verarbeitung. Bitte versuchen Sie es erneut.'
      )
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      return apiError(
        new Error('Empty AI response'),
        'Keine Antwort vom KI-Service erhalten'
      )
    }

    // Parse the JSON response
    let refined: RefinedProductData
    try {
      // Extract JSON from response (handle potential markdown wrapping)
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found in response')
      }

      const parsed = JSON.parse(jsonMatch[0])

      refined = {
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
    } catch (parseError) {
      logger.error('Failed to parse AI response', {
        content: content.substring(0, 500),
        error: parseError instanceof Error ? parseError.message : 'Unknown parse error'
      })
      return apiError(
        new Error('Invalid AI response format'),
        'Fehler beim Verarbeiten der KI-Antwort. Bitte versuchen Sie es erneut.'
      )
    }

    logger.info('Product data refined with AI', {
      instruction: instruction.substring(0, 100),
      userId: session.user.id,
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
}
