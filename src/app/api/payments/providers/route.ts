/**
 * GET /api/payments/providers — rails offerable to the customer right now.
 *
 * The payment method picker calls this. `?escrow=1` filters to escrow-capable
 * rails (P2P marketplace needs holds). In production only configured rails are
 * returned, so the picker auto-hides until a second rail goes live.
 */

import { NextRequest } from 'next/server'
import { apiSuccess, apiError } from '@/lib/api/helpers'
import { getAvailableProviders } from '@/config/payment-providers'

export async function GET(request: NextRequest) {
  try {
    const requireEscrow = request.nextUrl.searchParams.get('escrow') === '1'
    const providers = getAvailableProviders({ requireEscrow }).map((p) => ({
      slug: p.slug,
      label: p.label,
      descriptionKey: p.descriptionKey,
      supportsEscrow: p.supportsEscrow,
    }))
    return apiSuccess({ providers })
  } catch (error) {
    return apiError(error, 'Failed to load payment providers')
  }
}
