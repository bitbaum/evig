export const ADMIN_CONTENT = {
  tasks: {
    emptyTitle: 'Keine Aufgaben gefunden',
    emptyDescription: 'Erstelle die erste Aufgabe, um loszulegen.',
    errorMessage: 'Fehler beim Laden der Aufgaben',
  },
  protocols: {
    emptyTitle: 'Keine Protokolle vorhanden',
    emptyDescription: 'Erstelle das erste Protokoll.',
    errorMessage: 'Fehler beim Laden der Protokolle',
  },
  workshops: {
    emptyTitle: 'Keine Workshops gefunden',
    emptyDescription: 'Erstelle den ersten Workshop.',
    errorMessage: 'Fehler beim Laden der Workshops',
  },
  locations: {
    emptyTitle: 'Keine Standorte gefunden',
    emptyDescription: 'Füge den ersten Standort hinzu.',
    errorMessage: 'Fehler beim Laden der Standorte',
  },
  reviews: {
    emptyTitle: 'Keine Bewertungen gefunden',
    emptyDescription: 'Es gibt noch keine Bewertungen.',
    errorMessage: 'Fehler beim Laden der Bewertungen',
  },
  decisions: {
    emptyTitle: 'Keine Entscheide vorhanden',
    emptyDescription: 'Erstelle den ersten Entscheid.',
    errorMessage: 'Fehler beim Laden der Entscheide',
  },
  team: {
    emptyTitle: 'Keine Teammitglieder gefunden',
    emptyDescription: 'Füge das erste Teammitglied hinzu.',
    errorMessage: 'Fehler beim Laden des Teams',
  },
} as const

export const ADMIN_COMMON = {
  retry: 'Erneut versuchen',
  loading: 'Wird geladen...',
  noResults: 'Keine Ergebnisse',
  search: 'Suchen...',
  clearFilters: 'Filter zurücksetzen',
  pagination: {
    previous: 'Zurück',
    next: 'Weiter',
    pageOf: (current: number, total: number) => `Seite ${current} von ${total}`,
  },
} as const
