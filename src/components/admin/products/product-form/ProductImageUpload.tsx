'use client'

import { Upload, X } from 'lucide-react'
import Heading from '@/components/admin/AdminHeading'

interface Props {
  imagePreviews: string[]
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  onRemoveImage: (index: number) => void
}

export function ProductImageUpload({ imagePreviews, onImageUpload, onRemoveImage }: Props) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
      <Heading level={2} className="text-lg text-gray-900 dark:text-white mb-6">Produktbilder</Heading>

      <div className="space-y-4">
        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <label htmlFor="product-image-upload" className="cursor-pointer">
              <span className="font-medium text-green-600 hover:text-green-500">Dateien auswählen</span>
              <span> oder hierhin ziehen</span>
            </label>
            <input
              id="product-image-upload"
              type="file"
              multiple
              accept="image/*"
              onChange={onImageUpload}
              className="hidden"
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">PNG, JPG, GIF bis zu 10MB</p>
        </div>

        {imagePreviews.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {imagePreviews.map((preview, index) => (
              <div key={index} className="relative group">
                <img src={preview} alt={`Preview ${index + 1}`} className="w-full h-24 object-cover rounded-lg" />
                <button
                  type="button"
                  onClick={() => onRemoveImage(index)}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
