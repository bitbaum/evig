/**
 * API: Initialize Hirn AI Tables
 *
 * POST /api/admin/hirn/init
 * Creates the hirn_provider_settings table and seeds default providers.
 * Only super admins can run this.
 */

import { NextRequest } from 'next/server'
import { withAdmin } from '@/lib/api/middleware'
import { db } from '@/db'
import { sql } from 'drizzle-orm'
import { hirnProviderSettings } from '@/db/schema/hirn'
import { logger } from '@/lib/logger'
import { OLLAMA_URL } from '@/config/urls'
import { apiSuccess, apiError } from '@/lib/api/helpers'

export const POST = withAdmin('hirn', async (request: NextRequest, session) => {
  try {
    // Create provider settings table (DDL — must use raw SQL)
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS hirn_provider_settings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        scope TEXT NOT NULL DEFAULT 'system',
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        provider TEXT NOT NULL,
        is_enabled BOOLEAN DEFAULT true,
        is_default BOOLEAN DEFAULT false,
        settings JSONB DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(scope, user_id, provider),
        CHECK (scope = 'system' OR user_id IS NOT NULL)
      )
    `)

    // Create indexes
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_hirn_provider_settings_scope
      ON hirn_provider_settings(scope)
    `)
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_hirn_provider_settings_user_id
      ON hirn_provider_settings(user_id)
    `)

    // Insert default providers (Groq as default)
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
