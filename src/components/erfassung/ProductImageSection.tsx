'use client'

/**
 * ProductImageSection
 *
 * Product image upload section of the ProductForm.
 * Handles image preview, upload via file input, and removal.
 */

import Image from 'next/image'
import { Camera, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import Heading from '@/components/ui/Heading'
import { downscaleImage } from '@/lib/images/downscale'

interface ProductImageSectionProps {
  image: string | null
  onImageChange: (image: string | null) => void
}

export function ProductImageSection({ image, onImageChange }: ProductImageSectionProps) {
  const t = useTranslations('components.erfassung.productImage')

  return (
    <div className="card-shell p-6">
      <Heading level={2} className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
        <Camera className="w-5 h-5" />
        {t('title')}
      </Heading>
      <div className="flex items-start gap-4">
        {image ? (
          <div className="relative">
            <Image
              src={image}
              alt={t('title')}
              width={200}
              height={150}
              className="rounded-lg object-cover"
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              onClick={() => onImageChange(null)}
              aria-label={t('remove')}
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center w-48 h-36 border-2 border-dashed border-default rounded-lg cursor-pointer hover:border-action hover:bg-action-muted transition-colors">
            <Camera className="w-8 h-8 text-text-tertiary mb-2" />
            <span className="text-sm text-text-secondary">{t('upload')}</span>
            <span className="text-xs text-text-tertiary dark:text-text-tertiary mt-1">{t('drag')}</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0]
                if (file) {
                  // Downscale so the stored/uploaded image is a bounded JPEG,
                  // not a raw multi-megabyte phone photo.
                  const base64 = await downscaleImage(file)
                  if (base64) onImageChange(base64)
                }
              }}
            />
          </label>
        )}
      </div>
      <p className="mt-2 text-xs text-text-secondary">
        {t('hint')}
      </p>
    </div>
  )
}
