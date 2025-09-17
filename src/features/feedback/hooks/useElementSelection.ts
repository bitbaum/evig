/**
 * Element Selection Hook
 * @fileoverview Custom hook for element selection functionality
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import { SelectedElement } from '../types'
import {
  createSelectedElement,
  isElementSelected,
  addElementHighlight,
  removeElementHighlight,
  cleanupAllHighlights,
  shouldExcludeElement,
  clearSelectedElements
} from '../utils'

interface UseElementSelectionOptions {
  panelRef: React.RefObject<HTMLDivElement>
}

export function useElementSelection({ panelRef }: UseElementSelectionOptions) {
  const [selectedElements, setSelectedElements] = useState<SelectedElement[]>([])
  const [isElementSelectionMode, setIsElementSelectionMode] = useState(false)

  const toggleElementSelection = useCallback(() => {
    setIsElementSelectionMode(prev => !prev)
  }, [])

  const resetSelection = useCallback(() => {
    setSelectedElements([])
    setIsElementSelectionMode(false)
    clearSelectedElements()
  }, [])

  const addSelectedElement = useCallback((element: Element) => {
    const newElement = createSelectedElement(element)
    setSelectedElements(prev => [...prev, newElement])
    element.classList.add('suggestion-selected-element')
  }, [])

  const removeSelectedElement = useCallback((element: Element) => {
    setSelectedElements(prev => prev.filter(selected => selected.element !== element))
    element.classList.remove('suggestion-selected-element')
  }, [])

  // Handle element selection mode
  useEffect(() => {
    if (!isElementSelectionMode) return

    const handleElementClick = (event: MouseEvent) => {
      const target = event.target as Element

      // Check if the click is on the panel itself - if so, ignore it
      if (panelRef.current?.contains(target)) {
        return
      }

      // Check if the click is on the element selection overlay - if so, ignore it
      const overlay = document.querySelector('[data-element-selection-overlay]')
      if (overlay?.contains(target)) {
        return
      }

      // Exclude certain elements
      if (shouldExcludeElement(target)) {
        return
      }

      event.preventDefault()
      event.stopPropagation()

      // Toggle element selection
      if (isElementSelected(target, selectedElements)) {
        removeSelectedElement(target)
      } else {
        addSelectedElement(target)
      }
    }

    const handleMouseOver = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (target && !panelRef.current?.contains(target) && !shouldExcludeElement(target)) {
        addElementHighlight(target)
      }
    }

    const handleMouseOut = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (target) {
        removeElementHighlight(target)
      }
    }

    // Add a small delay to ensure the panel is rendered before attaching listeners
    const timeoutId = setTimeout(() => {
      document.addEventListener('click', handleElementClick, true)
      document.addEventListener('mouseover', handleMouseOver)
      document.addEventListener('mouseout', handleMouseOut)
    }, 100)

    return () => {
      clearTimeout(timeoutId)
      document.removeEventListener('click', handleElementClick, true)
      document.removeEventListener('mouseover', handleMouseOver)
      document.removeEventListener('mouseout', handleMouseOut)
      cleanupAllHighlights()
    }
  }, [isElementSelectionMode, selectedElements, panelRef, addSelectedElement, removeSelectedElement])

  return {
    selectedElements,
    isElementSelectionMode,
    toggleElementSelection,
    resetSelection,
    setIsElementSelectionMode
  }
}