import { Send } from 'lucide-react'
import { getAllSkills } from '@/config/it-hilfe'

interface OfferFormProps {
  showForm: boolean
  onShowForm: () => void
  offerMessage: string
  onMessageChange: (value: string) => void
  offerEstimatedTime: string
  onEstimatedTimeChange: (value: string) => void
  offerCompensation: string
  onCompensationChange: (value: string) => void
  offerSkills: string[]
  onSkillToggle: (skillId: string) => void
  submitting: boolean
  error: string
  onSubmit: (e: React.FormEvent) => void
  onCancel: () => void
}

export function OfferForm({
  showForm,
  onShowForm,
  offerMessage,
  onMessageChange,
  offerEstimatedTime,
  onEstimatedTimeChange,
  offerCompensation,
  onCompensationChange,
  offerSkills,
  onSkillToggle,
  submitting,
  error,
  onSubmit,
  onCancel,
}: OfferFormProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      {!showForm ? (
        <button
          onClick={onShowForm}
          className="w-full py-3 min-h-[44px] bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
        >
          <Send className="w-5 h-5" aria-hidden="true" />
          Angebot abgeben
        </button>
      ) : (
        <form onSubmit={onSubmit}>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Dein Angebot</h3>

          {error && (
            <div id="offer-error" className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="offer-message" className="block text-sm font-medium text-gray-700 mb-1">
                Nachricht an den Anfragenden <span className="text-red-500">*</span>
              </label>
              <textarea
                id="offer-message"
                value={offerMessage}
                onChange={(e) => onMessageChange(e.target.value)}
                placeholder="Beschreibe, wie du helfen kannst und warum du geeignet bist..."
                required
                aria-required="true"
                aria-invalid={!!error}
                aria-describedby={error ? 'offer-error' : undefined}
                minLength={20}
                maxLength={2000}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="offer-estimated-time" className="block text-sm font-medium text-gray-700 mb-1">
                  Geschätzte Dauer (optional)
                </label>
                <input
                  id="offer-estimated-time"
                  type="text"
                  value={offerEstimatedTime}
                  onChange={(e) => onEstimatedTimeChange(e.target.value)}
                  placeholder="z.B. 1-2 Stunden"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                />
              </div>
              <div>
                <label htmlFor="offer-compensation" className="block text-sm font-medium text-gray-700 mb-1">
                  Vergütungsvorschlag (optional)
                </label>
                <input
                  id="offer-compensation"
                  type="text"
                  value={offerCompensation}
                  onChange={(e) => onCompensationChange(e.target.value)}
                  placeholder="z.B. Kostenlos, CHF 30"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Deine relevanten Skills (optional)
              </label>
              <div className="flex flex-wrap gap-2">
                {getAllSkills().map((skill) => (
                  <button
                    key={skill.id}
                    type="button"
                    onClick={() => onSkillToggle(skill.id)}
                    className={`px-3 py-3 min-h-[44px] rounded-full text-sm transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
                      offerSkills.includes(skill.id)
                        ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-500'
                        : 'bg-gray-100 text-gray-700 border-2 border-transparent hover:bg-gray-200'
                    }`}
                  >
                    {skill.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-3 min-h-[44px] text-gray-700 bg-gray-100 rounded-lg font-medium hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={submitting || offerMessage.length < 20}
              className="px-4 py-3 min-h-[44px] bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
            >
              {submitting ? 'Wird gesendet...' : 'Angebot senden'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
