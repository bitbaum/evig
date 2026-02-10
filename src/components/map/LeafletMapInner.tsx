'use client'

/**
 * LeafletMap Inner Component
 *
 * The actual Leaflet map implementation. Must be loaded with ssr: false
 * because Leaflet requires the `window` object.
 *
 * Use LeafletMap.tsx (the dynamic wrapper) in your pages.
 */

import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// =============================================================================
// TYPES
// =============================================================================

export interface MapMarker {
  id: string
  lat: number
  lng: number
  label: string
  description?: string
  type: 'store' | 'helper'
}

interface LeafletMapInnerProps {
  markers: MapMarker[]
  center?: [number, number]
  zoom?: number
  highlightedMarkerId?: string | null
  className?: string
}

// =============================================================================
// CUSTOM ICONS
// =============================================================================

const storeIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [30, 49],
  iconAnchor: [15, 49],
  popupAnchor: [1, -40],
  shadowSize: [49, 49],
})

const helperIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [22, 36],
  iconAnchor: [11, 36],
  popupAnchor: [1, -30],
  shadowSize: [36, 36],
})

const helperHighlightIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [30, 49],
  iconAnchor: [15, 49],
  popupAnchor: [1, -40],
  shadowSize: [49, 49],
})

// =============================================================================
// COMPONENT — uses vanilla Leaflet API to avoid react-leaflet StrictMode issues
// =============================================================================

export default function LeafletMapInner({
  markers,
  center,
  zoom = 10,
  highlightedMarkerId,
  className = '',
}: LeafletMapInnerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markersRef = useRef<L.Marker[]>([])
  const [ready, setReady] = useState(false)

  // Default center: Switzerland
  const mapCenter: [number, number] = center || [47.37, 8.54]

  // Initialize map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = L.map(containerRef.current).setView(mapCenter, zoom)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map)

    mapRef.current = map
    setReady(true)

    return () => {
      map.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Update markers when data changes
  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready) return

    // Clear old markers
    for (const m of markersRef.current) {
      m.remove()
    }
    markersRef.current = []

    if (markers.length === 0) return

    // Add new markers
    for (const marker of markers) {
      let icon = marker.type === 'store' ? storeIcon : helperIcon
      if (marker.type === 'helper' && highlightedMarkerId === marker.id) {
        icon = helperHighlightIcon
      }

      const leafletMarker = L.marker([marker.lat, marker.lng], { icon }).addTo(map)

      const popupHtml = `<div class="text-sm">
        <p class="font-semibold">${marker.label}</p>
        ${marker.description ? `<p class="text-gray-600 mt-1">${marker.description}</p>` : ''}
      </div>`
      leafletMarker.bindPopup(popupHtml)

      markersRef.current.push(leafletMarker)
    }

    // Fit bounds
    if (markers.length === 1) {
      map.setView([markers[0].lat, markers[0].lng], 13)
    } else {
      const bounds = L.latLngBounds(markers.map(m => [m.lat, m.lng]))
      map.fitBounds(bounds, { padding: [40, 40] })
    }
  }, [markers, highlightedMarkerId, ready])

  return (
    <div
      ref={containerRef}
      className={`w-full min-h-[400px] rounded-lg ${className}`}
      style={{ height: '100%' }}
    />
  )
}
