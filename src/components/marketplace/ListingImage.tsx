'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ImageIcon } from 'lucide-react'

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
      <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_50%_38%,var(--surface-overlay),var(--surface-base)_64%)]">
        <ImageIcon className={`${fallbackIconSize} text-text-muted/70`} aria-hidden="true" />
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
