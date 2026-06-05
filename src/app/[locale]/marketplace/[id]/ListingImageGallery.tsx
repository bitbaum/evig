'use client'

import { ListingImage } from '@/components/marketplace/ListingImage'
import { Button } from '@/components/ui/button'
import type { ListingImageData } from './types'
import { useTranslations } from 'next-intl'

interface ListingImageGalleryProps {
  images: ListingImageData[]
  title: string
  selectedImage: number
  onSelectImage: (idx: number) => void
}

export function ListingImageGallery({ images, title, selectedImage, onSelectImage }: ListingImageGalleryProps) {
  const t = useTranslations('marketplace.listing')
  return (
    <div className="space-y-3">
      <div className="card-shell overflow-hidden">
        <ListingImage
          src={images[selectedImage]?.url}
          alt={title}
          className="w-full aspect-square object-cover"
          fallbackIconSize="w-24 h-24"
        />
      </div>
      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto">
          {images.map((img, idx) => (
            <Button
              key={img.id}
              variant="ghost"
              onClick={() => onSelectImage(idx)}
              className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors focus:outline-hidden focus:ring-2 focus:ring-action focus:ring-offset-2 ${
                idx === selectedImage ? 'border-action' : 'border-transparent hover:border-strong'
              }`}
              aria-label={t('imageAriaLabel', { n: idx + 1 })}
            >
              <ListingImage src={img.url} alt="" fallbackIconSize="w-4 h-4" />
            </Button>
          ))}
        </div>
      )}
    </div>
  )
}
