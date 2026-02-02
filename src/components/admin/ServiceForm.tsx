'use client'

/**
 * Service Form Component
 *
 * Full service edit form for admin UI.
 * Handles all fields: basic info, hero, features, process, pricing.
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Save,
  Loader2,
  Plus,
  Trash2,
  GripVertical,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { IconPicker } from './IconPicker'
import { SERVICE_CATEGORIES } from '@/config/database'
import { CATEGORY_LABELS } from '@/config/service-categories'

interface Feature {
  title: string
  description: string
  icon: string
}

interface ProcessStep {
  step: number
  title: string
  description: string
}

interface ServiceFormData {
  id?: string
  name: string
  slug: string
  description: string
  category: string
  durationMinutes: number
  priceCents: number | null
  requiresApproval: boolean
  isActive: boolean
  isBookable: boolean
  isFeatured: boolean
  displayOrder: number
  // Presentation
  iconName: string
  heroTitle: string
  heroSubtitle: string
  heroDescription: string
  features: Feature[]
  process: ProcessStep[]
  pricingBase: string
  pricingDetails: string[]
  pricingMediaPrices: string[] | null
}

interface ServiceFormProps {
  initialData?: Partial<ServiceFormData>
  isEdit?: boolean
}

// Collapsible section component
function Section({
  title,
  children,
  defaultOpen = true,
}: {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-6 py-4 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-gray-500" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-500" />
        )}
      </button>
      {isOpen && <div className="p-6 space-y-4">{children}</div>}
    </div>
  )
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
    // Presentation
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
        const map: Record<string, string> = {
          ä: 'ae',
          ö: 'oe',
          ü: 'ue',
          Ä: 'ae',
          Ö: 'oe',
          Ü: 'ue',
        }
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
      const url = isEdit
        ? `/api/admin/services/${initialData?.id}`
        : '/api/admin/services'

      const method = isEdit ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Speichern fehlgeschlagen')
      }

      setSuccess(isEdit ? 'Dienstleistung gespeichert!' : 'Dienstleistung erstellt!')

      // Redirect after short delay
      setTimeout(() => {
        router.push('/admin/services')
        router.refresh()
      }, 1000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Speichern fehlgeschlagen')
    } finally {
      setSaving(false)
    }
  }

  // Feature management
  const addFeature = () => {
    setFormData((prev) => ({
      ...prev,
      features: [
        ...prev.features,
        { title: '', description: '', icon: 'Wrench' },
      ],
    }))
  }

  const updateFeature = (index: number, field: keyof Feature, value: string) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.map((f, i) =>
        i === index ? { ...f, [field]: value } : f
      ),
    }))
  }

  const removeFeature = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }))
  }

  // Process step management
  const addProcessStep = () => {
    setFormData((prev) => ({
      ...prev,
      process: [
        ...prev.process,
        { step: prev.process.length + 1, title: '', description: '' },
      ],
    }))
  }

  const updateProcessStep = (
    index: number,
    field: keyof ProcessStep,
    value: string | number
  ) => {
    setFormData((prev) => ({
      ...prev,
      process: prev.process.map((p, i) =>
        i === index ? { ...p, [field]: value } : p
      ),
    }))
  }

  const removeProcessStep = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      process: prev.process
        .filter((_, i) => i !== index)
        .map((p, i) => ({ ...p, step: i + 1 })),
    }))
  }

  // Pricing details management
  const addPricingDetail = () => {
    setFormData((prev) => ({
      ...prev,
      pricingDetails: [...prev.pricingDetails, ''],
    }))
  }

  const updatePricingDetail = (index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      pricingDetails: prev.pricingDetails.map((d, i) =>
        i === index ? value : d
      ),
    }))
  }

  const removePricingDetail = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      pricingDetails: prev.pricingDetails.filter((_, i) => i !== index),
    }))
  }

  // Media prices management
  const addMediaPrice = () => {
    setFormData((prev) => ({
      ...prev,
      pricingMediaPrices: [...(prev.pricingMediaPrices || []), ''],
    }))
  }

  const updateMediaPrice = (index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      pricingMediaPrices: (prev.pricingMediaPrices || []).map((p, i) =>
        i === index ? value : p
      ),
    }))
  }

  const removeMediaPrice = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      pricingMediaPrices: (prev.pricingMediaPrices || []).filter(
        (_, i) => i !== index
      ),
    }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/services"
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {isEdit ? 'Dienstleistung bearbeiten' : 'Neue Dienstleistung'}
            </h1>
            {initialData?.slug && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                /{initialData.slug}
              </p>
            )}
          </div>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors"
        >
          {saving ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Save className="w-5 h-5" />
          )}
          Speichern
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {/* Basic Info */}
      <Section title="Grundinformationen" defaultOpen={true}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => {
                setFormData((prev) => ({
                  ...prev,
                  name: e.target.value,
                  slug: !isEdit ? generateSlug(e.target.value) : prev.slug,
                }))
              }}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Slug *
            </label>
            <input
              type="text"
              required
              pattern="[a-z0-9-]+"
              value={formData.slug}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, slug: e.target.value }))
              }
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Kurzbeschreibung
          </label>
          <textarea
            value={formData.description}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, description: e.target.value }))
            }
            rows={2}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Kategorie
            </label>
            <select
              value={formData.category}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, category: e.target.value }))
              }
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {Object.values(SERVICE_CATEGORIES).map((cat) => (
                <option key={cat} value={cat}>
                  {CATEGORY_LABELS[cat as keyof typeof CATEGORY_LABELS]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Dauer (Minuten)
            </label>
            <input
              type="number"
              min={0}
              value={formData.durationMinutes}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  durationMinutes: parseInt(e.target.value) || 0,
                }))
              }
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Preis (Rappen)
            </label>
            <input
              type="number"
              min={0}
              value={formData.priceCents ?? ''}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  priceCents: e.target.value ? parseInt(e.target.value) : null,
                }))
              }
              placeholder="Leer = Auf Anfrage"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Reihenfolge
          </label>
          <input
            type="number"
            min={0}
            value={formData.displayOrder}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                displayOrder: parseInt(e.target.value) || 0,
              }))
            }
            className="w-32 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, isActive: e.target.checked }))
              }
              className="w-4 h-4 text-green-600 rounded"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Aktiv
            </span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isBookable}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  isBookable: e.target.checked,
                }))
              }
              className="w-4 h-4 text-green-600 rounded"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Buchbar
            </span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isFeatured}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  isFeatured: e.target.checked,
                }))
              }
              className="w-4 h-4 text-green-600 rounded"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Auf Hauptseite anzeigen
            </span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.requiresApproval}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  requiresApproval: e.target.checked,
                }))
              }
              className="w-4 h-4 text-green-600 rounded"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Erfordert Genehmigung
            </span>
          </label>
        </div>
      </Section>

      {/* Icon & Hero */}
      <Section title="Hero-Bereich" defaultOpen={true}>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Icon
          </label>
          <IconPicker
            value={formData.iconName}
            onChange={(iconName) =>
              setFormData((prev) => ({ ...prev, iconName }))
            }
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Hero-Titel
          </label>
          <input
            type="text"
            value={formData.heroTitle}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, heroTitle: e.target.value }))
            }
            placeholder={formData.name || 'Wird als Anzeigename verwendet'}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Hero-Untertitel
          </label>
          <input
            type="text"
            value={formData.heroSubtitle}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, heroSubtitle: e.target.value }))
            }
            placeholder="Kurzer Slogan"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Hero-Beschreibung
          </label>
          <textarea
            value={formData.heroDescription}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                heroDescription: e.target.value,
              }))
            }
            rows={4}
            placeholder="Ausführliche Beschreibung für die Service-Seite"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
      </Section>

      {/* Features */}
      <Section title="Features" defaultOpen={false}>
        <div className="space-y-4">
          {formData.features.map((feature, index) => (
            <div
              key={index}
              className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-400">
                  <GripVertical className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    Feature {index + 1}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => removeFeature(index)}
                  className="p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={feature.title}
                  onChange={(e) =>
                    updateFeature(index, 'title', e.target.value)
                  }
                  placeholder="Titel"
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
                <IconPicker
                  value={feature.icon}
                  onChange={(icon) => updateFeature(index, 'icon', icon)}
                />
              </div>
              <textarea
                value={feature.description}
                onChange={(e) =>
                  updateFeature(index, 'description', e.target.value)
                }
                placeholder="Beschreibung"
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
          ))}
          <button
            type="button"
            onClick={addFeature}
            className="flex items-center gap-2 px-4 py-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Feature hinzufügen
          </button>
        </div>
      </Section>

      {/* Process */}
      <Section title="Prozess-Schritte" defaultOpen={false}>
        <div className="space-y-4">
          {formData.process.map((step, index) => (
            <div
              key={index}
              className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    {step.step}
                  </div>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Schritt {step.step}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => removeProcessStep(index)}
                  className="p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <input
                type="text"
                value={step.title}
                onChange={(e) =>
                  updateProcessStep(index, 'title', e.target.value)
                }
                placeholder="Titel des Schritts"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
              <textarea
                value={step.description}
                onChange={(e) =>
                  updateProcessStep(index, 'description', e.target.value)
                }
                placeholder="Beschreibung"
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
          ))}
          <button
            type="button"
            onClick={addProcessStep}
            className="flex items-center gap-2 px-4 py-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Schritt hinzufügen
          </button>
        </div>
      </Section>

      {/* Pricing Display */}
      <Section title="Preisanzeige" defaultOpen={false}>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Basis-Preis (Anzeige)
          </label>
          <input
            type="text"
            value={formData.pricingBase}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, pricingBase: e.target.value }))
            }
            placeholder="z.B. CHF 70/Stunde, Kostenlos, Auf Anfrage"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Preisdetails
          </label>
          <div className="space-y-2">
            {formData.pricingDetails.map((detail, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={detail}
                  onChange={(e) => updatePricingDetail(index, e.target.value)}
                  placeholder="Detail-Zeile"
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => removePricingDetail(index)}
                  className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addPricingDetail}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg"
            >
              <Plus className="w-4 h-4" />
              Detail hinzufügen
            </button>
          </div>
        </div>

        {/* Media Prices (optional, for data recovery service) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Medienpreise (optional, für Datenrettung)
          </label>
          <div className="space-y-2">
            {(formData.pricingMediaPrices || []).map((price, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={price}
                  onChange={(e) => updateMediaPrice(index, e.target.value)}
                  placeholder="z.B. Disketten: CHF 10 pro Stück"
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => removeMediaPrice(index)}
                  className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addMediaPrice}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg"
            >
              <Plus className="w-4 h-4" />
              Medienpreis hinzufügen
            </button>
          </div>
        </div>
      </Section>
    </form>
  )
}
