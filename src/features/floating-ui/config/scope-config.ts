/**
 * Scope configuration for the feedback/suggestion system.
 * SSOT for scope labels, colors, and quick suggestion options.
 */

import type { FeedbackScope } from '../types'

export const SCOPE_CONFIG = {
  site: {
    emoji: '\uD83C\uDF10',
    name: 'Gesamte Website',
    color: '#7c3aed',
    focusRing: 'focus:ring-purple-500',
    buttonBg: 'bg-purple-600 hover:bg-purple-700',
    borderColor: 'border-purple-500',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-900',
    hoverBg: 'hover:bg-purple-50 hover:border-purple-300'
  },
  page: {
    emoji: '\uD83D\uDCC4',
    name: 'Diese Seite',
    color: '#16a34a',
    focusRing: 'focus:ring-primary-500',
    buttonBg: 'bg-primary-600 hover:bg-primary-700',
    borderColor: 'border-primary-500',
    bgColor: 'bg-primary-50',
    textColor: 'text-primary-900',
    hoverBg: 'hover:bg-primary-50 hover:border-primary-300'
  },
  element: {
    emoji: '\uD83C\uDFAF',
    name: 'Spezifisches Element',
    color: '#2563eb',
    focusRing: 'focus:ring-info-500',
    buttonBg: 'bg-info-600 hover:bg-info-700',
    borderColor: 'border-info-500',
    bgColor: 'bg-info-50',
    textColor: 'text-info-900',
    hoverBg: 'hover:bg-info-50 hover:border-info-300'
  }
} as const

/**
 * Quick suggestions based on feedback scope.
 * Returns contextual suggestion chips for the user.
 */
export const getQuickSuggestions = (scope: FeedbackScope, elementCount: number = 0): string[] => {
  switch (scope) {
    case 'site':
      return ['Navigation verbessern', 'Design modernisieren', 'Performance optimieren', 'Mobile verbessern']
    case 'page':
      return ['Details hinzufügen', 'Link reparieren', 'Layout verbessern', 'Inhalt aktualisieren']
    case 'element':
      return elementCount > 0
        ? ['Besser sichtbar machen', 'Neu positionieren', 'Text ändern', 'Entfernen']
        : ['Element auswählen']
  }
}
