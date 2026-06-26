/**
 * Document upload — PDF CVs for job applications (reuses object storage path).
 */

import { uploadImageBuffer } from '@/lib/storage/image-upload'
import { logger } from '@/lib/logger'

const CV_MAX_BYTES = 5 * 1024 * 1024

export async function uploadCvBuffer(
  buffer: Buffer,
  filename: string,
): Promise<{ success: true; storageKey: string; url: string } | { success: false; error: string }> {
  if (buffer.length > CV_MAX_BYTES) {
    return { success: false, error: 'Datei zu gross (max. 5 MB)' }
  }

  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_')
  const result = await uploadImageBuffer(buffer, safeName, 'hr-cvs', {
    contentType: 'application/pdf',
    cacheControl: 'private, max-age=31536000',
  })

  if (!result.success || !result.url) {
    return { success: false, error: result.error ?? 'Upload fehlgeschlagen' }
  }

  const storageKey = `hr-cvs/${safeName}`
  logger.info('CV uploaded', { storageKey, size: buffer.length })
  return { success: true, storageKey, url: result.url }
}
