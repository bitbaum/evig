import { useState, useCallback, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { logger } from '@/lib/logger'
import type { ErfassungFormData, AIFieldMetadata } from '@/types/erfassung'
import { DEFAULT_FORM_DATA, formDataToPayload } from '@/types/erfassung'
import { SPEC_TEMPLATES } from '@/config/erfassung'

export function useErfassungForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const editId = searchParams.get('edit')

  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingProduct, setIsLoadingProduct] = useState(false)
  const [savedItemUUID, setSavedItemUUID] = useState<string | null>(null)
  const [savedProductId, setSavedProductId] = useState<string | null>(null)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [formData, setFormData] = useState<ErfassungFormData>(DEFAULT_FORM_DATA)
  const [aiMetadata, setAiMetadata] = useState<AIFieldMetadata>({})

  const [showAIRefine, setShowAIRefine] = useState(false)
  const [aiInstruction, setAiInstruction] = useState('')
  const [aiRefining, setAiRefining] = useState(false)
  const [aiError, setAiError] = useState('')
  const [saveError, setSaveError] = useState('')
  const [aiSuccess, setAiSuccess] = useState('')
  const [dataEntryCollapsed, setDataEntryCollapsed] = useState(false)

  useEffect(() => {
    if (editId) {
      setIsEditMode(true)
      setIsLoadingProduct(true)
      setShowAdvanced(true)

      fetch(`/api/admin/inventory/${editId}`)
        .then(res => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`)
          return res.json()
        })
        .then(data => {
          if (data.success && data.data?.product) {
            const p = data.data.product
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
              box_id: p.box_id || '',
              auf_lager: p.quantity_available?.toString() || '1',
              hauptkategorie: p.category || '',
              unterkategorie: p.subcategory || '',
              kundenprofile: p.customer_profiles || [],
              image: p.image_url || null,
            })
          }
        })
        .catch(err => {
          logger.error('Failed to load product for edit', { error: err, editId })
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
      specs: SPEC_TEMPLATES[kategorie] || SPEC_TEMPLATES.default,
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

    setFormData(prev => ({
      ...prev,
      hersteller: data.hersteller || prev.hersteller,
      produktname: data.produktname || prev.produktname,
      kurzbeschreibung: data.kurzbeschreibung || prev.kurzbeschreibung,
      verkaufspreis: data.verkaufspreis || prev.verkaufspreis,
      zustand: data.zustand || prev.zustand,
      hauptkategorie: data.hauptkategorie || prev.hauptkategorie,
      unterkategorie: data.unterkategorie || prev.unterkategorie,
      kundenprofile: data.kundenprofile?.length ? data.kundenprofile : prev.kundenprofile,
      specs: data.specs?.length
        ? data.specs.map(s => ({ key: s.key, value: s.value }))
        : prev.specs,
    }))

    if (metadata) {
      setAiMetadata(prev => ({ ...prev, ...metadata }))
    }
  }, [])

  const handleImageCapture = useCallback((imageBase64: string) => {
    setFormData(prev => ({ ...prev, image: imageBase64 }))
  }, [])

  const handleDataFilled = useCallback(() => {
    setDataEntryCollapsed(true)
    setShowAIRefine(true)
  }, [])

  const handleAIRefine = async (instruction?: string) => {
    const refineInstruction = instruction || aiInstruction
    if (!refineInstruction.trim()) {
      setAiError('Bitte geben Sie eine Anweisung ein')
      return
    }

    if (!formData.produktname && !formData.hersteller) {
      setAiError('Bitte geben Sie zuerst Hersteller oder Produktname ein')
      return
    }

    setAiError('')
    setAiSuccess('')
    setAiRefining(true)

    try {
      const res = await fetch('/api/admin/erfassung/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentProduct: {
            hersteller: formData.hersteller,
            produktname: formData.produktname,
            kurzbeschreibung: formData.kurzbeschreibung,
            specs: formData.specs,
            verkaufspreis: formData.verkaufspreis,
            zustand: formData.zustand,
            hauptkategorie: formData.hauptkategorie,
            unterkategorie: formData.unterkategorie,
            kundenprofile: formData.kundenprofile,
          },
          instruction: refineInstruction,
        }),
      })

      const data = await res.json()

      if (data.success && data.data?.refined) {
        const ref = data.data.refined
        setFormData(prev => ({
          ...prev,
          hersteller: ref.hersteller || prev.hersteller,
          produktname: ref.produktname || prev.produktname,
          kurzbeschreibung: ref.kurzbeschreibung || prev.kurzbeschreibung,
          specs: ref.specs?.length ? ref.specs : prev.specs,
          verkaufspreis: ref.verkaufspreis || prev.verkaufspreis,
          zustand: ref.zustand || prev.zustand,
          hauptkategorie: ref.hauptkategorie || prev.hauptkategorie,
          unterkategorie: ref.unterkategorie || prev.unterkategorie,
          kundenprofile: ref.kundenprofile?.length ? ref.kundenprofile : prev.kundenprofile,
        }))
        setAiInstruction('')
        const changedFields = data.data.fieldsChanged || []
        setAiSuccess(`KI hat ${changedFields.length} Felder verbessert: ${changedFields.join(', ')}`)
      } else {
        setAiError(data.error || 'Verbesserung fehlgeschlagen')
      }
    } catch {
      setAiError('Netzwerkfehler. Bitte versuchen Sie es erneut.')
    } finally {
      setAiRefining(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent, action: 'draft' | 'erfassen' | 'publish' = 'draft') => {
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

        const response = await fetch(`/api/admin/inventory/${editId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatePayload),
        })

        if (!response.ok) {
          throw new Error('Produkt konnte nicht aktualisiert werden')
        }

        router.push('/admin/products')
      } else {
        const payload = formDataToPayload(formData, action)

        const response = await fetch('/api/admin/erfassung', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

        if (!response.ok) {
          throw new Error('Produkt konnte nicht gespeichert werden')
        }

        const result = await response.json()
        if (result.success && result.data) {
          setSavedItemUUID(result.data.item_uuid)
          setSavedProductId(result.data.product_id)
        } else {
          throw new Error(result.error || 'Unbekannter Fehler')
        }
      }
    } catch (error) {
      logger.error('Error saving product', { error })
      setSaveError(error instanceof Error ? error.message : 'Fehler beim Speichern. Bitte erneut versuchen.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = useCallback(() => {
    setSavedItemUUID(null)
    setSavedProductId(null)
    setFormData(DEFAULT_FORM_DATA)
    setAiMetadata({})
    setShowAIRefine(false)
    setDataEntryCollapsed(false)
  }, [])

  return {
    formData,
    aiMetadata,
    isLoading,
    isLoadingProduct,
    isEditMode,
    savedItemUUID,
    savedProductId,
    showAdvanced,
    showAIRefine,
    aiInstruction,
    aiRefining,
    aiError,
    aiSuccess,
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
    handleAIRefine,
    handleSubmit,
    handleReset,
    setShowAdvanced,
    setShowAIRefine,
    setAiInstruction,
    setFormData,
  }
}
