'use client'

/**
 * LeafletMap - Dynamic SSR-safe wrapper
 *
 * Loads the Leaflet map component with next/dynamic (ssr: false)
 * because Leaflet requires the browser `window` object.
 */

import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'

// Re-export the MapMarker type for convenience
export type { MapMarker } from './LeafletMapInner'

function MapLoadingFallback() {
  const t = useTranslations('components.map')
  return (
    <div className="w-full min-h-[400px] rounded-lg bg-neutral-100 animate-pulse flex items-center justify-center">
      <p className="text-neutral-400 text-sm">{t('loading')}</p>
    </div>
  )
}

const LeafletMap = dynamic(() => import('./LeafletMapInner'), {
  ssr: false,
  loading: () => <MapLoadingFallback />,
})

export default LeafletMap
