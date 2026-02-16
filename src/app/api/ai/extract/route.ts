/**
 * AI Form Extraction API
 *
 * POST /api/ai/extract
 * Universal endpoint for AI-powered form field extraction.
 * Dispatches to form-specific prompts via FORM_AI_REGISTRY.
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { z } from 'zod'
import { logger } from '@/lib/logger'
import { registryExtract, type ExtractMode } from '@/lib/ai/extract'
import { FORM_AI_REGISTRY } from '@/lib/ai/config/prompts'
import { isStaffEmail } from '@/lib/permissions'

const VALID_FORM_TYPES = Object.keys(FORM_AI_REGISTRY)

const extractRequestSchema = z.object({
  formType: z.string().refine(v => VALID_FORM_TYPES.includes(v), {
    message: `Gültiger formType erforderlich: ${VALID_FORM_TYPES.join(', ')}`,
  }),
  text: z.string().min(3, 'Text zu kurz').max(5000, 'Text zu lang'),
  mode: z.enum(['extract', 'generate', 'refine']).optional(),
  currentData: z.record(z.string(), z.unknown()).optional(),
  instruction: z.string().max(2000).optional(),
  quickAction: z.string().max(100).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { success: false, error: 'Ungültiger JSON-Body' },
        { status: 400 }
      )
    }

    const result = extractRequestSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: 'Ungültige Anfrage', details: result.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { formType, text, mode, currentData, instruction, quickAction } = result.data

    // Check auth level from registry
    const config = FORM_AI_REGISTRY[formType]
    if (config.auth === 'staff' && !isStaffEmail(session.user.email || '')) {
      return NextResponse.json(
        { success: false, error: 'Nur für Staff-Mitglieder verfügbar' },
        { status: 403 }
      )
    }

    logger.info('AI extraction requested', {
      formType,
      mode: mode || 'extract',
      textLength: text.length,
      userId: session.user.id,
    })

    const EXTRACT_TIMEOUT_MS = 45_000
    const extractionResult = await Promise.race([
      registryExtract({
        formType,
        text,
        mode: mode as ExtractMode,
        currentData,
        instruction,
        quickAction,
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Zeitüberschreitung')), EXTRACT_TIMEOUT_MS)
      ),
    ])

    return NextResponse.json(extractionResult)
  } catch (error) {
    logger.error('AI extraction error', { error })
    return NextResponse.json(
      { success: false, error: 'Fehler bei der KI-Extraktion' },
      { status: 500 }
    )
  }
}
