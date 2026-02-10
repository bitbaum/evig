'use client'

/**
 * LeafletMap - Dynamic SSR-safe wrapper
 *
 * Loads the Leaflet map component with next/dynamic (ssr: false)
 * because Leaflet requires the browser `window` object.
 */

import dynamic from 'next/dynamic'

// Re-export the MapMarker type for convenience
export type { MapMarker } from './LeafletMapInner'

const LeafletMap = dynamic(() => import('./LeafletMapInner'), {
  ssr: false,
  loading: () => (
    <div className="w-full min-h-[400px] rounded-lg bg-gray-100 animate-pulse flex items-center justify-center">
      <p className="text-gray-400 text-sm">Karte wird geladen...</p>
    </div>
  ),
})

export default LeafletMap
