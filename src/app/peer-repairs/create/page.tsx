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
  BUDGET_TYPES,
  SERVICE_TYPES,
  REPAIR_SKILLS,
  getSkillsByCategory,
} from '@/config/peer-repairs'
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
  const [budgetType, setBudgetType] = useState('')
  const [budgetAmount, setBudgetAmount] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [city, setCity] = useState('')
  const [canton, setCanton] = useState('')
  const [serviceType, setServiceType] = useState('flexible')
  const [skillsNeeded, setSkillsNeeded] = useState<string[]>([])

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login?callbackUrl=/peer-repairs/create')
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
      const budgetTypeConfig = BUDGET_TYPES.find((b) => b.id === budgetType)

      const payload = {
        categoryId,
        deviceBrand: deviceBrand || null,
        deviceModel: deviceModel || null,
        title,
        description,
        urgency,
        budgetType,
        budgetAmountCents: budgetTypeConfig?.requiresAmount
          ? Math.round(parseFloat(budgetAmount) * 100)
          : null,
        postalCode,
        city,
        canton,
        serviceType,
        skillsNeeded,
      }

      const response = await fetch('/api/peer-repairs/requests', {
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
        router.push(`/peer-repairs/${data.data.requestId}`)
      }, 1500)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten'
      setError(message)
      logger.error('Error creating peer repair request', { error: err })
    } finally {
      setLoading(false)
    }
  }

  const budgetTypeConfig = BUDGET_TYPES.find((b) => b.id === budgetType)
  const skillsByCategory = getSkillsByCategory()

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
          href="/peer-repairs"
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
            Beschreibe dein Reparaturproblem und finde Hilfe aus der Community.
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
          {/* Device Category */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Gerätekategorie</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {DEVICE_CATEGORIES.map((cat) => {
                const Icon = cat.icon
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategoryId(cat.id)}
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

          {/* Device Details */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Gerätedetails</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Marke (optional)
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
                  Modell (optional)
                </label>
                <input
                  type="text"
                  value={deviceModel}
                  onChange={(e) => setDeviceModel(e.target.value)}
                  placeholder="z.B. MacBook Pro 2020, Galaxy S21"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Titel <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Kurze Beschreibung des Problems"
                required
                minLength={10}
                maxLength={200}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
              <p className="text-xs text-gray-500 mt-1">{title.length}/200 Zeichen</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Beschreibung <span className="text-red-500">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Beschreibe das Problem detailliert: Was funktioniert nicht? Wann ist es passiert? Was hast du bereits versucht?"
                required
                minLength={20}
                maxLength={5000}
                rows={5}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
              <p className="text-xs text-gray-500 mt-1">{description.length}/5000 Zeichen</p>
            </div>
          </div>

          {/* Location */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Standort</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Postleitzahl <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="z.B. 8001"
                  required
                  pattern="\d{4}"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stadt <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Stadt"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kanton <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={canton}
                  onChange={(e) => setCanton(e.target.value)}
                  placeholder="Kanton"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Service Type & Urgency */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Service & Dringlichkeit</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Service-Typ
                </label>
                <select
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  {SERVICE_TYPES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} - {s.description}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dringlichkeit
                </label>
                <select
                  value={urgency}
                  onChange={(e) => setUrgency(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  {URGENCY_LEVELS.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} - {u.description}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Budget */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Vergütung</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              {BUDGET_TYPES.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setBudgetType(b.id)}
                  className={`p-3 rounded-lg border-2 transition-all text-left ${
                    budgetType === b.id
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="block text-sm font-medium text-gray-900">{b.name}</span>
                  <span className="block text-xs text-gray-500 mt-1">{b.description}</span>
                </button>
              ))}
            </div>

            {budgetTypeConfig?.requiresAmount && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Betrag (CHF) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={budgetAmount}
                  onChange={(e) => setBudgetAmount(e.target.value)}
                  placeholder="z.B. 50"
                  min="1"
                  step="1"
                  required={budgetTypeConfig.requiresAmount}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            )}
          </div>

          {/* Skills needed */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Benötigte Skills (optional)</h2>
            <p className="text-sm text-gray-600 mb-4">
              Wähle die Skills aus, die für diese Reparatur hilfreich sein könnten.
            </p>

            {Object.entries(skillsByCategory).map(([category, skills]) => (
              <div key={category} className="mb-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2 capitalize">
                  {category === 'hardware' ? 'Hardware' : category === 'software' ? 'Software' : 'Netzwerk'}
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
            ))}
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-4">
            <Link
              href="/peer-repairs"
              className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              Abbrechen
            </Link>
            <button
              type="submit"
              disabled={loading || !categoryId || !budgetType || !title || !description || !postalCode || !city || !canton}
              className="px-6 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Wird erstellt...' : 'Anfrage erstellen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
