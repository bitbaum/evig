/**
 * API: Hirn AI Providers
 *
 * GET /api/admin/hirn/providers
 * List available AI providers and their status.
 *
 * PATCH /api/admin/hirn/providers
 * Update provider settings (set default, enable/disable).
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { canAccessSection } from '@/lib/permissions'
import { getProviderSettings, setDefaultProvider, createProvider } from '@/lib/hirn/providers'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = {
      email: session.user.email,
      is_staff: session.user.isStaff,
      staff_permissions: session.user.staffPermissions,
      is_super_admin: session.user.isSuperAdmin,
    }

    if (!canAccessSection(user, 'hirn')) {
      return NextResponse.json(
        { error: 'No permission to access Hirn' },
        { status: 403 }
      )
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

    return NextResponse.json({
      success: true,
      data: providersWithStatus,
    })
  } catch (error) {
    logger.error('Hirn providers error', { error })
    return NextResponse.json(
      { error: 'Failed to get providers' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = {
      email: session.user.email,
      is_staff: session.user.isStaff,
      staff_permissions: session.user.staffPermissions,
      is_super_admin: session.user.isSuperAdmin,
    }

    if (!canAccessSection(user, 'hirn')) {
      return NextResponse.json(
        { error: 'No permission to access Hirn' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { provider, isDefault } = body

    if (!provider) {
      return NextResponse.json(
        { error: 'Provider is required' },
        { status: 400 }
      )
    }

    // Check if provider is available before setting as default
    const settings = await getProviderSettings('system')
    const providerSettings = settings.find(s => s.provider === provider)

    if (!providerSettings) {
      return NextResponse.json(
        { error: 'Provider not found' },
        { status: 404 }
      )
    }

    if (!providerSettings.is_enabled) {
      return NextResponse.json(
        { error: 'Provider is not enabled' },
        { status: 400 }
      )
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
        return NextResponse.json(
          { error: `Provider ${provider} ist nicht verfügbar. Prüfe API-Key oder Ollama-Status.` },
          { status: 400 }
        )
      }
    } catch (err) {
      return NextResponse.json(
        { error: `Provider ${provider} konnte nicht geprüft werden` },
        { status: 400 }
      )
    }

    if (isDefault) {
      await setDefaultProvider(provider as 'groq' | 'ollama' | 'openai' | 'openrouter', 'system')
    }

    logger.info('Provider updated', { provider, isDefault, userId: session.user.id })

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Hirn provider update error', { error })
    return NextResponse.json(
      { error: 'Failed to update provider' },
      { status: 500 }
    )
  }
}
