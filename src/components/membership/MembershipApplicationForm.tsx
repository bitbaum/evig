'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { CheckCircle, Loader2, AlertCircle, Copy, Check } from 'lucide-react'
import { apiFetch } from '@/lib/api/client'
import Heading from '@/components/ui/Heading'
import { BANK, MEMBERSHIP, ORG } from '@/config/org'

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard.writeText(value.replace(/\s/g, ''))
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }}
      className="inline-flex items-center gap-1 text-xs text-green-600 hover:text-green-700 font-medium"
    >
      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
      {copied ? 'Kopiert!' : label}
    </button>
  )
}

export function MembershipApplicationForm() {
  const { data: session } = useSession()
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [memberType, setMemberType] = useState<'regular' | 'reduced'>('regular')
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    applicantName: session?.user?.name || '',
    applicantEmail: session?.user?.email || '',
    addressStreet: '',
    addressPostalCode: '',
    addressCity: '',
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

    const { data, error: apiError } = await apiFetch<{ id: string; memberType: string }>(
      '/api/membership/apply',
      { method: 'POST', body: { ...formData, memberType } }
    )

    setSubmitting(false)

    if (apiError) {
      setError(apiError)
      return
    }

    if (data?.id) setSuccess(true)
  }

  const fee = memberType === 'reduced' ? MEMBERSHIP.fees.reduced : MEMBERSHIP.fees.regular
  const paymentRef = `${MEMBERSHIP.referencePrefix}-${formData.applicantName.split(' ')[0].toUpperCase()}`

  if (success) {
    return (
      <div className="space-y-6">
        {/* Confirmation */}
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-green-100 rounded-full mb-4">
            <CheckCircle className="w-7 h-7 text-green-600" />
          </div>
          <Heading level={3} className="text-xl text-green-900 mb-2">
            Willkommen im Verein!
          </Heading>
          <p className="text-green-800">
            Du bist jetzt Mitglied von {ORG.name}. Dein Stimmrecht bei Vereinsentscheiden ist ab sofort aktiv.
          </p>
        </div>

        {/* Payment instructions */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <Heading level={3} className="text-lg text-gray-900 mb-4">
            Jahresbeitrag überweisen
          </Heading>
          <p className="text-sm text-gray-600 mb-4">
            Bitte überweise den Jahresbeitrag von <strong>{MEMBERSHIP.currency} {fee}</strong> an folgendes Konto:
          </p>
          <div className="bg-gray-50 rounded-lg p-4 space-y-3 text-sm">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-gray-500">Empfänger</span>
                <p className="font-medium text-gray-900">{BANK.accountHolder}</p>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <div>
                <span className="text-gray-500">IBAN</span>
                <p className="font-mono font-medium text-gray-900">{BANK.iban}</p>
              </div>
              <CopyButton value={BANK.iban} label="Kopieren" />
            </div>
            <div className="flex justify-between items-center">
              <div>
                <span className="text-gray-500">Bank</span>
                <p className="text-gray-900">{BANK.name}</p>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <div>
                <span className="text-gray-500">Verwendungszweck</span>
                <p className="font-medium text-gray-900">{paymentRef}</p>
              </div>
              <CopyButton value={paymentRef} label="Kopieren" />
            </div>
            <div className="flex justify-between items-center">
              <div>
                <span className="text-gray-500">Betrag</span>
                <p className="font-bold text-green-600">{MEMBERSHIP.currency} {fee}</p>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-3">
            Du kannst auch per TWINT an die Vereinsnummer überweisen. Bei Fragen: {session?.user?.email ? 'wir melden uns per E-Mail.' : 'kontaktiere uns.'}
          </p>
        </div>
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
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setMemberType('regular')}
          className={`px-4 py-3 rounded-lg border-2 text-left transition-colors ${
            memberType === 'regular' ? 'border-green-600 bg-green-50' : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="font-semibold text-gray-900">Regulär</div>
          <div className="text-sm text-gray-600">CHF {MEMBERSHIP.fees.regular} / Jahr</div>
        </button>
        <button
          type="button"
          onClick={() => setMemberType('reduced')}
          className={`px-4 py-3 rounded-lg border-2 text-left transition-colors ${
            memberType === 'reduced' ? 'border-green-600 bg-green-50' : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="font-semibold text-gray-900">Ermässigt</div>
          <div className="text-sm text-gray-600">CHF {MEMBERSHIP.fees.reduced} / Jahr</div>
          <div className="text-xs text-gray-500 mt-0.5">Studierende, Lernende</div>
        </button>
      </div>

      {/* Name + Email */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
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
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">E-Mail *</label>
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

      {/* Address (legally required for Mitgliederliste) */}
      <div>
        <label htmlFor="street" className="block text-sm font-medium text-gray-700 mb-1">Strasse *</label>
        <input
          id="street"
          type="text"
          required
          value={formData.addressStreet}
          onChange={(e) => setFormData({ ...formData, addressStreet: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label htmlFor="plz" className="block text-sm font-medium text-gray-700 mb-1">PLZ *</label>
          <input
            id="plz"
            type="text"
            inputMode="numeric"
            maxLength={4}
            required
            value={formData.addressPostalCode}
            onChange={(e) => setFormData({ ...formData, addressPostalCode: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
        <div className="col-span-2">
          <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">Ort *</label>
          <input
            id="city"
            type="text"
            required
            value={formData.addressCity}
            onChange={(e) => setFormData({ ...formData, addressCity: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-green-600 px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-green-500 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
      >
        {submitting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Wird verarbeitet...
          </>
        ) : (
          `Mitglied werden — CHF ${fee}/Jahr`
        )}
      </button>
      <p className="text-xs text-gray-500">
        Adresse wird für die offizielle Mitgliederliste benötigt (Schweizer Vereinsrecht).
      </p>
    </form>
  )
}
