/**
 * Image Upload Utility
 *
 * Handles image upload to Vercel Blob storage for production
 * or local filesystem for development.
 */

import { put, del } from '@vercel/blob'
import { logger } from '@/lib/logger'
import fs from 'fs'
import path from 'path'

interface UploadResult {
  success: boolean
  url?: string
  error?: string
}

/**
 * Check if blob storage is configured
 */
export function isBlobConfigured(): boolean {
  return !!process.env.BLOB_READ_WRITE_TOKEN
}

/**
 * Upload a base64 image to blob storage (production) or local filesystem (development)
 *
 * @param base64Data - Base64 encoded image (with or without data URL prefix)
 * @param filename - Desired filename (e.g., "I-260204-0001.jpg")
 * @param folder - Optional folder path (e.g., "products")
 * @returns Upload result with URL or error
 */
export async function uploadImage(
  base64Data: string,
  filename: string,
  folder: string = 'products'
): Promise<UploadResult> {
  try {
    // Remove data URL prefix if present
    const base64Content = base64Data.includes(',')
      ? base64Data.split(',')[1]
      : base64Data

    // Convert base64 to buffer
    const buffer = Buffer.from(base64Content, 'base64')

    // Determine content type from data URL or default to jpeg
    let contentType = 'image/jpeg'
    if (base64Data.startsWith('data:')) {
      const match = base64Data.match(/data:([^;]+);/)
      if (match) {
        contentType = match[1]
      }
    }

    // Check if blob storage is configured
    if (isBlobConfigured()) {
      // Production: Upload to Vercel Blob
      const pathname = `${folder}/${filename}`

      const blob = await put(pathname, buffer, {
        access: 'public',
        contentType,
        addRandomSuffix: false, // Keep exact filename for predictability
      })

      logger.info('Image uploaded to blob storage', {
        filename,
        url: blob.url,
        size: buffer.length,
      })

      return {
        success: true,
        url: blob.url,
      }
    } else {
      // Development: Save to local filesystem
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', folder)

      // Create directory if it doesn't exist
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true })
      }

      const filepath = path.join(uploadDir, filename)
      fs.writeFileSync(filepath, buffer)

      // Return URL relative to public folder
      const url = `/uploads/${folder}/${filename}`

      logger.info('Image saved to local filesystem', {
        filename,
        filepath,
        url,
        size: buffer.length,
      })

      return {
        success: true,
        url,
      }
    }
  } catch (error) {
    logger.error('Failed to upload image', { error, filename })

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown upload error',
    }
  }
}

/**
 * Delete an image from blob storage or local filesystem
 *
 * @param url - Full URL or path of the image to delete
 * @returns Success status
 */
export async function deleteImage(url: string): Promise<boolean> {
  try {
    if (url.includes('blob.vercel-storage.com')) {
      // Blob storage
      await del(url)
      logger.info('Image deleted from blob storage', { url })
    } else if (url.startsWith('/uploads/')) {
      // Local filesystem
      const filepath = path.join(process.cwd(), 'public', url)
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath)
        logger.info('Image deleted from local filesystem', { url, filepath })
      }
    }
    return true
  } catch (error) {
    logger.error('Failed to delete image', { error, url })
    return false
  }
}

/**
 * Generate a unique filename for a product image
 *
 * @param itemUuid - Product item UUID (e.g., "I-260204-0001")
 * @param index - Image index (for multiple images)
 * @returns Filename like "I-260204-0001_1.jpg"
 */
export function generateImageFilename(itemUuid: string, index: number = 0): string {
  const suffix = index > 0 ? `_${index}` : ''
  return `${itemUuid}${suffix}.jpg`
}
