'use client'

import { useMemo } from 'react'
import { useFormHandler } from '@/hooks/useFormHandler'
import type { LocationFormData, SubmitResult } from './types'
import { INITIAL_LOCATION_FORM_DATA } from './types'

export function useLocationForm() {
  const form = useFormHandler<LocationFormData>({
    initialData: INITIAL_LOCATION_FORM_DATA,
    apiEndpoint: '/api/locations',
    redirectTo: '/admin/locations',
    redirectDelay: 2000,
    createSuccessMessage: 'Ort erfolgreich erstellt und zur Genehmigung eingereicht',
    validate: (data) => {
      if (!data.name || !data.type || !data.city) {
        return 'Bitte füllen Sie alle erforderlichen Felder aus'
      }
      if (data.postal_code && !/^[0-9]{4}$/.test(data.postal_code)) {
        return 'Bitte geben Sie eine gültige Schweizer Postleitzahl ein (4 Ziffern)'
      }
      if ((data.latitude && !data.longitude) || (!data.latitude && data.longitude)) {
        return 'Bitte geben Sie beide Koordinaten an oder keine'
      }
      return null
    },
    transformBeforeSubmit: (data) => ({
      ...data,
      latitude: data.latitude ? parseFloat(data.latitude) : null,
      longitude: data.longitude ? parseFloat(data.longitude) : null,
      max_capacity: data.max_capacity ? parseInt(data.max_capacity) : null,
      accessibility_info: {
        ...data.accessibility_info,
        wheelchairAccessible: Boolean(data.accessibility_info.wheelchairAccessible),
        parkingAvailable: Boolean(data.accessibility_info.parkingAvailable),
      },
    }),
  })

  const handleFacilityChange = (facility: string, checked: boolean) => {
    form.setData(prev => ({
      ...prev,
      facilities: checked
        ? [...prev.facilities, facility]
        : prev.facilities.filter(f => f !== facility),
    }))
  }

  const handleAccessibilityChange = (field: string, value: string | boolean) => {
    form.setData(prev => ({
      ...prev,
      accessibility_info: {
        ...prev.accessibility_info,
        [field]: value,
      },
    }))
  }

  // Derive submitResult for backward compatibility with consumers
  const submitResult: SubmitResult | null = useMemo(() => {
    if (form.success) return { success: true, message: form.success }
    if (form.error) return { success: false, message: form.error }
    return null
  }, [form.success, form.error])

  return {
    formData: form.data,
    isSubmitting: form.isSubmitting,
    submitResult,
    handleFieldChange: form.updateField,
    handleFacilityChange,
    handleAccessibilityChange,
    handleSubmit: form.handleSubmit,
  }
}
