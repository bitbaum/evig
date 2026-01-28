/**
 * API: Initialize Hirn AI Tables
 *
 * POST /api/admin/hirn/init
 * Creates the hirn_provider_settings table and seeds default providers.
 * Only super admins can run this.
 */

import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { isSuperAdmin } from '@/lib/permissions'
import { query } from '@/lib/auth/db'
import { logger } from '@/lib/logger'
import { apiSuccess, apiError, apiUnauthorized, apiForbidden } from '@/lib/api/helpers'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return apiUnauthorized()
    }

    if (!isSuperAdmin(session.user.email)) {
      return apiForbidden('Nur Super-Admins können Hirn initialisieren')
    }

    // Create provider settings table
    await query(`
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
    await query(`
      CREATE INDEX IF NOT EXISTS idx_hirn_provider_settings_scope
      ON hirn_provider_settings(scope)
    `)
    await query(`
      CREATE INDEX IF NOT EXISTS idx_hirn_provider_settings_user_id
      ON hirn_provider_settings(user_id)
    `)

    // Insert default providers (Groq as default)
    await query(`
      INSERT INTO hirn_provider_settings (scope, provider, is_enabled, is_default, settings)
      VALUES ('system', 'groq', true, true, $1::jsonb)
      ON CONFLICT (scope, user_id, provider) DO NOTHING
    `, [JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      description: 'Free tier, fast inference'
    })])

    // Insert Ollama (for local development)
    await query(`
      INSERT INTO hirn_provider_settings (scope, provider, is_enabled, is_default, settings)
      VALUES ('system', 'ollama', true, false, $1::jsonb)
      ON CONFLICT (scope, user_id, provider) DO NOTHING
    `, [JSON.stringify({
      base_url: 'http://localhost:11434',
      model: 'llama3.2',
      embedding_model: 'nomic-embed-text',
      description: 'Self-hosted, privacy-focused'
    })])

    // Insert OpenRouter
    await query(`
      INSERT INTO hirn_provider_settings (scope, provider, is_enabled, is_default, settings)
      VALUES ('system', 'openrouter', true, false, $1::jsonb)
      ON CONFLICT (scope, user_id, provider) DO NOTHING
    `, [JSON.stringify({
      model: 'meta-llama/llama-3.3-70b-instruct',
      description: 'Pay-per-token, many models available'
    })])

    logger.info('Hirn AI initialized', { userId: session.user.id })

    return apiSuccess({ message: 'Hirn AI erfolgreich initialisiert' })
  } catch (error) {
    logger.error('Failed to initialize Hirn', { error })
    return apiError(error, 'Hirn konnte nicht initialisiert werden')
  }
}
