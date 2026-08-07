/**
 * Form Assist API
 *
 * POST /api/ai/form-assist
 *
 * One route for every AI-assisted form in the app. Adding assistance to a new
 * form means adding it to AI_FORMS — nothing here changes.
 *
 * The field registry stays server-side on purpose: the client names a form,
 * never the fields, so it cannot widen what the model is allowed to write.
 *
 * Auth required — staff only, same as the other advisors.
 */

import { createFormAssistHandler } from '@fleet/ai-forms/server'
import { auth } from '@/auth'
import { callWithFallback } from '@/lib/ai/providers'
import { AI_FORMS } from '@/config/ai-forms'

export const POST = createFormAssistHandler({
  targets: AI_FORMS,

  authorize: async () => {
    const session = await auth()
    return session?.user?.email
      ? { ok: true }
      : { ok: false, status: 401, error: 'Nicht angemeldet.' }
  },

  // Reuses the app's own provider chain, so form assistance inherits the
  // existing key handling, fallback order and timeouts rather than adding a
  // second policy to keep in sync.
  complete: async ({ system, prompt, maxTokens, temperature }) => {
    const result = await callWithFallback({
      systemPrompt: system,
      userPrompt: prompt,
      maxTokens,
      temperature,
    })
    if (!result) {
      throw new Error('Kein KI-Anbieter verfügbar.')
    }
    return result.text
  },

  // Deliberately NOT wrapped in the house { success, data } envelope. This
  // route has exactly one client — useAiForm — and the hook reads the
  // AssistResult shape directly (`result.ok`, `result.values`). Wrapping it
  // typechecks fine and breaks at runtime, because the hook would see an
  // object with no `ok` and report every successful call as a failure.
})
