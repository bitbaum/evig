import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { mkdir, writeFile } from 'fs/promises'
import path from 'path'
import { apiError, apiSuccess, apiUnauthorized, apiBadRequest } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'

export const dynamic = 'force-dynamic'

// POST /api/uploads
// Accepts multipart/form-data with one or more image files under field name "files"
// Stores locally under public/uploads/<userId>/ and returns public URLs
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return apiUnauthorized(ERROR_MESSAGES.UNAUTHORIZED)
    }

    const formData = await req.formData()
    // Support either multiple files under 'files' or any file inputs
    const files: File[] = []
    for (const [key, value] of formData.entries()) {
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
    const timestamp = Date.now()

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      // Basic validation: only images up to ~10 MB
      const isImage = file.type?.startsWith('image/')
      if (!isImage) {
        return apiBadRequest('Nur Bilddateien sind erlaubt')
      }

      const maxSize = 10 * 1024 * 1024 // 10 MB
      if (file.size > maxSize) {
        return apiBadRequest('Datei zu gross (max 10MB)')
      }

      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      const safeName = (file.name || `image_${i}`).replace(/[^a-zA-Z0-9_.-]/g, '_')
      const ext = path.extname(safeName) || '.jpg'
      const base = path.basename(safeName, ext)
      const fileName = `${base}_${timestamp}_${i}${ext}`
      const filePath = path.join(uploadBaseDir, fileName)

      await writeFile(filePath, buffer)

      // Public URL from /public folder
      const publicUrl = `/uploads/${encodeURIComponent(session.user.id)}/${encodeURIComponent(fileName)}`
      urls.push(publicUrl)
    }

    return apiSuccess({ urls })
  } catch (error) {
    return apiError(error, 'Upload fehlgeschlagen')
  }
}

