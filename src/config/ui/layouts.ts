/**
 * UI Layout Configuration
 *
 * SSOT for grid layouts and responsive patterns.
 * Consistent breakpoints across all listing pages.
 */

export const LAYOUTS = {
  // Grid layouts for listings/cards
  grids: {
    // Main listing grid (marketplace)
    listingCards: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',

    // Request cards (IT-Hilfe)
    requestCards: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3',

    // Helper cards
    helperCards: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3',

    // Image gallery
    imageGallery: 'grid grid-cols-2 sm:grid-cols-4',

    // Similar items (smaller cards)
    similarItems: 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',

    // Feature grid (2 columns)
    features: 'grid grid-cols-1 md:grid-cols-2',
  },

  // Container widths
  containers: {
    narrow: 'max-w-3xl mx-auto',
    medium: 'max-w-5xl mx-auto',
    wide: 'max-w-7xl mx-auto',
    full: 'max-w-full mx-auto',
  },

  // Flex layouts
  flex: {
    center: 'flex items-center justify-center',
    between: 'flex items-center justify-between',
    start: 'flex items-start',
    col: 'flex flex-col',
    wrap: 'flex flex-wrap',
  },
} as const
