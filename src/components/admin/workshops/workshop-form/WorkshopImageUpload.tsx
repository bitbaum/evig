'use client'

import { Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Heading from '@/components/admin/AdminHeading'

interface Props {
  imagePreviews: string[]
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  onRemoveImage: (index: number) => void
}

export function WorkshopImageUpload({ imagePreviews, onImageUpload, onRemoveImage }: Props) {
  return (
    <div className="bg-surface-base rounded-xl shadow-xs border border-subtle dark:border-white/6 p-6">
      <Heading level={2} className="text-lg text-text-primary mb-6 flex items-center gap-2">
        <Upload className="w-5 h-5" />
        Workshop-Bilder
      </Heading>

      <div className="space-y-4">
        <div className="border-2 border-dashed border-default rounded-lg p-8 text-center">
          <Upload className="w-12 h-12 text-text-muted mx-auto mb-4" />
          <div className="text-sm text-text-secondary">
            <label htmlFor="workshop-image-upload" className="cursor-pointer">
              <span className="font-medium text-action hover:text-action">
                Bilder auswählen
              </span>
              <span> oder hierhin ziehen</span>
            </label>
            <input
              id="workshop-image-upload"
              type="file"
              multiple
              accept="image/*"
              onChange={onImageUpload}
              className="hidden"
            />
          </div>
          <p className="text-xs text-text-tertiary mt-2">
            PNG, JPG, GIF bis zu 10MB • Maximal 10 Bilder
          </p>
        </div>

        {imagePreviews.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {imagePreviews.map((preview, index) => (
              <div key={index} className="relative group">
                <img
                  src={preview}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-24 object-cover rounded-lg"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  onClick={() => onRemoveImage(index)}
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full opacity-0 group-hover:opacity-100"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
