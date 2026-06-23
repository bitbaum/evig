import { NextRequest } from 'next/server'
import { withAuth } from '@/lib/api/middleware'
import path from 'path'
import sharp from 'sharp'
import { apiError, apiSuccess, apiBadRequest } from '@/lib/api/helpers'
import { FILE_SIZE_LIMITS } from '@/config/limits'
import { MARKETPLACE_LIMITS } from '@/config/marketplace'
import { logger } from '@/lib/logger'
import { uploadImageBuffer } from '@/lib/storage/image-upload'

export const dynamic = 'force-dynamic'

interface ImageUrls {
  original: string
  thumbnail: string
  medium: string
}

// POST /api/uploads
// Accepts multipart/form-data with one or more image files under field name "files"
// Stores in configured object storage (Cloudflare R2 in production), with a
// local public/uploads fallback for development, and returns public URLs.
// Generates optimized thumbnail (200x200) and medium (800x600) versions as webp
export const POST = withAuth(async (request, session) => {
  try {
    const formData = await request.formData()
    // Support either multiple files under 'files' or any file inputs
    const files: File[] = []
    for (const [, value] of formData.entries()) {
      if (value instanceof File) {
        files.push(value)
      }
    }

    if (files.length === 0) {
      return apiBadRequest('Keine Dateien hochgeladen')
    }

    if (files.length > MARKETPLACE_LIMITS.MAX_IMAGES) {
      return apiBadRequest(`Maximal ${MARKETPLACE_LIMITS.MAX_IMAGES} Bilder erlaubt`)
    }

    const urls: string[] = []
    const imageUrls: ImageUrls[] = []
    const timestamp = Date.now()
    const userPath = encodeURIComponent(session.user.id)

    const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

    for (let i = 0; i < files.length; i++) {
      const file = files[i]

      // Strict MIME type allowlist — no SVG (XSS vector)
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        return apiBadRequest('Nur JPEG, PNG, WebP und GIF sind erlaubt')
      }

      if (file.size > FILE_SIZE_LIMITS.UPLOAD_MAX) {
        return apiBadRequest('Datei zu gross (max 10MB)')
      }

      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      // Re-check size on the actual buffer — file.size is reported by the
      // browser and can be spoofed or wrong for streamed/chunked uploads.
      if (buffer.byteLength > FILE_SIZE_LIMITS.UPLOAD_MAX) {
        return apiBadRequest('Datei zu gross (max 10MB)')
      }
      const safeName = (file.name || `image_${i}`).replace(/[^a-zA-Z0-9_.-]/g, '_')
      const ext = path.extname(safeName).toLowerCase() || '.jpg'
      const base = path.basename(safeName, ext)

      // Block double extensions (e.g. file.jpg.exe)
      if (/\.[a-zA-Z]{2,}\./i.test(safeName)) {
        return apiBadRequest('Dateinamen mit mehreren Erweiterungen sind nicht erlaubt')
      }

      // Block non-image extensions even if MIME type passed
      const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif']
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        return apiBadRequest('Nur JPEG, PNG, WebP und GIF sind erlaubt')
      }
      const fileName = `${base}_${timestamp}_${i}${ext}`
      // Decode once before storing. This rejects files whose browser MIME and
      // extension claim to be an image but whose bytes are not an image.
      await sharp(buffer).metadata()

      const folder = `users/${userPath}`
      const originalUpload = await uploadImageBuffer(buffer, fileName, folder, {
        contentType: file.type,
      })
      if (!originalUpload.success || !originalUpload.url) {
        throw new Error(originalUpload.error || 'Originalbild konnte nicht gespeichert werden')
      }
      const originalUrl = originalUpload.url
      urls.push(originalUrl)

      // Generate optimized versions
      const thumbName = `${base}_${timestamp}_${i}_thumb.webp`
      const mediumName = `${base}_${timestamp}_${i}_medium.webp`

      try {
        // Thumbnail: 200x200, cover crop
        const thumbnail = await sharp(buffer)
          .resize(200, 200, { fit: 'cover' })
          .webp({ quality: 80 })
          .toBuffer()

        // Medium: 800x600, fit inside
        const medium = await sharp(buffer)
          .resize(800, 600, { fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 85 })
          .toBuffer()

        const [thumbUpload, mediumUpload] = await Promise.all([
          uploadImageBuffer(thumbnail, thumbName, folder, { contentType: 'image/webp' }),
          uploadImageBuffer(medium, mediumName, folder, { contentType: 'image/webp' }),
        ])
        if (!thumbUpload.success || !thumbUpload.url || !mediumUpload.success || !mediumUpload.url) {
          throw new Error('Optimierte Bildgrössen konnten nicht gespeichert werden')
        }

        imageUrls.push({
          original: originalUrl,
          thumbnail: thumbUpload.url,
          medium: mediumUpload.url,
        })
      } catch (err) {
        logger.warn('Image optimization failed, using original', { fileName, error: err })
        imageUrls.push({
          original: originalUrl,
          thumbnail: originalUrl,
          medium: originalUrl,
        })
      }
    }

    return apiSuccess({ urls, images: imageUrls })
  } catch (error) {
    return apiError(error, 'Upload fehlgeschlagen')
  }
})
