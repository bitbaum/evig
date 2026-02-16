import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { withAdmin } from '@/lib/api/middleware'
import { apiSuccess, apiError, apiNotFound } from '@/lib/api/helpers'
import { logger } from '@/lib/logger'
import { CMS_CONFIG } from '@/config/cms'

export const dynamic = 'force-dynamic'

const REBOOT_CONTENT_URL = CMS_CONFIG.URL
const ENABLE_CMS = CMS_CONFIG.ENABLED

export const GET = withAdmin<{ id: string }>(async (request, session, context) => {
  const { id } = context!.params!
  try {
    if (!ENABLE_CMS) {
      return apiError(new Error('CMS is disabled'), 'CMS is disabled', 501)
    }
    const cookieStore = await cookies()

    // Forward to Reboot Content API
    const response = await fetch(`${REBOOT_CONTENT_URL}/api/content/static-pages/${id}`, {
      headers: {
        'Authorization': `Bearer ${cookieStore.get('admin_token')?.value}`,
      },
    })

    if (!response.ok) {
      return apiNotFound('Page')
    }

    const data = await response.json()
    return apiSuccess(data)
  } catch (error) {
    return apiError(error, error instanceof Error ? error.message : 'Internal server error')
  }
})

export const PUT = withAdmin<{ id: string }>(async (request, session, context) => {
  const { id } = context!.params!
  try {
    if (!ENABLE_CMS) {
      return apiError(new Error('CMS is disabled'), 'CMS is disabled', 501)
    }
    const body = await request.json()
    const cookieStore = await cookies()

    // Forward to Reboot Content API
    const response = await fetch(`${REBOOT_CONTENT_URL}/api/content/static-pages/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${cookieStore.get('admin_token')?.value}`,
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorData = await response.json()
      return apiError(
        new Error(errorData.error || 'Failed to update page'),
        errorData.error || 'Failed to update page',
        response.status
      )
    }

    const data = await response.json()
    return apiSuccess(data)
  } catch (error) {
    return apiError(error, error instanceof Error ? error.message : 'Internal server error')
  }
})
