'use client'

/**
 * ProductImageSection
 *
 * Product image upload section of the ProductForm.
 * Handles image preview, upload via file input, and removal.
 */

import Image from 'next/image'
import { Camera } from 'lucide-react'

interface ProductImageSectionProps {
  image: string | null
  onImageChange: (image: string | null) => void
}

export function ProductImageSection({ image, onImageChange }: ProductImageSectionProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <Camera className="w-5 h-5" />
        Produktbild
      </h2>
      <div className="flex items-start gap-4">
        {image ? (
          <div className="relative">
            <Image
              src={image}
              alt="Produktbild"
              width={200}
              height={150}
              className="rounded-lg object-cover"
            />
            <button
              type="button"
              onClick={() => onImageChange(null)}
              className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center"
            >
              <span className="text-xs font-bold">X</span>
            </button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center w-48 h-36 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors">
            <Camera className="w-8 h-8 text-gray-500 mb-2" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Bild hochladen</span>
            <span className="text-xs text-gray-500 dark:text-gray-500 mt-1">oder hierher ziehen</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  const reader = new FileReader()
                  reader.onload = (event) => {
                    const base64 = event.target?.result as string
                    onImageChange(base64)
                  }
                  reader.readAsDataURL(file)
                }
              }}
            />
          </label>
        )}
      </div>
      <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
        JPG, PNG oder WebP. Max 5 MB.
      </p>
    </div>
  )
}
