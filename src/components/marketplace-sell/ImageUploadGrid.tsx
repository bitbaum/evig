import { useRef } from 'react'
import { X, Loader2, ImagePlus } from 'lucide-react'
import { MARKETPLACE_LIMITS } from '@/config/marketplace'

interface Props {
  images: string[]
  isUploading: boolean
  onUpload: (files: FileList) => void
  onRemove: (index: number) => void
}

export function ImageUploadGrid({ images, isUploading, onUpload, onRemove }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Bilder <span className="text-red-500">*</span>
        <span className="text-xs text-gray-400 ml-1">({images.length}/{MARKETPLACE_LIMITS.MAX_IMAGES})</span>
      </label>
      <div className="grid grid-cols-4 gap-3">
        {images.map((url, idx) => (
          <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600">
            <img src={url} alt="" className="w-full h-full object-cover" />
            <button
              onClick={() => onRemove(idx)}
              className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
            >
              <X className="w-3 h-3" />
            </button>
            {idx === 0 && (
              <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/50 text-white text-xs rounded">
                Hauptbild
              </span>
            )}
          </div>
        ))}
        {images.length < MARKETPLACE_LIMITS.MAX_IMAGES && (
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="aspect-square rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-gray-500 hover:border-gray-400 transition-colors"
          >
            {isUploading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <>
                <ImagePlus className="w-6 h-6" />
                <span className="text-xs">Hochladen</span>
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
