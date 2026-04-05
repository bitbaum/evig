'use client'

import { CheckCircle, Loader2 } from 'lucide-react'

interface MarkCompletedCardProps {
  onMarkCompleted: () => void
  submitting: boolean
}

/**
 * Card shown to the accepted helper while a request is in the matched state,
 * inviting them to mark the repair as done.
 */
export function MarkCompletedCard({ onMarkCompleted, submitting }: MarkCompletedCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-emerald-200 p-6">
      <div className="flex items-start gap-3">
        <CheckCircle className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            Hilfe abgeschlossen?
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Wenn du die Reparatur bzw. Hilfe beendet hast, markiere sie als
            abgeschlossen. Der Anfragende wird dann gebeten, dir eine Bewertung
            zu hinterlassen.
          </p>
          <button
            type="button"
            onClick={onMarkCompleted}
            disabled={submitting}
            className="inline-flex items-center gap-2 px-5 py-3 min-h-[44px] bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Wird gespeichert...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" aria-hidden="true" />
                Als abgeschlossen markieren
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
