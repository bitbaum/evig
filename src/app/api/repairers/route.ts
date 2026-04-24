// Legacy endpoint — thin proxy to /api/technicians?tier=professional
// Kept for backwards compatibility. Remaps response shape for existing callers.
import { NextRequest } from 'next/server'
import { GET as techniciansGET } from '@/app/api/technicians/route'
import { apiError } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    const inbound = new URL(request.url)
    const target = new URL(inbound)
    target.pathname = '/api/technicians'
    // Forward all inbound params, then force tier
    target.search = inbound.search
    target.searchParams.set('tier', 'professional')

    const proxied = new NextRequest(target, { headers: request.headers })
    const response = await techniciansGET(proxied)
    const body = await response.json() as Record<string, unknown>

    // Remap { technicians } → { repairers } for backwards compatibility
    // Forward cache headers from the proxied technicians response
    const cacheControl = response.headers.get('Cache-Control')
    const { technicians, ...rest } = body
    return Response.json(
      { repairers: technicians ?? [], ...rest },
      {
        status: response.status,
        headers: cacheControl ? { 'Cache-Control': cacheControl } : undefined,
      }
    )
  } catch (error) {
    logger.error('Error in legacy /api/repairers proxy', { error })
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
}
