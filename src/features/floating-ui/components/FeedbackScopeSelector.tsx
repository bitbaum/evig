'use client'

import { cn } from '@/lib/utils'
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
      <label className="block text-xs font-medium text-gray-700">
        Feedback-Bereich *
      </label>
      <div className="grid grid-cols-1 gap-2">
        {(Object.keys(SCOPE_CONFIG) as FeedbackScope[]).map((scope) => {
          const config = SCOPE_CONFIG[scope]
          const isActive = feedbackScope === scope

          return (
            <button
              key={scope}
              type="button"
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
                  ? `${config.bgColor} ${config.borderColor} ${config.textColor} shadow-md transform scale-[1.02]`
                  : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300"
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
            </button>
          )
        })}
      </div>

      {feedbackScope === 'element' && (
        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <button
            type="button"
            onClick={toggleElementSelection}
            className={cn(
              "w-full px-3 py-2 text-sm rounded-lg border-2 transition-all duration-200",
              isElementSelectionMode
                ? "bg-blue-600 text-white border-blue-600 shadow-md"
                : "bg-white text-blue-700 border-blue-300 hover:bg-blue-50 hover:border-blue-400"
            )}
          >
            <div className="flex items-center justify-center space-x-2">
              <span>{'\uD83C\uDFAF'}</span>
              <span className="font-medium">
                {isElementSelectionMode
                  ? `Auswahl aktiv (${selectedElements.length})`
                  : "Elemente auswählen"}
              </span>
            </div>
          </button>

          {selectedElements.length > 0 && !isElementSelectionMode && (
            <div className="mt-2 p-2 bg-white rounded border border-blue-200">
              <p className="text-xs font-medium text-blue-800 mb-1">
                {selectedElements.length} Element{selectedElements.length > 1 ? 'e' : ''} ausgewählt
              </p>
              <div className="space-y-1">
                {selectedElements.slice(0, 2).map((el, index) => (
                  <div key={index} className="text-xs text-blue-700 bg-blue-50 px-2 py-1 rounded truncate">
                    {el.elementType}: {el.elementText.substring(0, 25)}...
                  </div>
                ))}
                {selectedElements.length > 2 && (
                  <div className="text-xs text-blue-600 italic">
                    +{selectedElements.length - 2} weitere...
                  </div>
                )}
              </div>
            </div>
          )}

          {isElementSelectionMode && (
            <div className="mt-2 text-xs text-blue-700 bg-blue-100 p-2 rounded">
              Klicken Sie auf Elemente der Seite, um sie auszuwählen
            </div>
          )}
        </div>
      )}
    </div>
  )
}
