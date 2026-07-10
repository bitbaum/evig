/**
 * API: Voice-to-Product Erfassung
 *
 * POST /api/admin/erfassung/voice — accepts an audio file, transcribes it, and
 * returns structured product data. The pipeline lives in
 * `@/lib/erfassung/voice-to-product` (shared with the intake voice route).
 */

import { withAdmin } from '@/lib/api/middleware'
import { voiceToProductResponse } from '@/lib/erfassung/voice-to-product'

export const POST = withAdmin('products', voiceToProductResponse)
