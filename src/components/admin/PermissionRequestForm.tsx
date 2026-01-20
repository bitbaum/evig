'use client'

import { useState } from 'react'
import { Shield, Send, X, Check } from 'lucide-react'

interface Section {
  id: string
  label: string
  description: string
}

interface PermissionRequestFormProps {
  availableSections: Section[]
  onClose?: () => void
}

export function PermissionRequestForm({ availableSections, onClose }: PermissionRequestFormProps) {
  const [selectedSections, setSelectedSections] = useState<string[]>([])
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const toggleSection = (sectionId: string) => {
    setSelectedSections(prev =>
      prev.includes(sectionId)
        ? prev.filter(s => s !== sectionId)
        : [...prev, sectionId]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (selectedSections.length === 0) {
      setError('Bitte wählen Sie mindestens einen Bereich aus.')
      return
    }

    if (reason.trim().length < 10) {
      setError('Bitte geben Sie einen Grund an (mindestens 10 Zeichen).')
      return
    }

    setSubmitting(true)

    try {
      const response = await fetch('/api/admin/permissions/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sections: selectedSections,
          reason: reason.trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Fehler beim Senden der Anfrage')
      }

      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler')
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="p-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
            <Check className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h3 className="font-semibold text-green-900 dark:text-green-200">
              Anfrage gesendet
            </h3>
            <p className="text-sm text-green-700 dark:text-green-300">
              Ein Super Admin wird Ihre Anfrage prüfen.
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-sm text-green-600 hover:text-green-700"
          >
            Schliessen
          </button>
        )}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
          <Shield className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Zugriff anfordern
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Wählen Sie die Bereiche aus, auf die Sie Zugriff benötigen.
          </p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="ml-auto text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Section Selection */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Bereiche auswählen
        </label>
        <div className="grid grid-cols-2 gap-2">
          {availableSections.map(section => (
            <button
              key={section.id}
              type="button"
              onClick={() => toggleSection(section.id)}
              className={`p-3 text-left rounded-lg border transition-colors ${
                selectedSections.includes(section.id)
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="font-medium text-gray-900 dark:text-white">
                {section.label}
              </span>
              <span className="block text-xs text-gray-500 dark:text-gray-400 mt-1">
                {section.description}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Reason */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Begründung
        </label>
        <textarea
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder="Warum benötigen Sie Zugriff auf diese Bereiche?"
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={submitting || selectedSections.length === 0}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors"
      >
        {submitting ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Wird gesendet...
          </>
        ) : (
          <>
            <Send className="w-4 h-4" />
            Anfrage senden
          </>
        )}
      </button>
    </form>
  )
}
