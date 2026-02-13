/**
 * Page Content Configuration
 *
 * SSOT for all page titles, descriptions, and UI text.
 * Eliminates hardcoded strings across marketplace and IT-Hilfe pages.
 */

export const MARKETPLACE_CONTENT = {
  page: {
    title: 'Marketplace',
    description: 'Kaufen und verkaufen Sie gebrauchte IT-Geräte in der Community',
  },
  filters: {
    allCategories: 'Alle',
    showFilters: 'Filter anzeigen',
    hideFilters: 'Filter ausblenden',
    clearFilters: 'Filter zurücksetzen',
    sortBy: 'Sortieren nach',
  },
  emptyStates: {
    noListings: {
      title: 'Keine Inserate gefunden',
      messageEmpty: 'Es sind noch keine Inserate verfügbar. Seien Sie der Erste!',
      messageFiltered: 'Versuchen Sie andere Filteroptionen oder entfernen Sie einige Filter.',
    },
    noSimilar: {
      title: 'Keine ähnlichen Inserate',
      message: 'Erkunden Sie andere Kategorien im Marketplace.',
    },
  },
  actions: {
    sell: 'Verkaufen',
    viewDetails: 'Details ansehen',
    contactSeller: 'Verkäufer kontaktieren',
    backToMarketplace: 'Zurück zum Marketplace',
  },
  loadingStates: {
    listings: 'Inserate werden geladen...',
    details: 'Details werden geladen...',
  },
  errorStates: {
    loadFailed: 'Fehler beim Laden der Inserate',
    tryAgain: 'Erneut versuchen',
  },
} as const

export const IT_HILFE_CONTENT = {
  page: {
    title: 'IT-Hilfe',
    description: 'Finden Sie freiwillige Techniker in Ihrer Nähe',
  },
  filters: {
    allCategories: 'Alle',
    showFilters: 'Filter anzeigen',
    hideFilters: 'Filter ausblenden',
    clearFilters: 'Filter zurücksetzen',
  },
  emptyStates: {
    noRequests: {
      title: 'Keine Anfragen gefunden',
      messageEmpty: 'Es sind noch keine IT-Hilfe Anfragen verfügbar.',
      messageFiltered: 'Versuchen Sie andere Filter oder setzen Sie sie zurück.',
    },
    noHelpers: {
      title: 'Keine Techniker gefunden',
      message: 'Aktuell sind keine Techniker in dieser Region verfügbar.',
    },
  },
  actions: {
    createRequest: 'Anfrage erstellen',
    findHelpers: 'Techniker finden',
    makeOffer: 'Angebot erstellen',
    backToRequests: 'Zurück zu Anfragen',
  },
  loadingStates: {
    requests: 'Anfragen werden geladen...',
    helpers: 'Techniker werden geladen...',
    details: 'Details werden geladen...',
  },
  errorStates: {
    loadFailed: 'Fehler beim Laden',
    tryAgain: 'Erneut versuchen',
  },
} as const
