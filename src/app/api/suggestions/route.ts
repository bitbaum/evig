import { apiSuccess, apiError } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    return apiSuccess({ received: body })
  } catch (e) {
    return apiError(e, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
}

export const dynamic = 'force-dynamic'



