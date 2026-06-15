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
    focusRing: 'focus:ring-action',
    buttonBg: 'bg-action hover:bg-action-hover',
    borderColor: 'border-action',
    bgColor: 'bg-action-muted',
    textColor: 'text-action',
    hoverBg: 'hover:bg-action-muted hover:border-action',
    activeClasses: 'bg-action-muted border-action text-action',
  },
  element: {
    emoji: '🎯',
    name: 'Spezifisches Element',
    color: FEEDBACK_SCOPE_COLORS.element,
    focusRing: 'focus:ring-action',
    buttonBg: 'bg-surface-overlay hover:bg-surface-raised',
    borderColor: 'border-strong',
    bgColor: 'bg-surface-raised',
    textColor: 'text-text-primary',
    hoverBg: 'hover:bg-surface-raised hover:border-strong',
    activeClasses: 'bg-surface-overlay border-strong text-text-primary',
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
