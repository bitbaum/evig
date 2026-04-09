/**
 * ImageUploadSection Component
 * 
 * Form section for product image upload and management
 * 
 * Created: 2025-12-17
 * Last Modified: 2025-12-17
 * Last Modified Summary: Extracted from ProductListingForm
 */

import { Image as ImageIcon, X } from 'lucide-react'
import { MARKETPLACE_LIMITS } from '@/config/marketplace'
import { cn } from '@/lib/utils'
import { getTextColor } from '@/lib/design-system'
import Heading from '@/components/ui/Heading'

interface ImageUploadSectionProps {
  images: File[]
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  onImageRemove: (index: number) => void
}

export function ImageUploadSection({ images, onImageUpload, onImageRemove }: ImageUploadSectionProps) {
  return (
    <div className="space-y-4">
      <Heading level={3} className={cn('text-lg font-medium', getTextColor('white', 'primary'))}>
        Produkt-Bilder
      </Heading>
      <p className={cn('text-sm', getTextColor('white', 'muted'))}>
        Füge bis zu {MARKETPLACE_LIMITS.MAX_IMAGES} klare Bilder deines Produkts hinzu
      </p>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Existing images */}
        {images.map((image, index) => (
          <div key={index} className="relative group">
            <img
              src={URL.createObjectURL(image)}
              alt={`Bild ${index + 1}`}
              className="w-full h-24 object-cover rounded-lg border-2 border-neutral-200"
            />
            <button
              type="button"
              onClick={() => onImageRemove(index)}
              className="absolute -top-2 -right-2 w-6 h-6 bg-error-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity min-h-[touch] touch-target"
              aria-label="Bild entfernen"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}

        {/* Upload button */}
        {images.length < MARKETPLACE_LIMITS.MAX_IMAGES && (
          <div className="border-2 border-dashed border-neutral-300 rounded-lg p-4 flex flex-col items-center justify-center hover:border-neutral-400 transition-colors cursor-pointer">
            <ImageIcon className="w-8 h-8 text-neutral-400 mb-2" />
            <label className="cursor-pointer">
              <span className={cn('text-sm', getTextColor('white', 'muted'))}>
                Bild hinzufügen
              </span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={onImageUpload}
                className="hidden"
                aria-label="Bild hochladen"
              />
            </label>
          </div>
        )}
      </div>
      
      {images.length >= MARKETPLACE_LIMITS.MAX_IMAGES && (
        <p className={cn('text-sm', getTextColor('white', 'muted'))}>
          Maximum {MARKETPLACE_LIMITS.MAX_IMAGES} Bilder erreicht
        </p>
      )}
    </div>
  )
}



