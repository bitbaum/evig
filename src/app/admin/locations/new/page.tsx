'use client'

import Link from 'next/link'
import Heading from '@/components/admin/AdminHeading'
import { MapPin, ArrowLeft, Save, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import {
  useLocationForm,
  LocationBasicInfoSection,
  LocationAddressSection,
  LocationFacilitiesSection,
  LocationAccessibilitySection,
  LocationContactSection,
} from '@/components/admin/locations/location-form'

export default function NewLocationPage() {
  const {
    formData,
    isSubmitting,
    submitResult,
    handleFieldChange,
    handleFacilityChange,
    handleAccessibilityChange,
    handleSubmit,
  } = useLocationForm()

  return (
    <div className="min-h-screen bg-neutral-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin/locations"
            className="inline-flex items-center text-neutral-600 hover:text-neutral-800 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zurück zur Ortsverwaltung
          </Link>

          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-info-100 rounded-full mb-6">
              <MapPin className="w-8 h-8 text-info-600" />
            </div>
            <Heading level={1} className="text-3xl font-bold text-neutral-900 mb-2">
              Neuen Ort erstellen
            </Heading>
            <p className="text-neutral-600">
              Füge einen neuen Veranstaltungsort zur Plattform hinzu
            </p>
          </div>
        </div>

        {submitResult && (
          <div
            id={submitResult.success ? undefined : 'location-form-error'}
            className={`mb-8 p-6 rounded-xl border ${
            submitResult.success
              ? 'bg-primary-50 border-primary-200 text-primary-800'
              : 'bg-error-50 border-error-200 text-error-800'
          }`}>
            <div className="flex items-center">
              {submitResult.success ? (
                <CheckCircle className="w-6 h-6 mr-3" />
              ) : (
                <AlertCircle className="w-6 h-6 mr-3" />
              )}
              <div>
                <Heading level={3} className="font-semibold mb-1">
                  {submitResult.success ? 'Ort erstellt!' : 'Fehler'}
                </Heading>
                <p>{submitResult.message}</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-8">
          <LocationBasicInfoSection formData={formData} submitResult={submitResult} onFieldChange={handleFieldChange} />
          <LocationAddressSection formData={formData} onFieldChange={handleFieldChange} />
          <LocationFacilitiesSection formData={formData} onFieldChange={handleFieldChange} onFacilityChange={handleFacilityChange} />
          <LocationAccessibilitySection formData={formData} onAccessibilityChange={handleAccessibilityChange} />
          <LocationContactSection formData={formData} onFieldChange={handleFieldChange} />

          {/* Submit Button */}
          <div className="text-center">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center px-8 py-3 bg-info-600 text-white text-lg font-semibold rounded-lg hover:bg-info-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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

            <p className="text-sm text-neutral-600 mt-4">
              Nach Erstellung wird der Ort zur Genehmigung eingereicht und muss von einem Administrator freigegeben werden.
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}
