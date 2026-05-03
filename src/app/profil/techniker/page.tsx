'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { apiFetch } from '@/lib/api/client'
import { logger } from '@/lib/logger'
import { UI_FEEDBACK_MS } from '@/config/limits'
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
import Heading from '@/components/ui/Heading'
import {
  IT_HILFE,
  SERVICE_CATEGORIES,
  IT_SKILLS,
  SERVICE_TYPES,
  SERVICE_TYPE,
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

export default function TechnikerProfilPage() {
  const t = useTranslations('profil.techniker')
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
      router.push('/auth/login?callbackUrl=/profil/techniker')
    }
  }, [status, router])

  // Load existing profile
  useEffect(() => {
    if (status !== 'authenticated') return

    const fetchProfile = async () => {
      try {
        const result = await apiFetch<{ profile: TechnicianProfile | null }>(
          '/api/user/technician-profile',
        )
        if (result.success && result.data?.profile) {
          setProfile(result.data.profile)
        } else if (!result.success) {
          logger.warn('Error fetching technician profile', { error: result.error })
        }
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
      const result = await apiFetch<unknown>('/api/user/technician-profile', {
        method: 'PUT',
        body: profile,
      })

      if (!result.success) {
        throw new Error(result.error || t('saveFailed'))
      }

      setSuccess(true)
      setTimeout(() => setSuccess(false), UI_FEEDBACK_MS.SUCCESS)
    } catch (err) {
      const message = err instanceof Error ? err.message : t('saveFailed')
      setError(message)
      logger.error('Error saving technician profile', { error: err })
    } finally {
      setSaving(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-neutral-600 hover:text-neutral-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('backToDashboard')}
          </Link>

          <Heading level={1} className="text-2xl text-neutral-900">
            {t('pageTitle')}
          </Heading>
          <p className="text-neutral-600 mt-1">
            {t('pageDesc')}
          </p>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-primary-50 border border-primary-200 rounded-lg text-primary-700 flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            {t('saveSuccess')}
          </div>
        )}

        {/* Skills Selection */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-100 p-6 mb-6">
          <Heading level={2} className="text-lg text-neutral-900 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600" />
            {t('skills.heading')}
          </Heading>
          <p className="text-sm text-neutral-600 mb-6">
            {t('skills.desc')}
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
                  <Heading level={3} className="font-medium text-neutral-900">{category.name}</Heading>
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
                          : 'bg-neutral-100 text-neutral-700 border-2 border-transparent hover:bg-neutral-200'
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
        <div className="bg-white rounded-xl shadow-sm border border-neutral-100 p-6 mb-6">
          <Heading level={2} className="text-lg text-neutral-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-600" />
            {t('serviceType.heading')}
          </Heading>
          <p className="text-sm text-neutral-600 mb-4">
            {t('serviceType.desc')}
          </p>

          <div className="flex flex-wrap gap-2">
            {SERVICE_TYPES.filter((t) => t.id !== SERVICE_TYPE.FLEXIBLE).map((type) => (
              <button
                key={type.id}
                type="button"
                onClick={() => handleServiceTypeToggle(type.id)}
                className={`px-4 py-2 rounded-lg text-sm transition-all ${
                  profile.serviceTypes.includes(type.id)
                    ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-500'
                    : 'bg-neutral-100 text-neutral-700 border-2 border-transparent hover:bg-neutral-200'
                }`}
              >
                {type.name}
                <span className="block text-xs opacity-75">{type.description}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Location */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-100 p-6 mb-6">
          <Heading level={2} className="text-lg text-neutral-900 mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-emerald-600" />
            {t('location.heading')}
          </Heading>
          <p className="text-sm text-neutral-600 mb-4">
            {t('location.desc')}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                {t('location.postalCode')}
              </label>
              <input
                type="text"
                value={profile.postalCode}
                onChange={(e) =>
                  setProfile((prev) => ({ ...prev, postalCode: e.target.value }))
                }
                placeholder="8000"
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                maxLength={4}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                {t('location.city')}
              </label>
              <input
                type="text"
                value={profile.city}
                onChange={(e) =>
                  setProfile((prev) => ({ ...prev, city: e.target.value }))
                }
                placeholder="Zürich"
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                {t('location.canton')}
              </label>
              <select
                value={profile.canton}
                onChange={(e) =>
                  setProfile((prev) => ({ ...prev, canton: e.target.value }))
                }
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="">{t('location.cantonPlaceholder')}</option>
                {SWISS_CANTONS.map((canton) => (
                  <option key={canton} value={canton}>
                    {canton}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                {t('location.maxTravel')}
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
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-100 p-6 mb-6">
          <Heading level={2} className="text-lg text-neutral-900 mb-4 flex items-center gap-2">
            <Euro className="w-5 h-5 text-emerald-600" />
            {t('pricing.heading')}
          </Heading>
          <p className="text-sm text-neutral-600 mb-4">
            {t('pricing.desc')}
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                {t('pricing.hourlyRate')}
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
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
              <p className="text-xs text-neutral-500 mt-1">
                {t('pricing.hourlyRateHint')}
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
                  className="w-4 h-4 text-emerald-600 border-neutral-300 rounded focus:ring-emerald-500"
                />
                <span className="text-sm text-neutral-700">
                  {BUDGET_TIERS.find((tier) => tier.id === 'gratis')?.icon} {t('pricing.acceptsGratis')}
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
                  className="w-4 h-4 text-emerald-600 border-neutral-300 rounded focus:ring-emerald-500"
                />
                <span className="text-sm text-neutral-700">
                  {BUDGET_TIERS.find((tier) => tier.id === 'kulturlegi')?.icon} {t('pricing.acceptsKulturlegi')}
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Bio */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-100 p-6 mb-6">
          <Heading level={2} className="text-lg text-neutral-900 mb-4">
            {t('bio.heading')}
          </Heading>
          <p className="text-sm text-neutral-600 mb-4">
            {t('bio.desc')}
          </p>

          <textarea
            value={profile.bio}
            onChange={(e) =>
              setProfile((prev) => ({ ...prev, bio: e.target.value }))
            }
            placeholder={t('bio.placeholder')}
            rows={4}
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            maxLength={1000}
          />
          <p className="text-xs text-neutral-500 mt-1">
            {t('bio.charCount', { count: profile.bio.length })}
          </p>
        </div>

        {/* Active Toggle */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-100 p-6 mb-6">
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <Heading level={2} className="text-lg text-neutral-900">
                {t('activate.heading')}
              </Heading>
              <p className="text-sm text-neutral-600">
                {t('activate.desc')}
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
              <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </div>
          </label>
        </div>

        {/* Save Button */}
        <div className="flex justify-end gap-4">
          <Link
            href={IT_HILFE.routes.browse}
            className="px-6 py-3 text-neutral-700 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
          >
            {t('cancel')}
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
            {saving ? t('saving') : t('save')}
          </button>
        </div>

        {profile.skills.length === 0 && (
          <p className="text-sm text-warning-600 text-center mt-4">
            {t('skillRequired')}
          </p>
        )}
      </div>
    </div>
  )
}
