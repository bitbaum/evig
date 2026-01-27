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
import { auth } from '@/auth'
import { canAccessSection } from '@/lib/permissions'
import { getProviderSettings, setDefaultProvider, createProvider } from '@/lib/hirn/providers'
import { logger } from '@/lib/logger'
import { apiSuccess, apiError, apiUnauthorized, apiForbidden, apiBadRequest, apiNotFound } from '@/lib/api/helpers'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return apiUnauthorized()
    }

    const user = {
      email: session.user.email,
      is_staff: session.user.isStaff,
      staff_permissions: session.user.staffPermissions,
      is_super_admin: session.user.isSuperAdmin,
    }

    if (!canAccessSection(user, 'hirn')) {
      return apiForbidden('Keine Berechtigung für Hirn')
    }

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
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return apiUnauthorized()
    }

    const user = {
      email: session.user.email,
      is_staff: session.user.isStaff,
      staff_permissions: session.user.staffPermissions,
      is_super_admin: session.user.isSuperAdmin,
    }

    if (!canAccessSection(user, 'hirn')) {
      return apiForbidden('Keine Berechtigung für Hirn')
    }

    const body = await request.json()
    const { provider, isDefault } = body

    if (!provider) {
      return apiBadRequest('Provider ist erforderlich')
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

    // Check availability
    try {
      const providerInstance = createProvider(provider as 'groq' | 'ollama' | 'openai' | 'openrouter', {
        apiKey: providerSettings.settings.api_key,
        baseUrl: providerSettings.settings.base_url,
        model: providerSettings.settings.model,
      })
      const isAvailable = await providerInstance.isAvailable()

      if (!isAvailable) {
        return apiBadRequest(`Provider ${provider} ist nicht verfügbar. Prüfe API-Key oder Ollama-Status.`)
      }
    } catch (err) {
      return apiBadRequest(`Provider ${provider} konnte nicht geprüft werden`)
    }

    if (isDefault) {
      await setDefaultProvider(provider as 'groq' | 'ollama' | 'openai' | 'openrouter', 'system')
    }

    logger.info('Provider updated', { provider, isDefault, userId: session.user.id })

    return apiSuccess({ message: 'Provider aktualisiert' })
  } catch (error) {
    return apiError(error, 'Provider konnte nicht aktualisiert werden')
  }
}
