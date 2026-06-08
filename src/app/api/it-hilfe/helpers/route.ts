/**
 * @deprecated Orphaned — zero src/ callers as of QQQ.3. Legacy proxy
 * forwarding to /api/technicians?tier=community with response remap
 * (technicians → helpers). New code should call /api/technicians
 * directly with the tier query param. Tracked in docs/DEAD_CODE.md.
 */
import { NextRequest } from 'next/server'
import { GET as techniciansGET } from '@/app/api/technicians/route'
import { apiError } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { logger } from '@/lib/logger'
import { REPAIRER_PROFILE_TIER } from '@/config/repairer-status'

export async function GET(request: NextRequest) {
  try {
    const inbound = new URL(request.url)
    const target = new URL(inbound)
    target.pathname = '/api/technicians'
    // Forward all inbound params, then force tier
    target.search = inbound.search
    target.searchParams.set('tier', REPAIRER_PROFILE_TIER.COMMUNITY)

    const proxied = new NextRequest(target, { headers: request.headers })
    const response = await techniciansGET(proxied)
    const body = await response.json() as Record<string, unknown>

    // Remap { technicians, pagination } → { helpers, total, pagination }
    const { technicians, pagination, ...rest } = body as {
      technicians: unknown[]
      pagination: { total?: number } | undefined
      [key: string]: unknown
    }
    // Forward the cache headers from the proxied technicians response
    const cacheControl = response.headers.get('Cache-Control')
    return Response.json(
      {
        helpers: technicians ?? [],
        total: pagination?.total ?? 0,
        pagination,
        ...rest,
      },
      {
        status: response.status,
        headers: cacheControl ? { 'Cache-Control': cacheControl } : undefined,
      }
    )
  } catch (error) {
    logger.error('Error in legacy /api/it-hilfe/helpers proxy', { error })
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
}
