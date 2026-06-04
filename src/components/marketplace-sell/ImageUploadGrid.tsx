import { useRef } from 'react'
import { X, Loader2, ImagePlus } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { MARKETPLACE_LIMITS } from '@/config/marketplace'

interface Props {
  images: string[]
  isUploading: boolean
  onUpload: (files: FileList) => void
  onRemove: (index: number) => void
}

export function ImageUploadGrid({ images, isUploading, onUpload, onRemove }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const t = useTranslations('marketplace.sell')
  const tCommon = useTranslations('common')

  return (
    <div>
      <label className="block text-sm font-medium text-text-secondary mb-2">
        {t('imagesLabel')} <span className="text-xs text-text-tertiary ml-1">({tCommon('optional')}, {images.length}/{MARKETPLACE_LIMITS.MAX_IMAGES})</span>
      </label>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {images.map((url, idx) => (
          <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border dark:border-neutral-600">
            <img src={url} alt={t('imageAlt', { index: idx + 1 })} className="w-full h-full object-cover" />
            <button
              onClick={() => onRemove(idx)}
              aria-label={t('removeImageLabel', { index: idx + 1 })}
              className="absolute top-1 right-1 p-2 bg-error-500 text-white rounded-full hover:bg-error-600"
            >
              <X className="w-4 h-4" />
            </button>
            {idx === 0 && (
              <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/50 text-white text-xs rounded">
                {t('mainImage')}
              </span>
            )}
          </div>
        ))}
        {images.length < MARKETPLACE_LIMITS.MAX_IMAGES && (
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="aspect-square rounded-lg border-2 border-dashed border-neutral-300 dark:border-neutral-600 flex flex-col items-center justify-center gap-1 text-text-tertiary hover:text-neutral-600 hover:border-neutral-400 transition-colors"
          >
            {isUploading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <>
                <ImagePlus className="w-6 h-6" />
                <span className="text-xs">{tCommon('upload')}</span>
              </>
            )}
          </button>
        )}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={(e) => e.target.files && onUpload(e.target.files)}
        className="hidden"
      />
    </div>
  )
}
