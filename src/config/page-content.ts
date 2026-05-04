/**
 * Page Content Configuration
 *
 * SSOT for all page titles, descriptions, and UI text.
 * Eliminates hardcoded strings across marketplace and IT-Hilfe pages.
 */

import { ORG } from '@/config/org';

export const MARKETPLACE_CONTENT = {
  page: {
    title: 'Marketplace',
    description: 'Kaufe und verkaufe gebrauchte IT-Geräte in der Community — fair, nachhaltig und lokal.',
  },
  sellerTypes: {
    all: 'Alle',
    revampit: `${ORG.name} Geräte`,
    community: 'Community Inserate',
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
      messageEmpty: 'Noch keine Inserate vorhanden. Erstelle das erste!',
      messageFiltered: 'Versuche andere Filter oder setze sie zurück.',
    },
    noSimilar: {
      title: 'Keine ähnlichen Inserate',
      message: 'Entdecke andere Kategorien im Marketplace.',
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
    description: 'Finde Techniker in deiner Nähe — Community-basierte IT-Unterstützung',
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
      messageEmpty: 'Noch keine IT-Hilfe-Anfragen vorhanden.',
      messageFiltered: 'Versuche andere Filter oder setze sie zurück.',
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
