/**
 * useElementSelection Hook
 * @fileoverview Custom hook for managing element selection functionality
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import { ELEMENT_SELECTION_COLORS } from '@/config/ui-colors'
import { generateSelector } from '@/lib/utils/element-selector'
import { SelectedElement } from '../types'

interface UseElementSelectionProps {
  panelRef: React.RefObject<HTMLDivElement>
}

interface UseElementSelectionReturn {
  selectedElements: SelectedElement[]
  isElementSelectionMode: boolean
  toggleElementSelection: () => void
  resetSelection: () => void
  setIsElementSelectionMode: (mode: boolean) => void
}

export function useElementSelection({ panelRef }: UseElementSelectionProps): UseElementSelectionReturn {
  const [selectedElements, setSelectedElements] = useState<SelectedElement[]>([])
  const [isElementSelectionMode, setIsElementSelectionMode] = useState(false)
  const lastHoverRef = useRef<HTMLElement | null>(null)

  // Handle element click in selection mode
  const handleElementClick = useCallback((event: MouseEvent) => {
    if (!isElementSelectionMode) return

    event.preventDefault()
    event.stopPropagation()

    const target = event.target as Element
    const selector = generateSelector(target)

    // Check if element is already selected
    const isAlreadySelected = selectedElements.some(el => el.selector === selector)

    if (isAlreadySelected) {
      // Remove from selection
      setSelectedElements(prev => prev.filter(el => el.selector !== selector))
    } else {
      // Add to selection
      const selectedElement: SelectedElement = {
        element: target,
        selector,
        text: target.textContent?.slice(0, 50) || ''
      }
      setSelectedElements(prev => [...prev, selectedElement])
    }
  }, [isElementSelectionMode, selectedElements, generateSelector])

  // Handle element hover in selection mode
  const handleElementHover = useCallback((event: MouseEvent) => {
    if (!isElementSelectionMode) return

    const target = event.target as HTMLElement

    // Remove previous hover styling
    if (lastHoverRef.current && lastHoverRef.current !== target) {
      lastHoverRef.current.style.outline = ''
      lastHoverRef.current.style.cursor = ''
    }

    // Add hover styling
    if (target && !panelRef.current?.contains(target)) {
      target.style.outline = `2px solid ${ELEMENT_SELECTION_COLORS.outline}`
      target.style.cursor = 'pointer'
      lastHoverRef.current = target
    }
  }, [isElementSelectionMode, panelRef])

  // Handle mouse leave in selection mode
  const handleElementLeave = useCallback(() => {
    if (!isElementSelectionMode) return

    if (lastHoverRef.current) {
      lastHoverRef.current.style.outline = ''
      lastHoverRef.current.style.cursor = ''
      lastHoverRef.current = null
    }
  }, [isElementSelectionMode])

  // Toggle element selection mode
  const toggleElementSelection = useCallback(() => {
    setIsElementSelectionMode(prev => !prev)
  }, [])

  // Reset selection
  const resetSelection = useCallback(() => {
    setSelectedElements([])
  }, [])

  // Add/remove event listeners when selection mode changes
  useEffect(() => {
    if (isElementSelectionMode) {
      document.addEventListener('click', handleElementClick, true)
      document.addEventListener('mouseover', handleElementHover)
      document.addEventListener('mouseout', handleElementLeave)

      // Add global styles for selected elements
      const style = document.createElement('style')
      style.textContent = `
        .suggestion-selected-element {
          position: relative;
          box-shadow: 0 0 0 3px ${ELEMENT_SELECTION_COLORS.outline} !important;
          border: 2px solid ${ELEMENT_SELECTION_COLORS.border} !important;
        }
        .suggestion-selected-element::after {
          content: '✓';
          position: absolute;
          top: -8px;
          right: -8px;
          background: ${ELEMENT_SELECTION_COLORS.badge};
          color: white;
          border-radius: 50%;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: bold;
          z-index: 1000;
        }
      `
      style.id = 'suggestion-element-styles'
      document.head.appendChild(style)

      return () => {
        document.removeEventListener('click', handleElementClick, true)
        document.removeEventListener('mouseover', handleElementHover)
        document.removeEventListener('mouseout', handleElementLeave)
        const existingStyle = document.getElementById('suggestion-element-styles')
        if (existingStyle) existingStyle.remove()
      }
    } else {
      // Clean up when exiting selection mode
      if (lastHoverRef.current) {
        lastHoverRef.current.style.outline = ''
        lastHoverRef.current.style.cursor = ''
        lastHoverRef.current = null
      }

      // Remove selection classes from elements
      selectedElements.forEach(({ selector }) => {
        try {
          const elements = document.querySelectorAll(selector)
          elements.forEach(el => el.classList.remove('suggestion-selected-element'))
        } catch (e) {
          // Ignore invalid selectors
        }
      })
    }
  }, [isElementSelectionMode, handleElementClick, handleElementHover, handleElementLeave, selectedElements])

  // Update selected elements styling
  useEffect(() => {
    selectedElements.forEach(({ selector }) => {
      try {
        const elements = document.querySelectorAll(selector)
        elements.forEach(el => el.classList.add('suggestion-selected-element'))
      } catch (e) {
        // Ignore invalid selectors
      }
    })

    return () => {
      selectedElements.forEach(({ selector }) => {
        try {
          const elements = document.querySelectorAll(selector)
          elements.forEach(el => el.classList.remove('suggestion-selected-element'))
        } catch (e) {
          // Ignore invalid selectors
        }
      })
    }
  }, [selectedElements])

  return {
    selectedElements,
    isElementSelectionMode,
    toggleElementSelection,
    resetSelection,
    setIsElementSelectionMode
  }
}





