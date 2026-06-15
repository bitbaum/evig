'use client'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { SCOPE_CONFIG } from '../config/scope-config'
import type { FeedbackScope, SelectedElement } from '../types'

interface FeedbackScopeSelectorProps {
  feedbackScope: FeedbackScope
  setFeedbackScope: (scope: FeedbackScope) => void
  isElementSelectionMode: boolean
  setIsElementSelectionMode: (mode: boolean) => void
  selectedElements: SelectedElement[]
  setSelectedElements: (elements: SelectedElement[]) => void
  toggleElementSelection: () => void
}

export function FeedbackScopeSelector({
  feedbackScope,
  setFeedbackScope,
  isElementSelectionMode,
  setIsElementSelectionMode,
  selectedElements,
  setSelectedElements,
  toggleElementSelection,
}: FeedbackScopeSelectorProps) {
  return (
    <div className="space-y-3">
      <label className="block text-xs font-medium text-text-secondary">
        Feedback-Bereich *
      </label>
      <div className="grid grid-cols-1 gap-2">
        {(Object.keys(SCOPE_CONFIG) as FeedbackScope[]).map((scope) => {
          const config = SCOPE_CONFIG[scope]
          const isActive = feedbackScope === scope

          return (
            <Button
              key={scope}
              type="button"
              variant="ghost"
              onClick={() => {
                setFeedbackScope(scope)
                if (scope !== 'element') {
                  setIsElementSelectionMode(false)
                  setSelectedElements([])
                }
              }}
              className={cn(
                "w-full px-3 py-2.5 text-xs rounded-lg border-2 transition-all duration-200",
                isActive
                  ? `${config.bgColor} ${config.borderColor} ${config.textColor} transform scale-[1.02]`
                  : "bg-surface-base border text-text-secondary hover:bg-surface-raised hover:border-strong"
              )}
            >
              <div className="flex items-center space-x-3">
                <span className="text-base">{config.emoji}</span>
                <div className="text-left">
                  <span className="font-medium block leading-tight">{config.name}</span>
                  <span className="text-xs opacity-75 block leading-tight">
                    {scope === 'site' && 'Gesamte Website verbessern'}
                    {scope === 'page' && 'Diese Seite optimieren'}
                    {scope === 'element' && 'Spezifische Elemente auswählen'}
                  </span>
                </div>
                {isActive && (
                  <div className="ml-auto">
                    <div className="w-2 h-2 bg-current rounded-full opacity-75"></div>
                  </div>
                )}
              </div>
            </Button>
          )
        })}
      </div>

      {feedbackScope === 'element' && (
        <div className="mt-3 p-3 bg-surface-raised border border-subtle rounded-lg">
          <Button
            type="button"
            variant={isElementSelectionMode ? 'primary' : 'outline'}
            onClick={toggleElementSelection}
            className="w-full"
          >
            <div className="flex items-center justify-center space-x-2">
              <span>{'\uD83C\uDFAF'}</span>
              <span className="font-medium">
                {isElementSelectionMode
                  ? `Auswahl aktiv (${selectedElements.length})`
                  : "Elemente auswählen"}
              </span>
            </div>
          </Button>

          {selectedElements.length > 0 && !isElementSelectionMode && (
            <div className="mt-2 p-2 bg-surface-base rounded border border-subtle">
              <p className="text-xs font-medium text-text-primary mb-1">
                {selectedElements.length} Element{selectedElements.length > 1 ? 'e' : ''} ausgewählt
              </p>
              <div className="space-y-1">
                {selectedElements.slice(0, 2).map((el, index) => (
                  <div key={index} className="text-xs text-text-secondary bg-surface-raised px-2 py-1 rounded truncate">
                    {el.elementType}: {el.elementText.substring(0, 25)}...
                  </div>
                ))}
                {selectedElements.length > 2 && (
                  <div className="text-xs text-text-muted italic">
                    +{selectedElements.length - 2} weitere...
                  </div>
                )}
              </div>
            </div>
          )}

          {isElementSelectionMode && (
            <div className="mt-2 text-xs text-text-secondary bg-surface-overlay p-2 rounded">
              Klicken Sie auf Elemente der Seite, um sie auszuwählen
            </div>
          )}
        </div>
      )}
    </div>
  )
}
