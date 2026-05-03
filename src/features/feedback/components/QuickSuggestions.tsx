/**
 * QuickSuggestions Component
 * @fileoverview Component providing quick suggestion templates based on scope
 */

import { Button } from '@/components/ui/button'
import { FeedbackScope, SelectedElement } from '../types'

interface QuickSuggestionsProps {
  feedbackScope: FeedbackScope
  selectedElements: SelectedElement[]
  onQuickSuggestion: (suggestion: string) => void
}

export function QuickSuggestions({
  feedbackScope,
  selectedElements,
  onQuickSuggestion
}: QuickSuggestionsProps) {
  const getSuggestions = () => {
    switch (feedbackScope) {
      case 'page':
        return [
          "Die Seite lädt zu langsam",
          "Navigation ist unklar",
          "Inhalt ist schwer zu finden",
          "Mobile Ansicht könnte besser sein",
          "Farben/Text sind schlecht lesbar"
        ]
      case 'site':
        return [
          "Suchfunktion fehlt",
          "Mehrsprachigkeit wäre gut",
          "Newsletter-Anmeldung hinzufügen",
          "Soziale Medien Links fehlen",
          "Datenschutz-Informationen verbessern"
        ]
      case 'element':
        if (selectedElements.length === 0) return []
        return [
          "Dieses Element ist nicht klar",
          "Text ist zu klein/gross",
          "Farbe passt nicht zum Design",
          "Funktionalität fehlt",
          "Positionierung ist ungünstig"
        ]
      default:
        return []
    }
  }

  const suggestions = getSuggestions()

  if (suggestions.length === 0) return null

  return (
    <div className="space-y-2">
      <div className="text-xs font-medium text-neutral-700">Schnellvorschläge:</div>
      <div className="flex flex-wrap gap-1">
        {suggestions.map((suggestion, index) => (
          <Button
            key={index}
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onQuickSuggestion(suggestion)}
            className="h-6 px-2 text-xs bg-neutral-50 hover:bg-neutral-100 border-neutral-200 text-neutral-600 hover:text-neutral-800"
          >
            {suggestion}
          </Button>
        ))}
      </div>
    </div>
  )
}






