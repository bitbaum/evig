'use client'

import { useState } from 'react'
import { Package } from 'lucide-react'

interface ListingImageProps {
  src: string | null | undefined
  alt: string
  className?: string
  fallbackIconSize?: string
}

/**
 * Image component with graceful fallback for marketplace listings.
 * Shows a Package icon placeholder when:
 * - src is null/undefined/empty (no image provided)
 * - image fails to load (broken URL, 404, network error)
 */
export function ListingImage({ src, alt, className = 'w-full h-full object-cover', fallbackIconSize = 'w-12 h-12' }: ListingImageProps) {
  const [hasError, setHasError] = useState(false)

  if (!src || hasError) {
    return (
      <div className="w-full h-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
        <Package className={`${fallbackIconSize} text-gray-300 dark:text-gray-500`} aria-hidden="true" />
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setHasError(true)}
    />
  )
}
