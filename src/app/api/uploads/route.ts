import { NextRequest } from 'next/server'
import { withAuth } from '@/lib/api/middleware'
import { mkdir, writeFile } from 'fs/promises'
import path from 'path'
import sharp from 'sharp'
import { apiError, apiSuccess, apiBadRequest } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

interface ImageUrls {
  original: string
  thumbnail: string
  medium: string
}

// POST /api/uploads
// Accepts multipart/form-data with one or more image files under field name "files"
// Stores locally under public/uploads/<userId>/ and returns public URLs
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

    if (files.length > 5) {
      return apiBadRequest('Maximal 5 Bilder erlaubt')
    }

    const uploadBaseDir = path.join(process.cwd(), 'public', 'uploads', session.user.id)
    await mkdir(uploadBaseDir, { recursive: true })

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

      const maxSize = 10 * 1024 * 1024 // 10 MB
      if (file.size > maxSize) {
        return apiBadRequest('Datei zu gross (max 10MB)')
      }

      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
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
      const filePath = path.join(uploadBaseDir, fileName)

      // Save original
      await writeFile(filePath, buffer)

      const originalUrl = `/uploads/${userPath}/${encodeURIComponent(fileName)}`
      urls.push(originalUrl)

      // Generate optimized versions
      const thumbName = `${base}_${timestamp}_${i}_thumb.webp`
      const mediumName = `${base}_${timestamp}_${i}_medium.webp`

      try {
        // Thumbnail: 200x200, cover crop
        await sharp(buffer)
          .resize(200, 200, { fit: 'cover' })
          .webp({ quality: 80 })
          .toFile(path.join(uploadBaseDir, thumbName))

        // Medium: 800x600, fit inside
        await sharp(buffer)
          .resize(800, 600, { fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 85 })
          .toFile(path.join(uploadBaseDir, mediumName))

        imageUrls.push({
          original: originalUrl,
          thumbnail: `/uploads/${userPath}/${encodeURIComponent(thumbName)}`,
          medium: `/uploads/${userPath}/${encodeURIComponent(mediumName)}`,
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
