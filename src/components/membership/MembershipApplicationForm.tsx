'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { CheckCircle, Loader2, AlertCircle } from 'lucide-react'
import { apiFetch } from '@/lib/api/client'

export function MembershipApplicationForm() {
  const { data: session } = useSession()
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    applicantName: session?.user?.name || '',
    applicantEmail: session?.user?.email || '',
    addressStreet: '',
    addressPostalCode: '',
    addressCity: '',
    birthDate: '',
    memberType: 'regular' as 'regular' | 'reduced',
    motivation: '',
  })

  const canSubmit =
    !submitting &&
    formData.applicantName.trim().length >= 2 &&
    /\S+@\S+\.\S+/.test(formData.applicantEmail) &&
    formData.addressStreet.trim().length >= 2 &&
    /^\d{4}$/.test(formData.addressPostalCode) &&
    formData.addressCity.trim().length >= 2

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return

    setSubmitting(true)
    setError(null)

    const { data, error: apiError } = await apiFetch<{ id: string; message: string }>(
      '/api/membership/apply',
      {
        method: 'POST',
        body: formData,
      }
    )

    setSubmitting(false)

    if (apiError) {
      setError(apiError)
      return
    }

    if (data?.id) {
      setSuccess(true)
    }
  }

  if (success) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-xl font-bold text-green-900 mb-2">Antrag eingereicht!</h3>
        <p className="text-green-800">
          Dein Mitgliedschaftsantrag wurde erfolgreich gespeichert. Wir prüfen ihn an der nächsten
          Vorstandssitzung und melden uns per E-Mail bei dir.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Membership type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Mitgliedschaftsart *
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setFormData({ ...formData, memberType: 'regular' })}
            className={`px-4 py-3 rounded-lg border-2 text-left transition-colors ${
              formData.memberType === 'regular'
                ? 'border-green-600 bg-green-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="font-semibold text-gray-900">Regulär</div>
            <div className="text-sm text-gray-600">CHF 50 / Jahr</div>
          </button>
          <button
            type="button"
            onClick={() => setFormData({ ...formData, memberType: 'reduced' })}
            className={`px-4 py-3 rounded-lg border-2 text-left transition-colors ${
              formData.memberType === 'reduced'
                ? 'border-green-600 bg-green-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="font-semibold text-gray-900">Ermässigt</div>
            <div className="text-sm text-gray-600">CHF 20 / Jahr</div>
            <div className="text-xs text-gray-500 mt-0.5">Studierende, Lernende</div>
          </button>
        </div>
      </div>

      {/* Name + Email */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Name *
          </label>
          <input
            id="name"
            type="text"
            required
            value={formData.applicantName}
            onChange={(e) => setFormData({ ...formData, applicantName: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            E-Mail *
          </label>
          <input
            id="email"
            type="email"
            required
            value={formData.applicantEmail}
            onChange={(e) => setFormData({ ...formData, applicantEmail: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Street */}
      <div>
        <label htmlFor="street" className="block text-sm font-medium text-gray-700 mb-1">
          Strasse und Hausnummer *
        </label>
        <input
          id="street"
          type="text"
          required
          value={formData.addressStreet}
          onChange={(e) => setFormData({ ...formData, addressStreet: e.target.value })}
          placeholder="z.B. Bahnhofstrasse 1"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
        />
      </div>

      {/* PLZ + City */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label htmlFor="plz" className="block text-sm font-medium text-gray-700 mb-1">
            PLZ *
          </label>
          <input
            id="plz"
            type="text"
            inputMode="numeric"
            pattern="\d{4}"
            maxLength={4}
            required
            value={formData.addressPostalCode}
            onChange={(e) => setFormData({ ...formData, addressPostalCode: e.target.value })}
            placeholder="8000"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
        <div className="col-span-2">
          <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
            Ort *
          </label>
          <input
            id="city"
            type="text"
            required
            value={formData.addressCity}
            onChange={(e) => setFormData({ ...formData, addressCity: e.target.value })}
            placeholder="Zürich"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Motivation (optional) */}
      <div>
        <label htmlFor="motivation" className="block text-sm font-medium text-gray-700 mb-1">
          Warum möchtest du Mitglied werden? <span className="text-gray-400">(optional)</span>
        </label>
        <textarea
          id="motivation"
          rows={3}
          maxLength={2000}
          value={formData.motivation}
          onChange={(e) => setFormData({ ...formData, motivation: e.target.value })}
          placeholder="Erzähl uns kurz, was dich an RevampIT interessiert..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
        />
      </div>

      {/* Submit */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={!canSubmit}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-md bg-green-600 px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-green-500 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Wird eingereicht...
            </>
          ) : (
            'Antrag einreichen'
          )}
        </button>
        <p className="mt-3 text-xs text-gray-500">
          Nach dem Einreichen wird dein Antrag an der nächsten Vorstandssitzung geprüft. Du erhältst dann eine E-Mail mit der Entscheidung und Zahlungsinformationen.
        </p>
      </div>
    </form>
  )
}
