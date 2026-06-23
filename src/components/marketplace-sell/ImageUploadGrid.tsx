import { useRef } from 'react'
import { X, Loader2, ImagePlus } from 'lucide-react'
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
    <div>
      <label className="block text-sm font-medium text-text-secondary mb-2">
        {t('imagesLabel')} <span className="text-xs text-text-tertiary ml-1">({tCommon('optional')}, {images.length}/{MARKETPLACE_LIMITS.MAX_IMAGES})</span>
      </label>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {images.map((url, idx) => (
          <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border">
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
            className="aspect-square rounded-lg border-2 border-dashed border-default flex flex-col items-center justify-center gap-1 text-text-tertiary hover:text-text-secondary hover:border-strong h-auto bg-transparent hover:bg-transparent"
          >
            {isUploading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <>
                <ImagePlus className="w-6 h-6" />
                <span className="text-xs">{tCommon('upload')}</span>
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
