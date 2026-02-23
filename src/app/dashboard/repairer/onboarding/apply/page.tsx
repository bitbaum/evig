'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Wrench,
  CheckCircle,
  AlertCircle,
  Loader2,
  ArrowLeft,
} from 'lucide-react'
import type { RepairerApplicationForm } from '@/components/repairer-apply/types'
import { INITIAL_FORM_DATA } from '@/components/repairer-apply/config'
import { BusinessInfoSection } from '@/components/repairer-apply/BusinessInfoSection'
import { ContactInfoSection } from '@/components/repairer-apply/ContactInfoSection'
import { ServicesPricingSection } from '@/components/repairer-apply/ServicesPricingSection'
import { DocumentsSection } from '@/components/repairer-apply/DocumentsSection'

export default function RepairerApplicationPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitResult, setSubmitResult] = useState<{
    success: boolean
    message: string
  } | null>(null)
  const [formData, setFormData] = useState<RepairerApplicationForm>(INITIAL_FORM_DATA)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.termsAccepted) {
      setSubmitResult({ success: false, message: 'Bitte akzeptieren Sie die Nutzungsbedingungen' })
      return
    }

    if (formData.servicesOffered.length === 0) {
      setSubmitResult({ success: false, message: 'Bitte wählen Sie mindestens einen Service aus' })
      return
    }

    setIsSubmitting(true)
    setSubmitResult(null)

    try {
      const submitData = new FormData()

      Object.entries(formData).forEach(([key, value]) => {
        if (key === 'portfolioImages' || key === 'certificationsDocs' || key === 'idDocument') return
        if (Array.isArray(value)) {
          submitData.append(key, JSON.stringify(value))
        } else {
          submitData.append(key, String(value))
        }
      })

      formData.portfolioImages.forEach((file, index) => {
        submitData.append(`portfolioImage_${index}`, file)
      })
      formData.certificationsDocs.forEach((file, index) => {
        submitData.append(`certificationDoc_${index}`, file)
      })
      if (formData.idDocument) {
        submitData.append('idDocument', formData.idDocument)
      }

      const response = await fetch('/api/repairer/apply', {
        method: 'POST',
        body: submitData,
      })
      const data = await response.json()

      if (data.success) {
        setSubmitResult({
          success: true,
          message: 'Ihre Bewerbung wurde erfolgreich eingereicht! Sie erhalten in Kürze eine E-Mail mit weiteren Informationen.',
        })
        setTimeout(() => router.push('/dashboard'), 3000)
      } else {
        setSubmitResult({
          success: false,
          message: data.error || 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.',
        })
      }
    } catch {
      setSubmitResult({ success: false, message: 'Netzwerkfehler. Bitte versuchen Sie es erneut.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!session?.user) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Anmeldung erforderlich</h1>
            <p className="text-gray-600 mb-6">
              Bitte melden Sie sich an, um sich als Reparateur zu bewerben.
            </p>
            <Link
              href="/auth/login"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Anmelden
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard/repairer/onboarding"
            className="inline-flex items-center text-gray-600 hover:text-gray-800 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zurück zur Reparateur-Übersicht
          </Link>

          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-6">
              <Wrench className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Reparateur-Bewerbung
            </h1>
            <p className="text-gray-600">
              Füllen Sie das Formular aus, um sich als zertifizierter Reparateur bei RevampIT zu bewerben
            </p>
          </div>
        </div>

        {submitResult && (
          <div id={submitResult.success ? undefined : 'repairer-apply-error'} className={`mb-8 p-6 rounded-xl border ${
            submitResult.success
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <div className="flex items-center">
              {submitResult.success ? (
                <CheckCircle className="w-6 h-6 mr-3" />
              ) : (
                <AlertCircle className="w-6 h-6 mr-3" />
              )}
              <div>
                <h3 className="font-semibold mb-1">
                  {submitResult.success ? 'Bewerbung erfolgreich!' : 'Fehler'}
                </h3>
                <p>{submitResult.message}</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-8">
          <BusinessInfoSection formData={formData} setFormData={setFormData} />
          <ContactInfoSection formData={formData} setFormData={setFormData} />
          <ServicesPricingSection formData={formData} setFormData={setFormData} />
          <DocumentsSection formData={formData} setFormData={setFormData} />

          {/* Terms and Conditions */}
          <div className="mb-8">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Nutzungsbedingungen für Reparateure</h3>

              <div className="space-y-3 text-sm text-gray-700 mb-4">
                <p>• Ich verpflichte mich, alle Reparaturen fachgerecht und mit hoher Qualität durchzuführen</p>
                <p>• Ich werde alle gesetzlichen Vorschriften und Sicherheitsstandards einhalten</p>
                <p>• Ich bin für die Qualität meiner Arbeit und verwendeten Ersatzteile verantwortlich</p>
                <p>• Ich werde Kunden termingerecht und professionell betreuen</p>
                <p>• Ich akzeptiere das Bewertungssystem und die Servicegebühren der Plattform</p>
                <p>• Meine Angaben sind wahrheitsgemäss und ich werde sie aktuell halten</p>
              </div>

              <div className="mt-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.termsAccepted}
                    onChange={(e) => setFormData(prev => ({ ...prev, termsAccepted: e.target.checked }))}
                    className="mr-3 text-blue-600 focus:ring-blue-500"
                    required
                    aria-required="true"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Ich akzeptiere die <Link href="/terms" className="text-blue-600 hover:text-blue-700 underline">Nutzungsbedingungen</Link> und die <Link href="/privacy" className="text-blue-600 hover:text-blue-700 underline">Datenschutzerklärung</Link>
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="text-center">
            <button
              type="submit"
              disabled={isSubmitting || !formData.termsAccepted}
              className="inline-flex items-center px-8 py-3 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Bewerbung wird eingereicht...
                </>
              ) : (
                'Bewerbung als Reparateur einreichen'
              )}
            </button>

            <p className="text-sm text-gray-600 mt-4">
              Nach Einreichung wird Ihre Bewerbung geprüft. Dies kann 1-2 Werktage dauern.
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}
