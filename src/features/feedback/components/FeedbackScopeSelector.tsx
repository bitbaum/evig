/**
 * FeedbackScopeSelector Component
 * @fileoverview Component for selecting feedback scope (page, site, element)
 */

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { FeedbackScope, SelectedElement } from '../types'

interface FeedbackScopeSelectorProps {
  feedbackScope: FeedbackScope
  selectedElements: SelectedElement[]
  onScopeChange: (scope: FeedbackScope) => void
  onElementSelectionToggle: () => void
  onResetToPageScope: () => void
  isElementSelectionMode: boolean
}

export function FeedbackScopeSelector({
  feedbackScope,
  selectedElements,
  onScopeChange,
  onElementSelectionToggle,
  onResetToPageScope,
  isElementSelectionMode
}: FeedbackScopeSelectorProps) {
  const scopes = [
    {
      id: 'page' as FeedbackScope,
      label: 'Diese Seite',
      description: 'Verbesserungen für die aktuelle Seite',
      color: 'green',
      icon: '📄'
    },
    {
      id: 'site' as FeedbackScope,
      label: 'Gesamte Website',
      description: 'Allgemeine Verbesserungen',
      color: 'purple',
      icon: '🌐'
    },
    {
      id: 'element' as FeedbackScope,
      label: 'Spezifische Elemente',
      description: selectedElements.length === 0
        ? 'Elemente auf der Seite auswählen'
        : `${selectedElements.length} Element${selectedElements.length > 1 ? 'e' : ''} ausgewählt`,
      color: 'blue',
      icon: '🎯'
    }
  ]

  return (
    <div className="space-y-2">
      <div className="text-xs font-medium text-neutral-700">Umfang der Rückmeldung:</div>
      <div className="flex flex-wrap gap-1">
        {scopes.map((scope) => (
          <button
            key={scope.id}
            onClick={() => {
              if (scope.id === 'element' && !isElementSelectionMode) {
                onElementSelectionToggle()
              } else if (scope.id !== 'element') {
                onScopeChange(scope.id)
                onResetToPageScope()
              }
            }}
            disabled={isElementSelectionMode && scope.id !== 'element'}
            className={cn(
              "flex-1 min-w-0 px-2 py-1.5 rounded-lg border text-xs font-medium transition-all",
              "flex items-center justify-center space-x-1",
              feedbackScope === scope.id
                ? scope.id === 'page'
                  ? "bg-primary-100 border-primary-300 text-primary-800"
                  : scope.id === 'site'
                  ? "bg-purple-100 border-purple-300 text-purple-800"
                  : "bg-blue-100 border-blue-300 text-blue-800"
                : "bg-white border-neutral-300 text-neutral-600 hover:bg-neutral-50"
            )}
          >
            <span className="text-sm">{scope.icon}</span>
            <span className="truncate">{scope.label}</span>
          </button>
        ))}
      </div>

      {feedbackScope === 'element' && (
        <div className="text-xs text-neutral-600 bg-blue-50 p-2 rounded">
          {isElementSelectionMode ? (
            <div className="flex items-center justify-between">
              <span>Element-Auswahl aktiv - klicken Sie auf Elemente</span>
              <Button
                size="sm"
                variant="outline"
                onClick={onElementSelectionToggle}
                className="h-6 px-2 text-xs"
              >
                Abbrechen
              </Button>
            </div>
          ) : (
            <span>
              {selectedElements.length === 0
                ? "Klicken Sie auf 'Spezifische Elemente' um Elemente auszuwählen"
                : `${selectedElements.length} Element${selectedElements.length > 1 ? 'e' : ''} ausgewählt`
              }
            </span>
          )}
        </div>
      )}
    </div>
  )
}
