'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { logger } from '@/lib/logger'
import {
  ArrowLeft,
  Save,
  Loader2,
  CheckCircle,
  MapPin,
  Clock,
  Euro,
  Users,
} from 'lucide-react'
import {
  IT_HILFE,
  SERVICE_CATEGORIES,
  IT_SKILLS,
  SERVICE_TYPES,
  BUDGET_TIERS,
  SWISS_CANTONS,
  type ITSkill,
} from '@/config/it-hilfe'

interface TechnicianProfile {
  skills: string[]
  bio: string
  hourlyRateCents: number | null
  acceptsGratis: boolean
  acceptsKulturlegi: boolean
  serviceTypes: string[]
  postalCode: string
  city: string
  canton: string
  maxTravelKm: number
  isActive: boolean
}

export default function SkillsProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [profile, setProfile] = useState<TechnicianProfile>({
    skills: [],
    bio: '',
    hourlyRateCents: null,
    acceptsGratis: true,
    acceptsKulturlegi: true,
    serviceTypes: ['flexible'],
    postalCode: '',
    city: '',
    canton: '',
    maxTravelKm: 10,
    isActive: false,
  })

  // Redirect if not logged in
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login?callbackUrl=/profil/skills')
    }
  }, [status, router])

  // Load existing profile
  useEffect(() => {
    if (status !== 'authenticated') return

    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/user/technician-profile')
        if (response.ok) {
          const data = await response.json()
          if (data.data?.profile) {
            setProfile(data.data.profile)
          }
        }
      } catch (err) {
        logger.error('Error fetching technician profile', { error: err })
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [status])

  const handleSkillToggle = (skillId: string) => {
    setProfile((prev) => ({
      ...prev,
      skills: prev.skills.includes(skillId)
        ? prev.skills.filter((s) => s !== skillId)
        : [...prev.skills, skillId],
    }))
  }

  const handleServiceTypeToggle = (typeId: string) => {
    setProfile((prev) => ({
      ...prev,
      serviceTypes: prev.serviceTypes.includes(typeId)
        ? prev.serviceTypes.filter((t) => t !== typeId)
        : [...prev.serviceTypes, typeId],
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    setSuccess(false)

    try {
      const response = await fetch('/api/user/technician-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Speichern fehlgeschlagen')
      }

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Speichern fehlgeschlagen'
      setError(message)
      logger.error('Error saving technician profile', { error: err })
    } finally {
      setSaving(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Zurück zum Dashboard
          </Link>

          <h1 className="text-2xl font-bold text-gray-900">
            IT-Hilfe anbieten
          </h1>
          <p className="text-gray-600 mt-1">
            Erfasse deine Skills und Verfügbarkeit, um anderen bei IT-Problemen zu helfen.
          </p>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            Profil erfolgreich gespeichert!
          </div>
        )}

        {/* Skills Selection */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600" />
            Deine Skills
          </h2>
          <p className="text-sm text-gray-600 mb-6">
            Wähle die Bereiche aus, in denen du anderen helfen kannst.
          </p>

          {SERVICE_CATEGORIES.map((category) => {
            const skills = IT_SKILLS[category.id] || []
            if (skills.length === 0) return null

            const CategoryIcon = category.icon

            return (
              <div key={category.id} className="mb-6 last:mb-0">
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-8 h-8 rounded-lg ${category.color} flex items-center justify-center`}>
                    <CategoryIcon className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="font-medium text-gray-900">{category.name}</h3>
                </div>
                <div className="flex flex-wrap gap-2 ml-10">
                  {skills.map((skill: ITSkill) => (
                    <button
                      key={skill.id}
                      type="button"
                      onClick={() => handleSkillToggle(skill.id)}
                      className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                        profile.skills.includes(skill.id)
                          ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-500'
                          : 'bg-gray-100 text-gray-700 border-2 border-transparent hover:bg-gray-200'
                      }`}
                      title={skill.description}
                    >
                      {skill.name}
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* Service Type */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-600" />
            Art der Hilfe
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Wie möchtest du Hilfe anbieten?
          </p>

          <div className="flex flex-wrap gap-2">
            {SERVICE_TYPES.filter((t) => t.id !== 'flexible').map((type) => (
              <button
                key={type.id}
                type="button"
                onClick={() => handleServiceTypeToggle(type.id)}
                className={`px-4 py-2 rounded-lg text-sm transition-all ${
                  profile.serviceTypes.includes(type.id)
                    ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-500'
                    : 'bg-gray-100 text-gray-700 border-2 border-transparent hover:bg-gray-200'
                }`}
              >
                {type.name}
                <span className="block text-xs opacity-75">{type.description}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Location */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-emerald-600" />
            Standort
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Wo bist du verfügbar?
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                PLZ
              </label>
              <input
                type="text"
                value={profile.postalCode}
                onChange={(e) =>
                  setProfile((prev) => ({ ...prev, postalCode: e.target.value }))
                }
                placeholder="8000"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                maxLength={4}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ort
              </label>
              <input
                type="text"
                value={profile.city}
                onChange={(e) =>
                  setProfile((prev) => ({ ...prev, city: e.target.value }))
                }
                placeholder="Zürich"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kanton
              </label>
              <select
                value={profile.canton}
                onChange={(e) =>
                  setProfile((prev) => ({ ...prev, canton: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="">Bitte wählen...</option>
                {SWISS_CANTONS.map((canton) => (
                  <option key={canton} value={canton}>
                    {canton}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max. Anfahrt (km)
              </label>
              <input
                type="number"
                value={profile.maxTravelKm}
                onChange={(e) =>
                  setProfile((prev) => ({
                    ...prev,
                    maxTravelKm: parseInt(e.target.value) || 0,
                  }))
                }
                min={0}
                max={100}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Euro className="w-5 h-5 text-emerald-600" />
            Vergütung
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Lege fest, wie du vergütet werden möchtest.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stundensatz (CHF)
              </label>
              <input
                type="number"
                value={profile.hourlyRateCents ? profile.hourlyRateCents / 100 : ''}
                onChange={(e) =>
                  setProfile((prev) => ({
                    ...prev,
                    hourlyRateCents: e.target.value
                      ? Math.round(parseFloat(e.target.value) * 100)
                      : null,
                  }))
                }
                placeholder="z.B. 40"
                min={0}
                step={5}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Leer lassen wenn du nur gratis helfen möchtest
              </p>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={profile.acceptsGratis}
                  onChange={(e) =>
                    setProfile((prev) => ({
                      ...prev,
                      acceptsGratis: e.target.checked,
                    }))
                  }
                  className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                />
                <span className="text-sm text-gray-700">
                  {BUDGET_TIERS.find((t) => t.id === 'gratis')?.icon} Ich helfe auch gratis (Community-Hilfe)
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={profile.acceptsKulturlegi}
                  onChange={(e) =>
                    setProfile((prev) => ({
                      ...prev,
                      acceptsKulturlegi: e.target.checked,
                    }))
                  }
                  className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                />
                <span className="text-sm text-gray-700">
                  {BUDGET_TIERS.find((t) => t.id === 'kulturlegi')?.icon} Ich akzeptiere KulturLegi (50% Rabatt)
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Bio */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Über dich
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Erzähle etwas über deine Erfahrung und warum du anderen helfen möchtest.
          </p>

          <textarea
            value={profile.bio}
            onChange={(e) =>
              setProfile((prev) => ({ ...prev, bio: e.target.value }))
            }
            placeholder="z.B. Ich repariere seit 10 Jahren Computer und helfe gerne Leuten, ihre Geräte länger zu nutzen..."
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            maxLength={1000}
          />
          <p className="text-xs text-gray-500 mt-1">
            {profile.bio.length}/1000 Zeichen
          </p>
        </div>

        {/* Active Toggle */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Profil aktivieren
              </h2>
              <p className="text-sm text-gray-600">
                Dein Profil wird in der Techniker-Suche angezeigt
              </p>
            </div>
            <div className="relative">
              <input
                type="checkbox"
                checked={profile.isActive}
                onChange={(e) =>
                  setProfile((prev) => ({
                    ...prev,
                    isActive: e.target.checked,
                  }))
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </div>
          </label>
        </div>

        {/* Save Button */}
        <div className="flex justify-end gap-4">
          <Link
            href={IT_HILFE.routes.browse}
            className="px-6 py-3 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Abbrechen
          </Link>
          <button
            onClick={handleSave}
            disabled={saving || profile.skills.length === 0}
            className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            Speichern
          </button>
        </div>

        {profile.skills.length === 0 && (
          <p className="text-sm text-amber-600 text-center mt-4">
            Bitte wähle mindestens einen Skill aus.
          </p>
        )}
      </div>
    </div>
  )
}
