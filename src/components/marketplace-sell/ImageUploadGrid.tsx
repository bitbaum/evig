import { useRef } from 'react'
import { X, Loader2, ImagePlus, Camera } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
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
    <div className="rounded-lg border border-subtle bg-surface-raised p-3 sm:p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <label className="block text-sm font-semibold text-text-primary">
            {t('imagesLabel')}
          </label>
          <p className="mt-1 text-xs text-text-tertiary">
            {t('imagesHelp')} · {images.length}/{MARKETPLACE_LIMITS.MAX_IMAGES}
          </p>
        </div>
        <Camera className="mt-0.5 h-4 w-4 shrink-0 text-action" aria-hidden="true" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {images.map((url, idx) => (
          <div key={idx} className="relative aspect-square overflow-hidden rounded-lg border border-subtle bg-surface-base">
            <img src={url} alt={t('imageAlt', { index: idx + 1 })} className="w-full h-full object-cover" />
            <Button
              variant="destructive"
              size="icon"
              onClick={() => onRemove(idx)}
              aria-label={t('removeImageLabel', { index: idx + 1 })}
              className="absolute top-1 right-1 p-2 rounded-full h-auto w-auto"
            >
              <X className="w-4 h-4" />
            </Button>
            {idx === 0 && (
              <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/50 text-white text-xs rounded-sm">
                {t('mainImage')}
              </span>
            )}
          </div>
        ))}
        {images.length < MARKETPLACE_LIMITS.MAX_IMAGES && (
          <Button
            variant="ghost"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="aspect-square h-auto flex-col gap-2 rounded-lg border-2 border-dashed border-default bg-surface-base text-text-tertiary hover:border-action hover:bg-surface-base hover:text-action"
          >
            {isUploading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <>
                <ImagePlus className="h-6 w-6" />
                <span className="text-xs font-medium">{tCommon('upload')}</span>
              </>
            )}
          </Button>
        )}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={(e) => {
          if (e.target.files?.length) onUpload(e.target.files)
          e.target.value = ''
        }}
        className="hidden"
      />
    </div>
  )
}
