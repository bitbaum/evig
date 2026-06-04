'use client'

import { useState } from 'react'
import { Camera, X, Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { FILE_SIZE_LIMITS } from '@/config/limits'
import { logger } from '@/lib/logger'
import { apiFetch } from '@/lib/api/client'
import Heading from '@/components/ui/Heading'

interface ITHilfeImageUploadProps {
  imageUrls: string[]
  onImagesChange: (urls: string[]) => void
  maxImages?: number
  onError?: (message: string) => void
}

export function ITHilfeImageUpload({
  imageUrls,
  onImagesChange,
  maxImages = 5,
  onError,
}: ITHilfeImageUploadProps) {
  const t = useTranslations('itHelp.imageUpload')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reportError = (message: string) => {
    setError(message)
    onError?.(message)
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    // Validate before upload
    const remaining = maxImages - imageUrls.length
    if (remaining <= 0) return

    const filesToUpload = Array.from(files).slice(0, remaining)
    for (const file of filesToUpload) {
      if (!file.type.startsWith('image/')) {
        reportError(t('errorImageOnly'))
        return
      }
      if (file.size > FILE_SIZE_LIMITS.UPLOAD_MAX) {
        reportError(t('errorTooLarge'))
        return
      }
    }

    setUploading(true)
    try {
      const formData = new FormData()
      filesToUpload.forEach((file) => formData.append('files', file))

      const { data, error: apiError } = await apiFetch<{ urls: string[] }>('/api/uploads', {
        method: 'POST',
        body: formData,
        formData: true,
      })

      if (apiError) {
        throw new Error(apiError)
      }

      const newUrls = data?.urls || []
      onImagesChange([...imageUrls, ...newUrls])
    } catch (err) {
      logger.error('Image upload failed', { error: err })
      reportError(t('errorUploadFailed'))
    } finally {
      setUploading(false)
      // Reset input so same file can be re-selected
      e.target.value = ''
    }
  }

  const handleRemove = (index: number) => {
    onImagesChange(imageUrls.filter((_, i) => i !== index))
  }

  return (
    <div className="card-shell p-6">
      <Heading level={2} className="text-lg font-semibold text-text-primary mb-4">{t('heading')}</Heading>

      {error && (
        <p className="text-sm text-error-600 mb-3">{error}</p>
      )}

      {imageUrls.length < maxImages && (
        <div className="border-2 border-dashed border-neutral-300 rounded-lg p-6 text-center mb-4">
          {uploading ? (
            <Loader2 className="w-10 h-10 text-text-muted mx-auto mb-2 animate-spin" />
          ) : (
            <Camera className="w-10 h-10 text-text-muted mx-auto mb-2" />
          )}
          <label htmlFor="it-hilfe-image-upload" className="cursor-pointer">
            <span className="text-sm font-medium text-action hover:text-action">
              {uploading ? t('uploading') : t('selectPhotos')}
            </span>
          </label>
          <input
            id="it-hilfe-image-upload"
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileSelect}
            disabled={uploading}
            className="hidden"
          />
          <p className="text-xs text-text-tertiary mt-1">
            PNG, JPG, GIF bis 10MB ({imageUrls.length}/{maxImages})
          </p>
        </div>
      )}

      {imageUrls.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {imageUrls.map((url, index) => (
            <div key={url} className="relative group">
              <img
                src={url}
                alt={t('imageAlt', { index: index + 1 })}
                className="w-full h-24 object-cover rounded-lg"
              />
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="absolute -top-2 -right-2 w-6 h-6 bg-error-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
