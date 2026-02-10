'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Wrench,
  Upload,
  MapPin,
  Clock,
  Star,
  CheckCircle,
  AlertCircle,
  Loader2,
  ArrowLeft,
  FileText,
  Award,
  Shield
} from 'lucide-react'

export default function RepairerApplicationPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitResult, setSubmitResult] = useState<{
    success: boolean
    message: string
  } | null>(null)

  const [formData, setFormData] = useState({
    businessType: 'individual' as 'individual' | 'business' | 'freelance',
    businessName: '',
    description: '',
    yearsExperience: '',
    phone: '',
    website: '',
    address: '',
    city: '',
    postalCode: '',
    serviceRadius: '30',
    remoteServices: false,
    hourlyRate: '',
    emergencyFee: '',
    homeVisitFee: '',
    servicesOffered: [] as string[],
    specializations: [] as string[],
    certifications: [] as string[],
    insuranceInfo: '',
    portfolioImages: [] as File[],
    idDocument: null as File | null,
    certificationsDocs: [] as File[],
    termsAccepted: false
  })

  const serviceOptions = [
    { id: 'laptop_repair', label: 'Laptop-Reparatur' },
    { id: 'phone_repair', label: 'Smartphone-Reparatur' },
    { id: 'tablet_repair', label: 'Tablet-Reparatur' },
    { id: 'desktop_repair', label: 'Desktop-PC Reparatur' },
    { id: 'console_repair', label: 'Spielkonsole Reparatur' },
    { id: 'audio_repair', label: 'Audio-Geräte Reparatur' },
    { id: 'other', label: 'Sonstige' }
  ]

  const specializationOptions = [
    { id: 'screen_replacement', label: 'Bildschirmtausch' },
    { id: 'battery_replacement', label: 'Akkuersatz' },
    { id: 'data_recovery', label: 'Datenrettung' },
    { id: 'motherboard_repair', label: 'Mainboard-Reparatur' },
    { id: 'water_damage', label: 'Wasserschaden' },
    { id: 'diagnostics', label: 'Diagnose' },
    { id: 'cleaning', label: 'Reinigung' },
    { id: 'upgrades', label: 'Aufrüstungen' }
  ]

  const handleServiceChange = (serviceId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      servicesOffered: checked
        ? [...prev.servicesOffered, serviceId]
        : prev.servicesOffered.filter(id => id !== serviceId)
    }))
  }

  const handleSpecializationChange = (specId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      specializations: checked
        ? [...prev.specializations, specId]
        : prev.specializations.filter(id => id !== specId)
    }))
  }

  const handleFileUpload = (field: 'portfolioImages' | 'certificationsDocs', files: FileList) => {
    const fileArray = Array.from(files)
    setFormData(prev => ({
      ...prev,
      [field]: field === 'portfolioImages'
        ? [...prev.portfolioImages, ...fileArray].slice(0, 10) // Max 10 images
        : [...prev.certificationsDocs, ...fileArray].slice(0, 5) // Max 5 docs
    }))
  }

  const handleIdDocument = (file: File) => {
    setFormData(prev => ({ ...prev, idDocument: file }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.termsAccepted) {
      setSubmitResult({
        success: false,
        message: 'Bitte akzeptieren Sie die Nutzungsbedingungen'
      })
      return
    }

    if (formData.servicesOffered.length === 0) {
      setSubmitResult({
        success: false,
        message: 'Bitte wählen Sie mindestens einen Service aus'
      })
      return
    }

    setIsSubmitting(true)
    setSubmitResult(null)

    try {
      const submitData = new FormData()

      // Add basic form data
      Object.entries(formData).forEach(([key, value]) => {
        if (key === 'portfolioImages' || key === 'certificationsDocs' || key === 'idDocument') {
          // Handle file arrays separately
          return
        }
        if (Array.isArray(value)) {
          submitData.append(key, JSON.stringify(value))
        } else {
          submitData.append(key, String(value))
        }
      })

      // Add files
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
        body: submitData
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
          {/* Business Information */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Wrench className="w-5 h-5 mr-2" />
              Geschäftsinformationen
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Geschäftstyp *
                </label>
                <select
                  value={formData.businessType}
                  onChange={(e) => setFormData(prev => ({ ...prev, businessType: e.target.value as 'individual' | 'business' | 'freelance' }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  aria-required="true"
                >
                  <option value="individual">Einzelperson</option>
                  <option value="freelance">Freiberufler</option>
                  <option value="business">Geschäft/Firma</option>
                </select>
              </div>

              {(formData.businessType === 'business' || formData.businessType === 'freelance') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Geschäftsfirmenname *
                  </label>
                  <input
                    type="text"
                    value={formData.businessName}
                    onChange={(e) => setFormData(prev => ({ ...prev, businessName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    aria-required="true"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jahre Erfahrung *
                </label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={formData.yearsExperience}
                  onChange={(e) => setFormData(prev => ({ ...prev, yearsExperience: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  aria-required="true"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Beschreibung Ihrer Dienstleistungen *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Beschreiben Sie Ihre Reparaturdienstleistungen, Fachgebiete und besondere Stärken..."
                  required
                  aria-required="true"
                />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <MapPin className="w-5 h-5 mr-2" />
              Kontaktinformationen
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Telefonnummer *
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="+41 79 123 45 67"
                  required
                  aria-required="true"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Website (optional)
                </label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://ihre-website.ch"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Adresse *
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  aria-required="true"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Service-Radius (km) *
                </label>
                <select
                  value={formData.serviceRadius}
                  onChange={(e) => setFormData(prev => ({ ...prev, serviceRadius: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  aria-required="true"
                >
                  <option value="10">10 km</option>
                  <option value="25">25 km</option>
                  <option value="30">30 km</option>
                  <option value="50">50 km</option>
                  <option value="100">100 km</option>
                  <option value="0">Überall (remote only)</option>
                </select>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="remote-services"
                  checked={formData.remoteServices}
                  onChange={(e) => setFormData(prev => ({ ...prev, remoteServices: e.target.checked }))}
                  className="mr-3 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="remote-services" className="text-sm text-gray-700">
                  Ich biete Remote-Reparaturdienste an
                </label>
              </div>
            </div>
          </div>

          {/* Services & Pricing */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Star className="w-5 h-5 mr-2" />
              Dienstleistungen & Preise
            </h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Welche Dienstleistungen bieten Sie an? *
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {serviceOptions.map(option => (
                    <label key={option.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.servicesOffered.includes(option.id)}
                        onChange={(e) => handleServiceChange(option.id, e.target.checked)}
                        className="mr-2 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Spezialisierungen (optional)
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {specializationOptions.map(option => (
                    <label key={option.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.specializations.includes(option.id)}
                        onChange={(e) => handleSpecializationChange(option.id, e.target.checked)}
                        className="mr-2 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stundensatz (CHF) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.hourlyRate}
                    onChange={(e) => setFormData(prev => ({ ...prev, hourlyRate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="70.00"
                    required
                    aria-required="true"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notfallgebühr (CHF)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.emergencyFee}
                    onChange={(e) => setFormData(prev => ({ ...prev, emergencyFee: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="100.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hausbesuch (CHF)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.homeVisitFee}
                    onChange={(e) => setFormData(prev => ({ ...prev, homeVisitFee: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="50.00"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Documents & Verification */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Dokumente & Verifizierung
            </h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ausweis/Personalausweis *
                </label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => e.target.files?.[0] && handleIdDocument(e.target.files[0])}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  aria-required="true"
                />
                <p className="text-xs text-gray-500 mt-1">JPG, PNG oder PDF, max. 5MB</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Zertifizierungen (optional)
                </label>
                <input
                  type="file"
                  multiple
                  accept="image/*,.pdf"
                  onChange={(e) => e.target.files && handleFileUpload('certificationsDocs', e.target.files)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Max. 5 Dateien, JPG, PNG oder PDF</p>
                {formData.certificationsDocs.length > 0 && (
                  <p className="text-xs text-green-600 mt-1">
                    {formData.certificationsDocs.length} Datei(en) ausgewählt
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Portfolio-Bilder (optional)
                </label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => e.target.files && handleFileUpload('portfolioImages', e.target.files)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Max. 10 Bilder, JPG oder PNG</p>
                {formData.portfolioImages.length > 0 && (
                  <p className="text-xs text-green-600 mt-1">
                    {formData.portfolioImages.length} Bild(er) ausgewählt
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Haftpflichtversicherung
                </label>
                <textarea
                  value={formData.insuranceInfo}
                  onChange={(e) => setFormData(prev => ({ ...prev, insuranceInfo: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Versicherungsgesellschaft und Policennummer..."
                />
              </div>
            </div>
          </div>

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
                  <label className="text-sm font-medium text-gray-700">
                    Ich akzeptiere die <Link href="/terms" className="text-blue-600 hover:text-blue-700 underline">Nutzungsbedingungen</Link> und die <Link href="/privacy" className="text-blue-600 hover:text-blue-700 underline">Datenschutzerklärung</Link>
                  </label>
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