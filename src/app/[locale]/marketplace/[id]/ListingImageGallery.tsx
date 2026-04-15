'use client'

import { ListingImage } from '@/components/marketplace/ListingImage'
import type { ListingImageData } from './types'

interface ListingImageGalleryProps {
  images: ListingImageData[]
  title: string
  selectedImage: number
  onSelectImage: (idx: number) => void
}

export function ListingImageGallery({ images, title, selectedImage, onSelectImage }: ListingImageGalleryProps) {
  return (
    <div className="space-y-3">
      <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm">
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
            <button
              key={img.id}
              onClick={() => onSelectImage(idx)}
              className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                idx === selectedImage ? 'border-green-500' : 'border-transparent hover:border-gray-300'
              }`}
              aria-label={`Bild ${idx + 1} anzeigen`}
            >
              <ListingImage src={img.url} alt="" fallbackIconSize="w-4 h-4" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
