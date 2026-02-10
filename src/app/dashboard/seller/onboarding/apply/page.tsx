'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Store,
  User,
  Mail,
  Phone,
  MapPin,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader2,
  ArrowLeft
} from 'lucide-react'

export default function SellerApplicationPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitResult, setSubmitResult] = useState<{
    success: boolean
    message: string
  } | null>(null)

  const [formData, setFormData] = useState({
    businessName: '',
    businessType: 'individual', // 'individual' or 'business'
    taxId: '',
    address: '',
    city: '',
    postalCode: '',
    phone: '',
    experience: '',
    productTypes: [] as string[],
    motivation: '',
    termsAccepted: false
  })

  const productTypeOptions = [
    { id: 'laptops', label: 'Laptops' },
    { id: 'desktops', label: 'Desktop-PCs' },
    { id: 'monitors', label: 'Monitore' },
    { id: 'accessories', label: 'Zubehör' },
    { id: 'networking', label: 'Netzwerkgeräte' },
    { id: 'other', label: 'Sonstiges' }
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.termsAccepted) {
      setSubmitResult({
        success: false,
        message: 'Bitte akzeptieren Sie die Nutzungsbedingungen'
      })
      return
    }

    setIsSubmitting(true)
    setSubmitResult(null)

    try {
      const response = await fetch('/api/seller/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (data.success) {
        setSubmitResult({
          success: true,
          message: 'Ihre Bewerbung wurde erfolgreich eingereicht! Sie erhalten in Kürze eine E-Mail mit weiteren Informationen.'
        })

        // Redirect after success
        setTimeout(() => {
          router.push('/dashboard')
        }, 3000)
      } else {
        setSubmitResult({
          success: false,
          message: data.error || 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.'
        })
      }
    } catch (error) {
      setSubmitResult({
        success: false,
        message: 'Netzwerkfehler. Bitte versuchen Sie es erneut.'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleProductTypeChange = (productType: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      productTypes: checked
        ? [...prev.productTypes, productType]
        : prev.productTypes.filter(type => type !== productType)
    }))
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    )
  }

  if (!session?.user) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Anmeldung erforderlich</h1>
            <p className="text-gray-600 mb-6">
              Bitte melden Sie sich an, um sich als Verkäufer zu bewerben.
            </p>
            <Link
              href="/auth/login"
              className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
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
            href="/dashboard/seller/onboarding"
            className="inline-flex items-center text-gray-600 hover:text-gray-800 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zurück zur Verkäufer-Übersicht
          </Link>

          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6">
              <Store className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Verkäufer-Bewerbung
            </h1>
            <p className="text-gray-600">
              Füllen Sie das Formular aus, um sich als Verkäufer auf RevampIT zu bewerben
            </p>
          </div>
        </div>

        {submitResult && (
          <div id={submitResult.success ? undefined : 'seller-apply-error'} className={`mb-8 p-6 rounded-xl border ${
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
                  {submitResult.success ? 'Bewerbung erfolgreich!' : 'Fehler bei der Bewerbung'}
                </h3>
                <p>{submitResult.message}</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-8">
          {/* Personal Information */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <User className="w-5 h-5 mr-2" />
              Persönliche Informationen
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Geschäftstyp *
                </label>
                <select
                  value={formData.businessType}
                  onChange={(e) => setFormData(prev => ({ ...prev, businessType: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                  aria-required="true"
                >
                  <option value="individual">Privatperson</option>
                  <option value="business">Geschäft/Firma</option>
                </select>
              </div>

              {formData.businessType === 'business' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Firmenname *
                  </label>
                  <input
                    type="text"
                    value={formData.businessName}
                    onChange={(e) => setFormData(prev => ({ ...prev, businessName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                    aria-required="true"
                  />
                </div>
              )}

              {formData.businessType === 'business' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Steuernummer/UID
                  </label>
                  <input
                    type="text"
                    value={formData.taxId}
                    onChange={(e) => setFormData(prev => ({ ...prev, taxId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Für geschäftliche Verkäufe"
                  />
                </div>
              )}

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Adresse *
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Strasse und Hausnummer"
                  required
                  aria-required="true"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  PLZ *
                </label>
                <input
                  type="text"
                  value={formData.postalCode}
                  onChange={(e) => setFormData(prev => ({ ...prev, postalCode: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                  aria-required="true"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ort *
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                  aria-required="true"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Telefonnummer *
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                  aria-required="true"
                />
              </div>
            </div>
          </div>

          {/* Product Information */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Produktinformationen
            </h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Welche Produkttypen möchten Sie verkaufen? *
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {productTypeOptions.map(option => (
                    <label key={option.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.productTypes.includes(option.id)}
                        onChange={(e) => handleProductTypeChange(option.id, e.target.checked)}
                        className="mr-2 text-green-600 focus:ring-green-500"
                      />
                      <span className="text-sm text-gray-700">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Erfahrung mit refurbished Elektronik
                </label>
                <textarea
                  value={formData.experience}
                  onChange={(e) => setFormData(prev => ({ ...prev, experience: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Beschreiben Sie Ihre Erfahrung mit refurbished Elektronik..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Warum möchten Sie bei RevampIT verkaufen?
                </label>
                <textarea
                  value={formData.motivation}
                  onChange={(e) => setFormData(prev => ({ ...prev, motivation: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Was motiviert Sie, refurbished Elektronik zu verkaufen?"
                />
              </div>
            </div>
          </div>

          {/* Terms and Conditions */}
          <div className="mb-8">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Nutzungsbedingungen</h3>

              <div className="space-y-3 text-sm text-gray-700">
                <p>• Alle Produkte müssen funktionstüchtig und korrekt beschrieben sein</p>
                <p>• Sie sind für die Qualität und den Versand Ihrer Produkte verantwortlich</p>
                <p>• RevampIT erhebt eine Provision von 5% pro erfolgreichem Verkauf</p>
                <p>• Sie verpflichten sich, Käuferanfragen innerhalb von 24 Stunden zu beantworten</p>
                <p>• Rückgaben werden über das RevampIT-System abgewickelt</p>
              </div>

              <div className="mt-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.termsAccepted}
                    onChange={(e) => setFormData(prev => ({ ...prev, termsAccepted: e.target.checked }))}
                    className="mr-2 text-green-600 focus:ring-green-500"
                    required
                    aria-required="true"
                  />
                  <span className="text-sm text-gray-700">
                    Ich akzeptiere die <Link href="/terms" className="text-green-600 hover:text-green-700">Nutzungsbedingungen</Link> und die <Link href="/privacy" className="text-green-600 hover:text-green-700">Datenschutzerklärung</Link>
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
              className="inline-flex items-center px-8 py-3 bg-green-600 text-white text-lg font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Bewerbung wird eingereicht...
                </>
              ) : (
                'Bewerbung einreichen'
              )}
            </button>

            <p className="text-sm text-gray-600 mt-4">
              Nach Einreichung erhalten Sie eine Bestätigungs-E-Mail.
              Die Verifizierung dauert normalerweise 1-2 Werktage.
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}