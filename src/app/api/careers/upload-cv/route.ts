/**
 * POST /api/careers/upload-cv — guest + logged-in CV upload (PDF only)
 */

import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { apiSuccess, apiBadRequest, apiError } from '@/lib/api/helpers'
import { uploadCvBuffer } from '@/lib/storage/document-upload'
import { rateLimiters, getClientIdentifier } from '@/lib/security/rate-limit'
import { isE2ETestAccountEmail } from '@/config/e2e-test-accounts'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

const ALLOWED = ['application/pdf']

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    const email = session?.user?.email ?? getClientIdentifier(request)
    const rateKey = `${email}:cv-upload`

    if (
      !isE2ETestAccountEmail(session?.user?.email ?? '') &&
      !rateLimiters.jobApplicationCreate(rateKey)
    ) {
      return apiBadRequest('Zu viele Uploads. Bitte versuche es später erneut.')
    }

    const formData = await request.formData()
    const file = formData.get('file')
    if (!(file instanceof File)) {
      return apiBadRequest('Keine Datei hochgeladen')
    }

    if (!ALLOWED.includes(file.type)) {
      return apiBadRequest('Nur PDF-Dateien sind erlaubt')
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const timestamp = Date.now()
    const filename = `${timestamp}-${file.name}`

    const result = await uploadCvBuffer(buffer, filename)
    if (!result.success) {
      return apiBadRequest(result.error)
    }

    return apiSuccess({ storage_key: result.storageKey, url: result.url })
  } catch (error) {
    logger.error('CV upload failed', { error })
    return apiError(error, 'Upload fehlgeschlagen')
  }
}
