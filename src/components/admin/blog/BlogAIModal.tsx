import { Sparkles, Wand2, X, Loader2 } from 'lucide-react'
import type { Category } from './types'

interface QuickAction {
  readonly key: string
  readonly label: string
  readonly prompt: string
}

interface Props {
  aiMode: 'generate' | 'refine'
  aiTopic: string
  aiInstruction: string
  aiGenerating: boolean
  aiError: string
  categoryName?: string
  quickActions: readonly QuickAction[]
  onTopicChange: (value: string) => void
  onInstructionChange: (value: string) => void
  onGenerate: () => void
  onRefine: (instruction?: string) => void
  onClose: () => void
}

export function BlogAIModal({
  aiMode,
  aiTopic,
  aiInstruction,
  aiGenerating,
  aiError,
  categoryName,
  quickActions,
  onTopicChange,
  onInstructionChange,
  onGenerate,
  onRefine,
  onClose,
}: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            {aiMode === 'generate' ? (
              <>
                <Sparkles className="w-5 h-5 text-purple-500" />
                Artikel mit KI generieren
              </>
            ) : (
              <>
                <Wand2 className="w-5 h-5 text-purple-500" />
                Artikel mit KI verbessern
              </>
            )}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
          {aiMode === 'generate'
            ? 'Beschreiben Sie das Thema oder die Idee für Ihren Blog-Artikel. Die KI wird einen vollständigen Entwurf generieren.'
            : 'Beschreiben Sie, wie der Artikel verbessert werden soll, oder nutzen Sie die Schnellaktionen.'}
        </p>

        {aiError && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg mb-4 text-sm">
            {aiError}
          </div>
        )}

        <div className="space-y-4">
          {aiMode === 'generate' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Thema / Idee *
              </label>
              <textarea
                value={aiTopic}
                onChange={(e) => onTopicChange(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder='z.B. "Wie man einen alten Laptop wieder fit macht" oder "Die Vorteile von Refurbished-Geräten für die Umwelt"'
                disabled={aiGenerating}
              />
            </div>
          ) : (
            <>
              {/* Quick Actions for Refinement */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Schnellaktionen
                </label>
                <div className="flex flex-wrap gap-2">
                  {quickActions.map((action) => (
                    <button
                      key={action.key}
                      onClick={() => onRefine(action.prompt)}
                      disabled={aiGenerating}
                      className="px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg text-sm font-medium hover:bg-purple-200 dark:hover:bg-purple-800/40 disabled:opacity-50 transition-colors"
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">oder</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Eigene Anweisung
                </label>
                <textarea
                  value={aiInstruction}
                  onChange={(e) => onInstructionChange(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder='z.B. "Füge einen Abschnitt über Reparatur-Tipps hinzu" oder "Mache den Text ansprechender"'
                  disabled={aiGenerating}
                />
              </div>
            </>
          )}

          {categoryName && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Kategorie: <span className="font-medium">{categoryName}</span>
            </p>
          )}

          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              disabled={aiGenerating}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Abbrechen
            </button>
            {aiMode === 'generate' ? (
              <button
                onClick={onGenerate}
                disabled={aiGenerating || !aiTopic.trim()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-medium rounded-lg transition-colors"
              >
                {aiGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generiere...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generieren
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={() => onRefine()}
                disabled={aiGenerating || !aiInstruction.trim()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-medium rounded-lg transition-colors"
              >
                {aiGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Verbessere...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4" />
                    Verbessern
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
