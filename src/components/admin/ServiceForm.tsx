'use client'

/**
 * Service Form Component
 *
 * Full service edit form for admin UI.
 * Handles all fields: basic info, hero, features, process, pricing.
 *
 * Sub-components extracted to service-form/ directory.
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import { IconPicker } from './IconPicker'
import { SERVICE_CATEGORIES } from '@/config/database'
import { CATEGORY_LABELS } from '@/config/service-categories'
import {
  CollapsibleSection,
  FeaturesSection,
  ProcessSection,
  PricingSection,
} from './service-form'
import type { Feature, ProcessStep, ServiceFormData } from './service-form'

interface ServiceFormProps {
  initialData?: Partial<ServiceFormData>
  isEdit?: boolean
}

export function ServiceForm({ initialData, isEdit = false }: ServiceFormProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [formData, setFormData] = useState<ServiceFormData>({
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
  })

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[äöüÄÖÜ]/g, (match) => {
        const map: Record<string, string> = { ä: 'ae', ö: 'oe', ü: 'ue', Ä: 'ae', Ö: 'oe', Ü: 'ue' }
        return map[match] || match
      })
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSaving(true)

    try {
      const url = isEdit ? `/api/admin/services/${initialData?.id}` : '/api/admin/services'
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Speichern fehlgeschlagen')
      }
      setSuccess(isEdit ? 'Dienstleistung gespeichert!' : 'Dienstleistung erstellt!')
      setTimeout(() => { router.push('/admin/services'); router.refresh() }, 1000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Speichern fehlgeschlagen')
    } finally {
      setSaving(false)
    }
  }

  const updateField = <K extends keyof ServiceFormData>(field: K, value: ServiceFormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
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
          <Link href="/admin/services" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {isEdit ? 'Dienstleistung bearbeiten' : 'Neue Dienstleistung'}
            </h1>
            {initialData?.slug && <p className="text-sm text-gray-500 dark:text-gray-400">/{initialData.slug}</p>}
          </div>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          Speichern
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div role="alert" className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      {success && (
        <div role="status" className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {/* Basic Info */}
      <CollapsibleSection title="Grundinformationen" defaultOpen={true}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, name: e.target.value, slug: !isEdit ? generateSlug(e.target.value) : prev.slug }))
              }}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Slug *</label>
            <input
              type="text"
              required
              pattern="[a-z0-9-]+"
              value={formData.slug}
              onChange={(e) => updateField('slug', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Kurzbeschreibung</label>
          <textarea
            value={formData.description}
            onChange={(e) => updateField('description', e.target.value)}
            rows={2}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Kategorie</label>
            <select
              value={formData.category}
              onChange={(e) => updateField('category', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {Object.values(SERVICE_CATEGORIES).map((cat) => (
                <option key={cat} value={cat}>{CATEGORY_LABELS[cat as keyof typeof CATEGORY_LABELS]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Dauer (Minuten)</label>
            <input
              type="number"
              min={0}
              value={formData.durationMinutes}
              onChange={(e) => updateField('durationMinutes', parseInt(e.target.value) || 0)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Preis (Rappen)</label>
            <input
              type="number"
              min={0}
              value={formData.priceCents ?? ''}
              onChange={(e) => updateField('priceCents', e.target.value ? parseInt(e.target.value) : null)}
              placeholder="Leer = Auf Anfrage"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Reihenfolge</label>
          <input
            type="number"
            min={0}
            value={formData.displayOrder}
            onChange={(e) => updateField('displayOrder', parseInt(e.target.value) || 0)}
            className="w-32 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

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
                className="w-4 h-4 text-green-600 rounded"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
            </label>
          ))}
        </div>
      </CollapsibleSection>

      {/* Hero */}
      <CollapsibleSection title="Hero-Bereich" defaultOpen={true}>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Icon</label>
          <IconPicker value={formData.iconName} onChange={(iconName) => updateField('iconName', iconName)} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Hero-Titel</label>
          <input
            type="text"
            value={formData.heroTitle}
            onChange={(e) => updateField('heroTitle', e.target.value)}
            placeholder={formData.name || 'Wird als Anzeigename verwendet'}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Hero-Untertitel</label>
          <input
            type="text"
            value={formData.heroSubtitle}
            onChange={(e) => updateField('heroSubtitle', e.target.value)}
            placeholder="Kurzer Slogan"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Hero-Beschreibung</label>
          <textarea
            value={formData.heroDescription}
            onChange={(e) => updateField('heroDescription', e.target.value)}
            rows={4}
            placeholder="Ausführliche Beschreibung für die Service-Seite"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
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
