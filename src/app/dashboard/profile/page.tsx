'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { lookupSwissPostalCode, searchSwissCities, isValidSwissPostalCode, type PostalCodeData } from '@/lib/swiss-postal-codes'
import { ROLES } from '@/lib/constants'
import {
  User,
  Mail,
  Phone,
  MapPin,
  Building2,
  Save,
  Loader2,
  CheckCircle2,
  ArrowLeft,
  Bell,
  Globe,
  Shield,
  Calendar,
  Wrench,
  Clock,
  AlertCircle
} from 'lucide-react'
import { getTextColor, getStatusColors } from '@/lib/design-system'
import { cn } from '@/lib/utils'
import { logger } from '@/lib/logger'

interface ProfileData {
  first_name: string
  last_name: string
  company_name: string
  phone: string
  mobile: string
  address_line1: string
  address_line2: string
  postal_code: string
  city: string
  canton: string
  country: string
  preferred_language: string
  newsletter_subscribed: boolean
  // Service provider fields
  bio?: string
  skills?: string[]
  expertise_areas?: string[]
  website?: string
  service_radius_km?: number
  availability?: {
    monday?: { start: string; end: string; available: boolean }
    tuesday?: { start: string; end: string; available: boolean }
    wednesday?: { start: string; end: string; available: boolean }
    thursday?: { start: string; end: string; available: boolean }
    friday?: { start: string; end: string; available: boolean }
    saturday?: { start: string; end: string; available: boolean }
    sunday?: { start: string; end: string; available: boolean }
  }
}

const SWISS_CANTONS = [
  'Aargau', 'Appenzell Ausserrhoden', 'Appenzell Innerrhoden', 'Basel-Landschaft',
  'Basel-Stadt', 'Bern', 'Freiburg', 'Genf', 'Glarus', 'Graubünden', 'Jura',
  'Luzern', 'Neuenburg', 'Nidwalden', 'Obwalden', 'Schaffhausen', 'Schwyz',
  'Solothurn', 'St. Gallen', 'Tessin', 'Thurgau', 'Uri', 'Waadt', 'Wallis',
  'Zug', 'Zürich'
]

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [profile, setProfile] = useState<ProfileData>({
    first_name: '',
    last_name: '',
    company_name: '',
    phone: '',
    mobile: '',
    address_line1: '',
    address_line2: '',
    postal_code: '',
    city: '',
    canton: '',
    country: 'Schweiz',
    preferred_language: 'de',
    newsletter_subscribed: false,
    bio: '',
    skills: [],
    expertise_areas: [],
    website: '',
    service_radius_km: 50,
    availability: {
      monday: { start: '09:00', end: '17:00', available: true },
      tuesday: { start: '09:00', end: '17:00', available: true },
      wednesday: { start: '09:00', end: '17:00', available: true },
      thursday: { start: '09:00', end: '17:00', available: true },
      friday: { start: '09:00', end: '17:00', available: true },
      saturday: { start: '09:00', end: '17:00', available: false },
      sunday: { start: '09:00', end: '17:00', available: false },
    },
  })

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)

  // Postal code auto-fill state
  const [postalCodeSuggestions, setPostalCodeSuggestions] = useState<PostalCodeData[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  // User role state
  const [userRole, setUserRole] = useState<string>('')
  const isServiceProvider = userRole === ROLES.REPAIRER || userRole === ROLES.SELLER

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login?callbackUrl=/dashboard/profile')
    }
  }, [status, router])

  // Load profile data
  useEffect(() => {
    async function loadProfile() {
      try {
        const response = await fetch('/api/user/profile')
        if (response.ok) {
          const data = await response.json()
          if (data.profile) {
            setProfile(prev => ({ ...prev, ...data.profile }))
          }
          if (data.role) {
            setUserRole(data.role)
          }
        } else if (response.status === 401) {
          // Not authenticated, redirect to login
          router.push('/auth/login?callbackUrl=/dashboard/profile')
          return
        }
      } catch (error) {
        logger.error('Failed to load profile', { error })
      } finally {
        setIsLoading(false)
      }
    }

    // Only load if session is fully loaded and user is authenticated
    if (status === 'authenticated' && session?.user) {
      loadProfile()
    } else if (status === 'unauthenticated') {
      setIsLoading(false)
      router.push('/auth/login?callbackUrl=/dashboard/profile')
    }
  }, [session, status, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setError(null)
    setSaveSuccess(false)

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Speichern fehlgeschlagen')
      }

      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Ein Fehler ist aufgetreten')
    } finally {
      setIsSaving(false)
    }
  }

  const handleChange = (field: keyof ProfileData, value: string | boolean) => {
    setProfile(prev => ({ ...prev, [field]: value }))
  }

  const handlePostalCodeChange = (value: string) => {
    setProfile(prev => ({ ...prev, postal_code: value }))

    // Auto-fill city and canton if valid Swiss postal code
    if (isValidSwissPostalCode(value)) {
      const postalData = lookupSwissPostalCode(value)
      if (postalData) {
        setProfile(prev => ({
          ...prev,
          postal_code: value,
          city: postalData.city,
          canton: postalData.canton
        }))
      }
    }
  }

  const handleCitySearch = (value: string) => {
    setProfile(prev => ({ ...prev, city: value }))

    if (value.length >= 2) {
      const suggestions = searchSwissCities(value)
      setPostalCodeSuggestions(suggestions.slice(0, 5)) // Limit to 5 suggestions
      setShowSuggestions(suggestions.length > 0)
    } else {
      setShowSuggestions(false)
    }
  }

  const selectPostalSuggestion = (suggestion: PostalCodeData) => {
    setProfile(prev => ({
      ...prev,
      postal_code: suggestion.postal_code,
      city: suggestion.city,
      canton: suggestion.canton
    }))
    setShowSuggestions(false)
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsChangingPassword(true)
    setPasswordError(null)
    setPasswordSuccess(false)

    try {
      const response = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(passwordData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Passwort-Änderung fehlgeschlagen')
      }

      setPasswordSuccess(true)
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })

      setTimeout(() => setPasswordSuccess(false), 3000)
    } catch (error) {
      setPasswordError(error instanceof Error ? error.message : 'Ein Fehler ist aufgetreten')
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handlePasswordFieldChange = (field: keyof typeof passwordData, value: string) => {
    setPasswordData(prev => ({ ...prev, [field]: value }))
  }

  if (status === 'loading' || isLoading) {
    return (
      <main className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      {/* Header */}
      <div className="bg-white dark:bg-neutral-800 border-b-2 border-neutral-200 dark:border-neutral-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zurück zum Dashboard
          </Link>
          <h1 className={cn('text-2xl font-bold', getTextColor('white', 'primary'), 'dark:text-white')}>
            Mein Profil
          </h1>
          <p className={cn('mt-1 text-sm sm:text-base', getTextColor('white', 'muted'), 'dark:text-neutral-400')}>
            Bearbeiten Sie Ihre persönlichen Daten und Einstellungen
          </p>
        </div>
      </div>

      {/* Account Overview */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Account Status */}
        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border-2 border-neutral-200 dark:border-neutral-700 p-4 sm:p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-success-100 dark:bg-success-900/30 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-success-600" />
            </div>
            <div>
              <h2 className={cn('text-lg font-semibold', getTextColor('white', 'primary'), 'dark:text-white')}>
                Kontoübersicht
              </h2>
              <p className={cn('text-sm', getTextColor('white', 'muted'), 'dark:text-neutral-400')}>Status und Sicherheit Ihres Kontos</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-4 bg-neutral-50 dark:bg-neutral-700/50 rounded-lg border-2 border-neutral-200 dark:border-neutral-600">
              <div className="w-8 h-8 bg-success-100 dark:bg-success-900/30 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-success-600" />
              </div>
              <div>
                <p className={cn('font-medium', getTextColor('neutral', 'primary'), 'dark:text-white')}>E-Mail bestätigt</p>
                <p className={cn('text-sm', getTextColor('neutral', 'muted'), 'dark:text-neutral-400')}>{session?.user?.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-neutral-50 dark:bg-neutral-700/50 rounded-lg border-2 border-neutral-200 dark:border-neutral-600">
              <div className="w-8 h-8 bg-info-100 dark:bg-info-900/30 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-info-600" />
              </div>
              <div>
                <p className={cn('font-medium', getTextColor('neutral', 'primary'), 'dark:text-white')}>
                  {profile.first_name && profile.last_name ? `${profile.first_name} ${profile.last_name}` : 'Name nicht angegeben'}
                </p>
                <p className={cn('text-sm', getTextColor('neutral', 'muted'), 'dark:text-neutral-400')}>Mitglied seit {new Date().getFullYear()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Letzte Aktivitäten
              </h2>
              <p className="text-sm text-gray-500">Ihre jüngsten Aktionen bei RevampIT</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">Konto erstellt</p>
                <p className="text-xs text-gray-500">Willkommen bei RevampIT!</p>
              </div>
              <span className="text-xs text-gray-400">Heute</span>
            </div>

            <div className="text-center py-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Mehr Aktivitäten erscheinen hier, sobald Sie Workshops buchen oder Termine vereinbaren.
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Success Message */}
          {saveSuccess && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <p className="text-green-700 dark:text-green-300">Profil erfolgreich gespeichert!</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          {/* Personal Information */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Persönliche Daten
                </h2>
                <p className="text-sm text-gray-500">Ihre grundlegenden Informationen</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Vorname
                </label>
                <input
                  type="text"
                  value={profile.first_name}
                  onChange={(e) => handleChange('first_name', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Max"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nachname
                </label>
                <input
                  type="text"
                  value={profile.last_name}
                  onChange={(e) => handleChange('last_name', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Muster"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Firma <span className="text-gray-400">(optional)</span>
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={profile.company_name}
                    onChange={(e) => handleChange('company_name', e.target.value)}
                    className="w-full pl-11 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Firma AG"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Service Provider Profile (only for repairers and sellers) */}
          {isServiceProvider && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                  <Wrench className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Dienstleistungsprofil
                  </h2>
                  <p className="text-sm text-gray-500">Informationen für Ihre Dienstleistungen</p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Bio */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Über mich <span className="text-gray-400">(optional)</span>
                  </label>
                  <textarea
                    value={profile.bio || ''}
                    onChange={(e) => handleChange('bio', e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Beschreiben Sie sich und Ihre Dienstleistungen..."
                  />
                </div>

                {/* Website */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Website <span className="text-gray-400">(optional)</span>
                  </label>
                  <input
                    type="url"
                    value={profile.website || ''}
                    onChange={(e) => handleChange('website', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="https://ihre-website.ch"
                  />
                </div>

                {/* Skills */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Fähigkeiten <span className="text-gray-400">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={(profile.skills || []).join(', ')}
                    onChange={(e) => handleChange('skills', e.target.value.split(',').map(s => s.trim()).filter(s => s))}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Hardware-Reparatur, Software-Installation, Datenrettung"
                  />
                  <p className="text-xs text-gray-500 mt-1">Trennen Sie Fähigkeiten mit Kommas</p>
                </div>

                {/* Expertise Areas */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Fachgebiete <span className="text-gray-400">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={(profile.expertise_areas || []).join(', ')}
                    onChange={(e) => handleChange('expertise_areas', e.target.value.split(',').map(s => s.trim()).filter(s => s))}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Laptops, Desktops, Smartphones, Linux, Windows"
                  />
                  <p className="text-xs text-gray-500 mt-1">Trennen Sie Fachgebiete mit Kommas</p>
                </div>

                {/* Service Radius */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Service-Radius (km) <span className="text-gray-400">(optional)</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={profile.service_radius_km || 50}
                    onChange={(e) => handleChange('service_radius_km', parseInt(e.target.value) || 50)}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">Maximaler Radius für Hausbesuche</p>
                </div>
              </div>
            </div>
          )}

          {/* Contact Information */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <Phone className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Kontaktdaten
                </h2>
                <p className="text-sm text-gray-500">So können wir Sie erreichen</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  E-Mail
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={session?.user?.email || ''}
                    disabled
                    className="w-full pl-11 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">E-Mail kann nicht geändert werden</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Telefon
                </label>
                <input
                  type="tel"
                  value={profile.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="+41 44 123 45 67 oder 044 123 45 67"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Mobiltelefon
                </label>
                <input
                  type="tel"
                  value={profile.mobile}
                  onChange={(e) => handleChange('mobile', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="+41 79 123 45 67 oder 079 123 45 67"
                />
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                <MapPin className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Adresse
                </h2>
                <p className="text-sm text-gray-500">Für Lieferungen und Rechnungen</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Strasse und Hausnummer
                </label>
                <input
                  type="text"
                  value={profile.address_line1}
                  onChange={(e) => handleChange('address_line1', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Musterstrasse 123"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Adresszusatz <span className="text-gray-400">(optional)</span>
                </label>
                <input
                  type="text"
                  value={profile.address_line2}
                  onChange={(e) => handleChange('address_line2', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="c/o Mustermann, 3. Stock"
                />
              </div>
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  PLZ
                </label>
                <input
                  type="text"
                  value={profile.postal_code}
                  onChange={(e) => handlePostalCodeChange(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="8000"
                  maxLength={4}
                />
                <p className="text-xs text-gray-500 mt-1">Stadt und Kanton werden automatisch ausgefüllt</p>
              </div>
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Ort
                </label>
                <input
                  type="text"
                  value={profile.city}
                  onChange={(e) => handleCitySearch(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Zürich"
                />
                {showSuggestions && postalCodeSuggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {postalCodeSuggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => selectPostalSuggestion(suggestion)}
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-600 first:rounded-t-lg last:rounded-b-lg"
                      >
                        <div className="font-medium">{suggestion.city}</div>
                        <div className="text-sm text-gray-500">{suggestion.postal_code} • {suggestion.canton}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Kanton
                </label>
                <select
                  value={profile.canton}
                  onChange={(e) => handleChange('canton', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Kanton wählen</option>
                  {SWISS_CANTONS.map((canton) => (
                    <option key={canton} value={canton}>{canton}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Land
                </label>
                <input
                  type="text"
                  value={profile.country}
                  onChange={(e) => handleChange('country', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Password Change */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Passwort ändern
                </h2>
                <p className="text-sm text-gray-500">Halten Sie Ihr Konto sicher</p>
              </div>
            </div>

            {/* Password Change Success */}
            {passwordSuccess && (
              <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <p className="text-green-700 dark:text-green-300">Passwort erfolgreich geändert!</p>
              </div>
            )}

            {/* Password Change Error */}
            {passwordError && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-700 dark:text-red-300">{passwordError}</p>
              </div>
            )}

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Aktuelles Passwort
                </label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => handlePasswordFieldChange('currentPassword', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Ihr aktuelles Passwort"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Neues Passwort
                  </label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => handlePasswordFieldChange('newPassword', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Mindestens 8 Zeichen"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Passwort bestätigen
                  </label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => handlePasswordFieldChange('confirmPassword', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Passwort wiederholen"
                    required
                  />
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-700 dark:text-yellow-300">
                  <p className="font-medium">Passwort-Anforderungen:</p>
                  <ul className="mt-1 ml-4 list-disc space-y-0.5">
                    <li>Mindestens 8 Zeichen</li>
                    <li>Mindestens ein Großbuchstabe</li>
                    <li>Mindestens ein Kleinbuchstabe</li>
                    <li>Mindestens eine Zahl</li>
                  </ul>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-medium px-4 py-2 rounded-lg transition-colors"
                >
                  {isChangingPassword ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Ändere...
                    </>
                  ) : (
                    <>
                      <Shield className="w-4 h-4" />
                      Passwort ändern
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Preferences */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                <Bell className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Einstellungen
                </h2>
                <p className="text-sm text-gray-500">Sprache und Newsletter</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Bevorzugte Sprache
                </label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <select
                    value={profile.preferred_language}
                    onChange={(e) => handleChange('preferred_language', e.target.value)}
                    className="w-full pl-11 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="de">Deutsch</option>
                    <option value="en">English</option>
                    <option value="fr">Français</option>
                  </select>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <input
                  id="newsletter"
                  type="checkbox"
                  checked={profile.newsletter_subscribed}
                  onChange={(e) => handleChange('newsletter_subscribed', e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <label htmlFor="newsletter" className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium">Newsletter abonnieren</span>
                  <p className="text-gray-500 dark:text-gray-400 mt-0.5">
                    Erhalten Sie Updates zu Workshops, Angeboten und Neuigkeiten von RevampIT
                  </p>
                </label>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Wird gespeichert...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Profil speichern
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}


