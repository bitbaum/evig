'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  MapPin,
  Building2,
  Home,
  Monitor,
  Users,
  Phone,
  Mail,
  ArrowLeft,
  Save,
  Loader2,
  CheckCircle,
  AlertCircle
} from 'lucide-react'

export default function NewLocationPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitResult, setSubmitResult] = useState<{
    success: boolean
    message: string
  } | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    type: 'venue' as 'venue' | 'home' | 'online' | 'community_center' | 'business',
    description: '',
    address_line1: '',
    address_line2: '',
    postal_code: '',
    city: '',
    canton: '',
    country: 'Switzerland',
    latitude: '',
    longitude: '',
    max_capacity: '',
    facilities: [] as string[],
    accessibility_info: {
      wheelchairAccessible: false,
      parkingAvailable: false,
      publicTransport: '',
      additionalInfo: ''
    },
    contact_name: '',
    contact_phone: '',
    contact_email: ''
  })

  const locationTypes = [
    { id: 'venue', label: 'Veranstaltungsort', icon: Building2, description: 'Professionelle Veranstaltungsräume' },
    { id: 'home', label: 'Zu Hause', icon: Home, description: 'Private Wohnungen/Häuser' },
    { id: 'online', label: 'Online', icon: Monitor, description: 'Virtuelle Veranstaltungen' },
    { id: 'community_center', label: 'Gemeinschaftszentrum', icon: Users, description: 'Öffentliche Gemeinschaftsräume' },
    { id: 'business', label: 'Geschäft', icon: Building2, description: 'Gewerbliche Räumlichkeiten' }
  ]

  const facilities = [
    'wheelchair_accessible',
    'parking',
    'wifi',
    'kitchen',
    'projector',
    'sound_system',
    'stage',
    'restrooms',
    'storage',
    'catering'
  ]

  const swissCantons = [
    'Aargau', 'Appenzell Ausserrhoden', 'Appenzell Innerrhoden', 'Basel-Landschaft',
    'Basel-Stadt', 'Bern', 'Freiburg', 'Genf', 'Glarus', 'Graubünden', 'Jura',
    'Luzern', 'Neuenburg', 'Nidwalden', 'Obwalden', 'Schaffhausen', 'Schwyz',
    'Solothurn', 'St. Gallen', 'Tessin', 'Thurgau', 'Uri', 'Waadt', 'Wallis',
    'Zug', 'Zürich'
  ]

  const handleFacilityChange = (facility: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      facilities: checked
        ? [...prev.facilities, facility]
        : prev.facilities.filter(f => f !== facility)
    }))
  }

  const handleAccessibilityChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      accessibility_info: {
        ...prev.accessibility_info,
        [field]: value
      }
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.type || !formData.city) {
      setSubmitResult({
        success: false,
        message: 'Bitte füllen Sie alle erforderlichen Felder aus'
      })
      return
    }

    // Validate Swiss postal code
    if (formData.postal_code && !/^[0-9]{4}$/.test(formData.postal_code)) {
      setSubmitResult({
        success: false,
        message: 'Bitte geben Sie eine gültige Schweizer Postleitzahl ein (4 Ziffern)'
      })
      return
    }

    // Validate coordinates if provided
    if ((formData.latitude && !formData.longitude) || (!formData.latitude && formData.longitude)) {
      setSubmitResult({
        success: false,
        message: 'Bitte geben Sie beide Koordinaten an oder keine'
      })
      return
    }

    setIsSubmitting(true)
    setSubmitResult(null)

    try {
      const submitData = {
        ...formData,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        max_capacity: formData.max_capacity ? parseInt(formData.max_capacity) : null,
        // Convert boolean to proper format for database
        accessibility_info: {
          ...formData.accessibility_info,
          wheelchairAccessible: Boolean(formData.accessibility_info.wheelchairAccessible),
          parkingAvailable: Boolean(formData.accessibility_info.parkingAvailable)
        }
      }

      const response = await fetch('/api/locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData)
      })

      const data = await response.json()

      if (data.success) {
        setSubmitResult({
          success: true,
          message: 'Ort erfolgreich erstellt und zur Genehmigung eingereicht'
        })

        setTimeout(() => {
          router.push('/admin/locations')
        }, 2000)
      } else {
        setSubmitResult({
          success: false,
          message: data.error || 'Fehler beim Erstellen des Ortes'
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin/locations"
            className="inline-flex items-center text-gray-600 hover:text-gray-800 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zurück zur Ortsverwaltung
          </Link>

          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-6">
              <MapPin className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Neuen Ort erstellen
            </h1>
            <p className="text-gray-600">
              Fügen Sie einen neuen Veranstaltungsort zur Plattform hinzu
            </p>
          </div>
        </div>

        {submitResult && (
          <div
            id={submitResult.success ? undefined : 'location-form-error'}
            className={`mb-8 p-6 rounded-xl border ${
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
                  {submitResult.success ? 'Ort erstellt!' : 'Fehler'}
                </h3>
                <p>{submitResult.message}</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-8">
          {/* Basic Information */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <MapPin className="w-5 h-5 mr-2" />
              Grundinformationen
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name des Ortes *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="z.B. Gemeinschaftszentrum Zürich-West"
                  required
                  aria-required="true"
                  aria-invalid={!!(submitResult && !submitResult.success)}
                  aria-describedby={submitResult && !submitResult.success ? 'location-form-error' : undefined}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Ortstyp *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {locationTypes.map((type) => (
                    <label key={type.id} className="relative">
                      <input
                        type="radio"
                        value={type.id}
                        checked={formData.type === type.id}
                        onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as 'venue' | 'home' | 'online' | 'community_center' | 'business' }))}
                        className="sr-only peer"
                      />
                      <div className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        formData.type === type.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}>
                        <type.icon className={`w-6 h-6 mb-2 ${
                          formData.type === type.id ? 'text-blue-600' : 'text-gray-400'
                        }`} />
                        <div className="font-medium text-gray-900">{type.label}</div>
                        <div className="text-sm text-gray-600">{type.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Beschreibung
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Beschreiben Sie den Ort, seine Ausstattung und besondere Merkmale..."
                />
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Home className="w-5 h-5 mr-2" />
              Adresse & Standort
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Strasse und Hausnummer *
                </label>
                <input
                  type="text"
                  value={formData.address_line1}
                  onChange={(e) => setFormData(prev => ({ ...prev, address_line1: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="z.B. Musterstrasse 123"
                  required
                  aria-required="true"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Adresszusatz (optional)
                </label>
                <input
                  type="text"
                  value={formData.address_line2}
                  onChange={(e) => setFormData(prev => ({ ...prev, address_line2: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="z.B. c/o Mustermann, 3. Stock"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  PLZ *
                </label>
                <input
                  type="text"
                  value={formData.postal_code}
                  onChange={(e) => setFormData(prev => ({ ...prev, postal_code: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="8000"
                  maxLength={4}
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
                  placeholder="Zürich"
                  required
                  aria-required="true"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kanton
                </label>
                <select
                  value={formData.canton}
                  onChange={(e) => setFormData(prev => ({ ...prev, canton: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Kanton wählen</option>
                  {swissCantons.map(canton => (
                    <option key={canton} value={canton}>{canton}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Land
                </label>
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Breitengrad (optional)
                </label>
                <input
                  type="number"
                  step="0.000001"
                  min="-90"
                  max="90"
                  value={formData.latitude}
                  onChange={(e) => setFormData(prev => ({ ...prev, latitude: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="47.3769"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Längengrad (optional)
                </label>
                <input
                  type="number"
                  step="0.000001"
                  min="-180"
                  max="180"
                  value={formData.longitude}
                  onChange={(e) => setFormData(prev => ({ ...prev, longitude: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="8.5417"
                />
              </div>
            </div>
          </div>

          {/* Capacity & Facilities */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Kapazität & Ausstattung
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximale Kapazität (Personen)
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.max_capacity}
                  onChange={(e) => setFormData(prev => ({ ...prev, max_capacity: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="50"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Verfügbare Einrichtungen
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {facilities.map(facility => (
                    <label key={facility} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.facilities.includes(facility)}
                        onChange={(e) => handleFacilityChange(facility, e.target.checked)}
                        className="mr-2 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 capitalize">
                        {facility.replace('_', ' ')}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Accessibility */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <CheckCircle className="w-5 h-5 mr-2" />
              Barrierefreiheit & Zugänglichkeit
            </h2>

            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="wheelchair"
                  checked={formData.accessibility_info.wheelchairAccessible}
                  onChange={(e) => handleAccessibilityChange('wheelchairAccessible', !formData.accessibility_info.wheelchairAccessible)}
                  className="mr-3 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="wheelchair" className="text-sm font-medium text-gray-700">
                  Rollstuhlgerecht
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="parking"
                  checked={formData.accessibility_info.parkingAvailable}
                  onChange={(e) => handleAccessibilityChange('parkingAvailable', !formData.accessibility_info.parkingAvailable)}
                  className="mr-3 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="parking" className="text-sm font-medium text-gray-700">
                  Parkplatz verfügbar
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Öffentlicher Verkehr
                </label>
                <input
                  type="text"
                  value={formData.accessibility_info.publicTransport}
                  onChange={(e) => handleAccessibilityChange('publicTransport', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="z.B. 5 Min. zu Fuss zur Tramhaltestelle"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Zusätzliche Informationen
                </label>
                <textarea
                  value={formData.accessibility_info.additionalInfo}
                  onChange={(e) => handleAccessibilityChange('additionalInfo', e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="z.B. Rampe vorhanden, Aufzug verfügbar, etc."
                />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Phone className="w-5 h-5 mr-2" />
              Kontaktinformationen
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kontaktperson
                </label>
                <input
                  type="text"
                  value={formData.contact_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, contact_name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Max Mustermann"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Telefonnummer
                </label>
                <input
                  type="tel"
                  value={formData.contact_phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, contact_phone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="+41 79 123 45 67"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  E-Mail-Adresse
                </label>
                <input
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => setFormData(prev => ({ ...prev, contact_email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="kontakt@ort.ch"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="text-center">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center px-8 py-3 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Erstelle Ort...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  Ort erstellen
                </>
              )}
            </button>

            <p className="text-sm text-gray-600 mt-4">
              Nach Erstellung wird der Ort zur Genehmigung eingereicht und muss von einem Administrator freigegeben werden.
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}