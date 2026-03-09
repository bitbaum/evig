/**
 * API: Hirn AI Providers
 *
 * GET /api/admin/hirn/providers
 * List available AI providers and their status.
 *
 * PATCH /api/admin/hirn/providers
 * Update provider settings (set default, enable/disable, store API key).
 */

import { NextRequest } from 'next/server'
import { withAdmin } from '@/lib/api/middleware'
import {
  getProviderSettings,
  setDefaultProvider,
  createProvider,
  updateProviderSettings,
  setProviderEnabled,
  type ProviderName,
} from '@/lib/hirn/providers'
import { logger } from '@/lib/logger'
import { apiSuccess, apiError, apiBadRequest, apiNotFound } from '@/lib/api/helpers'
import { validateBody, HirnProviderUpdateSchema } from '@/lib/schemas'

export const GET = withAdmin('hirn', async (_request: NextRequest) => {
  try {
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

export const PATCH = withAdmin('hirn', async (request: NextRequest, session) => {
  try {
    const body = await request.json()
    const validation = validateBody(HirnProviderUpdateSchema, body)
    if (!validation.success) return validation.error
    const { provider, isDefault, apiKey, isEnabled } = validation.data

    const settings = await getProviderSettings('system')
    const providerSettings = settings.find((s) => s.provider === provider)
    if (!providerSettings) {
      return apiNotFound('Provider')
    }

    const providerName = provider as ProviderName
    const effectiveApiKey = apiKey !== undefined
      ? apiKey.trim()
      : (providerSettings.settings.api_key || '')

    if (apiKey !== undefined) {
      await updateProviderSettings(
        providerName,
        { api_key: effectiveApiKey || undefined },
        'system'
      )
    }

    if (isEnabled !== undefined) {
      await setProviderEnabled(providerName, isEnabled, 'system')
    }

    const enabledForDefault = isEnabled ?? providerSettings.is_enabled
    if (isDefault) {
      if (!enabledForDefault) {
        return apiBadRequest('Ein deaktivierter Provider kann nicht Standard sein')
      }

      try {
        const providerInstance = createProvider(providerName, {
          apiKey: effectiveApiKey,
          baseUrl: providerSettings.settings.base_url,
          model: providerSettings.settings.model,
        })
        const available = await providerInstance.isAvailable()

        if (!available) {
          return apiBadRequest(`Provider ${provider} ist nicht verfügbar. Prüfe API-Key oder Ollama-Status.`)
        }
      } catch {
        return apiBadRequest(`Provider ${provider} konnte nicht geprüft werden`)
      }

      await setDefaultProvider(providerName, 'system')
    }

    logger.info('Provider updated', {
      provider,
      isDefault,
      isEnabled,
      hasApiKeyUpdate: apiKey !== undefined,
      userId: session.user.id,
    })

    return apiSuccess({ message: 'Provider aktualisiert' })
  } catch (error) {
    return apiError(error, 'Provider konnte nicht aktualisiert werden')
  }
})
