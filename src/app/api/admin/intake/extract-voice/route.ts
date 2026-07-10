/**
 * Intake Voice Extraction API
 *
 * POST /api/admin/intake/extract-voice — accepts an audio file, transcribes it,
 * and returns structured product data. Same pipeline as the erfassung voice
 * route; shared in `@/lib/erfassung/voice-to-product`.
 */

import { withAdmin } from '@/lib/api/middleware'
import { voiceToProductResponse } from '@/lib/erfassung/voice-to-product'

export const POST = withAdmin('intake', voiceToProductResponse)
