/**
 * AI Form Extraction API
 *
 * POST /api/ai/extract
 * Universal endpoint for AI-powered form field extraction.
 * Dispatches to form-specific prompts via FORM_AI_REGISTRY.
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAuth, ValidSession } from '@/lib/api/middleware'
import { z } from 'zod'
import { logger } from '@/lib/logger'
import { apiBadRequest, apiForbidden, apiError } from '@/lib/api/helpers'
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

export const POST = withAuth(async (request: NextRequest, session: ValidSession) => {
  try {
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return apiBadRequest('Ungültiger JSON-Body')
    }

    const result = extractRequestSchema.safeParse(body)

    if (!result.success) {
      return apiBadRequest('Ungültige Anfrage', result.error.flatten().fieldErrors)
    }

    const { formType, text, mode, currentData, instruction, quickAction } = result.data

    // Check auth level from registry
    const config = FORM_AI_REGISTRY[formType]
    if (config.auth === 'staff' && !isStaffEmail(session.user.email || '')) {
      return apiForbidden('Nur für Staff-Mitglieder verfügbar')
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

    // Return extraction result directly — it already has { success, data, model, confidence }
    // Don't wrap with apiSuccess() which would double-nest: { success, data: { success, data, ... } }
    return NextResponse.json(extractionResult)
  } catch (error) {
    return apiError(error, 'Fehler bei der KI-Extraktion')
  }
})
