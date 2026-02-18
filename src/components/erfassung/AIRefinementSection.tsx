import { Loader2, ChevronDown, ChevronUp, Wand2, Sparkles } from 'lucide-react'

const AI_QUICK_ACTIONS = [
  { key: 'addSpecs', label: 'Specs ergänzen', prompt: 'Ergänze die technischen Spezifikationen basierend auf dem bekannten Produktmodell. Füge CPU, RAM, Speicher, Display-Grösse und andere relevante Specs hinzu.' },
  { key: 'estimatePrice', label: 'Preis schätzen', prompt: 'Schätze einen realistischen Verkaufspreis für den Schweizer Markt für gebrauchte Geräte. Berücksichtige Zustand, Alter und aktuelle Marktpreise auf ricardo.ch und tutti.ch.' },
  { key: 'improveDescription', label: 'Beschreibung verbessern', prompt: 'Verbessere die Kurzbeschreibung: Mache sie ansprechender und informativer. Hebe die wichtigsten Verkaufsargumente hervor.' },
]

interface Props {
  visible: boolean
  expanded: boolean
  onToggle: () => void
  aiError: string
  aiSuccess: string
  aiRefining: boolean
  aiInstruction: string
  onInstructionChange: (value: string) => void
  onRefine: (instruction?: string) => void
}

export function AIRefinementSection({
  visible,
  expanded,
  onToggle,
  aiError,
  aiSuccess,
  aiRefining,
  aiInstruction,
  onInstructionChange,
  onRefine,
}: Props) {
  if (!visible) return null

  return (
    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl shadow-sm border border-purple-200 dark:border-purple-700 p-4 sm:p-6">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between"
      >
        <h2 className="text-base sm:text-lg font-semibold text-purple-900 dark:text-purple-100 flex items-center gap-2">
          <Wand2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          Mit KI verbessern
        </h2>
        {expanded ? (
          <ChevronUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-purple-600 dark:text-purple-400" />
        )}
      </button>

      {expanded && (
        <div className="mt-4 space-y-4">
          <p className="text-sm text-purple-700 dark:text-purple-300">
            Nutze KI, um fehlende Daten zu ergänzen oder die Produktinformationen zu verbessern.
          </p>

          {aiError && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm">
              {aiError}
            </div>
          )}
          {aiSuccess && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 px-4 py-3 rounded-lg text-sm">
              {aiSuccess}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-2">
              Schnellaktionen
            </label>
            <div className="flex flex-wrap gap-2">
              {AI_QUICK_ACTIONS.map((action) => (
                <button
                  key={action.key}
                  type="button"
                  onClick={() => onRefine(action.prompt)}
                  disabled={aiRefining}
                  className="px-3 py-1.5 bg-purple-100 dark:bg-purple-800/40 text-purple-700 dark:text-purple-300 rounded-lg text-sm font-medium hover:bg-purple-200 dark:hover:bg-purple-700/50 disabled:opacity-50 transition-colors touch-manipulation"
                >
                  <Sparkles className="w-3 h-3 inline mr-1" />
                  {action.label}
                </button>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-purple-200 dark:border-purple-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 text-purple-500">oder</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-2">
              Eigene Anweisung
            </label>
            <div className="flex gap-2">
              <textarea
                value={aiInstruction}
                onChange={(e) => onInstructionChange(e.target.value)}
                rows={2}
                className="flex-1 px-4 py-2 bg-white dark:bg-gray-700 border border-purple-200 dark:border-purple-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                placeholder='z.B. "Finde die genauen Spezifikationen für dieses ThinkPad Modell"'
                disabled={aiRefining}
              />
              <button
                type="button"
                onClick={() => onRefine()}
                disabled={aiRefining || !aiInstruction.trim()}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-medium rounded-lg transition-colors touch-manipulation"
              >
                {aiRefining ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Wand2 className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
