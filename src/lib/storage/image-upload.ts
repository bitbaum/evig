/**
 * Image Upload Utility
 *
 * Production: any S3-compatible object storage via the AWS S3 SDK
 * (Cloudflare R2 or Hetzner Object Storage). Development: local filesystem
 * (public/uploads) when S3 isn't configured, so `next dev` works without creds.
 *
 * Required runtime env (set in /opt/revampit/app/.env on the box):
 *   S3_ENDPOINT           R2:      https://<ACCOUNT_ID>.r2.cloudflarestorage.com
 *                         Hetzner: https://fsn1.your-objectstorage.com
 *   S3_REGION             R2: auto (default) · Hetzner: fsn1
 *   S3_BUCKET             e.g. revampit-media
 *   S3_ACCESS_KEY_ID / S3_SECRET_ACCESS_KEY
 *   S3_PUBLIC_URL         public base URL for objects, e.g.
 *                         R2: https://pub-<hash>.r2.dev  (or a custom domain)
 * Optional:
 *   S3_ACL                'public-read' (default) — set to 'none' for R2, which
 *                         has no object ACLs (public access is a bucket setting).
 *   S3_FORCE_PATH_STYLE   'true' if a bucket/endpoint needs path-style.
 */

import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { logger } from '@/lib/logger'
import fs from 'fs'
import path from 'path'

interface UploadResult {
  success: boolean
  url?: string
  error?: string
}

// Read env dynamically (not at module load) so config can be set late and is
// testable. publicUrl has any trailing slash stripped.
function storageEnv() {
  return {
    endpoint: process.env.S3_ENDPOINT,
    region: process.env.S3_REGION || 'auto',
    bucket: process.env.S3_BUCKET,
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    publicUrl: process.env.S3_PUBLIC_URL?.replace(/\/$/, ''),
  }
}

/** True when object storage is fully configured (production path). */
export function isStorageConfigured(): boolean {
  const e = storageEnv()
  return Boolean(e.endpoint && e.bucket && e.accessKeyId && e.secretAccessKey && e.publicUrl)
}

let _s3: S3Client | null = null
function s3(): S3Client {
  if (!_s3) {
    const e = storageEnv()
    _s3 = new S3Client({
      endpoint: e.endpoint,
      region: e.region,
      credentials: { accessKeyId: e.accessKeyId!, secretAccessKey: e.secretAccessKey! },
      // Hetzner Object Storage works with virtual-hosted style; flip via env if
      // a particular bucket/endpoint needs path-style.
      forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
    })
  }
  return _s3
}

function decodeBase64(base64Data: string): { buffer: Buffer; contentType: string } {
  const base64Content = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data
  const buffer = Buffer.from(base64Content, 'base64')
  let contentType = 'image/jpeg'
  if (base64Data.startsWith('data:')) {
    const match = base64Data.match(/data:([^;]+);/)
    if (match) contentType = match[1]
  }
  return { buffer, contentType }
}

/**
 * Upload a base64 image. Returns a public URL or an error.
 * @param folder e.g. "products" / "listings"
 */
export async function uploadImage(
  base64Data: string,
  filename: string,
  folder: string = 'products',
): Promise<UploadResult> {
  const key = `${folder}/${filename}`

  try {
    const { buffer, contentType } = decodeBase64(base64Data)

    if (isStorageConfigured()) {
      const e = storageEnv()
      // R2 has no object-level ACLs (public access is a bucket setting) — set
      // S3_ACL=none there to omit the header. Hetzner keeps 'public-read'.
      const acl = process.env.S3_ACL === 'none' ? undefined : process.env.S3_ACL || 'public-read'
      await s3().send(
        new PutObjectCommand({
          Bucket: e.bucket,
          Key: key,
          Body: buffer,
          ContentType: contentType,
          ...(acl ? { ACL: acl as 'public-read' } : {}),
          CacheControl: 'public, max-age=31536000, immutable',
        }),
      )
      const url = `${e.publicUrl}/${key}`
      logger.info('Image uploaded to object storage', { key, url, size: buffer.length })
      return { success: true, url }
    }

    // Dev fallback: local filesystem (only works under `next dev`, never in a
    // standalone production build).
    if (process.env.NODE_ENV !== 'production') {
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', folder)
      if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })
      fs.writeFileSync(path.join(uploadDir, filename), buffer)
      const url = `/uploads/${folder}/${filename}`
      logger.info('Image saved to local filesystem (dev)', { url, size: buffer.length })
      return { success: true, url }
    }

    logger.error('Image upload failed: object storage not configured (S3_* env vars missing)')
    return { success: false, error: 'Bildspeicher ist nicht konfiguriert.' }
  } catch (error) {
    logger.error('Failed to upload image', { error, filename })
    return { success: false, error: error instanceof Error ? error.message : 'Unbekannter Fehler beim Upload' }
  }
}

/** Delete an image by its stored URL (S3 object or local dev file). */
export async function deleteImage(url: string): Promise<boolean> {
  try {
    const e = storageEnv()
    if (e.publicUrl && url.startsWith(e.publicUrl)) {
      const key = url.slice(e.publicUrl.length + 1) // strip "base/"
      await s3().send(new DeleteObjectCommand({ Bucket: e.bucket, Key: key }))
      logger.info('Image deleted from object storage', { key })
    } else if (url.startsWith('/uploads/')) {
      const filepath = path.join(process.cwd(), 'public', url)
      if (fs.existsSync(filepath)) fs.unlinkSync(filepath)
      logger.info('Image deleted from local filesystem', { url })
    }
    return true
  } catch (error) {
    logger.error('Failed to delete image', { error, url })
    return false
  }
}

/**
 * Generate a unique filename for a product image.
 * @returns Filename like "I-260204-0001.jpg" or "I-260204-0001_1.jpg"
 */
export function generateImageFilename(itemUuid: string, index: number = 0): string {
  const suffix = index > 0 ? `_${index}` : ''
  return `${itemUuid}${suffix}.jpg`
}
