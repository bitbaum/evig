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
    focusRing: 'focus:ring-green-500',
    buttonBg: 'bg-green-600 hover:bg-green-700',
    borderColor: 'border-green-500',
    bgColor: 'bg-green-50',
    textColor: 'text-green-900',
    hoverBg: 'hover:bg-green-50 hover:border-green-300'
  },
  element: {
    emoji: '\uD83C\uDFAF',
    name: 'Spezifisches Element',
    color: '#2563eb',
    focusRing: 'focus:ring-blue-500',
    buttonBg: 'bg-blue-600 hover:bg-blue-700',
    borderColor: 'border-blue-500',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-900',
    hoverBg: 'hover:bg-blue-50 hover:border-blue-300'
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
