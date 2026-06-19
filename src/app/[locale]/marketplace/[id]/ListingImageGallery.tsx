'use client'

import { useState, useEffect, useCallback } from 'react'
import { ListingImage } from '@/components/marketplace/ListingImage'
import { Button } from '@/components/ui/button'
import { ZoomIn, X, ChevronLeft, ChevronRight } from 'lucide-react'
import type { ListingImageData } from './types'
import { useTranslations } from 'next-intl'
import { useFocusTrap } from '@/hooks/useFocusTrap'

interface ListingImageGalleryProps {
  images: ListingImageData[]
  title: string
  selectedImage: number
  onSelectImage: (idx: number) => void
}

export function ListingImageGallery({ images, title, selectedImage, onSelectImage }: ListingImageGalleryProps) {
  const t = useTranslations('marketplace.listing')
  const [zoomed, setZoomed] = useState(false)

  const current = images[selectedImage]
  const hasImage = Boolean(current?.url)

  const step = useCallback(
    (delta: number) => onSelectImage((selectedImage + delta + images.length) % images.length),
    [selectedImage, images.length, onSelectImage],
  )

  // Esc-to-close, initial focus, focus restore and the Tab trap live in the
  // shared hook; attach its ref to the lightbox below.
  const lightboxRef = useFocusTrap<HTMLDivElement>(zoomed, () => setZoomed(false))

  // Arrow keys navigate between images while zoomed.
  useEffect(() => {
    if (!zoomed) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') step(1)
      else if (e.key === 'ArrowLeft') step(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [zoomed, step])

  return (
    <div className="space-y-3">
      <div className="card-shell group relative overflow-hidden">
        {/* eslint-disable-next-line no-restricted-syntax -- full-bleed image zoom trigger, not a UI button; Button chrome (padding/height/inline-flex) would break the full-bleed image */}
        <button
          type="button"
          onClick={() => hasImage && setZoomed(true)}
          disabled={!hasImage}
          aria-label={t('zoomOpen')}
          className={`block w-full ${hasImage ? 'cursor-zoom-in' : 'cursor-default'}`}
        >
          <ListingImage
            src={current?.url}
            alt={title}
            className="w-full aspect-square object-cover"
            fallbackIconSize="w-24 h-24"
          />
          {hasImage && (
            <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-md bg-black/60 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
              <ZoomIn className="h-3.5 w-3.5" aria-hidden="true" />
              {t('zoomOpen')}
            </span>
          )}
        </button>
        {images.length > 1 && (
          <span className="absolute top-2 right-2 rounded-md bg-black/60 px-2 py-0.5 text-xs text-white">
            {t('photoCount', { count: images.length })}
          </span>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto">
          {images.map((img, idx) => (
            <Button
              key={img.id}
              variant="ghost"
              onClick={() => onSelectImage(idx)}
              className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors focus:outline-hidden focus:ring-2 focus:ring-action focus:ring-offset-2 ${
                idx === selectedImage ? 'border-action' : 'border-transparent hover:border-strong'
              }`}
              aria-label={t('imageAriaLabel', { n: idx + 1 })}
            >
              <ListingImage src={img.url} alt="" fallbackIconSize="w-4 h-4" />
            </Button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {zoomed && hasImage && (
        <div
          ref={lightboxRef}
          tabIndex={-1}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 focus:outline-none"
          onClick={() => setZoomed(false)}
          role="dialog"
          aria-modal="true"
          aria-label={title}
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setZoomed(false)}
            aria-label={t('zoomClose')}
            className="absolute right-4 top-4 text-white/80 hover:text-white"
          >
            <X className="h-7 w-7" aria-hidden="true" />
          </Button>
          {images.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => { e.stopPropagation(); step(-1) }}
                aria-label={t('imageAriaLabel', { n: ((selectedImage - 1 + images.length) % images.length) + 1 })}
                className="absolute left-2 sm:left-4 text-white/80 hover:text-white"
              >
                <ChevronLeft className="h-9 w-9" aria-hidden="true" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => { e.stopPropagation(); step(1) }}
                aria-label={t('imageAriaLabel', { n: ((selectedImage + 1) % images.length) + 1 })}
                className="absolute right-2 sm:right-4 text-white/80 hover:text-white"
              >
                <ChevronRight className="h-9 w-9" aria-hidden="true" />
              </Button>
            </>
          )}
          {/* Full-resolution view — plain img for unconstrained object-contain zoom. */}
          <img
            src={current!.url}
            alt={title}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] max-w-[92vw] object-contain"
          />
        </div>
      )}
    </div>
  )
}
