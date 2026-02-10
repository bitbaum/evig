/**
 * AI Form Extraction API
 *
 * POST /api/ai/extract
 * Generic endpoint for AI-powered form field extraction.
 * Dispatches to form-specific extraction services based on formType.
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { z } from 'zod'
import { logger } from '@/lib/logger'
import { extractITHilfeFromText } from '@/lib/it-hilfe/ai-extraction'

const extractRequestSchema = z.object({
  formType: z.enum(['erfassung', 'it-hilfe']),
  text: z.string().min(3, 'Text zu kurz').max(2000, 'Text zu lang'),
})

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }

    const body = await request.json()
    const result = extractRequestSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: 'Ungültige Anfrage', details: result.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { formType, text } = result.data

    logger.info('AI extraction requested', {
      formType,
      textLength: text.length,
      userId: session.user.id,
    })

    if (formType === 'it-hilfe') {
      const extractionResult = await extractITHilfeFromText(text)
      return NextResponse.json(extractionResult)
    }

    // erfassung uses its own dedicated routes (voice/text/image)
    return NextResponse.json(
      { success: false, error: 'Erfassung nutzt eigene API-Routen' },
      { status: 400 }
    )
  } catch (error) {
    logger.error('AI extraction error', { error })
    return NextResponse.json(
      { success: false, error: 'Fehler bei der KI-Extraktion' },
      { status: 500 }
    )
  }
}
