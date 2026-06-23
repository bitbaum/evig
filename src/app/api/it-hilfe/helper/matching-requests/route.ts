/**
 * @deprecated Removed — use GET /api/it-hilfe/requests?matchMySkills=true
 */
import type { NextRequest } from 'next/server'
import { deprecatedApiEndpoint } from '@/lib/api/deprecated-endpoint'

export async function GET(_request: NextRequest) {
  return deprecatedApiEndpoint(
    '/api/it-hilfe/helper/matching-requests',
    '/api/it-hilfe/requests?matchMySkills=true',
  )
}
