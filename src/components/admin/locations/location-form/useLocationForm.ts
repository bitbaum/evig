'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { LocationFormData, SubmitResult } from './types'
import { INITIAL_LOCATION_FORM_DATA } from './types'

export function useLocationForm() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitResult, setSubmitResult] = useState<SubmitResult | null>(null)
  const [formData, setFormData] = useState<LocationFormData>(INITIAL_LOCATION_FORM_DATA)

  const handleFieldChange = <K extends keyof LocationFormData>(field: K, value: LocationFormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleFacilityChange = (facility: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      facilities: checked
        ? [...prev.facilities, facility]
        : prev.facilities.filter(f => f !== facility),
    }))
  }

  const handleAccessibilityChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      accessibility_info: {
        ...prev.accessibility_info,
        [field]: value,
      },
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.type || !formData.city) {
      setSubmitResult({
        success: false,
        message: 'Bitte füllen Sie alle erforderlichen Felder aus',
      })
      return
    }

    // Validate Swiss postal code
    if (formData.postal_code && !/^[0-9]{4}$/.test(formData.postal_code)) {
      setSubmitResult({
        success: false,
        message: 'Bitte geben Sie eine gültige Schweizer Postleitzahl ein (4 Ziffern)',
      })
      return
    }

    // Validate coordinates if provided
    if ((formData.latitude && !formData.longitude) || (!formData.latitude && formData.longitude)) {
      setSubmitResult({
        success: false,
        message: 'Bitte geben Sie beide Koordinaten an oder keine',
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
        accessibility_info: {
          ...formData.accessibility_info,
          wheelchairAccessible: Boolean(formData.accessibility_info.wheelchairAccessible),
          parkingAvailable: Boolean(formData.accessibility_info.parkingAvailable),
        },
      }

      const response = await fetch('/api/locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      })

      const data = await response.json()

      if (data.success) {
        setSubmitResult({
          success: true,
          message: 'Ort erfolgreich erstellt und zur Genehmigung eingereicht',
        })

        setTimeout(() => {
          router.push('/admin/locations')
        }, 2000)
      } else {
        setSubmitResult({
          success: false,
          message: data.error || 'Fehler beim Erstellen des Ortes',
        })
      }
    } catch {
      setSubmitResult({
        success: false,
        message: 'Netzwerkfehler. Bitte versuchen Sie es erneut.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    formData,
    isSubmitting,
    submitResult,
    handleFieldChange,
    handleFacilityChange,
    handleAccessibilityChange,
    handleSubmit,
  }
}
