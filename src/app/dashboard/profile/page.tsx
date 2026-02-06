'use client'

import Link from 'next/link'
import {
  User,
  Save,
  Loader2,
  CheckCircle2,
  ArrowLeft,
  Shield,
  Clock,
} from 'lucide-react'
import { getTextColor } from '@/lib/design-system'
import { cn } from '@/lib/utils'

// Hooks
import { useProfileData } from './hooks/useProfileData'
import { useProfileForm } from './hooks/useProfileForm'
import { usePasswordChange } from './hooks/usePasswordChange'
import { usePostalCodeLookup } from './hooks/usePostalCodeLookup'

// Section components
import { PersonalInfoSection } from './components/PersonalInfoSection'
import { ContactInfoSection } from './components/ContactInfoSection'
import { AddressSection } from './components/AddressSection'
import { ServiceProviderSection } from './components/ServiceProviderSection'
import { PasswordChangeSection } from './components/PasswordChangeSection'
import { PreferencesSection } from './components/PreferencesSection'

export default function ProfilePage() {
  const { session, status, isLoading, profile, setProfile, isServiceProvider } = useProfileData()
  const { isSaving, saveSuccess, error, handleSubmit, handleChange } = useProfileForm({ profile, setProfile })
  const {
    passwordData,
    isChangingPassword,
    passwordSuccess,
    passwordError,
    handlePasswordChange,
    handlePasswordFieldChange,
  } = usePasswordChange()
  const {
    postalCodeSuggestions,
    showSuggestions,
    handlePostalCodeChange,
    handleCitySearch,
    selectPostalSuggestion,
  } = usePostalCodeLookup({ setProfile })

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

          <PersonalInfoSection profile={profile} handleChange={handleChange} />

          {isServiceProvider && (
            <ServiceProviderSection profile={profile} handleChange={handleChange} />
          )}

          <ContactInfoSection
            profile={profile}
            email={session?.user?.email || ''}
            handleChange={handleChange}
          />

          <AddressSection
            profile={profile}
            handleChange={handleChange}
            handlePostalCodeChange={handlePostalCodeChange}
            handleCitySearch={handleCitySearch}
            postalCodeSuggestions={postalCodeSuggestions}
            showSuggestions={showSuggestions}
            selectPostalSuggestion={selectPostalSuggestion}
          />

          <PasswordChangeSection
            passwordData={passwordData}
            isChangingPassword={isChangingPassword}
            passwordSuccess={passwordSuccess}
            passwordError={passwordError}
            handlePasswordChange={handlePasswordChange}
            handlePasswordFieldChange={handlePasswordFieldChange}
          />

          <PreferencesSection profile={profile} handleChange={handleChange} />

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
