'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

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
      <div className="flex h-full w-full items-center justify-center bg-surface-raised">
        <div className="flex items-center justify-center rounded-full border border-subtle bg-surface-base p-3 shadow-xs">
          <ImageIcon className={cn('text-text-tertiary', fallbackIconSize)} aria-hidden="true" />
        </div>
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
