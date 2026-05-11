/**
 * API: Initialize Hirn AI Tables
 *
 * POST /api/admin/hirn/init
 * Seeds default Hirn AI providers.
 *
 * Schema ownership lives in Drizzle schema + migrations. This route must not
 * create or mutate tables; it only inserts default data.
 * Only super admins can run this.
 */

import { NextRequest } from 'next/server'
import { withAdmin } from '@/lib/api/middleware'
import { db } from '@/db'
import { hirnProviderSettings } from '@/db/schema/hirn'
import { logger } from '@/lib/logger'
import { OLLAMA_URL } from '@/config/urls'
import { apiSuccess, apiError } from '@/lib/api/helpers'

export const POST = withAdmin('hirn', async (request: NextRequest, session) => {
  try {
    // Insert default providers (Groq as default).
    await db.insert(hirnProviderSettings).values({
      scope: 'system',
      provider: 'groq',
      isEnabled: true,
      isDefault: true,
      settings: {
        model: 'llama-3.3-70b-versatile',
        description: 'Free tier, fast inference',
      },
    }).onConflictDoNothing()

    // Insert Ollama (for local development)
    await db.insert(hirnProviderSettings).values({
      scope: 'system',
      provider: 'ollama',
      isEnabled: true,
      isDefault: false,
      settings: {
        base_url: OLLAMA_URL,
        model: 'llama3.2',
        embedding_model: 'nomic-embed-text',
        description: 'Self-hosted, privacy-focused',
      },
    }).onConflictDoNothing()

    // Insert OpenRouter
    await db.insert(hirnProviderSettings).values({
      scope: 'system',
      provider: 'openrouter',
      isEnabled: true,
      isDefault: false,
      settings: {
        model: 'meta-llama/llama-3.3-70b-instruct',
        description: 'Pay-per-token, many models available',
      },
    }).onConflictDoNothing()

    logger.info('Hirn AI initialized', { userId: session.user.id })

    return apiSuccess({ message: 'Hirn AI erfolgreich initialisiert' })
  } catch (error) {
    logger.error('Failed to initialize Hirn', { error })
    return apiError(error, 'Hirn konnte nicht initialisiert werden')
  }
})
