import { useState, useCallback, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { logger } from '@/lib/logger'
import { apiFetch } from '@/lib/api/client'
import { sanitizeReturnTo } from '@/lib/utils/safe-redirect'
import type { ErfassungFormData, AIFieldMetadata } from '@/types/erfassung'
import { DEFAULT_FORM_DATA, formDataToPayload } from '@/types/erfassung'
import { SPEC_TEMPLATES, templateToSpecFields } from '@/config/erfassung'
import { ROUTES } from '@/config/routes'
import {
  CAPTURE_DESTINATIONS,
  type CaptureDestination,
} from '@/config/intake-workflow'

/**
 * Merge partial AI/refined data into existing form data.
 * Skips empty/null/undefined values so existing data is preserved.
 * Adding a new field to ErfassungFormData = this handles it automatically.
 */
function mergeFormData(prev: ErfassungFormData, data: Partial<ErfassungFormData>): ErfassungFormData {
  const updated = { ...prev }
  for (const key of Object.keys(data) as Array<keyof ErfassungFormData>) {
    const value = data[key]
    if (value === undefined || value === null) continue
    if (Array.isArray(value) && value.length === 0) continue
    if (typeof value === 'string' && value === '') continue
    ;(updated as Record<string, unknown>)[key] = value
  }
  return updated
}

/** Donation provenance attached to the canonical inventory item. */
export interface DonationState {
  isDonation: boolean
  donorName: string
  donorEmail: string
  donorNotes: string
  /** Set when opened from an existing donation row (/admin/donations). */
  existingDonationId: string | null
}

const DEFAULT_DONATION: DonationState = {
  isDonation: false,
  donorName: '',
  donorEmail: '',
  donorNotes: '',
  existingDonationId: null,
}

export function useErfassungForm() {
  const t = useTranslations('components.erfassung.formErrors')
  const router = useRouter()
  const searchParams = useSearchParams()
  const editId = searchParams.get('edit')
  // Prevent open-redirect: only same-origin paths
  const returnTo = sanitizeReturnTo(searchParams.get('returnTo'), '/admin/intake')
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingProduct, setIsLoadingProduct] = useState(false)
  const [savedItemUUID, setSavedItemUUID] = useState<string | null>(null)
  const [savedProductId, setSavedProductId] = useState<string | null>(null)
  const [savedInventoryId, setSavedInventoryId] = useState<string | null>(null)
  const [savedAction, setSavedAction] = useState<'draft' | 'erfassen' | 'publish'>('draft')
  const [savedListingId, setSavedListingId] = useState<string | null>(null)
  const [savedQcRequired, setSavedQcRequired] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [formData, setFormData] = useState<ErfassungFormData>(DEFAULT_FORM_DATA)
  const [aiMetadata, setAiMetadata] = useState<AIFieldMetadata>({})
  const [donation, setDonation] = useState<DonationState>(DEFAULT_DONATION)
  const [destination, setDestination] = useState<CaptureDestination>(CAPTURE_DESTINATIONS.QUALITY)
  const [qcSkipReason, setQcSkipReason] = useState('')

  // Donation cross-link prefill (forwarded by /admin/intake and /admin/donations)
  useEffect(() => {
    if (editId) return
    const donorName = searchParams.get('donor_name')
    const donorEmail = searchParams.get('donor_email')
    const donationId = searchParams.get('donation_id')
    if (donorName || donorEmail || donationId) {
      setDonation(prev => ({
        ...prev,
        isDonation: true,
        donorName: donorName || prev.donorName,
        donorEmail: donorEmail || prev.donorEmail,
        existingDonationId: donationId || prev.existingDonationId,
      }))
    }
   
  }, [editId, searchParams])

  const [reviewStarted, setReviewStarted] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [dataEntryCollapsed, setDataEntryCollapsed] = useState(false)

  useEffect(() => {
    if (editId) {
      setIsEditMode(true)
      setIsLoadingProduct(true)
      setShowAdvanced(true)

      apiFetch<{ product: {
        brand?: string; product_name?: string; short_description?: string
        specifications?: Record<string, unknown>
        dimensions?: { laenge_mm?: number; breite_mm?: number; hoehe_mm?: number }
        weight_grams?: number; estimated_price_chf?: number; condition?: string
        location?: string; box_id?: string; quantity_available?: number
        category?: string; subcategory?: string; customer_profiles?: string[]
        image_url?: string | null
      } }>(`/api/admin/inventory/${editId}`)
        .then(result => {
          if (result.success && result.data?.product) {
            const p = result.data.product
            const specsArray = p.specifications
              ? Object.entries(p.specifications).map(([key, value]) => ({
                  key,
                  value: String(value),
                }))
              : [{ key: '', value: '' }]

            setFormData({
              hersteller: p.brand || '',
              produktname: p.product_name || '',
              kurzbeschreibung: p.short_description || '',
              specs: specsArray.length > 0 ? specsArray : [{ key: '', value: '' }],
              laenge_mm: p.dimensions?.laenge_mm?.toString() || '',
              breite_mm: p.dimensions?.breite_mm?.toString() || '',
              hoehe_mm: p.dimensions?.hoehe_mm?.toString() || '',
              gewicht_kg: p.weight_grams ? (p.weight_grams / 1000).toString() : '',
              verkaufspreis: p.estimated_price_chf?.toString() || '',
              zustand: p.condition || 'good',
              location: p.location || '',
              // Not returned by the inventory GET yet — defaults to unselected on edit.
              storage_location_id: '',
              box_id: p.box_id || '',
              auf_lager: p.quantity_available?.toString() || '1',
              hauptkategorie: p.category || '',
              unterkategorie: p.subcategory || '',
              kundenprofile: p.customer_profiles || [],
              image: p.image_url || null,
            })
          } else if (!result.success) {
            logger.error('Failed to load product for edit', { error: result.error, editId })
          }
        })
        .finally(() => {
          setIsLoadingProduct(false)
        })
    }
  }, [editId])

  const handleChange = (field: keyof ErfassungFormData, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setAiMetadata(prev => {
      const updated = { ...prev }
      delete updated[field]
      return updated
    })
  }

  const handleKategorieChange = (kategorie: string) => {
    setFormData(prev => ({
      ...prev,
      hauptkategorie: kategorie,
      unterkategorie: '',
      specs: templateToSpecFields(SPEC_TEMPLATES[kategorie] || SPEC_TEMPLATES.default),
    }))
  }

  const handleSpecChange = (index: number, field: 'key' | 'value', value: string) => {
    const newSpecs = [...formData.specs]
    newSpecs[index] = { ...newSpecs[index], [field]: value }
    setFormData(prev => ({ ...prev, specs: newSpecs }))
  }

  const addSpecField = () => {
    setFormData(prev => ({
      ...prev,
      specs: [...prev.specs, { key: '', value: '' }],
    }))
  }

  const removeSpecField = (index: number) => {
    if (formData.specs.length > 1) {
      setFormData(prev => ({
        ...prev,
        specs: prev.specs.filter((_, i) => i !== index),
      }))
    }
  }

  const toggleProfile = (slug: string) => {
    setFormData(prev => ({
      ...prev,
      kundenprofile: prev.kundenprofile.includes(slug)
        ? prev.kundenprofile.filter(p => p !== slug)
        : [...prev.kundenprofile, slug],
    }))
  }

  const handleProductData = useCallback((data: Partial<ErfassungFormData>, metadata?: AIFieldMetadata) => {
    logger.info('Product data received', { product: data.produktname, hasMetadata: !!metadata })

    setFormData(prev => mergeFormData(prev, data))

    if (metadata) {
      setAiMetadata(prev => ({ ...prev, ...metadata }))
    }
  }, [])

  const handleImageCapture = useCallback((imageBase64: string) => {
    setFormData(prev => ({ ...prev, image: imageBase64 }))
  }, [])

  const handleDataFilled = useCallback(() => {
    setDataEntryCollapsed(true)
    setReviewStarted(true)
  }, [])

  const handleManualEntry = useCallback(() => {
    setDataEntryCollapsed(true)
    setReviewStarted(true)
  }, [])

  // SyntheticEvent — accepts both <form onSubmit> (FormEvent) and inline button clicks (MouseEvent)
  const handleSubmit = async (e: React.SyntheticEvent, action: 'draft' | 'erfassen' | 'publish' = 'draft') => {
    e.preventDefault()
    setIsLoading(true)
    setSaveError('')

    try {
      const specifications: Record<string, string> = {}
      formData.specs.forEach(spec => {
        if (spec.key && spec.value) {
          specifications[spec.key] = spec.value
        }
      })

      if (isEditMode && editId) {
        const updatePayload = {
          product_name: formData.produktname,
          brand: formData.hersteller,
          short_description: formData.kurzbeschreibung,
          specifications,
          estimated_price_chf: parseFloat(formData.verkaufspreis) || 0,
          condition: formData.zustand,
          category: formData.hauptkategorie,
          subcategory: formData.unterkategorie,
          dimensions: {
            laenge_mm: parseInt(formData.laenge_mm) || null,
            breite_mm: parseInt(formData.breite_mm) || null,
            hoehe_mm: parseInt(formData.hoehe_mm) || null,
          },
          weight_grams: formData.gewicht_kg ? parseFloat(formData.gewicht_kg) * 1000 : null,
          location: formData.location,
          box_id: formData.box_id,
          quantity_available: parseInt(formData.auf_lager) || 1,
        }

        const result = await apiFetch<void>(`/api/admin/inventory/${editId}`, {
          method: 'PUT',
          body: updatePayload,
        })

        if (!result.success) {
          throw new Error(result.error || t('updateFailed'))
        }

        router.push(returnTo)
      } else {
        // Every input channel converges here. Destination is the only workflow
        // decision; the API maps it to checklist, inventory or an explicitly
        // untested listing while keeping donation provenance attached.
        const payload = formDataToPayload(formData, 'erfassen')

        const result = await apiFetch<{
          item_uuid: string
          product_id: string
          inventory_id: string
          listing_id: string | null
          published: boolean
        }>('/api/admin/intake', {
          method: 'POST',
          body: {
            ...payload,
            destination,
            qc_skip_reason: destination === CAPTURE_DESTINATIONS.SHOP_UNTESTED
              ? qcSkipReason.trim()
              : undefined,
            is_donation: donation.isDonation,
            donor_name: donation.donorName || undefined,
            donor_email: donation.donorEmail || undefined,
            donor_notes: donation.donorNotes || undefined,
            existing_donation_id: donation.existingDonationId || undefined,
          },
        })

        if (!result.success) {
          throw new Error(result.error || t('saveFailed'))
        }

        if (result.data) {
          setSavedItemUUID(result.data.item_uuid)
          setSavedProductId(result.data.product_id)
          setSavedInventoryId(result.data.inventory_id)
          setSavedAction(result.data.published ? 'publish' : 'erfassen')
          setSavedListingId(result.data.listing_id || null)
          setSavedQcRequired(destination === CAPTURE_DESTINATIONS.QUALITY)
        }
      }
    } catch (error) {
      logger.error('Error saving product', { error })
      setSaveError(error instanceof Error ? error.message : t('genericSaveError'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = useCallback(() => {
    setSavedItemUUID(null)
    setSavedProductId(null)
    setSavedInventoryId(null)
    setSavedAction('draft')
    setSavedListingId(null)
    setSavedQcRequired(false)
    setFormData(DEFAULT_FORM_DATA)
    setDonation(DEFAULT_DONATION)
    setDestination(CAPTURE_DESTINATIONS.QUALITY)
    setQcSkipReason('')
    setAiMetadata({})
    setReviewStarted(false)
    setDataEntryCollapsed(false)
  }, [])

  return {
    formData,
    aiMetadata,
    isLoading,
    isLoadingProduct,
    isEditMode,
    donation,
    setDonation,
    destination,
    setDestination,
    qcSkipReason,
    setQcSkipReason,
    savedAction,
    savedListingId,
    savedQcRequired,
    savedInventoryId,
    savedItemUUID,
    savedProductId,
    showAdvanced,
    reviewStarted,
    saveError,
    dataEntryCollapsed,
    handleChange,
    handleKategorieChange,
    handleSpecChange,
    addSpecField,
    removeSpecField,
    toggleProfile,
    handleProductData,
    handleImageCapture,
    handleDataFilled,
    handleManualEntry,
    handleSubmit,
    handleReset,
    setShowAdvanced,
    setFormData,
  }
}
