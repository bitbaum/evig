'use client'

import { useState, useRef, ChangeEvent } from 'react'
import Image from 'next/image'
import { logger } from '@/lib/logger'
import { apiFetch } from '@/lib/api/client'
import { PROFILE_CONFIG } from '@/config/profile'
import { useTranslations } from 'next-intl'

interface AvatarUploadProps {
  currentAvatarUrl?: string | null
  onUploadSuccess: (url: string) => void
  onRemove?: () => void
  className?: string
}

export function AvatarUpload({
  currentAvatarUrl,
  onUploadSuccess,
  onRemove,
  className = '',
}: AvatarUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentAvatarUrl || null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const config = PROFILE_CONFIG.avatar
  const t = useTranslations('components.avatarUpload')

  const validateFile = (file: File): string | null => {
    // Check file type
    if (!(config.allowedTypes as readonly string[]).includes(file.type)) {
      return t('errorFileType')
    }

    // Check file size
    if (file.size > config.maxSizeBytes) {
      return t('errorFileSize')
    }

    return null
  }

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError(null)

    // Validate file
    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      logger.warn('Avatar validation failed', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        error: validationError,
      })
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string)
    }
    reader.readAsDataURL(file)

    // Upload file
    setIsUploading(true)
    logger.info('Avatar upload starting', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
    })

    try {
      const formData = new FormData()
      formData.append('file', file)

      const { data, error: apiError } = await apiFetch<{ images?: { thumbnail: string }[]; urls?: string[] }>('/api/uploads', {
        method: 'POST',
        body: formData,
        formData: true,
      })

      if (apiError) {
        throw new Error(apiError)
      }

      // Use thumbnail URL (200x200) for avatars
      const avatarUrl = data?.images?.[0]?.thumbnail || data?.urls?.[0] || ''

      logger.info('Avatar upload successful', {
        url: avatarUrl,
        fileName: file.name,
      })

      onUploadSuccess(avatarUrl)
      setError(null)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('errorUpload')
      setError(errorMessage)
      setPreviewUrl(currentAvatarUrl || null) // Reset to original on error

      logger.error('Avatar upload failed', {
        error: err,
        fileName: file.name,
      })
    } finally {
      setIsUploading(false)
      // Reset input so same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemove = () => {
    setPreviewUrl(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }

    logger.info('Avatar removed')

    if (onRemove) {
      onRemove()
    } else {
      onUploadSuccess('') // Empty string to clear avatar_url
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Avatar Display */}
      <div className="flex items-center gap-4">
        <div className="relative w-32 h-32 rounded-full overflow-hidden bg-neutral-100 border-2 border-neutral-200">
          {previewUrl ? (
            <Image
              src={previewUrl}
              alt={t('altText')}
              fill
              className="object-cover"
              unoptimized={previewUrl.startsWith('data:')} // Don't optimize data URLs
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-neutral-400">
              <svg
                className="w-16 h-16"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
          )}
        </div>

        {/* Upload Controls */}
        <div className="flex flex-col gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept={config.allowedExtensions.join(',')}
            onChange={handleFileChange}
            className="hidden"
            disabled={isUploading}
          />

          <button
            type="button"
            onClick={handleClick}
            disabled={isUploading}
            className="px-4 py-2 bg-info-600 text-white rounded-md hover:bg-info-700 disabled:bg-neutral-300 disabled:cursor-not-allowed transition-colors"
          >
            {isUploading
              ? t('saving')
              : previewUrl
              ? t('change')
              : t('upload')}
          </button>

          {previewUrl && (
            <button
              type="button"
              onClick={handleRemove}
              disabled={isUploading}
              className="px-4 py-2 bg-white text-error-600 border border-error-600 rounded-md hover:bg-error-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {t('remove')}
            </button>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="text-sm text-error-600 bg-error-50 border border-error-200 rounded-md p-3">
          {error}
        </div>
      )}

      {/* Help Text */}
      <p className="text-sm text-neutral-500">
        {config.allowedExtensions.join(', ').toUpperCase()} • Max {config.maxSizeMB}MB
      </p>
    </div>
  )
}
