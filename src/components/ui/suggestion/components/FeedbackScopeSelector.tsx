/**
 * FeedbackScopeSelector Component
 * @fileoverview Scope selection component for better modularity and reusability
 */

import { cn } from '@/lib/utils'
import { SCOPE_CONFIG, FeedbackScope, SelectedElement } from '../types'
import { clearSelectedElements } from '../utils'

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

  const handleScopeChange = (scope: FeedbackScope, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (scope === feedbackScope) return

    if (scope === 'page') {
      onResetToPageScope()
    } else if (scope === 'element') {
      onScopeChange(scope)
      onElementSelectionToggle()
    } else {
      onScopeChange(scope)
      clearSelectedElements()
    }
  }

  return (
    <div className="mb-2">
      <h4 className="text-sm font-medium text-gray-700 mb-1.5">Was möchten Sie verbessern?</h4>
      <div className="flex gap-1">
        {Object.entries(SCOPE_CONFIG).map(([scope, config]) => {
          const typedScope = scope as FeedbackScope
          const isActive = feedbackScope === typedScope

          return (
            <button
              key={scope}
              type="button"
              onClick={(e) => handleScopeChange(typedScope, e)}
              className={cn(
                "flex-1 p-1.5 rounded-md border transition-all duration-200 text-center text-xs",
                isActive
                  ? `${config.borderColor} ${config.bgColor} ${config.textColor} font-medium`
                  : `border-gray-200 bg-white text-gray-700 ${config.hoverBg}`
              )}
            >
              <div className="font-medium">{config.name}</div>
              {typedScope === 'element' && selectedElements.length > 0 && (
                <div className="text-xs mt-0.5 text-blue-600">{selectedElements.length}</div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}