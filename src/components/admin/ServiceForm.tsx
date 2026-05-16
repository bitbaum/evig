'use client'

/**
 * Service Form Component
 *
 * Full service edit form for admin UI.
 * Handles all fields: basic info, hero, features, process, pricing.
 *
 * Sub-components extracted to service-form/ directory.
 */

import { Link } from '@/i18n/navigation'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import Heading from '@/components/admin/AdminHeading'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { FormField } from '@/components/ui/form-field'
import { IconPicker } from './IconPicker'
import { SERVICE_CATEGORIES } from '@/config/database'
import { SERVICE_CATEGORY_LABELS } from '@/config/service-categories'
import {
  CollapsibleSection,
  FeaturesSection,
  ProcessSection,
  PricingSection,
} from './service-form'
import type { Feature, ProcessStep, ServiceFormData } from './service-form'
import { AIFormAssist } from '@/components/ai/AIFormAssist'
import { generateSlug } from '@/lib/utils/slug'
import { useFormHandler } from '@/hooks/useFormHandler'

interface ServiceFormProps {
  initialData?: Partial<ServiceFormData>
  isEdit?: boolean
}

export function ServiceForm({ initialData, isEdit = false }: ServiceFormProps) {
  const form = useFormHandler<ServiceFormData>({
    initialData: {
      name: initialData?.name || '',
      slug: initialData?.slug || '',
      description: initialData?.description || '',
      category: initialData?.category || 'general',
      durationMinutes: initialData?.durationMinutes || 60,
      priceCents: initialData?.priceCents ?? null,
      requiresApproval: initialData?.requiresApproval || false,
      isActive: initialData?.isActive ?? true,
      isBookable: initialData?.isBookable ?? true,
      isFeatured: initialData?.isFeatured || false,
      displayOrder: initialData?.displayOrder || 100,
      iconName: initialData?.iconName || 'Wrench',
      heroTitle: initialData?.heroTitle || '',
      heroSubtitle: initialData?.heroSubtitle || '',
      heroDescription: initialData?.heroDescription || '',
      features: initialData?.features || [],
      process: initialData?.process || [],
      pricingBase: initialData?.pricingBase || '',
      pricingDetails: initialData?.pricingDetails || [],
      pricingMediaPrices: initialData?.pricingMediaPrices || null,
    },
    apiEndpoint: '/api/admin/services',
    isEdit,
    editId: initialData?.id,
    editMethod: 'PUT',
    redirectTo: '/admin/services',
    createSuccessMessage: 'Dienstleistung erstellt!',
    editSuccessMessage: 'Dienstleistung gespeichert!',
  })

  const { data: formData, setData: setFormData, updateField, isSubmitting: saving, error, success, handleSubmit } = form

  const handleAIFieldsFilled = (data: Partial<Record<string, unknown>>) => {
    setFormData(prev => {
      const updated = { ...prev }
      if (data.name) updated.name = String(data.name)
      if (data.description) updated.description = String(data.description)
      if (data.heroTitle) updated.heroTitle = String(data.heroTitle)
      if (data.heroSubtitle) updated.heroSubtitle = String(data.heroSubtitle)
      if (data.heroDescription) updated.heroDescription = String(data.heroDescription)
      if (Array.isArray(data.features)) updated.features = data.features as Feature[]
      if (Array.isArray(data.process)) updated.process = data.process as ProcessStep[]
      return updated
    })
  }

  // Feature management
  const addFeature = () => updateField('features', [...formData.features, { title: '', description: '', icon: 'Wrench' }])
  const updateFeature = (index: number, field: keyof Feature, value: string) => {
    updateField('features', formData.features.map((f, i) => (i === index ? { ...f, [field]: value } : f)))
  }
  const removeFeature = (index: number) => updateField('features', formData.features.filter((_, i) => i !== index))

  // Process step management
  const addProcessStep = () => updateField('process', [...formData.process, { step: formData.process.length + 1, title: '', description: '' }])
  const updateProcessStep = (index: number, field: keyof ProcessStep, value: string | number) => {
    updateField('process', formData.process.map((p, i) => (i === index ? { ...p, [field]: value } : p)))
  }
  const removeProcessStep = (index: number) => {
    updateField('process', formData.process.filter((_, i) => i !== index).map((p, i) => ({ ...p, step: i + 1 })))
  }

  // Pricing management
  const addPricingDetail = () => updateField('pricingDetails', [...formData.pricingDetails, ''])
  const updatePricingDetail = (index: number, value: string) => {
    updateField('pricingDetails', formData.pricingDetails.map((d, i) => (i === index ? value : d)))
  }
  const removePricingDetail = (index: number) => updateField('pricingDetails', formData.pricingDetails.filter((_, i) => i !== index))

  const addMediaPrice = () => updateField('pricingMediaPrices', [...(formData.pricingMediaPrices || []), ''])
  const updateMediaPrice = (index: number, value: string) => {
    updateField('pricingMediaPrices', (formData.pricingMediaPrices || []).map((p, i) => (i === index ? value : p)))
  }
  const removeMediaPrice = (index: number) => {
    updateField('pricingMediaPrices', (formData.pricingMediaPrices || []).filter((_, i) => i !== index))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/services" className="p-2 hover:bg-neutral-100 dark:hover:bg-white/[0.06] rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
          </Link>
          <div>
            <Heading level={1} className="text-2xl text-neutral-900 dark:text-white">
              {isEdit ? 'Dienstleistung bearbeiten' : 'Neue Dienstleistung'}
            </Heading>
            {initialData?.slug && <p className="text-sm text-neutral-500 dark:text-neutral-400">/{initialData.slug}</p>}
          </div>
        </div>
        <Button type="submit" disabled={saving} className="gap-2 px-6">
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          Speichern
        </Button>
      </div>

      {/* Alerts */}
      {error && (
        <div id="service-form-error" role="alert" className="bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 text-error-700 dark:text-error-300 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      {success && (
        <div role="status" className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 text-primary-700 dark:text-primary-300 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {/* AI Assistant */}
      <AIFormAssist
        formType="service"
        placeholder="Beschreibe die Dienstleistung in 1-2 Sätzen..."
        defaultExpanded={true}
        onFieldsFilled={handleAIFieldsFilled}
        currentData={formData as unknown as Record<string, unknown>}
      />

      {/* Basic Info */}
      <CollapsibleSection title="Grundinformationen" defaultOpen={true}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Name" required htmlFor="service-name">
            <Input
              id="service-name"
              type="text"
              required
              aria-required="true"
              aria-invalid={!!error}
              aria-describedby={error ? 'service-form-error' : undefined}
              value={formData.name}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, name: e.target.value, slug: !isEdit ? generateSlug(e.target.value) : prev.slug }))
              }}
            />
          </FormField>
          <FormField label="Slug" required htmlFor="service-slug">
            <Input
              id="service-slug"
              type="text"
              required
              aria-required="true"
              pattern="[a-z0-9-]+"
              value={formData.slug}
              onChange={(e) => updateField('slug', e.target.value)}
              className="font-mono text-sm"
            />
          </FormField>
        </div>

        <FormField label="Kurzbeschreibung">
          <Textarea
            value={formData.description}
            onChange={(e) => updateField('description', e.target.value)}
            rows={2}
          />
        </FormField>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField label="Kategorie" htmlFor="service-category">
            <Select
              id="service-category"
              value={formData.category}
              onChange={(e) => updateField('category', e.target.value)}
            >
              {Object.values(SERVICE_CATEGORIES).map((cat) => (
                <option key={cat} value={cat}>{SERVICE_CATEGORY_LABELS[cat as keyof typeof SERVICE_CATEGORY_LABELS]}</option>
              ))}
            </Select>
          </FormField>
          <FormField label="Dauer (Minuten)" htmlFor="service-duration">
            <Input
              id="service-duration"
              type="number"
              min={0}
              value={formData.durationMinutes}
              onChange={(e) => updateField('durationMinutes', parseInt(e.target.value) || 0)}
            />
          </FormField>
          <FormField label="Preis (Rappen)" htmlFor="service-price">
            <Input
              id="service-price"
              type="number"
              min={0}
              value={formData.priceCents ?? ''}
              onChange={(e) => updateField('priceCents', e.target.value ? parseInt(e.target.value) : null)}
              placeholder="Leer = Auf Anfrage"
            />
          </FormField>
        </div>

        <FormField label="Reihenfolge" htmlFor="service-order">
          <Input
            id="service-order"
            type="number"
            min={0}
            value={formData.displayOrder}
            onChange={(e) => updateField('displayOrder', parseInt(e.target.value) || 0)}
            className="w-32"
          />
        </FormField>

        <div className="flex flex-wrap gap-6">
          {[
            { field: 'isActive' as const, label: 'Aktiv' },
            { field: 'isBookable' as const, label: 'Buchbar' },
            { field: 'isFeatured' as const, label: 'Auf Hauptseite anzeigen' },
            { field: 'requiresApproval' as const, label: 'Erfordert Genehmigung' },
          ].map(({ field, label }) => (
            <label key={field} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={!!formData[field]}
                onChange={(e) => updateField(field, e.target.checked)}
                className="w-4 h-4 text-primary-600 rounded"
              />
              <span className="text-sm text-neutral-700 dark:text-neutral-300">{label}</span>
            </label>
          ))}
        </div>
      </CollapsibleSection>

      {/* Hero */}
      <CollapsibleSection title="Hero-Bereich" defaultOpen={true}>
        <FormField label="Icon">
          <IconPicker value={formData.iconName} onChange={(iconName) => updateField('iconName', iconName)} />
        </FormField>
        <FormField label="Hero-Titel" htmlFor="hero-title">
          <Input
            id="hero-title"
            type="text"
            value={formData.heroTitle}
            onChange={(e) => updateField('heroTitle', e.target.value)}
            placeholder={formData.name || 'Wird als Anzeigename verwendet'}
          />
        </FormField>
        <FormField label="Hero-Untertitel" htmlFor="hero-subtitle">
          <Input
            id="hero-subtitle"
            type="text"
            value={formData.heroSubtitle}
            onChange={(e) => updateField('heroSubtitle', e.target.value)}
            placeholder="Kurzer Slogan"
          />
        </FormField>
        <FormField label="Hero-Beschreibung" htmlFor="hero-description">
          <Textarea
            id="hero-description"
            value={formData.heroDescription}
            onChange={(e) => updateField('heroDescription', e.target.value)}
            rows={4}
            placeholder="Ausführliche Beschreibung für die Service-Seite"
          />
        </FormField>
      </CollapsibleSection>

      {/* Extracted Sections */}
      <FeaturesSection features={formData.features} onAdd={addFeature} onUpdate={updateFeature} onRemove={removeFeature} />
      <ProcessSection steps={formData.process} onAdd={addProcessStep} onUpdate={updateProcessStep} onRemove={removeProcessStep} />
      <PricingSection
        pricingBase={formData.pricingBase}
        pricingDetails={formData.pricingDetails}
        pricingMediaPrices={formData.pricingMediaPrices}
        onBaseChange={(v) => updateField('pricingBase', v)}
        onDetailAdd={addPricingDetail}
        onDetailUpdate={updatePricingDetail}
        onDetailRemove={removePricingDetail}
        onMediaPriceAdd={addMediaPrice}
        onMediaPriceUpdate={updateMediaPrice}
        onMediaPriceRemove={removeMediaPrice}
      />
    </form>
  )
}
