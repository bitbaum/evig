import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { SCOPE_CONFIG } from '@/config/feedback-scopes'
import type { FeedbackScope } from '../types'
import type { SelectedElement } from '../types'

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
  return (
    <div className="space-y-2">
      <div className="text-xs font-medium text-neutral-700">Umfang der Rückmeldung:</div>
      <div className="flex flex-wrap gap-1">
        {(Object.keys(SCOPE_CONFIG) as FeedbackScope[]).map((scopeKey) => {
          const config = SCOPE_CONFIG[scopeKey]
          return (
            <button
              key={scopeKey}
              onClick={() => {
                if (scopeKey === 'element' && !isElementSelectionMode) {
                  onElementSelectionToggle()
                } else if (scopeKey !== 'element') {
                  onScopeChange(scopeKey)
                  onResetToPageScope()
                }
              }}
              disabled={isElementSelectionMode && scopeKey !== 'element'}
              className={cn(
                "flex-1 min-w-0 px-2 py-1.5 rounded-lg border text-xs font-medium transition-all",
                "flex items-center justify-center space-x-1",
                feedbackScope === scopeKey
                  ? config.activeClasses
                  : "bg-white border-neutral-300 text-neutral-600 hover:bg-neutral-50"
              )}
            >
              <span className="text-sm">{config.emoji}</span>
              <span className="truncate">{config.name}</span>
            </button>
          )
        })}
      </div>

      {feedbackScope === 'element' && (
        <div className="text-xs text-neutral-600 bg-neutral-50 p-2 rounded">
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
                ? "Klicken Sie auf 'Spezifisches Element' um Elemente auszuwählen"
                : `${selectedElements.length} Element${selectedElements.length > 1 ? 'e' : ''} ausgewählt`
              }
            </span>
          )}
        </div>
      )}
    </div>
  )
}
