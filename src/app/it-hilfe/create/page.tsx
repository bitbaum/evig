'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { logger } from '@/lib/logger'
import {
  ArrowLeft,
  Wrench,
  AlertCircle,
  CheckCircle,
} from 'lucide-react'
import {
  DEVICE_CATEGORIES,
  URGENCY_LEVELS,
  SERVICE_TYPES,
  IT_SKILLS,
  SERVICE_CATEGORIES,
  getCategoryById,
} from '@/config/it-hilfe'
import { lookupSwissPostalCode } from '@/lib/swiss-postal-codes'

export default function CreatePeerRepairPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Form state
  const [categoryId, setCategoryId] = useState('')
  const [deviceBrand, setDeviceBrand] = useState('')
  const [deviceModel, setDeviceModel] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [urgency, setUrgency] = useState('normal')
  const [maxBudget, setMaxBudget] = useState('') // Empty = free/community help
  const [postalCode, setPostalCode] = useState('')
  const [city, setCity] = useState('')
  const [canton, setCanton] = useState('')
  const [serviceType, setServiceType] = useState('flexible')
  const [skillsNeeded, setSkillsNeeded] = useState<string[]>([])

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login?callbackUrl=/it-hilfe/create')
    }
  }, [status, router])

  // Auto-fill city and canton from postal code
  useEffect(() => {
    if (postalCode.length === 4) {
      const data = lookupSwissPostalCode(postalCode)
      if (data) {
        setCity(data.city)
        setCanton(data.canton)
      }
    }
  }, [postalCode])

  // Pre-fill form when category is selected
  const handleCategorySelect = (catId: string) => {
    setCategoryId(catId)
    const category = getCategoryById(catId)
    if (category) {
      // Pre-fill title and description with editable templates
      if (!title || title === getCategoryById(categoryId)?.defaultTitle) {
        setTitle(category.defaultTitle)
      }
      if (!description || description === getCategoryById(categoryId)?.defaultDescription) {
        setDescription(category.defaultDescription)
      }
      // Auto-select suggested skills
      setSkillsNeeded(category.suggestedSkills)
    }
  }

  const handleSkillToggle = (skillId: string) => {
    setSkillsNeeded((prev) =>
      prev.includes(skillId)
        ? prev.filter((s) => s !== skillId)
        : [...prev, skillId]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Convert maxBudget to cents (null if empty = free)
      const maxBudgetCents = maxBudget ? Math.round(parseFloat(maxBudget) * 100) : null

      const payload = {
        categoryId,
        deviceBrand: deviceBrand || null,
        deviceModel: deviceModel || null,
        title,
        description,
        urgency,
        maxBudgetCents,
        postalCode,
        city,
        canton,
        serviceType,
        skillsNeeded,
      }

      const response = await fetch('/api/it-hilfe/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Fehler beim Erstellen der Anfrage')
      }

      setSuccess(true)
      setTimeout(() => {
        router.push(`/it-hilfe/${data.data.requestId}`)
      }, 1500)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten'
      setError(message)
      logger.error('Error creating peer repair request', { error: err })
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Anfrage erstellt!</h2>
          <p className="text-gray-600">Du wirst gleich weitergeleitet...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        {/* Back link */}
        <Link
          href="/it-hilfe"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Zurück zur Übersicht
        </Link>

        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <Wrench className="w-6 h-6 text-emerald-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Reparaturanfrage erstellen</h1>
          </div>
          <p className="text-gray-600">
            Wähle ein Gerät und beschreibe dein Problem. Die Community hilft dir.
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Device Category - Primary selection */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Was möchtest du reparieren?</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {DEVICE_CATEGORIES.map((cat) => {
                const Icon = cat.icon
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleCategorySelect(cat.id)}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      categoryId === cat.id
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className={`w-10 h-10 mx-auto mb-2 rounded-lg ${cat.color} flex items-center justify-center`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-sm font-medium text-gray-900">{cat.name}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Only show rest of form after category selection */}
          {categoryId && (
            <>
              {/* Device Details - Pre-filled */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Beschreibe das Problem</h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Marke
                    </label>
                    <input
                      type="text"
                      value={deviceBrand}
                      onChange={(e) => setDeviceBrand(e.target.value)}
                      placeholder="z.B. Apple, Samsung, Lenovo"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Modell
                    </label>
                    <input
                      type="text"
                      value={deviceModel}
                      onChange={(e) => setDeviceModel(e.target.value)}
                      placeholder="z.B. MacBook Pro 2020"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Titel
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Kurze Beschreibung"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Beschreibung
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Was ist das Problem?"
                    rows={5}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Location */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Wo bist du?</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      PLZ
                    </label>
                    <input
                      type="text"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      placeholder="8001"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Stadt
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Stadt"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Kanton
                    </label>
                    <input
                      type="text"
                      value={canton}
                      onChange={(e) => setCanton(e.target.value)}
                      placeholder="Kanton"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Budget - Simplified */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Budget</h2>
                <p className="text-sm text-gray-600 mb-4">
                  Was bist du maximal bereit zu zahlen? Leer lassen für kostenlose Community-Hilfe.
                </p>
                <div className="flex items-center gap-3">
                  <span className="text-gray-500">CHF</span>
                  <input
                    type="number"
                    value={maxBudget}
                    onChange={(e) => setMaxBudget(e.target.value)}
                    placeholder="0 = gratis"
                    min="0"
                    step="5"
                    className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                  <span className="text-sm text-gray-500">
                    {!maxBudget ? 'Community-Hilfe (gratis)' : `bis CHF ${maxBudget}`}
                  </span>
                </div>
              </div>

              {/* Service Type & Urgency - Collapsible/Optional */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Optionen</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Wie soll die Reparatur erfolgen?
                    </label>
                    <select
                      value={serviceType}
                      onChange={(e) => setServiceType(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    >
                      {SERVICE_TYPES.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Wie dringend?
                    </label>
                    <select
                      value={urgency}
                      onChange={(e) => setUrgency(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    >
                      {URGENCY_LEVELS.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Skills - Pre-selected based on category */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Benötigte Skills</h2>
                <p className="text-sm text-gray-600 mb-4">
                  Bereits vorausgewählt basierend auf deinem Gerät. Du kannst anpassen.
                </p>

                {SERVICE_CATEGORIES.map((serviceCategory) => {
                  const skills = IT_SKILLS[serviceCategory.id] || []
                  if (skills.length === 0) return null
                  return (
                    <div key={serviceCategory.id} className="mb-4">
                      <h3 className="text-sm font-medium text-gray-700 mb-2">
                        {serviceCategory.name}
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {skills.map((skill) => (
                          <button
                            key={skill.id}
                            type="button"
                            onClick={() => handleSkillToggle(skill.id)}
                            className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                              skillsNeeded.includes(skill.id)
                                ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-500'
                                : 'bg-gray-100 text-gray-700 border-2 border-transparent hover:bg-gray-200'
                            }`}
                          >
                            {skill.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Submit */}
              <div className="flex justify-end gap-4">
                <Link
                  href="/it-hilfe"
                  className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  Abbrechen
                </Link>
                <button
                  type="submit"
                  disabled={loading || !categoryId || !title || !postalCode}
                  className="px-6 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Wird erstellt...' : 'Anfrage erstellen'}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  )
}
