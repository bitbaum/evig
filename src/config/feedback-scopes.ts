import { FEEDBACK_SCOPE_COLORS } from '@/config/ui-colors'

export type FeedbackScope = 'page' | 'element' | 'site'

export const SCOPE_CONFIG = {
  site: {
    emoji: '🌐',
    name: 'Gesamte Website',
    color: FEEDBACK_SCOPE_COLORS.site,
    focusRing: 'focus:ring-purple-500',
    buttonBg: 'bg-purple-600 hover:bg-purple-700',
    borderColor: 'border-purple-500',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-900',
    hoverBg: 'hover:bg-purple-50 hover:border-purple-300',
    activeClasses: 'bg-purple-100 border-purple-300 text-purple-800',
  },
  page: {
    emoji: '📄',
    name: 'Diese Seite',
    color: FEEDBACK_SCOPE_COLORS.page,
    focusRing: 'focus:ring-primary-500',
    buttonBg: 'bg-primary-600 hover:bg-primary-700',
    borderColor: 'border-primary-500',
    bgColor: 'bg-primary-50',
    textColor: 'text-primary-900',
    hoverBg: 'hover:bg-primary-50 hover:border-primary-300',
    activeClasses: 'bg-primary-100 border-primary-300 text-primary-800',
  },
  element: {
    emoji: '🎯',
    name: 'Spezifisches Element',
    color: FEEDBACK_SCOPE_COLORS.element,
    focusRing: 'focus:ring-info-500',
    buttonBg: 'bg-info-600 hover:bg-info-700',
    borderColor: 'border-info-500',
    bgColor: 'bg-info-50',
    textColor: 'text-info-900',
    hoverBg: 'hover:bg-info-50 hover:border-info-300',
    activeClasses: 'bg-info-100 border-info-300 text-info-800',
  },
} as const

export const QUICK_SUGGESTIONS: Record<FeedbackScope, string[]> = {
  site: [
    'Suchfunktion fehlt',
    'Mehrsprachigkeit wäre gut',
    'Navigation verbessern',
    'Mobile verbessern',
    'Performance optimieren',
  ],
  page: [
    'Die Seite lädt zu langsam',
    'Navigation ist unklar',
    'Inhalt ist schwer zu finden',
    'Layout verbessern',
    'Inhalt aktualisieren',
  ],
  element: [
    'Besser sichtbar machen',
    'Neu positionieren',
    'Text ändern',
    'Farbe passt nicht',
    'Entfernen',
  ],
}

export function getQuickSuggestions(scope: FeedbackScope, elementCount = 0): string[] {
  if (scope === 'element' && elementCount === 0) return ['Element auswählen']
  return QUICK_SUGGESTIONS[scope]
}
