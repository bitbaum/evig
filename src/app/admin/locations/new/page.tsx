'use client'

import Link from 'next/link'
import Heading from '@/components/admin/AdminHeading'
import { Button } from '@/components/ui/button'
import { MapPin, ArrowLeft, Save, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { ROUTES } from '@/config/routes'
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
    <div className="min-h-screen bg-surface-raised py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={ROUTES.admin.locations}
            className="inline-flex items-center text-text-secondary hover:text-text-primary mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zurück zur Ortsverwaltung
          </Link>

          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-action-muted rounded-full mb-6">
              <MapPin className="w-8 h-8 text-action" />
            </div>
            <Heading level={1} className="text-3xl font-bold text-text-primary mb-2">
              Neuen Ort erstellen
            </Heading>
            <p className="text-text-secondary">
              Füge einen neuen Veranstaltungsort zur Plattform hinzu
            </p>
          </div>
        </div>

        {submitResult && (
          <div
            id={submitResult.success ? undefined : 'location-form-error'}
            className={`mb-8 p-6 rounded-xl border ${
            submitResult.success
              ? 'bg-action-muted border-strong text-action'
              : 'bg-error-50 dark:bg-error-900/20 border-error-200 dark:border-error-800 text-error-800 dark:text-error-400'
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

        <form onSubmit={handleSubmit} className="bg-surface-base rounded-xl border border-subtle p-8">
          <LocationBasicInfoSection formData={formData} submitResult={submitResult} onFieldChange={handleFieldChange} />
          <LocationAddressSection formData={formData} onFieldChange={handleFieldChange} />
          <LocationFacilitiesSection formData={formData} onFieldChange={handleFieldChange} onFacilityChange={handleFacilityChange} />
          <LocationAccessibilitySection formData={formData} onAccessibilityChange={handleAccessibilityChange} />
          <LocationContactSection formData={formData} onFieldChange={handleFieldChange} />

          {/* Submit Button */}
          <div className="text-center">
            <Button
              type="submit"
              disabled={isSubmitting}
              variant="primary"
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
            </Button>

            <p className="text-sm text-text-secondary mt-4">
              Nach Erstellung wird der Ort zur Genehmigung eingereicht und muss von einem Administrator freigegeben werden.
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}
