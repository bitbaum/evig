'use client'

import { useState } from 'react'
import Image from 'next/image'
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
      <div className="w-full h-full bg-surface-raised flex items-center justify-center">
        <Package className={`${fallbackIconSize} text-text-muted dark:text-text-tertiary`} aria-hidden="true" />
      </div>
    )
  }

  return (
    <div className="relative w-full h-full">
      <Image
        src={src}
        alt={alt}
        className={className}
        fill
        sizes="(max-width: 768px) 100vw, 400px"
        onError={() => setHasError(true)}
        unoptimized
      />
    </div>
  )
}
