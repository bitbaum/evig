/**
 * API: Hirn AI Providers
 *
 * GET /api/admin/hirn/providers
 * List available AI providers and their status.
 *
 * PATCH /api/admin/hirn/providers
 * Update provider settings (set default, enable/disable).
 */

import { NextRequest } from 'next/server'
import { withAdmin } from '@/lib/api/middleware'
import { getProviderSettings, setDefaultProvider, createProvider, updateProviderSettings, type ProviderName } from '@/lib/hirn/providers'
import { logger } from '@/lib/logger'
import { apiSuccess, apiError, apiBadRequest, apiNotFound } from '@/lib/api/helpers'

export const GET = withAdmin(async (request: NextRequest) => {
  try {
    // Get system settings and check availability
    const settings = await getProviderSettings('system')

    const providersWithStatus = await Promise.all(
      settings.map(async (s) => {
        let isAvailable = false
        try {
          const provider = createProvider(s.provider, {
            apiKey: s.settings.api_key,
            baseUrl: s.settings.base_url,
            model: s.settings.model,
          })
          isAvailable = await provider.isAvailable()
        } catch {
          isAvailable = false
        }

        return {
          provider: s.provider,
          isEnabled: s.is_enabled,
          isDefault: s.is_default,
          model: s.settings.model || 'default',
          description: s.settings.description,
          isAvailable,
        }
      })
    )

    return apiSuccess(providersWithStatus)
  } catch (error) {
    return apiError(error, 'Provider konnten nicht geladen werden')
  }
})

export const PATCH = withAdmin(async (request: NextRequest, session) => {
  try {
    const body = await request.json()
    const { provider, isDefault, apiKey } = body

    if (!provider) {
      return apiBadRequest('Provider ist erforderlich')
    }

    if (apiKey !== undefined && typeof apiKey !== 'string') {
      return apiBadRequest('apiKey muss ein String sein')
    }

    // Check if provider is available before setting as default
    const settings = await getProviderSettings('system')
    const providerSettings = settings.find(s => s.provider === provider)

    if (!providerSettings) {
      return apiNotFound('Provider')
    }

    if (!providerSettings.is_enabled) {
      return apiBadRequest('Provider ist nicht aktiviert')
    }

    const effectiveApiKey = apiKey !== undefined
      ? apiKey.trim()
      : (providerSettings.settings.api_key || '')

    // Check availability
    try {
      const providerInstance = createProvider(provider as ProviderName, {
        apiKey: effectiveApiKey,
        baseUrl: providerSettings.settings.base_url,
        model: providerSettings.settings.model,
      })
      const isAvailable = await providerInstance.isAvailable()

      if (!isAvailable) {
        return apiBadRequest(`Provider ${provider} ist nicht verfügbar. Prüfe API-Key oder Ollama-Status.`)
      }
    } catch (_err) {
      return apiBadRequest(`Provider ${provider} konnte nicht geprüft werden`)
    }

    if (apiKey !== undefined) {
      await updateProviderSettings(
        provider as ProviderName,
        { api_key: effectiveApiKey || undefined },
        'system'
      )
    }

    if (isDefault) {
      await setDefaultProvider(provider as ProviderName, 'system')
    }

    logger.info('Provider updated', {
      provider,
      isDefault,
      hasApiKeyUpdate: apiKey !== undefined,
      userId: session.user.id,
    })

    return apiSuccess({ message: 'Provider aktualisiert' })
  } catch (error) {
    return apiError(error, 'Provider konnte nicht aktualisiert werden')
  }
})
