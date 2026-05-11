'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { FeedbackScope, SelectedElement } from '../types'
import { generateSelector } from '@/lib/utils/element-selector'

interface UseElementSelectionParams {
  feedbackScope: FeedbackScope
  setFeedbackScope: (scope: FeedbackScope) => void
}

export function useElementSelection({ feedbackScope, setFeedbackScope }: UseElementSelectionParams) {
  const [isElementSelectionMode, setIsElementSelectionMode] = useState(false)
  const [selectedElements, setSelectedElements] = useState<SelectedElement[]>([])
  const lastHoverRef = useRef<Element | null>(null)

  const toggleElementSelection = useCallback(() => {
    setIsElementSelectionMode(!isElementSelectionMode)
    if (!isElementSelectionMode) {
      setFeedbackScope('element')
    }
  }, [isElementSelectionMode, setFeedbackScope])

  const resetToPageScope = useCallback(() => {
    setFeedbackScope('page')
    setSelectedElements([])
    setIsElementSelectionMode(false)
  }, [setFeedbackScope])

  // Click handler for element selection mode
  useEffect(() => {
    if (!isElementSelectionMode) return

    const handleElementClick = (e: MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()

      const target = e.target as Element
      if (target.closest('[data-suggestion-panel]') || target.closest('[data-element-selection-overlay]')) {
        return
      }

      const elementType = target.tagName.toLowerCase()
      const elementText = target.textContent?.trim() || ''
      const selector = generateSelector(target)

      const elementData: SelectedElement = {
        element: target,
        elementType,
        elementText: elementText.substring(0, 100),
        selector
      }

      const existingIndex = selectedElements.findIndex(el => el.selector === selector)
      if (existingIndex > -1) {
        setSelectedElements(prev => prev.filter((_, i) => i !== existingIndex))
        target.classList.remove('suggestion-selected-element')
      } else {
        setSelectedElements(prev => [...prev, elementData])
        target.classList.add('suggestion-selected-element')
      }
    }

    document.addEventListener('click', handleElementClick, true)
    return () => {
      document.removeEventListener('click', handleElementClick, true)
      // Clean up selected element classes
      document.querySelectorAll('.suggestion-selected-element').forEach(el => {
        el.classList.remove('suggestion-selected-element')
      })
    }
  }, [isElementSelectionMode, selectedElements])

  // Hover highlight while in element selection mode
  useEffect(() => {
    if (!isElementSelectionMode) return

    const handleMouseMove = (e: MouseEvent) => {
      const target = e.target as Element
      if (target.closest('[data-suggestion-panel]') || target.closest('[data-element-selection-overlay]')) {
        return
      }

      if (lastHoverRef.current && lastHoverRef.current !== target) {
        lastHoverRef.current.classList.remove('suggestion-hover-element')
      }
      lastHoverRef.current = target
      target.classList.add('suggestion-hover-element')
    }

    document.addEventListener('mousemove', handleMouseMove, true)
    return () => {
      document.removeEventListener('mousemove', handleMouseMove, true)
      if (lastHoverRef.current) {
        lastHoverRef.current.classList.remove('suggestion-hover-element')
        lastHoverRef.current = null
      }
    }
  }, [isElementSelectionMode])

  return {
    isElementSelectionMode,
    setIsElementSelectionMode,
    selectedElements,
    setSelectedElements,
    toggleElementSelection,
    resetToPageScope,
  }
}
