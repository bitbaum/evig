/**
 * Map configuration — SSOT for tile layers, icon URLs, and default view.
 * All Leaflet map components must import from here instead of hardcoding URLs.
 */

export const MAP_TILES = {
  osm: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  },
} as const

/** Base URL for the pointhi/leaflet-color-markers CDN */
const MARKER_BASE = 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img'
const SHADOW_URL = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png'

export interface MapIconOptions {
  iconUrl: string
  shadowUrl: string
  iconSize: [number, number]
  iconAnchor: [number, number]
  popupAnchor: [number, number]
  shadowSize: [number, number]
}

export const MAP_MARKER_ICONS: Record<string, MapIconOptions> = {
  /** RevampIT store / drop-off location */
  store: {
    iconUrl: `${MARKER_BASE}/marker-icon-2x-green.png`,
    shadowUrl: SHADOW_URL,
    iconSize: [30, 49],
    iconAnchor: [15, 49],
    popupAnchor: [1, -40],
    shadowSize: [49, 49],
  },
  /** Volunteer helper location */
  helper: {
    iconUrl: `${MARKER_BASE}/marker-icon-2x-blue.png`,
    shadowUrl: SHADOW_URL,
    iconSize: [22, 36],
    iconAnchor: [11, 36],
    popupAnchor: [1, -30],
    shadowSize: [36, 36],
  },
  /** Highlighted/selected helper location */
  helperHighlight: {
    iconUrl: `${MARKER_BASE}/marker-icon-2x-orange.png`,
    shadowUrl: SHADOW_URL,
    iconSize: [30, 49],
    iconAnchor: [15, 49],
    popupAnchor: [1, -40],
    shadowSize: [49, 49],
  },
}

/** Default map view centered on Switzerland */
export const MAP_DEFAULTS = {
  center: [47.37, 8.54] as [number, number],
  zoom: 10,
} as const
