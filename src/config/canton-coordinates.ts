/**
 * Swiss Canton Coordinates
 *
 * Approximate center coordinates for all 26 Swiss cantons.
 * Used for placing map markers when only canton is known.
 */

export interface CantonCoordinate {
  lat: number
  lng: number
}

export const CANTON_COORDINATES: Record<string, CantonCoordinate> = {
  'Aargau': { lat: 47.39, lng: 8.05 },
  'Appenzell Ausserrhoden': { lat: 47.38, lng: 9.28 },
  'Appenzell Innerrhoden': { lat: 47.33, lng: 9.41 },
  'Basel-Landschaft': { lat: 47.44, lng: 7.76 },
  'Basel-Stadt': { lat: 47.56, lng: 7.59 },
  'Bern': { lat: 46.95, lng: 7.45 },
  'Freiburg': { lat: 46.80, lng: 7.15 },
  'Genf': { lat: 46.20, lng: 6.15 },
  'Glarus': { lat: 47.04, lng: 9.07 },
  'Graubünden': { lat: 46.66, lng: 9.57 },
  'Jura': { lat: 47.37, lng: 7.16 },
  'Luzern': { lat: 47.05, lng: 8.31 },
  'Neuenburg': { lat: 46.99, lng: 6.93 },
  'Nidwalden': { lat: 46.93, lng: 8.39 },
  'Obwalden': { lat: 46.88, lng: 8.25 },
  'Schaffhausen': { lat: 47.70, lng: 8.64 },
  'Schwyz': { lat: 47.02, lng: 8.65 },
  'Solothurn': { lat: 47.21, lng: 7.54 },
  'St. Gallen': { lat: 47.42, lng: 9.38 },
  'Tessin': { lat: 46.33, lng: 8.80 },
  'Thurgau': { lat: 47.60, lng: 9.05 },
  'Uri': { lat: 46.88, lng: 8.64 },
  'Waadt': { lat: 46.62, lng: 6.63 },
  'Wallis': { lat: 46.23, lng: 7.63 },
  'Zug': { lat: 47.17, lng: 8.52 },
  'Zürich': { lat: 47.37, lng: 8.55 },
} as const

/**
 * Get coordinates for a canton name, with fuzzy matching
 */
export function getCantonCoordinates(canton: string): CantonCoordinate | null {
  // Direct match
  if (CANTON_COORDINATES[canton]) {
    return CANTON_COORDINATES[canton]
  }

  // Case-insensitive match
  const lowerCanton = canton.toLowerCase()
  for (const [key, value] of Object.entries(CANTON_COORDINATES)) {
    if (key.toLowerCase() === lowerCanton) {
      return value
    }
  }

  return null
}
